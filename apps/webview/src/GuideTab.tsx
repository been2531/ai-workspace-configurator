import { useState } from 'react'
import type { Locale } from './i18n'

// ─── Types ─────────────────────────────────────────────────────────────────────

type LifecycleStep = {
  event: string
  desc: string
  hook?: 'block' | 'react'
  tag?: string
  tagClass?: string
  dim?: boolean
  inLoop?: boolean
}

type Block =
  | { t: 'p'; text: string }
  | { t: 'ul'; items: string[] }
  | { t: 'ol'; items: string[] }
  | { t: 'code'; text: string }
  | { t: 'tip'; text: string }
  | { t: 'warn'; text: string }
  | { t: 'table'; headers: string[]; rows: string[][] }
  | { t: 'lifecycle'; steps: LifecycleStep[]; loopLabel?: string }

// ─── Agent Loop Steps (shared) ────────────────────────────────────────────────

const LOOP_STEPS_EN: LifecycleStep[] = [
  { event: 'SessionStart', desc: 'MCP servers start and register tools before the first prompt.', tag: '② MCP', tagClass: 'bg-emerald-500/15 text-emerald-300/90 border-emerald-500/20' },
  { event: 'InstructionsLoaded', desc: 'All CLAUDE.md files merged and injected — before any user input.', tag: '① CLAUDE.md', tagClass: 'bg-indigo-500/15 text-indigo-300/90 border-indigo-500/20' },
  { event: 'UserPromptSubmit', desc: 'User prompt arrives. Hook can inspect, modify, or block it here.', hook: 'block', tag: '④ Hooks', tagClass: 'bg-red-500/15 text-red-300/90 border-red-500/20' },
  { event: 'UserPromptExpansion', desc: '/skill-name triggers lazy-load of skill body into context window.', tag: '③ Skills', tagClass: 'bg-violet-500/15 text-violet-300/90 border-violet-500/20' },
  { event: 'PreToolUse', desc: 'Runs before every tool call. Hook can allow or deny execution.', hook: 'block', tag: '④ Hooks', tagClass: 'bg-red-500/15 text-red-300/90 border-red-500/20', inLoop: true },
  { event: 'Execute Tool', desc: 'Bash · Edit · MCP tool call · Subagent spawn', tag: '⑤ Subagents', tagClass: 'bg-purple-500/15 text-purple-300/90 border-purple-500/20', inLoop: true },
  { event: 'PostToolUse', desc: 'Runs after every tool call. React: auto-lint, format, audit log.', hook: 'react', tag: '④ Hooks', tagClass: 'bg-amber-500/15 text-amber-400/80 border-amber-500/15', inLoop: true },
  { event: 'PostToolBatch', desc: 'Fires after a parallel batch of tool calls completes.', hook: 'react' },
  { event: 'Stop', desc: 'Turn ends. Non-blocking hooks: Slack notify, metrics, logging.', hook: 'react' },
  { event: 'SessionEnd · FileChanged · SubagentStart/Stop', desc: 'Async events that fire outside the main per-turn loop.', hook: 'react', dim: true },
]

const LOOP_STEPS_KO: LifecycleStep[] = [
  { event: 'SessionStart', desc: 'MCP 서버 시작; 첫 프롬프트 전 도구 등록 완료.', tag: '② MCP', tagClass: 'bg-emerald-500/15 text-emerald-300/90 border-emerald-500/20' },
  { event: 'InstructionsLoaded', desc: '모든 CLAUDE.md 파일 병합 후 주입 — 사용자 입력 전.', tag: '① CLAUDE.md', tagClass: 'bg-indigo-500/15 text-indigo-300/90 border-indigo-500/20' },
  { event: 'UserPromptSubmit', desc: '프롬프트 도착. 훅이 검사·수정·차단 가능.', hook: 'block', tag: '④ Hooks', tagClass: 'bg-red-500/15 text-red-300/90 border-red-500/20' },
  { event: 'UserPromptExpansion', desc: '/skill-name → 스킬 본문이 컨텍스트에 지연 로드됨.', tag: '③ Skills', tagClass: 'bg-violet-500/15 text-violet-300/90 border-violet-500/20' },
  { event: 'PreToolUse', desc: '모든 툴 호출 전 실행. 훅이 허용 또는 차단.', hook: 'block', tag: '④ Hooks', tagClass: 'bg-red-500/15 text-red-300/90 border-red-500/20', inLoop: true },
  { event: 'Execute Tool', desc: 'Bash · Edit · MCP 호출 · 서브에이전트 생성', tag: '⑤ Subagents', tagClass: 'bg-purple-500/15 text-purple-300/90 border-purple-500/20', inLoop: true },
  { event: 'PostToolUse', desc: '모든 툴 호출 후 실행. 반응: 자동 린트, 포맷, 감사 로그.', hook: 'react', tag: '④ Hooks', tagClass: 'bg-amber-500/15 text-amber-400/80 border-amber-500/15', inLoop: true },
  { event: 'PostToolBatch', desc: '병렬 툴 배치 완료 후 발동.', hook: 'react' },
  { event: 'Stop', desc: '턴 종료. 비차단 훅: Slack 알림, 메트릭, 로그.', hook: 'react' },
  { event: 'SessionEnd · FileChanged · SubagentStart/Stop', desc: '메인 턴 루프 외부에서 발동하는 비동기 이벤트.', hook: 'react', dim: true },
]

// ─── Codex / Cursor data ───────────────────────────────────────────────────────

interface SectionContent { title: string; blocks: Block[] }
interface Section { id: string; icon: string; en: SectionContent; ko: SectionContent }

const CODEX_SECTIONS: Section[] = [
  {
    id: 'codex-overview', icon: '⚡',
    en: {
      title: 'What is Codex CLI?',
      blocks: [
        { t: 'p', text: "OpenAI's open-source terminal agent (github.com/openai/codex). Reads AGENTS.md files and autonomously edits code + runs shell commands. Ships with 50+ slash commands, MCP, Skills, Hooks, Memory, and Plugins. Sandboxed by macOS Seatbelt (macOS) or Linux Landlock (Linux) by default — not Docker." },
        { t: 'table', headers: ['Feature', 'Codex CLI', 'Claude Code'], rows: [
          ['Primary model', 'GPT-4.1 / o4-mini / o3', 'claude-sonnet-4 / claude-opus-4'],
          ['Context files', 'AGENTS.md', 'CLAUDE.md + AGENTS.md'],
          ['Lifecycle hooks', '❌ None', '✅ 20+ events'],
          ['Skills / slash commands', '✅ 50+ slash commands', '✅ .claude/skills/'],
          ['MCP support', '✅ codex mcp subcommand', '✅ .mcp.json'],
          ['Sandbox', '✅ Seatbelt / Landlock', '⚠️ Trust-based'],
          ['Subagents', '❌ Single agent', '✅ Up to 10 parallel'],
          ['Open source', '✅ MIT', '❌ Proprietary CLI'],
        ]},
        { t: 'tip', text: 'Most important overlap: both tools read AGENTS.md. A well-written AGENTS.md applies rules to both Claude Code AND Codex CLI with zero duplication.' },
      ],
    },
    ko: {
      title: 'Codex CLI란?',
      blocks: [
        { t: 'p', text: "OpenAI의 오픈소스 터미널 에이전트 (github.com/openai/codex). AGENTS.md를 읽고 자율적으로 코드를 편집하고 셸 명령을 실행합니다. 50+ 슬래시 커맨드, MCP, Skills, Hooks, Memory, Plugins를 기본 제공합니다. macOS Seatbelt(macOS) 또는 Linux Landlock(Linux)으로 샌드박스 처리됩니다 — Docker 아님." },
        { t: 'table', headers: ['기능', 'Codex CLI', 'Claude Code'], rows: [
          ['주요 모델', 'GPT-4.1 / o4-mini / o3', 'claude-sonnet-4 / claude-opus-4'],
          ['컨텍스트 파일', 'AGENTS.md', 'CLAUDE.md + AGENTS.md'],
          ['생명주기 훅', '❌ 없음', '✅ 20+ 이벤트'],
          ['Skills / 슬래시 커맨드', '✅ 50+ 커맨드', '✅ .claude/skills/'],
          ['MCP 지원', '✅ codex mcp 서브커맨드', '✅ .mcp.json'],
          ['샌드박스', '✅ Seatbelt / Landlock', '⚠️ 신뢰 기반'],
          ['서브에이전트', '❌ 단일 에이전트', '✅ 최대 10개 병렬'],
          ['오픈소스', '✅ MIT', '❌ 독점 CLI'],
        ]},
        { t: 'tip', text: '가장 중요한 공통점: 두 도구 모두 AGENTS.md를 읽습니다. AGENTS.md 하나로 Claude Code와 Codex CLI 모두에 중복 없이 규칙을 적용할 수 있습니다.' },
      ],
    },
  },
  {
    id: 'codex-agents-md', icon: '📋',
    en: {
      title: 'AGENTS.md — The Context File',
      blocks: [
        { t: 'p', text: 'Codex discovers AGENTS.md by walking up the directory tree and merging files in order of specificity. This is the only way to give Codex persistent context — there is no equivalent of CLAUDE.md.' },
        { t: 'table', headers: ['File', 'Scope', 'Priority'], rows: [
          ['~/.codex/AGENTS.md', 'All repos for this user', 'Lowest (base defaults)'],
          ['{repo-root}/AGENTS.md', 'Entire repository', 'Middle'],
          ['{subdir}/AGENTS.md', 'That directory subtree', 'Higher'],
          ['{subdir}/AGENTS.override.md', 'That directory subtree', 'Highest (replaces all)'],
        ]},
        { t: 'code', text: '# {repo-root}/AGENTS.md\n\n## Stack\nNode 22, TypeScript 5.5, pnpm monorepo.\nApps: extension (CommonJS esbuild) + webview (ESM Vite).\n\n## Rules\n- No `any` types — use `unknown` + narrowing\n- Run `pnpm test` after every change\n- Never commit with test failures\n- Commits: feat/fix/chore/docs/refactor prefix\n\n## Prohibited actions\n- Do NOT git push --force\n- Do NOT rm -rf without explicit user confirmation\n\n## Commands\n- pnpm build     # full build\n- pnpm test      # all tests\n- pnpm lint      # eslint' },
        { t: 'warn', text: "Codex does NOT read CLAUDE.md. Claude-specific rules (VS Code API, extension architecture) belong in CLAUDE.md — invisible to Codex and vice versa." },
      ],
    },
    ko: {
      title: 'AGENTS.md — 컨텍스트 파일',
      blocks: [
        { t: 'p', text: 'Codex는 디렉토리 트리를 탐색하며 AGENTS.md를 발견하고 구체성 순으로 병합합니다. CLAUDE.md에 해당하는 것이 없으므로, Codex에 지속적 컨텍스트를 주는 유일한 방법입니다.' },
        { t: 'table', headers: ['파일', '범위', '우선순위'], rows: [
          ['~/.codex/AGENTS.md', '이 사용자의 모든 레포', '가장 낮음'],
          ['{repo-root}/AGENTS.md', '전체 레포지토리', '중간'],
          ['{subdir}/AGENTS.md', '해당 디렉토리 서브트리', '높음'],
          ['{subdir}/AGENTS.override.md', '해당 디렉토리 서브트리', '가장 높음 (전체 교체)'],
        ]},
        { t: 'code', text: '# {repo-root}/AGENTS.md\n\n## 스택\nNode 22, TypeScript 5.5, pnpm 모노레포.\n앱: extension (CommonJS esbuild) + webview (ESM Vite).\n\n## 규칙\n- any 타입 금지 — unknown + 타입 좁히기\n- 변경 후 반드시 `pnpm test` 실행\n- 테스트 실패 상태로 커밋 금지\n- 커밋: feat/fix/chore/docs/refactor 접두사\n\n## 금지 행동\n- git push --force 금지\n- 명시적 사용자 확인 없이 rm -rf 금지\n\n## 명령어\n- pnpm build     # 전체 빌드\n- pnpm test      # 전체 테스트\n- pnpm lint      # eslint' },
        { t: 'warn', text: 'Codex는 CLAUDE.md를 읽지 않습니다. Claude 전용 규칙은 CLAUDE.md에 유지하세요 — Codex에게는 보이지 않고, 반대도 마찬가지입니다.' },
      ],
    },
  },
  {
    id: 'codex-approval', icon: '🔒',
    en: {
      title: 'Approval Modes & Sandbox',
      blocks: [
        { t: 'p', text: "Codex's approval system controls how much it asks before acting. The sandbox uses macOS Seatbelt (macOS) or Linux Landlock (Linux) — not Docker — to isolate file writes and network access. Lifecycle hooks are also available via the /hooks command." },
        { t: 'table', headers: ['Flag value', 'File edits', 'Shell commands', 'Best for'], rows: [
          ['on-request (default)', 'Auto-apply', 'Ask each time', 'Day-to-day development'],
          ['never', 'Auto-apply', 'Auto-run', 'CI/CD, trusted automation'],
          ['read-only', 'Ask first', 'Ask first', 'Code review, sensitive repos'],
        ]},
        { t: 'code', text: '# Day-to-day\ncodex "add rate limiting to the auth middleware"\n\n# CI — fully autonomous\ncodex --ask-for-approval never "run migrations and fix failures"\n\n# Explore without changes\ncodex --ask-for-approval read-only "explain the auth flow"\n\n# Disable sandbox (not recommended)\ncodex --no-sandbox "..."\n\n# ~/.codex/config.toml — permanent defaults\n[defaults]\nmodel = "o4-mini"\nask_for_approval = "on-request"\nsandbox = true' },
        { t: 'warn', text: "never mode runs shell commands without confirmation. The OS-level sandbox (Seatbelt/Landlock) mitigates this, but disable it only in fully trusted environments." },
      ],
    },
    ko: {
      title: '승인 모드 & 샌드박스',
      blocks: [
        { t: 'p', text: "Codex의 승인 시스템은 얼마나 자주 확인을 요청할지 제어합니다. 샌드박스는 macOS Seatbelt(macOS) 또는 Linux Landlock(Linux)을 사용합니다 — Docker 아님. /hooks 커맨드로 생명주기 훅도 활용할 수 있습니다." },
        { t: 'table', headers: ['플래그 값', '파일 편집', '셸 명령', '적합한 경우'], rows: [
          ['on-request (기본)', '자동 적용', '매번 확인', '일상 개발'],
          ['never', '자동 적용', '자동 실행', 'CI/CD, 신뢰된 자동화'],
          ['read-only', '먼저 확인', '먼저 확인', '코드 리뷰, 민감한 레포'],
        ]},
        { t: 'code', text: '# 일상 사용\ncodex "auth 미들웨어에 레이트 리미팅 추가"\n\n# CI — 완전 자율\ncodex --ask-for-approval never "마이그레이션 실행 후 실패 수정"\n\n# 변경 없이 탐색\ncodex --ask-for-approval read-only "auth 흐름 설명해줘"\n\n# 샌드박스 비활성화 (비권장)\ncodex --no-sandbox "..."\n\n# ~/.codex/config.toml — 영구 기본값\n[defaults]\nmodel = "o4-mini"\nask_for_approval = "on-request"\nsandbox = true' },
        { t: 'warn', text: "never 모드는 확인 없이 셸 명령을 실행합니다. OS 레벨 샌드박스(Seatbelt/Landlock)가 이를 완화하지만, 완전히 신뢰된 환경에서만 비활성화하세요." },
      ],
    },
  },
  {
    id: 'codex-models', icon: '🤖',
    en: {
      title: 'Model Selection & Performance',
      blocks: [
        { t: 'p', text: "Codex CLI supports multiple OpenAI models. The choice affects cost, speed, and reasoning quality. o3 and o4-mini use chain-of-thought reasoning; GPT-4.1 is faster and cheaper for simpler tasks." },
        { t: 'table', headers: ['Model', 'Reasoning', 'Speed', 'Best for'], rows: [
          ['o3', 'Extended CoT', 'Slow', 'Complex refactors, architecture decisions'],
          ['o4-mini', 'CoT', 'Medium', 'Balanced — default for most tasks'],
          ['GPT-4.1', 'Standard', 'Fast', 'Quick edits, file reads, simple tasks'],
          ['GPT-4.1 mini', 'Standard', 'Fastest', 'High-volume CI checks, formatting'],
        ]},
        { t: 'code', text: '# Switch model per-run\ncodex --model o3 "redesign the database schema"\ncodex --model gpt-4.1 "add a console.log here"\n\n# ~/.codex/config.toml\n[defaults]\nmodel = "o4-mini"\n\n# Override in AGENTS.md (Codex reads this)\n## Preferred model\nUse o3 for any database migration or schema change.\nUse o4-mini for all other tasks.' },
        { t: 'tip', text: 'You can instruct Codex to use specific models for specific task types directly in AGENTS.md — it reads the instructions and respects them when choosing which model to use (if multi-model is configured).' },
      ],
    },
    ko: {
      title: '모델 선택 & 성능',
      blocks: [
        { t: 'p', text: "Codex CLI는 여러 OpenAI 모델을 지원합니다. 모델 선택이 비용, 속도, 추론 품질에 영향을 줍니다. o3와 o4-mini는 체인 오브 사고(CoT) 추론을 사용하고, GPT-4.1은 단순한 작업에 더 빠르고 저렴합니다." },
        { t: 'table', headers: ['모델', '추론', '속도', '적합한 경우'], rows: [
          ['o3', '확장 CoT', '느림', '복잡한 리팩토링, 아키텍처 결정'],
          ['o4-mini', 'CoT', '보통', '균형 잡힌 — 대부분 작업의 기본'],
          ['GPT-4.1', '표준', '빠름', '빠른 편집, 파일 읽기, 단순 작업'],
          ['GPT-4.1 mini', '표준', '가장 빠름', '대량 CI 검사, 포맷팅'],
        ]},
        { t: 'code', text: '# 실행별 모델 전환\ncodex --model o3 "데이터베이스 스키마 재설계"\ncodex --model gpt-4.1 "여기에 console.log 추가"\n\n# ~/.codex/config.toml\n[defaults]\nmodel = "o4-mini"\n\n# AGENTS.md에서 지시 (Codex가 읽음)\n## 선호 모델\n데이터베이스 마이그레이션이나 스키마 변경에는 o3 사용.\n다른 모든 작업에는 o4-mini 사용.' },
        { t: 'tip', text: 'AGENTS.md에서 특정 작업 유형에 특정 모델을 사용하도록 Codex에 지시할 수 있습니다 — 지침을 읽고 모델 선택 시 존중합니다.' },
      ],
    },
  },
  {
    id: 'codex-slash-commands', icon: '⌨️',
    en: {
      title: 'Slash Commands & Extensions',
      blocks: [
        { t: 'p', text: "Codex CLI ships with 50+ slash commands. Type / in the prompt to browse the full list. Three extension systems — Skills, Plugins, and Memory — add persistent capabilities across sessions." },
        { t: 'table', headers: ['Category', 'Commands', 'What they do'], rows: [
          ['Planning', '/plan, /goal', 'Enter plan mode; set/pause/resume/clear a persistent task goal across sessions'],
          ['Models', '/model, /fast, /personality', 'Switch model mid-session; toggle fast tier; set communication style'],
          ['Conversation', '/fork, /side, /new, /resume', 'Branch conversation; open ephemeral side thread; start fresh; restore prior session'],
          ['Extensions', '/skills, /plugins, /mcp, /hooks', 'Browse Skills; manage Plugins; list MCP tools; view/manage lifecycle Hooks'],
          ['Context', '/ide, /mention, /diff', 'Include editor open-file context; attach specific files; show git diff'],
          ['Session', '/compact, /status, /memories', 'Compress conversation history; show token usage; configure memory injection'],
        ]},
        { t: 'code', text: '# Import Claude Code skills into Codex\n/import     # migrates .claude/skills/ setup — most skills transfer directly\n\n# Set a persistent goal (survives /new and /fork)\n/goal set "Refactor the auth module to use JWT"\n\n# Non-interactive CI-friendly execution\ncodex exec "run tests and fix all failures"\n\n# Resume a prior session (restores conversation + file state)\ncodex resume\n\n# Multimodal: attach an image to a prompt\ncodex --image ui-screenshot.png "the dropdown is misaligned, fix it"' },
        { t: 'tip', text: 'Use /import to migrate your Claude Code .claude/skills/ setup — both tools use plain Markdown so most skills transfer without changes. codex exec and codex resume work as top-level subcommands, not slash commands.' },
      ],
    },
    ko: {
      title: '슬래시 커맨드 & 확장',
      blocks: [
        { t: 'p', text: "Codex CLI는 50+ 슬래시 커맨드를 제공합니다. 프롬프트에서 /를 입력하면 전체 목록을 탐색할 수 있습니다. Skills, Plugins, Memory 세 가지 확장 시스템이 세션 간 영구적인 기능을 추가합니다." },
        { t: 'table', headers: ['카테고리', '커맨드', '기능'], rows: [
          ['계획', '/plan, /goal', '계획 모드 진입; 세션 간 유지되는 작업 목표 설정/일시정지/재개/취소'],
          ['모델', '/model, /fast, /personality', '세션 중 모델 전환; fast 티어 토글; 소통 스타일 설정'],
          ['대화', '/fork, /side, /new, /resume', '대화 분기; 임시 사이드 스레드; 새로 시작; 이전 세션 복원'],
          ['확장', '/skills, /plugins, /mcp, /hooks', 'Skills 탐색; 플러그인 관리; MCP 도구 목록; 생명주기 훅 확인/관리'],
          ['컨텍스트', '/ide, /mention, /diff', '에디터 열린 파일 컨텍스트; 특정 파일 첨부; git diff 표시'],
          ['세션', '/compact, /status, /memories', '대화 압축; 토큰 사용량 표시; 메모리 주입 설정'],
        ]},
        { t: 'code', text: '# Claude Code Skills를 Codex로 가져오기\n/import     # .claude/skills/ 설정 마이그레이션 — 대부분의 스킬이 그대로 전환\n\n# 세션 간 유지되는 목표 설정\n/goal set "auth 모듈을 JWT로 리팩토링"\n\n# 비대화형 CI 친화적 실행\ncodex exec "테스트 실행 후 모든 실패 수정"\n\n# 이전 세션 복원 (대화 + 파일 상태 복원)\ncodex resume\n\n# 멀티모달: 이미지 첨부\ncodex --image ui-screenshot.png "드롭다운 정렬이 안 됨, 수정해줘"' },
        { t: 'tip', text: '/import로 Claude Code .claude/skills/ 설정을 Codex로 마이그레이션할 수 있습니다 — 두 도구 모두 일반 Markdown을 사용하므로 대부분의 스킬이 변경 없이 전환됩니다. codex exec와 codex resume는 슬래시 커맨드가 아닌 최상위 서브커맨드입니다.' },
      ],
    },
  },
  {
    id: 'codex-workflow', icon: '🔄',
    en: {
      title: 'Real-World Workflow Patterns',
      blocks: [
        { t: 'p', text: "Where Codex CLI shines: long autonomous tasks, CI pipelines, and repos where you want an open-source agent without vendor lock-in. Key patterns:" },
        { t: 'ul', items: [
          'Feature implementation: codex "implement X" → reviews diff → git commit',
          'CI integration: codex --ask-for-approval never "fix lint errors and test failures"',
          'Code review: codex --ask-for-approval read-only "review my changes and suggest improvements"',
          'Migration tasks: codex "migrate all class components to React hooks in src/components/"',
          'Test writing: codex "write unit tests for every function in src/utils/ that has no test"',
        ]},
        { t: 'code', text: '# GitHub Actions integration\n- name: Auto-fix lint\n  run: |\n    npm install -g @openai/codex\n    codex --ask-for-approval never \\\n      --model gpt-4.1 \\\n      "fix all ESLint errors, do not change logic"\n  env:\n    OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}\n\n# Local: open a chat session\ncodex  # interactive mode, no initial prompt\n\n# Pipe context in\ncat error.log | codex "diagnose this error and fix it"' },
        { t: 'warn', text: 'In CI, always review AGENTS.md prohibitions and prefer read-only mode for audit tasks. Codex supports lifecycle hooks (/hooks) for additional safeguards — but they must be configured explicitly.' },
      ],
    },
    ko: {
      title: '실전 워크플로우 패턴',
      blocks: [
        { t: 'p', text: "Codex CLI가 빛나는 곳: 긴 자율 작업, CI 파이프라인, 벤더 종속 없이 오픈소스 에이전트를 원하는 레포. 주요 패턴:" },
        { t: 'ul', items: [
          '기능 구현: codex "X 구현" → diff 검토 → git commit',
          'CI 통합: codex --ask-for-approval never "lint 오류와 테스트 실패 수정"',
          '코드 리뷰: codex --ask-for-approval read-only "변경사항 리뷰하고 개선 제안"',
          '마이그레이션: codex "src/components/ 내 모든 클래스 컴포넌트를 React 훅으로 변환"',
          '테스트 작성: codex "src/utils/ 내 테스트 없는 모든 함수에 단위 테스트 작성"',
        ]},
        { t: 'code', text: '# GitHub Actions 통합\n- name: 자동 lint 수정\n  run: |\n    npm install -g @openai/codex\n    codex --ask-for-approval never \\\n      --model gpt-4.1 \\\n      "모든 ESLint 오류 수정, 로직은 변경하지 말 것"\n  env:\n    OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}\n\n# 로컬: 채팅 세션 열기\ncodex  # 대화형 모드\n\n# 컨텍스트 파이프\ncat error.log | codex "이 오류 진단 후 수정"' },
        { t: 'warn', text: 'CI에서는 AGENTS.md의 금지 항목을 항상 검토하고 감사 작업에는 read-only 모드를 선호하세요. Codex는 생명주기 훅(/hooks)을 지원하지만 명시적으로 설정해야 합니다.' },
      ],
    },
  },
]

const CURSOR_SECTIONS: Section[] = [
  {
    id: 'cursor-overview', icon: '⚡',
    en: {
      title: 'What is Cursor?',
      blocks: [
        { t: 'p', text: "Cursor is a VS Code fork that embeds AI at every level of the editing workflow — from single-line Tab suggestions to fully autonomous Agent mode that can read, write, and run code across your entire repo." },
        { t: 'table', headers: ['Feature', 'Cursor', 'Claude Code', 'Codex CLI'], rows: [
          ['Interface', 'IDE (VS Code fork)', 'Terminal CLI', 'Terminal CLI'],
          ['Models', 'Claude 4/3.7, GPT-4o, Gemini', 'Claude only', 'GPT-4.1, o3, o4-mini'],
          ['Context files', '.cursor/rules/*.mdc', 'CLAUDE.md, AGENTS.md', 'AGENTS.md'],
          ['MCP support', '✅ native', '✅ .mcp.json', '✅ codex mcp'],
          ['Lifecycle hooks', '❌', '✅ 20+ events', '✅ /hooks'],
          ['Multi-file edit', '✅ Composer', '✅ agentic', '✅'],
          ['PR review', '✅ BugBot (auto)', '⚠️ manual', '⚠️ manual'],
          ['Price', '$20/mo Pro', 'Usage-based', 'Usage-based'],
        ]},
        { t: 'tip', text: 'Cursor is best for interactive day-to-day coding inside an IDE. Claude Code wins for complex autonomous multi-step tasks (30+ tool calls), large codebases, and when you need Hooks/Skills extensibility.' },
      ],
    },
    ko: {
      title: 'Cursor란?',
      blocks: [
        { t: 'p', text: "Cursor는 편집 워크플로우의 모든 레벨에 AI를 내장한 VS Code 포크입니다 — 단일 줄 Tab 제안부터 전체 레포를 읽고 쓰고 실행하는 완전 자율 Agent 모드까지." },
        { t: 'table', headers: ['기능', 'Cursor', 'Claude Code', 'Codex CLI'], rows: [
          ['인터페이스', 'IDE (VS Code 포크)', '터미널 CLI', '터미널 CLI'],
          ['모델', 'Claude 4/3.7, GPT-4o, Gemini', 'Claude 전용', 'GPT-4.1, o3, o4-mini'],
          ['컨텍스트 파일', '.cursor/rules/*.mdc', 'CLAUDE.md, AGENTS.md', 'AGENTS.md'],
          ['MCP 지원', '✅ 네이티브', '✅ .mcp.json', '✅ codex mcp'],
          ['생명주기 훅', '❌', '✅ 20+ 이벤트', '✅ /hooks'],
          ['멀티파일 편집', '✅ Composer', '✅ 에이전틱', '✅'],
          ['PR 리뷰', '✅ BugBot (자동)', '⚠️ 수동', '⚠️ 수동'],
          ['가격', '월 $20 Pro', '사용량 기반', '사용량 기반'],
        ]},
        { t: 'tip', text: 'Cursor는 IDE에서 일상적인 대화형 코딩에 가장 적합합니다. Claude Code는 복잡한 자율 멀티스텝 작업(30+ 툴 호출), 대규모 코드베이스, Hooks/Skills 확장성이 필요할 때 우세합니다.' },
      ],
    },
  },
  {
    id: 'cursor-ladder', icon: '🪜',
    en: {
      title: 'The Editing Ladder: Tab → K → Composer → Agent',
      blocks: [
        { t: 'p', text: "Think of Cursor as a ladder — each rung gives AI more autonomy and broader scope. Rules files inject into every rung simultaneously." },
        { t: 'table', headers: ['Rung', 'Shortcut', 'Scope', 'Autonomy', 'Best for'], rows: [
          ['Tab', 'Tab', 'Current line/block', 'Passive suggestion', 'Fast completions'],
          ['Inline edit', 'Cmd/Ctrl+K', 'Selected code', 'One-shot transform', 'Targeted rewrites'],
          ['Chat', 'Cmd/Ctrl+L', 'Files + @refs', 'Conversational', 'Q&A, exploration'],
          ['Composer', 'Cmd/Ctrl+I', 'Multiple files', 'Multi-step with review', 'Feature implementation'],
          ['Agent mode', 'Toggle in Composer', 'Entire repo + tools', 'Autonomous + tool use', 'Complex tasks'],
          ['BugBot', 'Auto on PR', 'Changed PR files', 'Fully automatic', 'PR review'],
        ]},
        { t: 'tip', text: 'Agent mode ≈ Claude Code\'s proceed mode. Checkpoints auto-save codebase snapshots before major changes so you can roll back without affecting Git history. For 30+ tool calls or very long tasks, Claude Code CLI handles larger contexts and has stronger planning via CLAUDE.md + AGENTS.md.' },
      ],
    },
    ko: {
      title: '편집 사다리: Tab → K → Composer → Agent',
      blocks: [
        { t: 'p', text: "Cursor를 사다리처럼 생각하세요 — 각 단계가 AI에게 더 많은 자율성과 더 넓은 범위를 줍니다. 규칙 파일은 모든 단계에 동시에 주입됩니다." },
        { t: 'table', headers: ['단계', '단축키', '범위', '자율성', '최적 용도'], rows: [
          ['Tab', 'Tab', '현재 줄/블록', '수동 제안', '빠른 자동완성'],
          ['인라인 편집', 'Cmd/Ctrl+K', '선택한 코드', '원샷 변환', '타겟 재작성'],
          ['Chat', 'Cmd/Ctrl+L', '파일 + @참조', '대화형', 'Q&A, 탐색'],
          ['Composer', 'Cmd/Ctrl+I', '여러 파일', '검토 포함 멀티스텝', '기능 구현'],
          ['Agent 모드', 'Composer에서 토글', '전체 레포 + 도구', '자율 + 도구 사용', '복잡한 작업'],
          ['BugBot', 'PR에서 자동', 'PR 변경 파일', '완전 자동', 'PR 리뷰'],
        ]},
        { t: 'tip', text: 'Agent 모드 ≈ Claude Code의 proceed 모드. 체크포인트가 주요 변경 전 코드베이스 스냅샷을 자동 저장해 Git 히스토리 없이 되돌릴 수 있습니다. 30+ 툴 호출이나 매우 긴 작업에는 Claude Code CLI가 더 큰 컨텍스트를 처리하고 CLAUDE.md + AGENTS.md로 더 강력한 계획을 세웁니다.' },
      ],
    },
  },
  {
    id: 'cursor-rules-flow', icon: '📋',
    en: {
      title: 'Rules Files (.mdc) — 4 Activation Types',
      blocks: [
        { t: 'p', text: "Cursor rules are NOT equal — they activate at different points. Put universal axioms in Always rules, language rules in Auto Attached, optional checklists in Manual. Misclassifying wastes tokens on every request." },
        { t: 'table', headers: ['Type', 'Frontmatter', 'Activates when', 'Token cost'], rows: [
          ['Always Apply', 'alwaysApply: true, no globs', 'Every single request', 'Highest — keep < 50 lines'],
          ['Auto Attached', 'alwaysApply: false, + globs', 'Matching file open/edited', 'Only when relevant'],
          ['Apply Intelligently', 'alwaysApply: false, description only', 'Cursor AI decides via description', '0 if not triggered'],
          ['Manual', '(no frontmatter)', '@rule-name in chat only', '0 until invoked'],
        ]},
        { t: 'code', text: '.cursor/rules/\n  global.mdc           # alwaysApply: true — universal axioms only\n  typescript.mdc       # globs: **/*.ts,**/*.tsx\n  tests.mdc            # globs: **/*.test.*,**/*.spec.*\n  api-routes.mdc       # globs: src/app/api/**\n  migration-guide.mdc  # Manual — @mentioned for DB migrations only\n  review-checklist.mdc # Manual — @mentioned before PR submission\n\n# typescript.mdc example\n---\ndescription: TypeScript strict rules for this project\nglobs: "**/*.ts,**/*.tsx"\nalwaysApply: false\n---\n- No `any`. Use `unknown` + narrowing.\n- All async functions must handle errors (no floating promises).\n- Use discriminated unions over optional fields.' },
      ],
    },
    ko: {
      title: '규칙 파일 (.mdc) — 4가지 활성화 타입',
      blocks: [
        { t: 'p', text: "Cursor 규칙은 동등하지 않습니다 — 타입에 따라 다른 시점에 활성화됩니다. 보편적 공리는 Always, 언어 규칙은 Auto Attached, 선택적 체크리스트는 Manual에 넣으세요. 잘못 분류하면 모든 요청에서 토큰을 낭비합니다." },
        { t: 'table', headers: ['타입', '프론트매터', '활성화 시점', '토큰 비용'], rows: [
          ['Always Apply', 'alwaysApply: true, glob 없음', '모든 단일 요청', '가장 높음 — 50줄 미만 유지'],
          ['Auto Attached', 'alwaysApply: false, + glob', '일치하는 파일 열릴/편집될 때', '관련성 있을 때만'],
          ['Apply Intelligently', 'alwaysApply: false, description만', 'Cursor AI가 description으로 판단', '트리거 없으면 0'],
          ['Manual', '(프론트매터 없음)', '채팅에서 @rule-name 멘션만', '호출 전까지 0'],
        ]},
        { t: 'code', text: '.cursor/rules/\n  global.mdc           # alwaysApply: true — 보편적 공리만\n  typescript.mdc       # globs: **/*.ts,**/*.tsx\n  tests.mdc            # globs: **/*.test.*,**/*.spec.*\n  api-routes.mdc       # globs: src/app/api/**\n  migration-guide.mdc  # Manual — DB 마이그레이션 시만 @멘션\n  review-checklist.mdc # Manual — PR 제출 전 @멘션\n\n# typescript.mdc 예시\n---\ndescription: 이 프로젝트의 TypeScript 엄격 규칙\nglobs: "**/*.ts,**/*.tsx"\nalwaysApply: false\n---\n- any 금지. unknown + 타입 좁히기 사용.\n- 모든 async 함수는 오류 처리 (떠다니는 프로미스 금지).\n- 선택적 필드보다 구별 유니온 선호.' },
      ],
    },
  },
  {
    id: 'cursor-context', icon: '🔍',
    en: {
      title: '@ Context System',
      blocks: [
        { t: 'p', text: "@ references let you inject exactly what AI needs per-session. Unlike Rules (ambient, always-on), @ references are precise and on-demand. Combine both for maximum signal, minimum noise." },
        { t: 'table', headers: ['Reference', 'What it injects', 'When to use'], rows: [
          ['@filename / @folder', 'Full file or directory tree', 'Primary source to edit or reference'],
          ['@codebase', 'Semantic search across entire repo', 'Finding relevant code you don\'t know the path to'],
          ['@web', 'Real-time web search results', 'Latest API docs, changelogs, error codes'],
          ['@docs', 'Indexed documentation library', 'Library-specific APIs (React, Next.js, Tailwind…)'],
          ['@git', 'Commits, diffs, branches', 'Understanding recent changes, blame, history'],
          ['@terminal', 'Recent terminal output', 'Error messages, test output, build logs'],
          ['@Cursor Rules', 'A specific .mdc rule file', 'Applying a Manual rule in the current context'],
        ]},
        { t: 'tip', text: 'Pattern: Rules (.mdc) = ambient always-on context. @ references = precise per-session context. Rules define HOW to work; @ references define WHAT to work on.' },
      ],
    },
    ko: {
      title: '@ 컨텍스트 시스템',
      blocks: [
        { t: 'p', text: "@ 참조는 세션별로 AI에게 필요한 것을 정확히 주입합니다. Rules(앰비언트, 항상 켜짐)와 달리 @ 참조는 정밀하고 온디맨드입니다. 두 가지를 결합하면 최대 신호, 최소 노이즈를 달성합니다." },
        { t: 'table', headers: ['참조', '주입 내용', '사용 시점'], rows: [
          ['@파일명 / @폴더', '전체 파일 또는 디렉토리 트리', '편집하거나 참조할 주요 소스'],
          ['@codebase', '전체 레포 시맨틱 검색', '경로를 모르는 관련 코드 찾기'],
          ['@web', '실시간 웹 검색 결과', '최신 API 문서, 변경 로그, 오류 코드'],
          ['@docs', '인덱싱된 문서 라이브러리', '라이브러리별 API (React, Next.js, Tailwind…)'],
          ['@git', '커밋, diff, 브랜치', '최근 변경, blame, 히스토리 이해'],
          ['@terminal', '최근 터미널 출력', '오류 메시지, 테스트 출력, 빌드 로그'],
          ['@Cursor Rules', '특정 .mdc 규칙 파일', '현재 컨텍스트에 Manual 규칙 적용'],
        ]},
        { t: 'tip', text: '패턴: Rules (.mdc) = 항상 켜진 앰비언트 컨텍스트. @ 참조 = 세션별 정밀 컨텍스트. Rules는 "어떻게" 작업할지, @ 참조는 "무엇을" 작업할지를 정의합니다.' },
      ],
    },
  },
  {
    id: 'cursor-rules-writing', icon: '✍️',
    en: {
      title: 'Writing Rules That Actually Work',
      blocks: [
        { t: 'p', text: "Rules compete with your code and @-references for token budget. Poor rules dilute the quality of every AI response. Core principle: rules are constraints and conventions, not documentation or tutorials." },
        { t: 'table', headers: ['✅ Effective rule', '❌ Ineffective rule'], rows: [
          ['"No `any` — use `unknown` + narrowing"', '"TypeScript is a statically typed language"'],
          ['"All API handlers return NextResponse, never raw Response"', '"Make sure to follow Next.js best practices"'],
          ['"Validate with zod before any db call"', '"Always validate your inputs"'],
          ['"Never `// ...` to omit code — emit full blocks"', '"Write complete implementations"'],
          ['"pnpm only — never npm install"', '"Use the correct package manager"'],
        ]},
        { t: 'ul', items: [
          'Imperative mood: "Use X", "Never Y", "Always Z before W"',
          'One constraint per line — scannable, impossible to miss',
          'Name the exact thing: function name, type name, import path',
          'Under 100 lines per file — split by topic if longer',
          'No prose or explanation — just the rule itself',
          'Ask: "Would this surprise a senior dev on their first day?" If yes → rule. If obvious → skip.',
        ]},
      ],
    },
    ko: {
      title: '실제로 작동하는 규칙 작성법',
      blocks: [
        { t: 'p', text: "규칙은 코드와 @-참조와 함께 토큰 예산을 두고 경쟁합니다. 나쁜 규칙은 모든 AI 응답의 품질을 저하시킵니다. 핵심 원칙: 규칙은 제약과 관례입니다, 문서나 튜토리얼이 아닙니다." },
        { t: 'table', headers: ['✅ 효과적인 규칙', '❌ 비효과적인 규칙'], rows: [
          ['"any 금지 — unknown + 타입 좁히기"', '"TypeScript는 정적으로 타입이 지정된 언어"'],
          ['"모든 API 핸들러는 NextResponse 반환, raw Response 금지"', '"Next.js 모범 사례를 따르세요"'],
          ['"db 호출 전 zod로 검증 필수"', '"항상 입력을 검증하세요"'],
          ['"코드 생략에 // ... 금지 — 전체 블록 출력"', '"완전한 구현을 작성해 주세요"'],
          ['"pnpm만 사용 — npm install 금지"', '"올바른 패키지 매니저를 사용하세요"'],
        ]},
        { t: 'ul', items: [
          '명령형: "X 사용", "Y 절대 금지", "W 전에 항상 Z"',
          '한 줄에 제약 하나 — 스캔 가능, 놓치기 불가',
          '정확한 것 명시: 함수 이름, 타입 이름, import 경로',
          '파일당 100줄 미만 — 더 길면 주제별 분리',
          '산문이나 설명 없음 — 규칙 그 자체만',
          '"첫날 시니어 개발자를 놀라게 할까?" — 그렇다면 규칙, 당연하다면 생략.',
        ]},
      ],
    },
  },
]

// ─── Chapters ──────────────────────────────────────────────────────────────────

type GuideTool = 'claude' | 'codex' | 'cursor'
type ChapterId = 'intro' | 'overview' | 'arch' | 'loop' | 'ext'

const CHAPTERS: { id: ChapterId; num: string; en: string; ko: string }[] = [
  { id: 'intro',    num: '1', en: 'Intro',    ko: '소개' },
  { id: 'overview', num: '2', en: 'Features', ko: '기능' },
  { id: 'arch',     num: '3', en: 'Arch',     ko: '구조' },
  { id: 'loop',     num: '4', en: 'Loop',     ko: '루프' },
  { id: 'ext',      num: '5', en: 'Ext.',     ko: '확장' },
]

const TOOL_TABS: { id: GuideTool; label: string; badgeColor: string; activeClass: string }[] = [
  { id: 'claude', label: 'Claude Code', badgeColor: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30', activeClass: 'border-indigo-500 text-gray-900 dark:text-white' },
  { id: 'codex',  label: 'Codex CLI',   badgeColor: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30', activeClass: 'border-emerald-500 text-gray-900 dark:text-white' },
  { id: 'cursor', label: 'Cursor',      badgeColor: 'bg-violet-500/15 text-violet-300 border-violet-500/30', activeClass: 'border-violet-500 text-gray-900 dark:text-white' },
]

// ─── Lifecycle renderer ────────────────────────────────────────────────────────

function LifecycleStepRow({ step }: { step: LifecycleStep }) {
  return (
    <div className={`relative flex gap-3 items-start ${step.dim ? 'opacity-35' : ''}`}>
      <div className={`relative z-10 mt-[3px] w-[15px] h-[15px] rounded-full border flex-shrink-0 flex items-center justify-center ${
        step.hook === 'block'
          ? 'border-red-400 dark:border-red-500/50 bg-red-100 dark:bg-red-950/60'
          : 'border-gray-300 dark:border-white/12 bg-gray-50 dark:bg-white/[0.03]'
      }`}>
        <div className={`w-1.5 h-1.5 rounded-full ${
          step.hook === 'block' ? 'bg-red-500 dark:bg-red-400/80' : 'bg-indigo-400 dark:bg-indigo-400/50'
        }`} />
      </div>
      <div className="flex-1 pb-3.5 min-w-0">
        <div className="flex flex-wrap items-center gap-1.5 mb-0.5">
          <span className="text-[11px] font-mono font-semibold text-gray-800 dark:text-gray-200 leading-tight">
            {step.event}
          </span>
          {step.hook === 'block' && (
            <span className="text-[8px] px-1.5 py-px bg-red-100 dark:bg-red-500/15 text-red-600 dark:text-red-400/90 border border-red-300 dark:border-red-500/20 rounded-sm font-bold uppercase tracking-wide">BLOCK</span>
          )}
          {step.hook === 'react' && !step.dim && (
            <span className="text-[8px] px-1 py-px bg-gray-100 dark:bg-white/[0.04] text-gray-500 border border-gray-200 dark:border-white/8 rounded-sm">hook</span>
          )}
          {step.tag && (
            <span className={`text-[9px] px-1.5 py-px rounded-sm border font-medium ${step.tagClass}`}>{step.tag}</span>
          )}
        </div>
        <p className="text-[10px] text-gray-500 leading-relaxed">{step.desc}</p>
      </div>
    </div>
  )
}

function LifecycleFlow({ steps, loopLabel }: { steps: LifecycleStep[]; loopLabel?: string }) {
  const firstLoopIdx = steps.findIndex((s) => s.inLoop)
  const lastLoopIdx = steps.reduceRight((acc, s, i) => (acc === -1 && s.inLoop ? i : acc), -1)
  const hasLoop = firstLoopIdx !== -1
  const beforeLoop = hasLoop ? steps.slice(0, firstLoopIdx) : steps
  const loopSteps = hasLoop ? steps.slice(firstLoopIdx, lastLoopIdx + 1) : []
  const afterLoop = hasLoop ? steps.slice(lastLoopIdx + 1) : []

  return (
    <div className="relative py-1">
      <div className="absolute left-[7px] top-4 bottom-4 w-px bg-gray-200 dark:bg-white/[0.07]" />
      <div className="space-y-0">
        {beforeLoop.map((step, i) => <LifecycleStepRow key={i} step={step} />)}
        {hasLoop && loopSteps.length > 0 && (
          <div className="relative ml-[23px] mb-3.5">
            <div className="border border-amber-300 dark:border-amber-500/25 rounded-lg bg-amber-50 dark:bg-amber-950/10 px-3 pt-2 pb-0.5">
              <div className="flex items-center gap-1.5 mb-2">
                <span className="text-[9px] font-semibold text-amber-600 dark:text-amber-400/80 tracking-wide">
                  {loopLabel ?? '↻ Agentic Loop · repeats per tool call'}
                </span>
              </div>
              <div className="relative">
                <div className="absolute left-[7px] top-1 bottom-1 w-px bg-amber-300 dark:bg-amber-500/15" />
                {loopSteps.map((step, i) => <LifecycleStepRow key={i} step={step} />)}
              </div>
            </div>
          </div>
        )}
        {afterLoop.map((step, i) => <LifecycleStepRow key={`a${i}`} step={step} />)}
      </div>
    </div>
  )
}

// ─── Block Renderer ────────────────────────────────────────────────────────────

function BlockRenderer({ block }: { block: Block }) {
  switch (block.t) {
    case 'p':
      return <p className="text-[12px] text-gray-600 dark:text-gray-400 leading-relaxed">{block.text}</p>
    case 'ul':
      return (
        <ul className="space-y-1.5">
          {block.items.map((item, i) => (
            <li key={i} className="flex gap-2 text-[12px] text-gray-600 dark:text-gray-400 leading-relaxed">
              <span className="text-gray-400 dark:text-gray-600 shrink-0 mt-px select-none">•</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      )
    case 'ol':
      return (
        <ol className="space-y-2 list-none">
          {block.items.map((item, i) => (
            <li key={i} className="flex gap-2 text-[12px] text-gray-600 dark:text-gray-400 leading-relaxed">
              <span className="text-indigo-500/70 shrink-0 tabular-nums select-none font-mono text-[11px] mt-[1px]">{i + 1}.</span>
              <span>{item}</span>
            </li>
          ))}
        </ol>
      )
    case 'code':
      return (
        <pre className="bg-gray-100 dark:bg-black/30 border border-gray-200 dark:border-white/8 rounded-lg px-3 py-2.5 text-[11px] text-gray-700 dark:text-gray-300 font-mono overflow-auto whitespace-pre leading-relaxed">
          {block.text}
        </pre>
      )
    case 'tip':
      return (
        <div className="flex gap-2.5 px-3 py-2.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-500/20">
          <span className="text-indigo-500 dark:text-indigo-400 text-xs shrink-0 mt-px">💡</span>
          <p className="text-[12px] text-indigo-700 dark:text-indigo-300/90 leading-relaxed">{block.text}</p>
        </div>
      )
    case 'warn':
      return (
        <div className="flex gap-2.5 px-3 py-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-500/20">
          <span className="text-amber-500 dark:text-amber-400 text-xs shrink-0 mt-px">⚠️</span>
          <p className="text-[12px] text-amber-700 dark:text-amber-300/90 leading-relaxed">{block.text}</p>
        </div>
      )
    case 'lifecycle':
      return <LifecycleFlow steps={block.steps} loopLabel={block.loopLabel} />
    case 'table':
      return (
        <div className="overflow-auto rounded-lg border border-gray-200 dark:border-white/8">
          <table className="w-full text-[11px] border-collapse">
            <thead>
              <tr className="bg-gray-100 dark:bg-white/[0.04]">
                {block.headers.map((h, i) => (
                  <th key={i} className="px-3 py-2 text-left text-gray-600 dark:text-gray-400 font-semibold border-b border-gray-200 dark:border-white/8 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row, ri) => (
                <tr key={ri} className="border-b border-gray-100 dark:border-white/[0.04] last:border-0 hover:bg-gray-50 dark:hover:bg-white/[0.02]">
                  {row.map((cell, ci) => (
                    <td key={ci} className={`px-3 py-2 text-gray-600 dark:text-gray-400 align-top ${ci === 0 ? 'font-mono text-gray-700 dark:text-gray-300 whitespace-nowrap' : ''}`}>{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )
  }
}

// ─── Chapter 1: Intro ─────────────────────────────────────────────────────────

function Chapter1({ isKo }: { isKo: boolean }) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-base font-bold text-gray-900 dark:text-white mb-3">
          {isKo ? 'Claude Code란?' : 'What is Claude Code?'}
        </h2>
        <div className="rounded-xl border border-indigo-200 dark:border-indigo-500/20 bg-indigo-50 dark:bg-indigo-950/20 px-4 py-3 space-y-1.5">
          <p className="text-[13px] text-indigo-800 dark:text-indigo-200 leading-relaxed font-medium">
            {isKo
              ? 'Claude Code는 터미널에서 동작하는 에이전틱 AI 코딩 어시스턴트입니다.'
              : 'Claude Code is an agentic AI coding assistant that runs in your terminal.'}
          </p>
          <p className="text-[12px] text-indigo-700 dark:text-indigo-300 leading-relaxed">
            {isKo
              ? '작업을 주면 자율적으로 코드를 읽고, 쓰고, 테스트하고, 커밋합니다 — 사람처럼 작업 흐름 전체를 처리합니다.'
              : 'Give it a task; it autonomously reads, writes, tests, and commits code — handling the full workflow like a developer would.'}
          </p>
          <p className="text-[12px] text-indigo-700 dark:text-indigo-300 leading-relaxed">
            {isKo
              ? '핵심은 에이전트 루프(Agent Loop)입니다. 5가지 확장 지점(CLAUDE.md, MCP, Skills, Hooks, Subagents)이 각각 루프의 특정 생명주기 이벤트에 연결됩니다.'
              : 'The core is the Agent Loop — 5 extension points (CLAUDE.md, MCP, Skills, Hooks, Subagents) each attach to a specific lifecycle event in that loop.'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {[
          { icon: '🖥️', en: 'Terminal-first', ko: '터미널 중심', en2: 'Works anywhere — no IDE plugin needed', ko2: '어디서나 동작 — IDE 플러그인 불필요' },
          { icon: '🔄', en: 'Event-driven', ko: '이벤트 기반', en2: 'Lifecycle hooks at every step', ko2: '모든 단계에 라이프사이클 훅' },
          { icon: '🤖', en: 'Anthropic models', ko: 'Anthropic 모델', en2: 'Sonnet 4.6, Opus 4.8', ko2: 'Sonnet 4.6, Opus 4.8' },
        ].map((card) => (
          <div key={card.en} className="rounded-lg border border-gray-200 dark:border-white/8 bg-white dark:bg-white/[0.02] p-3">
            <div className="text-xl mb-1.5">{card.icon}</div>
            <div className="text-[11px] font-semibold text-gray-800 dark:text-gray-200 mb-0.5">
              {isKo ? card.ko : card.en}
            </div>
            <div className="text-[10px] text-gray-500 leading-snug">
              {isKo ? card.ko2 : card.en2}
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-lg border border-gray-200 dark:border-white/8 bg-gray-50 dark:bg-white/[0.02] px-3 py-2.5">
        <div className="text-[10px] text-gray-500 dark:text-gray-500 mb-1.5 font-semibold uppercase tracking-wide">
          {isKo ? '빠른 시작' : 'Quick start'}
        </div>
        <pre className="text-[11px] font-mono text-gray-700 dark:text-gray-300">
{`npm install -g @anthropic-ai/claude-code
cd your-project
claude`}
        </pre>
      </div>
    </div>
  )
}

// ─── Chapter 2: Features Overview ─────────────────────────────────────────────

function Chapter2({ isKo }: { isKo: boolean }) {
  const features = [
    {
      num: '①', name: 'CLAUDE.md', color: 'indigo',
      lifecycle: 'InstructionsLoaded',
      en: 'Project context injected into every session automatically',
      ko: '프로젝트 컨텍스트가 모든 세션에 자동 주입',
      en2: 'The system prompt you control. Multiple files merge hierarchically.',
      ko2: '당신이 제어하는 시스템 프롬프트. 여러 파일이 계층적으로 병합됩니다.',
    },
    {
      num: '②', name: 'MCP Servers', color: 'emerald',
      lifecycle: 'SessionStart',
      en: 'External tools registered before first prompt',
      ko: '첫 프롬프트 전 외부 도구 등록',
      en2: 'GitHub, databases, web search — callable like built-in tools.',
      ko2: 'GitHub, DB, 웹 검색 — 내장 도구처럼 호출 가능.',
    },
    {
      num: '③', name: 'Skills', color: 'violet',
      lifecycle: 'UserPromptExpansion',
      en: 'Workflow bodies loaded only when invoked (lazy)',
      ko: '호출 시에만 로드되는 워크플로우 (지연)',
      en2: '/review /test /deploy — zero token cost when unused.',
      ko2: '/review /test /deploy — 미사용 시 토큰 비용 0.',
    },
    {
      num: '④', name: 'Hooks', color: 'red',
      lifecycle: 'Any lifecycle event',
      en: 'Shell commands that fire at lifecycle events automatically',
      ko: '생명주기 이벤트에 자동 발동하는 셸 명령',
      en2: 'Guards, auto-formatters, Slack notifiers — cannot be bypassed.',
      ko2: '가드, 자동 포매터, Slack 알림 — 우회 불가.',
    },
    {
      num: '⑤', name: 'Subagents', color: 'purple',
      lifecycle: 'Execute Tool (inside loop)',
      en: 'Parallel isolated Claude instances spawned mid-loop',
      ko: '루프 중 생성되는 병렬 격리 Claude 인스턴스',
      en2: 'Up to 10 parallel. Own context window — no context pollution.',
      ko2: '최대 10개 병렬. 독립 컨텍스트 — 오염 없음.',
    },
  ]

  const colorMap: Record<string, string> = {
    indigo: 'bg-indigo-500/10 border-indigo-200 dark:border-indigo-500/25 text-indigo-700 dark:text-indigo-300',
    emerald: 'bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/25 text-emerald-700 dark:text-emerald-300',
    violet: 'bg-violet-500/10 border-violet-200 dark:border-violet-500/25 text-violet-700 dark:text-violet-300',
    red: 'bg-red-500/10 border-red-200 dark:border-red-500/25 text-red-700 dark:text-red-300',
    purple: 'bg-purple-500/10 border-purple-200 dark:border-purple-500/25 text-purple-700 dark:text-purple-300',
  }

  return (
    <div className="space-y-4">
      <h2 className="text-base font-bold text-gray-900 dark:text-white">
        {isKo ? '기능 개요 — 5가지 확장 지점' : 'Features Overview — 5 Extension Points'}
      </h2>

      {/* Image-style lifecycle attachment table */}
      <div className="overflow-auto rounded-xl border border-gray-200 dark:border-white/10">
        <table className="w-full text-[11px] border-collapse">
          <thead>
            <tr className="bg-gray-100 dark:bg-white/[0.05]">
              <th className="px-3 py-2 text-left font-semibold text-gray-600 dark:text-gray-400 border-b border-gray-200 dark:border-white/8 w-[90px]">
                {isKo ? '확장 기능' : 'Feature'}
              </th>
              <th className="px-3 py-2 text-left font-semibold text-gray-600 dark:text-gray-400 border-b border-gray-200 dark:border-white/8">
                {isKo ? '공식 라이프사이클 부착 지점' : 'Lifecycle Attachment Point'}
              </th>
              <th className="px-3 py-2 text-left font-semibold text-gray-600 dark:text-gray-400 border-b border-gray-200 dark:border-white/8">
                {isKo ? '작동 방식의 본질' : 'How it Works'}
              </th>
            </tr>
          </thead>
          <tbody>
            {features.map((f) => (
              <tr key={f.name} className="border-b border-gray-100 dark:border-white/[0.04] last:border-0">
                <td className="px-3 py-2.5 align-top">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[10px] font-bold ${colorMap[f.color]}`}>
                    {f.num} {f.name}
                  </span>
                </td>
                <td className="px-3 py-2.5 align-top">
                  <code className="text-[10px] font-mono text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-white/[0.06] px-1.5 py-0.5 rounded">
                    {f.lifecycle}
                  </code>
                </td>
                <td className="px-3 py-2.5 align-top text-[11px] text-gray-600 dark:text-gray-400 leading-snug">
                  {isKo ? f.ko : f.en}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Feature cards */}
      <div className="space-y-2">
        {features.map((f) => (
          <div key={f.name} className="rounded-lg border border-gray-200 dark:border-white/8 bg-white dark:bg-white/[0.02] px-3 py-2.5">
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${colorMap[f.color]}`}>
                {f.num} {f.name}
              </span>
              <span className="text-[10px] text-gray-500">
                {isKo ? f.ko : f.en}
              </span>
            </div>
            <p className="text-[11px] text-gray-500 leading-relaxed pl-0.5">
              {isKo ? f.ko2 : f.en2}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Chapter 3: Architecture ──────────────────────────────────────────────────

function Chapter3({ isKo }: { isKo: boolean }) {
  type ArchRow = { phase: string; badge?: string; badgeClass?: string; loopStart?: boolean; loopEnd?: boolean; inLoop?: boolean; dim?: boolean }

  const rows: ArchRow[] = [
    { phase: 'SessionStart', badge: isKo ? '② MCP + ① CLAUDE.md' : '② MCP + ① CLAUDE.md', badgeClass: 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/30' },
    { phase: 'InstructionsLoaded', badge: isKo ? '① CLAUDE.md 완료' : '① CLAUDE.md merged', badgeClass: 'bg-indigo-100 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-500/30' },
    { phase: 'UserPromptSubmit', badge: isKo ? '④ Hooks (차단 가능)' : '④ Hooks (can block)', badgeClass: 'bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-300 border-red-200 dark:border-red-500/30' },
    { phase: 'UserPromptExpansion', badge: isKo ? '③ Skills 지연 로드' : '③ Skills lazy-load', badgeClass: 'bg-violet-100 dark:bg-violet-950/40 text-violet-700 dark:text-violet-300 border-violet-200 dark:border-violet-500/30', loopStart: true },
    { phase: 'PreToolUse', badge: isKo ? '④ Hooks BLOCK' : '④ Hooks BLOCK', badgeClass: 'bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-300 border-red-200 dark:border-red-500/30', inLoop: true },
    { phase: 'Execute Tool', badge: isKo ? '② MCP · ⑤ Subagents' : '② MCP · ⑤ Subagents', badgeClass: 'bg-purple-100 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-500/30', inLoop: true },
    { phase: 'PostToolUse', badge: isKo ? '④ Hooks REACT' : '④ Hooks REACT', badgeClass: 'bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-500/30', inLoop: true, loopEnd: true },
    { phase: 'PostToolBatch', dim: true },
    { phase: 'Stop', badge: isKo ? '④ Hooks 비동기' : '④ Hooks async', badgeClass: 'bg-gray-100 dark:bg-gray-800/60 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-white/10' },
    { phase: 'SessionEnd / FileChanged', dim: true },
  ]

  let inLoopSection = false

  return (
    <div className="space-y-4">
      <h2 className="text-base font-bold text-gray-900 dark:text-white">
        {isKo ? 'Claude Code 아키텍처' : 'Claude Code Architecture'}
      </h2>

      {/* VS Code-style window */}
      <div className="rounded-xl border border-gray-200 dark:border-white/10 overflow-hidden">
        {/* Title bar */}
        <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-[#1e1e1e] border-b border-gray-200 dark:border-white/8">
          <div className="flex gap-1.5">
            <div className="w-[10px] h-[10px] rounded-full bg-[#ff5f57]" />
            <div className="w-[10px] h-[10px] rounded-full bg-[#febc2e]" />
            <div className="w-[10px] h-[10px] rounded-full bg-[#28c840]" />
          </div>
          <span className="text-[9px] text-gray-400 dark:text-gray-500 ml-1 font-mono">
            {isKo ? 'claude — 에이전트 생명주기' : 'claude — agent lifecycle'}
          </span>
        </div>

        {/* Diagram body */}
        <div className="bg-white dark:bg-[#0d1117] p-4">
          {/* Input sources */}
          <div className="flex gap-2 mb-3">
            {[
              { label: 'CLAUDE.md', c: 'bg-indigo-100 dark:bg-indigo-950/50 border-indigo-300 dark:border-indigo-500/40 text-indigo-700 dark:text-indigo-300' },
              { label: '.mcp.json', c: 'bg-emerald-100 dark:bg-emerald-950/50 border-emerald-300 dark:border-emerald-500/40 text-emerald-700 dark:text-emerald-300' },
              { label: isKo ? '사용자 프롬프트' : 'User Prompt', c: 'bg-gray-100 dark:bg-white/5 border-gray-300 dark:border-white/15 text-gray-600 dark:text-gray-400' },
            ].map((src) => (
              <span key={src.label} className={`text-[9px] font-mono font-semibold px-2 py-1 rounded border ${src.c}`}>{src.label}</span>
            ))}
            <span className="text-[9px] text-gray-400 self-center">↓</span>
          </div>

          {/* Timeline */}
          <div className="relative">
            <div className="absolute left-[7px] top-2 bottom-2 w-px bg-gray-200 dark:bg-white/[0.08]" />

            <div className="space-y-0">
              {rows.map((row, i) => {
                const wasInLoop = inLoopSection
                if (row.inLoop) inLoopSection = true
                if (row.loopEnd) { /* reset after render */ }

                const isFirstLoop = !wasInLoop && row.inLoop
                const isLastLoop = row.loopEnd

                return (
                  <div key={i}>
                    {isFirstLoop && (
                      <div className="ml-5 mb-1 mt-0.5">
                        <div className="text-[8px] font-bold text-amber-600 dark:text-amber-400/80 uppercase tracking-wider">
                          ↻ {isKo ? '에이전트 루프 (툴 호출마다 반복)' : 'Agentic Loop (repeats per tool call)'}
                        </div>
                      </div>
                    )}

                    <div className={`relative flex items-center gap-2 py-[5px] ${row.inLoop ? 'ml-3 pl-2 border-l-2 border-amber-300 dark:border-amber-500/30' : ''} ${row.dim ? 'opacity-40' : ''}`}>
                      <div className={`relative z-10 w-[15px] h-[15px] rounded-full border flex-shrink-0 flex items-center justify-center ${
                        row.badge && row.badgeClass?.includes('red')
                          ? 'border-red-400 dark:border-red-500/50 bg-red-50 dark:bg-red-950/40'
                          : 'border-gray-300 dark:border-white/15 bg-white dark:bg-white/[0.04]'
                      }`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${row.badge && row.badgeClass?.includes('red') ? 'bg-red-400' : 'bg-indigo-400 dark:bg-indigo-400/60'}`} />
                      </div>
                      <span className="text-[10px] font-mono font-medium text-gray-700 dark:text-gray-300 shrink-0">
                        {row.phase}
                      </span>
                      {row.badge && (
                        <>
                          <span className="text-[9px] text-gray-300 dark:text-gray-700">→</span>
                          <span className={`text-[9px] px-1.5 py-0.5 rounded border font-medium ${row.badgeClass}`}>
                            {row.badge}
                          </span>
                        </>
                      )}
                    </div>

                    {isLastLoop && <div className="h-1" />}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-2.5 px-3 py-2.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-500/20">
        <span className="text-indigo-500 text-xs shrink-0 mt-px">💡</span>
        <p className="text-[12px] text-indigo-700 dark:text-indigo-300/90 leading-relaxed">
          {isKo
            ? '5가지 기능은 독립적인 도구가 아닙니다 — 모두 같은 에이전트 루프에 연결된 훅이며, 각각 다른 생명주기 이벤트에서 활성화됩니다.'
            : "The 5 features aren't independent tools — they're all hooks into the same Agent Loop, each activating at a different lifecycle event."}
        </p>
      </div>
    </div>
  )
}

// ─── Chapter 4: Agent Loop ────────────────────────────────────────────────────

function Chapter4({ isKo }: { isKo: boolean }) {
  return (
    <div className="space-y-4">
      <h2 className="text-base font-bold text-gray-900 dark:text-white">
        {isKo ? '에이전트 루프 — 핵심 구동 체계' : 'Agent Loop — The Core Engine'}
      </h2>
      <p className="text-[12px] text-gray-600 dark:text-gray-400 leading-relaxed">
        {isKo
          ? 'Claude Code의 모든 기능은 에이전트 루프의 특정 생명주기 이벤트에 밀착됩니다. 이 루프를 이해하면 Claude Code 전체가 보입니다.'
          : "All of Claude Code's features plug into a specific lifecycle event of the Agent Loop. Understanding this loop is understanding how Claude Code works."}
      </p>
      <LifecycleFlow
        steps={isKo ? LOOP_STEPS_KO : LOOP_STEPS_EN}
        loopLabel={isKo ? '↻ 에이전트 루프 · 툴 호출마다 반복' : '↻ Agentic Loop · repeats per tool call'}
      />
      <div className="overflow-auto rounded-lg border border-gray-200 dark:border-white/8">
        <table className="w-full text-[11px] border-collapse">
          <thead>
            <tr className="bg-gray-100 dark:bg-white/[0.04]">
              {(isKo ? ['기능', '생명주기 지점', '역할'] : ['Feature', 'Lifecycle Point', 'Role']).map((h, i) => (
                <th key={i} className="px-3 py-2 text-left text-gray-600 dark:text-gray-400 font-semibold border-b border-gray-200 dark:border-white/8 whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(isKo ? [
              ['CLAUDE.md', 'InstructionsLoaded', '모든 세션에 프로젝트 컨텍스트 주입'],
              ['MCP 서버', 'SessionStart', '외부 도구 등록; 호출 가능 상태로 전환'],
              ['Skills', 'UserPromptExpansion', '워크플로우 본문 — 사용 시에만 지연 로드'],
              ['Hooks', '모든 생명주기 지점', '횡단 관심사: 가드, 변환, 알림'],
              ['Subagents', '에이전트 루프 내부', '병렬 격리 실행; 독립된 컨텍스트 창'],
            ] : [
              ['CLAUDE.md', 'InstructionsLoaded', 'Project context injected into every session'],
              ['MCP Servers', 'SessionStart', 'External tools registered; become callable'],
              ['Skills', 'UserPromptExpansion', 'Workflow body loaded only when invoked'],
              ['Hooks', 'ANY lifecycle point', 'Cross-cutting guards, transforms, notifiers'],
              ['Subagents', 'Inside Agentic Loop', 'Parallel isolated execution; own context window'],
            ]).map((row, ri) => (
              <tr key={ri} className="border-b border-gray-100 dark:border-white/[0.04] last:border-0 hover:bg-gray-50 dark:hover:bg-white/[0.02]">
                {row.map((cell, ci) => (
                  <td key={ci} className={`px-3 py-2 text-gray-600 dark:text-gray-400 align-top ${ci === 0 ? 'font-mono text-gray-700 dark:text-gray-300 whitespace-nowrap' : ''}`}>{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex gap-2.5 px-3 py-2.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-500/20">
        <span className="text-indigo-500 text-xs shrink-0 mt-px">💡</span>
        <p className="text-[12px] text-indigo-700 dark:text-indigo-300/90 leading-relaxed">
          {isKo
            ? 'CLAUDE.md는 항상 로드됩니다(토큰 항상 소비). Skills는 사용 시에만 로드됩니다(지연). Hooks는 Skills나 MCP와 무관하게 항상 발동됩니다.'
            : 'CLAUDE.md is always loaded (token overhead). Skills load only when used (lazy). Hooks fire regardless of skills or MCP — they are pure lifecycle events.'}
        </p>
      </div>
    </div>
  )
}

// ─── Chapter 5: Extensions ────────────────────────────────────────────────────

type ExtTab = 'claude-md' | 'mcp' | 'skills' | 'hooks' | 'subagents'

const EXT_CONTENT: Record<ExtTab, { en: SectionContent; ko: SectionContent }> = {
  'claude-md': {
    en: {
      title: 'CLAUDE.md — Context & Memory',
      blocks: [
        { t: 'p', text: "CLAUDE.md fires at InstructionsLoaded — before any user input — shaping every response in the session. Think of it as the system prompt you control. Multiple CLAUDE.md files merge hierarchically:" },
        { t: 'ul', items: [
          'Enterprise → User (~/.claude/CLAUDE.md) → Project (repo root) → Folder (subdir)',
          'Each level overrides the previous; folder-level wins over project-level',
          'InstructionsLoaded hook fires after all files are merged',
        ]},
        { t: 'code', text: '# CLAUDE.md — fires at InstructionsLoaded\n\n## Architecture\nMonorepo: apps/extension (CommonJS) + apps/webview (ESM/Vite)\n\n## Hard Rules\n- No `any` types — use `unknown` + narrowing\n- packages/core must be DOM-free and vscode-free\n- Commits: feat/fix/chore/docs/refactor prefix only\n\n## Commands\n- pnpm build       # full build\n- pnpm --filter webview dev  # webview only' },
        { t: 'warn', text: 'Keep CLAUDE.md under 200 lines. Every line costs tokens on every request. Move procedures into Skills (lazy-loaded).' },
      ],
    },
    ko: {
      title: 'CLAUDE.md — 컨텍스트 & 메모리',
      blocks: [
        { t: 'p', text: 'CLAUDE.md는 InstructionsLoaded 시점에 발동합니다 — 사용자 입력 처리 전. 세션의 모든 응답을 형성하는 당신이 제어하는 시스템 프롬프트입니다.' },
        { t: 'ul', items: [
          '엔터프라이즈 → 사용자 (~/.claude/CLAUDE.md) → 프로젝트 (루트) → 폴더',
          '각 레벨이 이전을 오버라이드; 폴더 레벨이 프로젝트 레벨보다 우선',
          '모든 파일 병합 후 InstructionsLoaded 훅 발동',
        ]},
        { t: 'code', text: '# CLAUDE.md — InstructionsLoaded 시 발동\n\n## 아키텍처\n모노레포: apps/extension (CommonJS) + apps/webview (ESM/Vite)\n\n## 엄격한 규칙\n- any 타입 금지 — unknown + narrowing 사용\n- packages/core는 DOM-free, vscode-free 유지\n- 커밋: feat/fix/chore/docs/refactor 접두사만\n\n## 명령어\n- pnpm build       # 전체 빌드\n- pnpm --filter webview dev  # webview만' },
        { t: 'warn', text: 'CLAUDE.md는 200줄 이하로 유지하세요. 모든 줄이 모든 요청에서 토큰 비용이 됩니다. 절차는 Skills(지연 로드)로 이동하세요.' },
      ],
    },
  },
  'mcp': {
    en: {
      title: 'MCP Servers — External Tool Integration',
      blocks: [
        { t: 'p', text: "MCP servers start at SessionStart and register tools before the first prompt. Each server's tools appear as callable functions — also available as /mcp__[server]__[tool] slash commands." },
        { t: 'code', text: '// .mcp.json\n{\n  "mcpServers": {\n    "github": {\n      "command": "npx",\n      "args": ["-y", "@modelcontextprotocol/server-github"],\n      "env": { "GITHUB_TOKEN": "${GITHUB_TOKEN}" }\n    },\n    "postgres": {\n      "command": "npx",\n      "args": ["-y", "@modelcontextprotocol/server-postgres"],\n      "env": { "DATABASE_URL": "${DATABASE_URL}" }\n    }\n  }\n}' },
        { t: 'table', headers: ['MCP Server', 'Key Tools', 'Use Case'], rows: [
          ['filesystem', 'read_file, write_file', 'Files outside the workspace'],
          ['github', 'create_issue, get_pr', 'GitHub API without raw curl'],
          ['memory', 'remember, recall', 'Cross-session persistent KV store'],
          ['postgres', 'query, describe_table', 'Direct DB queries inside Claude'],
          ['brave-search', 'web_search', 'Web search in context window'],
        ]},
        { t: 'tip', text: 'Hooks can match "mcp__.*" regex to intercept all MCP calls — useful for logging every external API call or blocking specific servers in CI.' },
      ],
    },
    ko: {
      title: 'MCP 서버 — 외부 도구 통합',
      blocks: [
        { t: 'p', text: 'MCP 서버는 SessionStart 시점에 시작되어 도구를 등록합니다. 각 서버의 도구가 호출 가능한 함수로 나타납니다 — /mcp__[서버]__[도구] 슬래시 커맨드도 자동 생성됩니다.' },
        { t: 'code', text: '// .mcp.json\n{\n  "mcpServers": {\n    "github": {\n      "command": "npx",\n      "args": ["-y", "@modelcontextprotocol/server-github"],\n      "env": { "GITHUB_TOKEN": "${GITHUB_TOKEN}" }\n    },\n    "postgres": {\n      "command": "npx",\n      "args": ["-y", "@modelcontextprotocol/server-postgres"],\n      "env": { "DATABASE_URL": "${DATABASE_URL}" }\n    }\n  }\n}' },
        { t: 'table', headers: ['MCP 서버', '주요 도구', '사용 사례'], rows: [
          ['filesystem', 'read_file, write_file', '워크스페이스 외부 파일'],
          ['github', 'create_issue, get_pr', '원시 curl 없이 GitHub API'],
          ['memory', 'remember, recall', '세션 간 지속 KV 저장소'],
          ['postgres', 'query, describe_table', 'Claude 내부 직접 DB 쿼리'],
          ['brave-search', 'web_search', '컨텍스트 창 내 웹 검색'],
        ]},
        { t: 'tip', text: 'Hooks는 "mcp__.*" 정규식으로 모든 MCP 호출을 가로챌 수 있습니다 — CI에서 특정 서버 차단이나 모든 외부 API 호출 로깅에 유용합니다.' },
      ],
    },
  },
  'skills': {
    en: {
      title: 'Skills — Lazy-Loaded Workflows',
      blocks: [
        { t: 'p', text: "Skills are named workflow files. Their body loads only at UserPromptExpansion — when you type /skill-name or Claude auto-detects a match. Long checklists cost zero tokens when unused." },
        { t: 'table', headers: ['invocation', 'Who triggers', 'Useful for'], rows: [
          ['user', 'User via /skill-name only', 'Deployment scripts, risky workflows'],
          ['agent', 'Claude auto-matches via description', 'Repeatable analysis, test runs'],
          ['disabled', 'Nobody (WIP)', 'Staging a skill under development'],
        ]},
        { t: 'code', text: '# .claude/skills/review/SKILL.md\n---\ndescription: "Run a full PR code review on the current diff"\ninvocation: user\ncontext: fork\n---\n\nReview the current `git diff` for:\n1. Correctness bugs and edge-case failures\n2. Security (OWASP Top 10)\n3. Performance regressions\n4. Missing test coverage\n\nOutput a prioritized list with `file:line` refs.' },
        { t: 'tip', text: 'context: fork runs the skill in an isolated subagent — keeping the lead context clean. Use it for long analysis tasks.' },
      ],
    },
    ko: {
      title: 'Skills — 지연 로드 워크플로우',
      blocks: [
        { t: 'p', text: '스킬은 이름이 있는 워크플로우 파일입니다. 본문은 UserPromptExpansion 시점에만 로드됩니다 — /skill-name 입력 시 또는 Claude 자동 매칭 시. 미사용 시 토큰 비용 0입니다.' },
        { t: 'table', headers: ['invocation 값', '누가 트리거', '적합한 용도'], rows: [
          ['user', '사용자가 /skill-name으로만', '배포 스크립트, 위험한 워크플로우'],
          ['agent', 'Claude가 description으로 자동 매칭', '반복 분석, 테스트 실행'],
          ['disabled', '아무도 (진행 중인 작업)', '개발 중인 스킬 스테이징'],
        ]},
        { t: 'code', text: '# .claude/skills/review/SKILL.md\n---\ndescription: "현재 diff에 대해 전체 PR 코드 리뷰 실행"\ninvocation: user\ncontext: fork\n---\n\n현재 `git diff`를 다음 항목으로 리뷰하세요:\n1. 정확성 버그 및 엣지 케이스\n2. 보안 (OWASP Top 10)\n3. 성능 회귀\n4. 누락된 테스트 커버리지\n\n`file:line` 참조와 함께 우선순위 목록 출력.' },
        { t: 'tip', text: 'context: fork는 스킬을 격리된 서브에이전트에서 실행합니다 — 리드 컨텍스트를 깔끔하게 유지합니다. 긴 분석 작업에 사용하세요.' },
      ],
    },
  },
  'hooks': {
    en: {
      title: 'Hooks — Lifecycle Guards & Automation',
      blocks: [
        { t: 'p', text: "Hooks are shell commands that fire at lifecycle events automatically — regardless of what Claude decides. Unlike Skills (which Claude can choose), Hooks cannot be bypassed by Claude." },
        { t: 'table', headers: ['Event', 'Can block?', 'Common use'], rows: [
          ['PreToolUse', '✅ yes', 'Block rm -rf, force push'],
          ['PostToolUse', '⚠️ via context', 'Auto-lint, format, notify'],
          ['UserPromptSubmit', '✅ yes', 'Inject context, block off-topic'],
          ['Stop', '❌ no', 'Post-turn metrics, Slack notify'],
          ['FileChanged', '❌ no', 'Run formatter, test watcher'],
          ['SessionStart', '❌ no', 'Load env, print project status'],
          ['SubagentStop', '❌ no', 'Collect subagent results'],
        ]},
        { t: 'code', text: '// .claude/settings.json\n{\n  "hooks": {\n    "PreToolUse": [{\n      "matcher": "Bash",\n      "hooks": [{ "type": "command", "command": ".claude/hooks/guard.sh" }]\n    }],\n    "PostToolUse": [{\n      "matcher": "Edit",\n      "hooks": [{ "type": "command", "command": "npx eslint --fix ${tool_input.file_path}" }]\n    }]\n  }\n}\n\n# guard.sh (exit 2 = block, exit 0 = allow)\n#!/bin/bash\nCMD=$(cat | jq -r \'.tool_input.command\')\nif echo "$CMD" | grep -qE \'rm -rf|git push.*-f\'; then\n  echo \'{"hookSpecificOutput":{"permissionDecision":"deny"}}\'\nfi' },
      ],
    },
    ko: {
      title: 'Hooks — 생명주기 가드 & 자동화',
      blocks: [
        { t: 'p', text: 'Hooks는 생명주기 이벤트에서 자동으로 발동하는 셸 명령입니다 — Claude의 결정과 무관하게. Skills와 달리, Hooks는 Claude가 우회할 수 없습니다.' },
        { t: 'table', headers: ['이벤트', '차단 가능?', '대표 사용법'], rows: [
          ['PreToolUse', '✅ 가능', 'rm -rf, force push 차단'],
          ['PostToolUse', '⚠️ 컨텍스트로', '자동 린트, 포맷, 알림'],
          ['UserPromptSubmit', '✅ 가능', '컨텍스트 주입, 주제 외 차단'],
          ['Stop', '❌ 불가', '턴 후 메트릭, Slack 알림'],
          ['FileChanged', '❌ 불가', '포매터 실행, 테스트 워처'],
          ['SessionStart', '❌ 불가', '환경 로드, 프로젝트 상태 출력'],
          ['SubagentStop', '❌ 불가', '서브에이전트 결과 수집'],
        ]},
        { t: 'code', text: '// .claude/settings.json\n{\n  "hooks": {\n    "PreToolUse": [{\n      "matcher": "Bash",\n      "hooks": [{ "type": "command", "command": ".claude/hooks/guard.sh" }]\n    }],\n    "PostToolUse": [{\n      "matcher": "Edit",\n      "hooks": [{ "type": "command", "command": "npx eslint --fix ${tool_input.file_path}" }]\n    }]\n  }\n}\n\n# guard.sh (exit 2 = 차단, exit 0 = 허용)\n#!/bin/bash\nCMD=$(cat | jq -r \'.tool_input.command\')\nif echo "$CMD" | grep -qE \'rm -rf|git push.*-f\'; then\n  echo \'{"hookSpecificOutput":{"permissionDecision":"deny"}}\'\nfi' },
      ],
    },
  },
  'subagents': {
    en: {
      title: 'Subagents — Parallel Delegation',
      blocks: [
        { t: 'p', text: "Subagents are separate Claude Code instances spawned inside the agentic loop. They execute in an isolated context window — preventing context pollution — then return results to the lead agent. Up to 10 run in parallel." },
        { t: 'table', headers: ['Concept', 'Detail'], rows: [
          ['Spawned by', 'Lead agent or context:fork skill'],
          ['Isolation', 'Own context window; lead context stays clean'],
          ['Tool access', 'Restricted to what the lead permits'],
          ['Parallel limit', 'Up to 10 simultaneous subagents'],
          ['SubagentStart hook', 'Fires on spawn; log, apply policy'],
          ['SubagentStop hook', 'Fires on completion; collect, validate'],
        ]},
        { t: 'code', text: '# .claude/skills/test-and-fix/SKILL.md\n---\ndescription: "Run full test suite, fix all failures"\ncontext: fork    # isolated subagent; lead context unaffected\n---\n\n1. Run `pnpm test` and capture failures\n2. For each failure, identify root cause\n3. Fix source (not test assertions)\n4. Re-run only fixed tests to verify\n5. Report: N fixed, N remaining' },
        { t: 'tip', text: "Agent SDK: For full custom orchestration, build your own agents powered by Claude Code's tools with complete control over which tools each agent accesses." },
      ],
    },
    ko: {
      title: 'Subagents — 병렬 위임',
      blocks: [
        { t: 'p', text: '서브에이전트는 에이전트 루프 내에서 생성되는 별도의 Claude Code 인스턴스입니다. 격리된 컨텍스트 창에서 실행(오염 방지)하고 결과를 리드 에이전트에 반환합니다. 최대 10개 병렬 실행.' },
        { t: 'table', headers: ['개념', '상세'], rows: [
          ['생성 주체', '리드 에이전트 또는 context:fork 스킬'],
          ['격리', '자체 컨텍스트 창; 리드 컨텍스트 오염 없음'],
          ['도구 접근', '리드가 허용한 도구로 제한'],
          ['병렬 한도', '최대 10개 동시 서브에이전트'],
          ['SubagentStart 훅', '생성 시 발동; 로그, 정책 적용'],
          ['SubagentStop 훅', '완료 시 발동; 수집, 검증'],
        ]},
        { t: 'code', text: '# .claude/skills/test-and-fix/SKILL.md\n---\ndescription: "전체 테스트 스위트 실행 후 모든 실패 수정"\ncontext: fork    # 격리된 서브에이전트\n---\n\n1. `pnpm test` 실행 후 실패 캡처\n2. 각 실패에서 근본 원인 파악\n3. 소스 수정 (테스트 단언 아님)\n4. 수정된 테스트만 재실행하여 검증\n5. 보고: N개 수정, N개 남음' },
        { t: 'tip', text: 'Agent SDK: 완전한 커스텀 오케스트레이션을 위해 Claude Code의 도구로 구동되는 자체 에이전트를 구축하세요.' },
      ],
    },
  },
}

function Chapter5({ isKo }: { isKo: boolean }) {
  const [extTab, setExtTab] = useState<ExtTab>('claude-md')

  const tabs: { id: ExtTab; label: string; color: string; activeColor: string }[] = [
    { id: 'claude-md', label: 'CLAUDE.md', color: 'text-indigo-600 dark:text-indigo-400', activeColor: 'bg-indigo-100 dark:bg-indigo-950/50 border-indigo-300 dark:border-indigo-500/40' },
    { id: 'mcp', label: 'MCP', color: 'text-emerald-600 dark:text-emerald-400', activeColor: 'bg-emerald-100 dark:bg-emerald-950/50 border-emerald-300 dark:border-emerald-500/40' },
    { id: 'skills', label: 'Skills', color: 'text-violet-600 dark:text-violet-400', activeColor: 'bg-violet-100 dark:bg-violet-950/50 border-violet-300 dark:border-violet-500/40' },
    { id: 'hooks', label: 'Hooks', color: 'text-red-600 dark:text-red-400', activeColor: 'bg-red-100 dark:bg-red-950/50 border-red-300 dark:border-red-500/40' },
    { id: 'subagents', label: 'Subagents', color: 'text-purple-600 dark:text-purple-400', activeColor: 'bg-purple-100 dark:bg-purple-950/50 border-purple-300 dark:border-purple-500/40' },
  ]

  const content = EXT_CONTENT[extTab]
  const c = isKo ? content.ko : content.en

  return (
    <div className="space-y-4">
      <h2 className="text-base font-bold text-gray-900 dark:text-white">
        {isKo ? '확장 기능 상세' : 'Extensions — Deep Dive'}
      </h2>

      {/* Sub-tabs */}
      <div className="flex flex-wrap gap-1.5">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setExtTab(tab.id)}
            className={`px-2.5 py-1 rounded-lg border text-[11px] font-semibold transition-all ${
              extTab === tab.id
                ? `${tab.activeColor} ${tab.color}`
                : 'border-gray-200 dark:border-white/8 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-white/15'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="space-y-3">
        <h3 className="text-[13px] font-semibold text-gray-800 dark:text-gray-200">{c.title}</h3>
        {c.blocks.map((block, i) => (
          <BlockRenderer key={i} block={block} />
        ))}
      </div>
    </div>
  )
}

// ─── Chapters 6 & 7: Accordion for Codex / Cursor ─────────────────────────────

function AccordionChapter({ sections, isKo, title }: { sections: Section[]; isKo: boolean; title: string }) {
  const [openId, setOpenId] = useState<string | null>(sections[0]?.id ?? null)

  return (
    <div className="space-y-4">
      <h2 className="text-base font-bold text-gray-900 dark:text-white">{title}</h2>
      <div className="space-y-2">
        {sections.map((section) => {
          const isOpen = openId === section.id
          const content = isKo ? section.ko : section.en
          return (
            <div key={section.id} className={`rounded-xl border transition-colors ${isOpen ? 'border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/[0.025]' : 'border-gray-200 dark:border-white/6 hover:border-gray-300 dark:hover:border-white/10'}`}>
              <button onClick={() => setOpenId(isOpen ? null : section.id)} className="w-full flex items-center gap-2.5 px-4 py-3 text-left group">
                <span className="text-sm leading-none shrink-0">{section.icon}</span>
                <span className="text-xs font-semibold text-gray-700 dark:text-gray-200 flex-1 leading-snug group-hover:text-gray-900 dark:group-hover:text-white transition-colors">
                  {content.title}
                </span>
                <span className={`text-[10px] text-gray-400 dark:text-gray-600 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>▼</span>
              </button>
              {isOpen && (
                <div className="px-4 pb-4 space-y-3 border-t border-gray-200 dark:border-white/[0.06] pt-3">
                  {content.blocks.map((block, i) => <BlockRenderer key={i} block={block} />)}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Main Component ────────────────────────────────────────────────────────────

export default function GuideTab({ locale }: { locale: Locale }) {
  const [tool, setTool] = useState<GuideTool>('claude')
  const [chapter, setChapter] = useState<ChapterId>('intro')
  const isKo = locale === 'ko'

  function renderChapterContent() {
    switch (chapter) {
      case 'intro':    return <Chapter1 isKo={isKo} />
      case 'overview': return <Chapter2 isKo={isKo} />
      case 'arch':     return <Chapter3 isKo={isKo} />
      case 'loop':     return <Chapter4 isKo={isKo} />
      case 'ext':      return <Chapter5 isKo={isKo} />
    }
  }

  const BADGE_LABELS: Record<GuideTool, string> = {
    claude: 'Anthropic',
    codex: 'OpenAI',
    cursor: 'Anysphere',
  }

  return (
    <div className="flex flex-col" style={{ height: 'calc(100vh - 96px)' }}>
      {/* Top tool tabs */}
      <div className="flex border-b border-gray-200 dark:border-white/8 shrink-0">
        {TOOL_TABS.map(({ id, label, badgeColor, activeClass }) => (
          <button
            key={id}
            onClick={() => setTool(id)}
            className={`px-3 py-2 text-xs font-medium border-b-2 -mb-px transition-colors flex items-center gap-1.5 ${
              tool === id
                ? activeClass
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            {label}
            {tool === id && (
              <span className={`text-[9px] px-1.5 py-px rounded-full border font-bold uppercase tracking-wide ${badgeColor}`}>
                {BADGE_LABELS[id]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Claude Code: sidebar + chapter content */}
      {tool === 'claude' ? (
        <div className="flex flex-1 min-h-0">
          <nav className="w-[56px] shrink-0 flex flex-col border-r border-gray-200 dark:border-white/8 overflow-y-auto">
            {CHAPTERS.map((ch) => {
              const active = chapter === ch.id
              return (
                <button
                  key={ch.id}
                  onClick={() => setChapter(ch.id)}
                  title={isKo ? ch.ko : ch.en}
                  className={`flex flex-col items-center gap-1 py-2.5 px-1 border-r-2 transition-all flex-shrink-0 ${
                    active
                      ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/30'
                      : 'border-transparent hover:bg-gray-50 dark:hover:bg-white/[0.03]'
                  }`}
                >
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold transition-colors ${
                    active
                      ? 'bg-indigo-500 text-white'
                      : 'bg-gray-200 dark:bg-white/10 text-gray-600 dark:text-gray-400'
                  }`}>
                    {ch.num}
                  </span>
                  <span className={`text-[8px] text-center leading-tight transition-colors w-full ${
                    active ? 'text-indigo-600 dark:text-indigo-400 font-semibold' : 'text-gray-400 dark:text-gray-600'
                  }`}>
                    {isKo ? ch.ko : ch.en}
                  </span>
                </button>
              )
            })}
          </nav>
          <div className="flex-1 overflow-y-auto px-4 py-4 min-w-0">
            {renderChapterContent()}
          </div>
        </div>
      ) : (
        /* Codex / Cursor: full-width accordion */
        <div className="flex-1 overflow-y-auto px-4 py-4">
          {tool === 'codex'
            ? <AccordionChapter sections={CODEX_SECTIONS} isKo={isKo} title="Codex CLI" />
            : <AccordionChapter sections={CURSOR_SECTIONS} isKo={isKo} title="Cursor" />
          }
        </div>
      )}
    </div>
  )
}
