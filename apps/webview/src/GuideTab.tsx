import { useState } from 'react'
import type { Locale } from './i18n'

type GuideTool = 'claude' | 'codex' | 'cursor'

// ─── Content Types ─────────────────────────────────────────────────────────────

type Block =
  | { t: 'p'; text: string }
  | { t: 'ul'; items: string[] }
  | { t: 'ol'; items: string[] }
  | { t: 'code'; text: string }
  | { t: 'tip'; text: string }
  | { t: 'warn'; text: string }
  | { t: 'table'; headers: string[]; rows: string[][] }

interface SectionContent {
  title: string
  blocks: Block[]
}

interface Section {
  id: string
  icon: string
  en: SectionContent
  ko: SectionContent
}

// ─── Claude Code Content ───────────────────────────────────────────────────────

const CLAUDE_SECTIONS: Section[] = [
  {
    id: 'agent-loop',
    icon: '⚙️',
    en: {
      title: 'Agent Loop — The Core Engine',
      blocks: [
        { t: 'p', text: "All of Claude Code's features — CLAUDE.md, MCP, Skills, Hooks, Subagents — aren't independent add-ons. Each plugs into a specific lifecycle event of the Agent Loop. Understanding this loop is understanding how Claude Code works." },
        { t: 'code', text: 'SessionStart ──► InstructionsLoaded (CLAUDE.md + Rules read)\n     │\n     ▼\n┌─── Per-Turn Loop ─────────────────────────────────────────┐\n│  UserPromptSubmit  ◄── Hooks can block/modify prompt      │\n│       │                                                   │\n│       ▼  (if /skill-name)                                 │\n│  UserPromptExpansion ──► Skill body injected into context │\n│       │                                                   │\n│  ┌─── Agentic Loop (repeats per tool call) ───────────┐  │\n│  │  PreToolUse ──────────────► Hooks (allow / deny)   │  │\n│  │       │                                            │  │\n│  │       ▼                                            │  │\n│  │  Execute Tool  (Bash / Edit / MCP / Subagent)      │  │\n│  │       │                                            │  │\n│  │       ▼                                            │  │\n│  │  PostToolUse ─────────────► Hooks (react / patch)  │  │\n│  └────────────────────────────────────────────────────┘  │\n│  PostToolBatch  ◄── Hooks after parallel-batch completes  │\n│  Stop           ◄── Hooks post-turn (no blocking)         │\n└───────────────────────────────────────────────────────────┘\n     │\n     ▼\nSessionEnd / FileChanged / PreCompact / CwdChanged …' },
        { t: 'table', headers: ['Feature', 'Lifecycle Point', 'Role'], rows: [
          ['CLAUDE.md', 'InstructionsLoaded (SessionStart)', 'Project context injected into every session'],
          ['MCP Servers', 'SessionStart', 'External tools registered; become callable'],
          ['Skills', 'UserPromptExpansion or auto-match', 'Workflow body loaded only when invoked'],
          ['Hooks', 'ANY lifecycle point', 'Cross-cutting guards, transforms, notifiers'],
          ['Subagents', 'Inside Agentic Loop', 'Parallel isolated execution; own context window'],
        ]},
        { t: 'tip', text: 'Key insight: CLAUDE.md is always loaded (token overhead). Skills load only when used (lazy). Hooks are pure lifecycle events — they fire regardless of skills or MCP.' },
      ],
    },
    ko: {
      title: '에이전트 루프 — 핵심 구동 체계',
      blocks: [
        { t: 'p', text: 'Claude Code의 모든 기능 — CLAUDE.md, MCP, Skills, Hooks, Subagents — 은 각자 독립적인 도구가 아닙니다. 이들 각각은 에이전트 루프(Agent Loop)의 특정 생명주기(Lifecycle) 지점에 밀착되어 동작합니다. 이 루프를 이해하면 Claude Code 전체가 보입니다.' },
        { t: 'code', text: 'SessionStart ──► InstructionsLoaded (CLAUDE.md + Rules 읽기)\n     │\n     ▼\n┌─── 턴(Turn) 루프 ─────────────────────────────────────────┐\n│  UserPromptSubmit  ◄── Hooks: 프롬프트 차단/수정 가능     │\n│       │                                                   │\n│       ▼  (/skill-name 입력 시)                            │\n│  UserPromptExpansion ──► 스킬 본문이 컨텍스트에 주입됨   │\n│       │                                                   │\n│  ┌─── 에이전트 루프 (툴 호출당 반복) ─────────────────┐  │\n│  │  PreToolUse ──────────────► Hooks (allow / deny)   │  │\n│  │       │                                            │  │\n│  │       ▼                                            │  │\n│  │  도구 실행  (Bash / Edit / MCP / Subagent)          │  │\n│  │       │                                            │  │\n│  │       ▼                                            │  │\n│  │  PostToolUse ─────────────► Hooks (반응 / 변환)    │  │\n│  └────────────────────────────────────────────────────┘  │\n│  PostToolBatch  ◄── 병렬 툴 배치 완료 후 Hooks           │\n│  Stop           ◄── 턴 완료 후 Hooks (차단 불가)          │\n└───────────────────────────────────────────────────────────┘\n     │\n     ▼\nSessionEnd / FileChanged / PreCompact / CwdChanged …' },
        { t: 'table', headers: ['기능', '생명주기 지점', '역할'], rows: [
          ['CLAUDE.md', 'InstructionsLoaded (SessionStart)', '프로젝트 컨텍스트 — 모든 세션에 항상 주입'],
          ['MCP 서버', 'SessionStart', '외부 도구 등록; 호출 가능 상태로 전환'],
          ['스킬(Skills)', 'UserPromptExpansion 또는 자동 매칭', '워크플로우 본문 — 사용 시에만 지연 로드'],
          ['훅(Hooks)', '모든 생명주기 지점', '횡단 관심사: 가드, 변환, 알림'],
          ['서브에이전트', '에이전트 루프 내부', '병렬 격리 실행; 독립된 컨텍스트 창'],
        ]},
        { t: 'tip', text: '핵심 인사이트: CLAUDE.md는 항상 로드됩니다(토큰 항상 소비). Skills는 사용 시에만 로드됩니다(지연 로드). Hooks는 순수 생명주기 이벤트 — Skills나 MCP와 무관하게 항상 발동됩니다.' },
      ],
    },
  },
  {
    id: 'layer-context',
    icon: '①',
    en: {
      title: 'Layer 1 — Context: CLAUDE.md & Auto-Memory',
      blocks: [
        { t: 'p', text: "CLAUDE.md fires at InstructionsLoaded — before any user input — shaping every response in the session. Think of it as the system prompt you control. Multiple CLAUDE.md files merge hierarchically:" },
        { t: 'ul', items: [
          'Enterprise → User (~/.claude/CLAUDE.md) → Project (repo root) → Folder (subdir)',
          'Each level overrides the previous; folder-level wins over project-level',
          'InstructionsLoaded hook fires after all files are merged — useful for verifying context',
        ]},
        { t: 'code', text: '# CLAUDE.md — fires at InstructionsLoaded\n\n## Architecture\nMonorepo: apps/extension (CommonJS) + apps/webview (ESM/Vite)\nState: Zustand. API: tRPC. Auth: better-auth.\n\n## Hard Rules\n- No `any` types — use `unknown` + narrowing\n- packages/core must be DOM-free and vscode-free\n- Commits: feat/fix/chore/docs/refactor prefix only\n\n## Commands\n- pnpm build          # full build\n- pnpm --filter webview dev   # webview only' },
        { t: 'p', text: "Auto-Memory: Claude Code also builds memory automatically — saving learnings (build commands, debugging insights, patterns discovered) across sessions without you writing anything. Stored in ~/.claude/memory.json." },
        { t: 'warn', text: 'Keep CLAUDE.md under 200 lines. Every line is token cost on every request. Move procedures and long checklists into Skills (lazy-loaded).' },
      ],
    },
    ko: {
      title: '레이어 1 — 컨텍스트: CLAUDE.md & 자동 메모리',
      blocks: [
        { t: 'p', text: 'CLAUDE.md는 InstructionsLoaded 시점에 발동합니다 — 사용자 입력 처리 전. 세션의 모든 응답을 형성하는 당신이 제어하는 시스템 프롬프트입니다. 여러 CLAUDE.md 파일이 계층적으로 병합됩니다:' },
        { t: 'ul', items: [
          '엔터프라이즈 → 사용자 (~/.claude/CLAUDE.md) → 프로젝트 (레포 루트) → 폴더 (하위 디렉토리)',
          '각 레벨이 이전을 오버라이드; 폴더 레벨이 프로젝트 레벨보다 우선',
          'InstructionsLoaded 훅이 모든 파일 병합 후 발동 — 컨텍스트 검증에 유용',
        ]},
        { t: 'code', text: '# CLAUDE.md — InstructionsLoaded 시 발동\n\n## 아키텍처\n모노레포: apps/extension (CommonJS) + apps/webview (ESM/Vite)\n상태: Zustand. API: tRPC. 인증: better-auth.\n\n## 엄격한 규칙\n- any 타입 금지 — unknown + narrowing 사용\n- packages/core는 DOM-free, vscode-free 유지\n- 커밋: feat/fix/chore/docs/refactor 접두사만\n\n## 명령어\n- pnpm build          # 전체 빌드\n- pnpm --filter webview dev   # webview만' },
        { t: 'p', text: '자동 메모리(Auto-Memory): Claude Code는 작업하면서 자동으로 메모리를 구축합니다 — 빌드 명령, 디버깅 인사이트, 발견한 패턴 등을 세션 간에 저장합니다. ~/.claude/memory.json에 저장됩니다.' },
        { t: 'warn', text: 'CLAUDE.md는 200줄 이하로 유지하세요. 모든 줄이 모든 요청에서 토큰 비용이 됩니다. 절차와 긴 체크리스트는 Skills(지연 로드)로 이동하세요.' },
      ],
    },
  },
  {
    id: 'layer-tools',
    icon: '②',
    en: {
      title: 'Layer 2 — Tool Extension: MCP Servers',
      blocks: [
        { t: 'p', text: "MCP servers start at SessionStart and register tools before the first prompt. Once registered, each server's tools appear as callable functions in the agentic loop — invocable like Bash or Edit. They also become slash commands: /mcp__[server]__[tool]." },
        { t: 'code', text: '// .mcp.json — read at SessionStart\n{\n  "mcpServers": {\n    "github": {\n      "command": "npx",\n      "args": ["-y", "@modelcontextprotocol/server-github"],\n      "env": { "GITHUB_TOKEN": "${GITHUB_TOKEN}" }\n    },\n    "postgres": {\n      "command": "npx",\n      "args": ["-y", "@modelcontextprotocol/server-postgres"],\n      "env": { "DATABASE_URL": "${DATABASE_URL}" }\n    }\n  }\n}' },
        { t: 'table', headers: ['MCP Server', 'Key Tools', 'Use Case'], rows: [
          ['filesystem', 'read_file, write_file, list_dir', 'Files outside the workspace'],
          ['github', 'create_issue, get_pr, search_code', 'GitHub API without raw curl'],
          ['memory', 'remember, recall', 'Cross-session persistent KV store'],
          ['postgres', 'query, describe_table', 'Direct DB queries inside Claude'],
          ['brave-search', 'web_search', 'Web search in context window'],
          ['fetch', 'fetch_url', 'HTTP to any external API'],
        ]},
        { t: 'tip', text: 'Hooks can match on "mcp__.*" regex to intercept all MCP calls uniformly — useful for logging every external API call or blocking specific servers from running in CI.' },
      ],
    },
    ko: {
      title: '레이어 2 — 도구 확장: MCP 서버',
      blocks: [
        { t: 'p', text: 'MCP 서버는 SessionStart 시점에 시작되어 첫 프롬프트 전에 도구를 등록합니다. 등록되면 각 서버의 도구가 에이전트 루프 내 호출 가능한 함수로 나타납니다 — Bash나 Edit처럼 호출 가능. 슬래시 커맨드도 자동 생성됩니다: /mcp__[서버]__[도구].' },
        { t: 'code', text: '// .mcp.json — SessionStart 시 읽기\n{\n  "mcpServers": {\n    "github": {\n      "command": "npx",\n      "args": ["-y", "@modelcontextprotocol/server-github"],\n      "env": { "GITHUB_TOKEN": "${GITHUB_TOKEN}" }\n    },\n    "postgres": {\n      "command": "npx",\n      "args": ["-y", "@modelcontextprotocol/server-postgres"],\n      "env": { "DATABASE_URL": "${DATABASE_URL}" }\n    }\n  }\n}' },
        { t: 'table', headers: ['MCP 서버', '주요 도구', '사용 사례'], rows: [
          ['filesystem', 'read_file, write_file, list_dir', '워크스페이스 외부 파일'],
          ['github', 'create_issue, get_pr, search_code', '원시 curl 없이 GitHub API'],
          ['memory', 'remember, recall', '세션 간 지속 KV 저장소'],
          ['postgres', 'query, describe_table', 'Claude 내부에서 직접 DB 쿼리'],
          ['brave-search', 'web_search', '컨텍스트 창 내 웹 검색'],
          ['fetch', 'fetch_url', '외부 API HTTP 요청'],
        ]},
        { t: 'tip', text: 'Hooks는 "mcp__.*" 정규식으로 모든 MCP 호출을 일괄 가로챌 수 있습니다 — 모든 외부 API 호출을 로깅하거나 CI에서 특정 서버 실행을 차단하는 데 유용합니다.' },
      ],
    },
  },
  {
    id: 'layer-skills',
    icon: '③',
    en: {
      title: 'Layer 3 — Workflow: Skills (Lazy-Loaded)',
      blocks: [
        { t: 'p', text: "Skills are named workflow files. Their body loads only at UserPromptExpansion — when you type /skill-name or Claude auto-detects a match. This lazy loading is key: long checklists and procedures cost zero tokens when unused." },
        { t: 'table', headers: ['invocation value', 'Who triggers', 'Useful for'], rows: [
          ['user', 'User via /skill-name only', 'Deployment scripts, risky workflows you control'],
          ['agent', 'Claude auto-matches via description', 'Repeatable analysis, test runs, code review'],
          ['disabled', 'Nobody (WIP)', 'Staging a skill under development'],
        ]},
        { t: 'code', text: '# .claude/skills/review/SKILL.md\n---\ndescription: "Run a full PR code review on the current diff"\ninvocation: user        # only via /review — Claude won\'t auto-trigger\ncontext: fork           # runs in an isolated subagent context\n---\n\nReview the current `git diff` for:\n1. Correctness bugs and edge-case failures\n2. Security (OWASP Top 10)\n3. Performance regressions\n4. Missing test coverage on new code paths\n\nOutput a prioritized list with `file:line` refs.\nFormat: **[SEVERITY]** description' },
        { t: 'tip', text: 'Custom commands (.claude/commands/) still work and are treated as skills automatically. Skills add optional features: invocation control, context:fork for subagent isolation, and auto-invocation via description matching.' },
      ],
    },
    ko: {
      title: '레이어 3 — 워크플로우: 스킬 (지연 로드)',
      blocks: [
        { t: 'p', text: '스킬은 이름이 있는 워크플로우 파일입니다. 본문은 UserPromptExpansion 시점에만 로드됩니다 — /skill-name 입력 시 또는 Claude가 자동 매칭 시. 이 지연 로드가 핵심입니다: 사용하지 않으면 긴 체크리스트와 절차가 토큰을 전혀 소비하지 않습니다.' },
        { t: 'table', headers: ['invocation 값', '누가 트리거', '적합한 용도'], rows: [
          ['user', '사용자가 /skill-name으로만', '배포 스크립트, 당신이 제어할 위험한 워크플로우'],
          ['agent', 'Claude가 description으로 자동 매칭', '반복 분석, 테스트 실행, 코드 리뷰'],
          ['disabled', '아무도 (진행 중인 작업)', '개발 중인 스킬 스테이징'],
        ]},
        { t: 'code', text: '# .claude/skills/review/SKILL.md\n---\ndescription: "현재 diff에 대해 전체 PR 코드 리뷰 실행"\ninvocation: user        # /review로만 — Claude가 자동 트리거 안 함\ncontext: fork           # 격리된 서브에이전트 컨텍스트에서 실행\n---\n\n현재 `git diff`를 다음 항목으로 리뷰하세요:\n1. 정확성 버그 및 엣지 케이스 실패\n2. 보안 (OWASP Top 10)\n3. 성능 회귀\n4. 새 코드 경로에 대한 누락된 테스트 커버리지\n\n`file:line` 참조와 함께 우선순위 목록 출력.\n형식: **[SEVERITY]** 설명' },
        { t: 'tip', text: '기존 커스텀 커맨드(.claude/commands/)는 그대로 작동하며 자동으로 스킬로 처리됩니다. 스킬은 선택적 기능을 추가합니다: 호출 제어, 서브에이전트 격리를 위한 context:fork, description 매칭을 통한 자동 호출.' },
      ],
    },
  },
  {
    id: 'layer-hooks',
    icon: '④',
    en: {
      title: 'Layer 4 — Guards: Hooks (20+ Lifecycle Events)',
      blocks: [
        { t: 'p', text: "Hooks are shell commands that fire at lifecycle events automatically — regardless of what Claude decides. They're the enforcement layer. Unlike Skills (which Claude can choose), Hooks cannot be bypassed by Claude." },
        { t: 'table', headers: ['Event', 'When it fires', 'Can block?', 'Common use'], rows: [
          ['PreToolUse', 'Before every tool call', '✅ yes', 'Block rm -rf, force push'],
          ['PostToolUse', 'After every tool call', '⚠️ via context', 'Auto-lint, format, notify'],
          ['UserPromptSubmit', 'Before prompt processing', '✅ yes', 'Inject context, block off-topic'],
          ['Stop', 'After Claude finishes a turn', '❌ no', 'Post-turn metrics, Slack notify'],
          ['FileChanged', 'File changes on disk', '❌ no', 'Run formatter, test watcher'],
          ['SessionStart', 'Session begins', '❌ no', 'Load env, print project status'],
          ['SubagentStop', 'Subagent finishes', '❌ no', 'Collect subagent results'],
        ]},
        { t: 'code', text: '// .claude/settings.json\n{\n  "hooks": {\n    "PreToolUse": [{\n      "matcher": "Bash",\n      "hooks": [{\n        "type": "command",\n        "command": ".claude/hooks/guard.sh"\n      }]\n    }],\n    "PostToolUse": [{\n      "matcher": "Edit",\n      "hooks": [{\n        "type": "command",\n        "command": "npx eslint --fix ${tool_input.file_path}"\n      }]\n    }]\n  }\n}\n\n# guard.sh (exit 2 to block, exit 0 to allow)\n#!/bin/bash\nCMD=$(cat | jq -r \'.tool_input.command\')\nif echo "$CMD" | grep -qE \'rm -rf|git push.*-f\'; then\n  echo \'{"hookSpecificOutput":{"hookEventName":"PreToolUse","permissionDecision":"deny","permissionDecisionReason":"Blocked"}}\'\nfi' },
      ],
    },
    ko: {
      title: '레이어 4 — 가드: Hooks (20+ 생명주기 이벤트)',
      blocks: [
        { t: 'p', text: 'Hooks는 생명주기 이벤트에서 자동으로 발동하는 셸 명령입니다 — Claude의 결정과 무관하게. 이것이 집행(enforcement) 레이어입니다. Claude가 선택하는 Skills와 달리, Hooks는 Claude가 우회할 수 없습니다.' },
        { t: 'table', headers: ['이벤트', '발동 시점', '차단 가능?', '대표 사용법'], rows: [
          ['PreToolUse', '모든 툴 호출 전', '✅ 가능', 'rm -rf, force push 차단'],
          ['PostToolUse', '모든 툴 호출 후', '⚠️ 컨텍스트로', '자동 린트, 포맷, 알림'],
          ['UserPromptSubmit', '프롬프트 처리 전', '✅ 가능', '컨텍스트 주입, 주제 외 차단'],
          ['Stop', 'Claude 턴 완료 후', '❌ 불가', '턴 후 메트릭, Slack 알림'],
          ['FileChanged', '디스크 파일 변경 시', '❌ 불가', '포매터 실행, 테스트 워처'],
          ['SessionStart', '세션 시작', '❌ 불가', '환경 로드, 프로젝트 상태 출력'],
          ['SubagentStop', '서브에이전트 완료 시', '❌ 불가', '서브에이전트 결과 수집'],
        ]},
        { t: 'code', text: '// .claude/settings.json\n{\n  "hooks": {\n    "PreToolUse": [{\n      "matcher": "Bash",\n      "hooks": [{\n        "type": "command",\n        "command": ".claude/hooks/guard.sh"\n      }]\n    }],\n    "PostToolUse": [{\n      "matcher": "Edit",\n      "hooks": [{\n        "type": "command",\n        "command": "npx eslint --fix ${tool_input.file_path}"\n      }]\n    }]\n  }\n}\n\n# guard.sh (exit 2 = 차단, exit 0 = 허용)\n#!/bin/bash\nCMD=$(cat | jq -r \'.tool_input.command\')\nif echo "$CMD" | grep -qE \'rm -rf|git push.*-f\'; then\n  echo \'{"hookSpecificOutput":{"hookEventName":"PreToolUse","permissionDecision":"deny","permissionDecisionReason":"차단됨"}}\'\nfi' },
      ],
    },
  },
  {
    id: 'layer-subagents',
    icon: '⑤',
    en: {
      title: 'Layer 5 — Delegation: Subagents & Agent SDK',
      blocks: [
        { t: 'p', text: "Subagents are separate Claude Code instances spawned inside the agentic loop. They execute in an isolated context window — preventing context pollution — then return results to the lead agent. Up to 10 subagents run in parallel." },
        { t: 'table', headers: ['Concept', 'Detail'], rows: [
          ['Spawned by', 'Lead agent or context:fork skill'],
          ['Isolation', 'Own context window; lead context stays clean'],
          ['Tool access', 'Restricted to what the lead permits'],
          ['Parallel limit', 'Up to 10 simultaneous subagents'],
          ['SubagentStart hook', 'Fires on spawn; log, apply policy'],
          ['SubagentStop hook', 'Fires on completion; collect, validate'],
        ]},
        { t: 'code', text: '# Delegate a skill to a subagent via context: fork\n\n# .claude/skills/test-and-fix/SKILL.md\n---\ndescription: "Run full test suite, fix all failures"\ncontext: fork    # ← isolated subagent; lead context unaffected\n---\n\n1. Run `pnpm test` and capture failures\n2. For each failure, identify root cause\n3. Fix source (not test assertions)\n4. Re-run only fixed tests to verify\n5. Report: N fixed, N remaining' },
        { t: 'tip', text: 'Agent SDK: For full custom orchestration, build your own agents powered by Claude Code\'s tools with complete control over which tools each agent can access and how they hand off work.' },
      ],
    },
    ko: {
      title: '레이어 5 — 위임: 서브에이전트 & Agent SDK',
      blocks: [
        { t: 'p', text: '서브에이전트는 에이전트 루프 내에서 생성되는 별도의 Claude Code 인스턴스입니다. 격리된 컨텍스트 창에서 실행(컨텍스트 오염 방지)하고 결과를 리드 에이전트에 반환합니다. 최대 10개의 서브에이전트가 병렬로 실행됩니다.' },
        { t: 'table', headers: ['개념', '상세'], rows: [
          ['생성 주체', '리드 에이전트 또는 context:fork 스킬'],
          ['격리', '자체 컨텍스트 창; 리드 컨텍스트 오염 없음'],
          ['도구 접근', '리드가 허용한 도구로 제한'],
          ['병렬 한도', '최대 10개 동시 서브에이전트'],
          ['SubagentStart 훅', '생성 시 발동; 로그, 정책 적용'],
          ['SubagentStop 훅', '완료 시 발동; 수집, 검증'],
        ]},
        { t: 'code', text: '# context: fork로 스킬을 서브에이전트에 위임\n\n# .claude/skills/test-and-fix/SKILL.md\n---\ndescription: "전체 테스트 스위트 실행 후 모든 실패 수정"\ncontext: fork    # ← 격리된 서브에이전트; 리드 컨텍스트 영향 없음\n---\n\n1. `pnpm test` 실행 후 실패 캡처\n2. 각 실패에서 근본 원인 파악\n3. 소스 수정 (테스트 단언 아님)\n4. 수정된 테스트만 재실행하여 검증\n5. 보고: N개 수정, N개 남음' },
        { t: 'tip', text: 'Agent SDK: 완전한 커스텀 오케스트레이션을 위해 Claude Code의 도구로 구동되는 자체 에이전트를 구축하세요. 각 에이전트가 접근할 도구와 작업 인계 방식을 완전히 제어합니다.' },
      ],
    },
  },
  {
    id: 'full-flow',
    icon: '🔄',
    en: {
      title: 'All 5 Layers in Action: A Real Example',
      blocks: [
        { t: 'p', text: 'Task: "Add rate limiting to the auth middleware." Watch how each layer activates in sequence:' },
        { t: 'ol', items: [
          '[SessionStart → InstructionsLoaded] CLAUDE.md loads → Claude knows stack (Express + TS), no any types, test before commit.',
          '[SessionStart] MCP servers start → GitHub MCP and postgres MCP register tools.',
          '[UserPromptSubmit] Hook inspects the prompt → clean, passes through.',
          '[UserPromptExpansion] Claude auto-matches "rate limiting" task to the ratelimit skill (invocation:agent) → skill body injected.',
          '[Agentic Loop begins] Claude plans: read auth.ts → check tests → implement → run tests.',
          '[PreToolUse] Read("src/middleware/auth.ts") → Hook checks protected-paths list → allowed.',
          '[PostToolUse] Read completes → Hook logs file access to audit trail.',
          '[PreToolUse] Edit("src/middleware/auth.ts") → Hook validates TS extension rule → allowed.',
          '[PostToolUse] Edit completes → Hook auto-runs ESLint on changed file → clean.',
          '[FileChanged] File change detected → Hook triggers test watcher → relevant tests re-run.',
          '[SubagentStart] Claude spawns subagent (context:fork) to run full test suite in parallel → SubagentStart hook logs spawn.',
          '[SubagentStop] All tests pass → SubagentStop hook collects result → lead agent gets summary.',
          '[Stop] Turn ends → Stop hook fires → Slack notification: "Rate limiting done, all tests pass."',
        ]},
        { t: 'tip', text: "The layers aren't independent — they're all hooks into the same Agent Loop, each activating at a different lifecycle event to create the complete behavior." },
      ],
    },
    ko: {
      title: '5개 레이어 실전 동작: 실전 예시',
      blocks: [
        { t: 'p', text: '작업: "auth 미들웨어에 레이트 리미팅 추가해줘." 각 레이어가 순서대로 활성화되는 과정:' },
        { t: 'ol', items: [
          '[SessionStart → InstructionsLoaded] CLAUDE.md 로드 → Claude가 스택(Express + TS, any 금지, 커밋 전 테스트) 파악.',
          '[SessionStart] MCP 서버 시작 → GitHub MCP와 postgres MCP가 도구 등록.',
          '[UserPromptSubmit] 훅이 프롬프트 검사 → 통과.',
          '[UserPromptExpansion] Claude가 "레이트 리미팅" 작업을 ratelimit 스킬(invocation:agent)에 자동 매칭 → 스킬 본문 주입.',
          '[에이전트 루프 시작] Claude 계획 수립: auth.ts 읽기 → 테스트 확인 → 구현 → 테스트 실행.',
          '[PreToolUse] Read("src/middleware/auth.ts") → 훅이 보호 경로 목록 확인 → 허용.',
          '[PostToolUse] Read 완료 → 훅이 감사 추적에 파일 접근 기록.',
          '[PreToolUse] Edit("src/middleware/auth.ts") → 훅이 TS 확장자 규칙 검증 → 허용.',
          '[PostToolUse] Edit 완료 → 훅이 변경된 파일에 ESLint 자동 실행 → 통과.',
          '[FileChanged] 파일 변경 감지 → 훅이 테스트 워처 트리거 → 관련 테스트 재실행.',
          '[SubagentStart] Claude가 전체 테스트 스위트를 위한 서브에이전트(context:fork) 생성 → SubagentStart 훅이 생성 기록.',
          '[SubagentStop] 모든 테스트 통과 → SubagentStop 훅이 결과 수집 → 리드 에이전트가 요약 받음.',
          '[Stop] 턴 종료 → Stop 훅 발동 → Slack 알림: "레이트 리미팅 완료, 모든 테스트 통과."',
        ]},
        { t: 'tip', text: '레이어들은 독립적이지 않습니다 — 모두 같은 에이전트 루프에 연결된 훅이며, 각각 다른 생명주기 이벤트에서 활성화되어 완전한 동작을 만들어냅니다.' },
      ],
    },
  },
]

// ─── Codex CLI Content ─────────────────────────────────────────────────────────

const CODEX_SECTIONS: Section[] = [
  {
    id: 'codex-overview',
    icon: '🟢',
    en: {
      title: 'How Codex CLI Differs from Claude Code',
      blocks: [
        { t: 'p', text: "OpenAI's Codex CLI (github.com/openai/codex) is a terminal agent using GPT-4.1/o3 models. It reads AGENTS.md and performs real file edits and shell commands — but without Hooks, Skills, or MCP. Simpler, but less extensible." },
        { t: 'table', headers: ['Feature', 'Codex CLI', 'Claude Code'], rows: [
          ['Primary model', 'GPT-4.1 / o4-mini / o3', 'claude-sonnet-4 / claude-opus-4'],
          ['AGENTS.md', '✅ (global → project → dir)', '✅ (agentic mode)'],
          ['CLAUDE.md equiv.', '❌ None', '✅ InstructionsLoaded'],
          ['Hooks / lifecycle', '❌ None', '✅ 20+ events'],
          ['Skills system', '❌ None', '✅ .claude/skills/'],
          ['MCP support', '❌ None', '✅ .mcp.json'],
          ['Sandbox', '✅ Docker by default', '⚠️ Trust-based'],
          ['Subagents', '❌ Single agent', '✅ Up to 10 parallel'],
        ]},
        { t: 'tip', text: 'Most important overlap: both tools read AGENTS.md. A well-written AGENTS.md applies rules across Claude Code AND Codex CLI with zero duplication.' },
      ],
    },
    ko: {
      title: 'Codex CLI가 Claude Code와 다른 점',
      blocks: [
        { t: 'p', text: "OpenAI의 Codex CLI (github.com/openai/codex)는 GPT-4.1/o3 모델을 사용하는 터미널 에이전트입니다. AGENTS.md를 읽고 실제 파일 편집과 셸 명령을 수행하지만 Hooks, Skills, MCP가 없습니다. 더 단순하지만 확장성은 낮습니다." },
        { t: 'table', headers: ['기능', 'Codex CLI', 'Claude Code'], rows: [
          ['주요 모델', 'GPT-4.1 / o4-mini / o3', 'claude-sonnet-4 / claude-opus-4'],
          ['AGENTS.md', '✅ (전역 → 프로젝트 → 디렉토리)', '✅ (에이전트 모드)'],
          ['CLAUDE.md 동등물', '❌ 없음', '✅ InstructionsLoaded'],
          ['Hooks / 생명주기', '❌ 없음', '✅ 20+ 이벤트'],
          ['Skills 시스템', '❌ 없음', '✅ .claude/skills/'],
          ['MCP 지원', '❌ 없음', '✅ .mcp.json'],
          ['샌드박스', '✅ 기본 Docker', '⚠️ 신뢰 기반'],
          ['서브에이전트', '❌ 단일 에이전트', '✅ 최대 10개 병렬'],
        ]},
        { t: 'tip', text: '가장 중요한 공통점: 두 도구 모두 AGENTS.md를 읽습니다. 잘 작성된 AGENTS.md 하나가 Claude Code와 Codex CLI 모두에 중복 없이 규칙을 적용합니다.' },
      ],
    },
  },
  {
    id: 'codex-agents-md',
    icon: '📋',
    en: {
      title: 'AGENTS.md Discovery Chain',
      blocks: [
        { t: 'p', text: "Codex CLI discovers AGENTS.md by walking up the directory tree and merging files in order of specificity. This layered discovery is more sophisticated than Claude Code's flat approach." },
        { t: 'table', headers: ['File', 'Scope', 'Priority'], rows: [
          ['~/.codex/AGENTS.md', 'All repos for this user', 'Lowest (base defaults)'],
          ['{repo-root}/AGENTS.md', 'Entire repository', 'Middle'],
          ['{subdir}/AGENTS.md', 'That directory subtree', 'Higher'],
          ['{subdir}/AGENTS.override.md', 'That directory subtree', 'Highest (replaces all)'],
        ]},
        { t: 'code', text: '# ~/.codex/AGENTS.md — global defaults\n\n## Universal Principles\n- Read before writing: understand context fully\n- Minimal diffs: change only what is required\n- If ambiguous, ask — never guess at intent\n\n---\n# {repo-root}/AGENTS.md — project rules\n\n## Testing\n- Run `pnpm test` after every change\n- Never commit with failures\n- Integration tests hit real filesystem; no fs mocks\n\n## Prohibited\n- No `any` types\n- No direct require(\'vscode\') in packages/core' },
        { t: 'warn', text: "Codex CLI does NOT read CLAUDE.md. Keep Claude-specific rules (VS Code API, extension conventions) in CLAUDE.md — they stay invisible to Codex." },
      ],
    },
    ko: {
      title: 'AGENTS.md 발견 체인',
      blocks: [
        { t: 'p', text: 'Codex CLI는 디렉토리 트리를 위로 탐색하면서 AGENTS.md를 발견하고 구체성 순으로 파일을 병합합니다. 이 계층적 발견은 Claude Code의 단순 방식보다 더 정교합니다.' },
        { t: 'table', headers: ['파일', '범위', '우선순위'], rows: [
          ['~/.codex/AGENTS.md', '이 사용자의 모든 레포', '가장 낮음 (기본 설정)'],
          ['{repo-root}/AGENTS.md', '전체 레포지토리', '중간'],
          ['{subdir}/AGENTS.md', '해당 디렉토리 서브트리', '높음'],
          ['{subdir}/AGENTS.override.md', '해당 디렉토리 서브트리', '가장 높음 (전체 교체)'],
        ]},
        { t: 'code', text: '# ~/.codex/AGENTS.md — 전역 기본값\n\n## 보편적 원칙\n- 쓰기 전에 읽기: 컨텍스트 완전 파악 후 행동\n- 최소 diff: 필요한 것만 변경\n- 모호하면 질문 — 의도를 추측하지 말 것\n\n---\n# {repo-root}/AGENTS.md — 프로젝트 규칙\n\n## 테스트\n- 모든 변경 후 `pnpm test` 실행\n- 실패 상태로 커밋 금지\n- 통합 테스트는 실제 파일시스템; fs 모킹 금지\n\n## 금지\n- any 타입 금지\n- packages/core에서 직접 require(\'vscode\') 금지' },
        { t: 'warn', text: 'Codex CLI는 CLAUDE.md를 읽지 않습니다. Claude 전용 규칙(VS Code API, 익스텐션 관례)은 CLAUDE.md에 유지하세요 — Codex에게는 보이지 않습니다.' },
      ],
    },
  },
  {
    id: 'codex-approval',
    icon: '🔒',
    en: {
      title: 'Approval Workflow',
      blocks: [
        { t: 'p', text: "Codex CLI's approval system is simpler than Claude Code's Hooks — a single flag controls when Codex pauses for human confirmation. Three modes:" },
        { t: 'table', headers: ['Flag value', 'File edits', 'Shell commands', 'Best for'], rows: [
          ['on-request (default)', 'Auto-apply', 'Ask each time', 'Day-to-day development'],
          ['never', 'Auto-apply', 'Auto-run', 'CI/CD, trusted automation'],
          ['read-only', 'Ask first', 'Ask first', 'Code review, sensitive repos'],
        ]},
        { t: 'code', text: '# Default interactive run\ncodex "add rate limiting to the auth middleware"\n\n# CI — never pause\ncodex --ask-for-approval never "run migrations and fix failures"\n\n# Verify what AGENTS.md Codex sees\ncodex --ask-for-approval never "Summarize the current AGENTS.md instructions"\n\n# ~/.codex/config.toml — permanent defaults\n[defaults]\nmodel = "o4-mini"\nask_for_approval = "on-request"' },
        { t: 'warn', text: 'never mode runs shell commands without confirmation. Codex enables Docker sandboxing when Docker is available — disable it only if you trust the repo completely.' },
      ],
    },
    ko: {
      title: '승인 워크플로우',
      blocks: [
        { t: 'p', text: "Codex CLI의 승인 시스템은 Claude Code의 Hooks보다 단순합니다 — 단일 플래그가 Codex가 인간 확인을 위해 언제 멈출지를 제어합니다. 세 가지 모드:" },
        { t: 'table', headers: ['플래그 값', '파일 편집', '셸 명령', '적합한 경우'], rows: [
          ['on-request (기본)', '자동 적용', '매번 확인', '일상 개발'],
          ['never', '자동 적용', '자동 실행', 'CI/CD, 신뢰된 자동화'],
          ['read-only', '먼저 확인', '먼저 확인', '코드 리뷰, 민감한 레포'],
        ]},
        { t: 'code', text: '# 기본 대화형 실행\ncodex "auth 미들웨어에 레이트 리미팅 추가"\n\n# CI — 멈추지 않음\ncodex --ask-for-approval never "마이그레이션 실행 후 실패 수정"\n\n# Codex가 보는 AGENTS.md 확인\ncodex --ask-for-approval never "현재 AGENTS.md 지침 요약해줘"\n\n# ~/.codex/config.toml — 영구 기본값\n[defaults]\nmodel = "o4-mini"\nask_for_approval = "on-request"' },
        { t: 'warn', text: 'never 모드는 확인 없이 셸 명령을 실행합니다. Docker를 사용할 수 있으면 Codex가 Docker 샌드박싱을 활성화합니다 — 레포를 완전히 신뢰하는 경우에만 비활성화하세요.' },
      ],
    },
  },
]

// ─── Cursor Content ────────────────────────────────────────────────────────────

const CURSOR_SECTIONS: Section[] = [
  {
    id: 'cursor-ladder',
    icon: '🪜',
    en: {
      title: 'The Editing Ladder: Tab → K → Composer → Agent',
      blocks: [
        { t: 'p', text: "Cursor embeds AI at every level of the editing workflow. Think of it as a ladder — each rung gives Claude more autonomy and broader scope. Rules files are injected at every rung." },
        { t: 'table', headers: ['Rung', 'Shortcut', 'Scope', 'Autonomy'], rows: [
          ['Tab completion', 'Tab', 'Current line / block', 'Passive suggestion'],
          ['Inline edit', 'Cmd/Ctrl+K', 'Selected code', 'One-shot transform'],
          ['Composer', 'Cmd/Ctrl+I', 'Multiple files', 'Multi-step with review'],
          ['Agent mode', 'Toggle in Composer', 'Entire repo + tools', 'Autonomous + tool use'],
          ['BugBot', 'Auto on PR', 'Changed PR files', 'Fully automatic'],
        ]},
        { t: 'p', text: "Rules (.cursor/rules/*.mdc) are the common thread across all rungs — injected into every Tab suggestion, every Composer turn, every Agent action. One well-written rule shapes all 5 rungs simultaneously." },
        { t: 'tip', text: 'Agent mode in Cursor ≈ Claude Code\'s proceed mode. For very long tasks (30+ tool calls) or cross-repo work, prefer Claude Code CLI — it handles larger contexts and has stronger planning via CLAUDE.md + AGENTS.md.' },
      ],
    },
    ko: {
      title: '편집 사다리: Tab → K → Composer → Agent',
      blocks: [
        { t: 'p', text: 'Cursor는 편집 워크플로우의 모든 레벨에 AI를 내장합니다. 사다리처럼 — 각 단계는 Claude에게 더 많은 자율성과 더 넓은 범위를 줍니다. 규칙 파일은 모든 단계에 주입됩니다.' },
        { t: 'table', headers: ['단계', '단축키', '범위', '자율성'], rows: [
          ['Tab 자동완성', 'Tab', '현재 줄 / 블록', '수동 제안'],
          ['인라인 편집', 'Cmd/Ctrl+K', '선택한 코드', '원샷 변환'],
          ['Composer', 'Cmd/Ctrl+I', '여러 파일', '검토 포함 멀티스텝'],
          ['Agent 모드', 'Composer에서 토글', '전체 레포 + 도구', '자율 + 도구 사용'],
          ['BugBot', 'PR에서 자동', 'PR 변경 파일', '완전 자동'],
        ]},
        { t: 'p', text: '규칙 (.cursor/rules/*.mdc)은 모든 단계의 공통 요소입니다 — 모든 Tab 제안, 모든 Composer 턴, 모든 Agent 작업에 주입됩니다. 한 번 잘 작성된 규칙이 5개 단계 모두를 동시에 형성합니다.' },
        { t: 'tip', text: 'Cursor Agent 모드 ≈ Claude Code의 proceed 모드. 매우 긴 작업(30+ 툴 호출)이나 크로스 레포 작업에는 Claude Code CLI를 선호하세요 — 더 큰 컨텍스트와 CLAUDE.md + AGENTS.md를 통한 더 강력한 계획.' },
      ],
    },
  },
  {
    id: 'cursor-rules-flow',
    icon: '📋',
    en: {
      title: 'Rules Files & Activation Ladder',
      blocks: [
        { t: 'p', text: "Cursor rules are NOT equal — they activate at different points based on type. Understanding this prevents wasting context tokens on rules that should only load when relevant." },
        { t: 'table', headers: ['Type', 'Frontmatter', 'Activates when', 'Token cost'], rows: [
          ['Always', 'alwaysApply: true, no globs', 'Every single request', 'Highest — keep < 50 lines'],
          ['Auto Attached', 'alwaysApply: false, + globs', 'Matching file open/edited', 'Only when relevant'],
          ['Agent Requested', 'alwaysApply: false, no globs', 'Cursor AI decides from description', '0 if not triggered'],
          ['Manual', '(no frontmatter)', '@mentioned only', '0 until invoked'],
        ]},
        { t: 'code', text: '.cursor/rules/\n  global.mdc           # alwaysApply: true — universal axioms\n  typescript.mdc       # globs: **/*.ts,**/*.tsx\n  tests.mdc            # globs: **/*.test.*,**/*.spec.*\n  api-routes.mdc       # globs: src/app/api/**\n  migration-guide.mdc  # Manual: @mentioned for DB migrations\n  review-checklist.mdc # Manual: @mentioned before PR submission\n\n# typescript.mdc\n---\ndescription: TypeScript strict rules for this project\nglobs: **/*.ts,**/*.tsx\nalwaysApply: false\n---\n\n- No `any`. Use `unknown` + narrowing.\n- Prefer discriminated unions over optional fields.\n- All async functions must handle errors (no floating promises).\n- Use Result<T,E> for operations that can fail gracefully.' },
      ],
    },
    ko: {
      title: '규칙 파일과 활성화 사다리',
      blocks: [
        { t: 'p', text: 'Cursor 규칙은 동등하지 않습니다 — 타입에 따라 다른 지점에서 활성화됩니다. 이를 이해하면 관련성이 있을 때만 로드해야 할 규칙으로 컨텍스트 토큰을 낭비하지 않게 됩니다.' },
        { t: 'table', headers: ['타입', '프론트매터', '활성화 시점', '토큰 비용'], rows: [
          ['Always', 'alwaysApply: true, glob 없음', '모든 단일 요청', '가장 높음 — 50줄 미만 유지'],
          ['Auto Attached', 'alwaysApply: false, + glob', '일치하는 파일 열릴/편집될 때', '관련성 있을 때만'],
          ['Agent Requested', 'alwaysApply: false, glob 없음', 'Cursor AI가 description으로 판단', '트리거 없으면 0'],
          ['Manual', '(프론트매터 없음)', '@멘션할 때만', '호출 전까지 0'],
        ]},
        { t: 'code', text: '.cursor/rules/\n  global.mdc           # alwaysApply: true — 보편적 공리\n  typescript.mdc       # globs: **/*.ts,**/*.tsx\n  tests.mdc            # globs: **/*.test.*,**/*.spec.*\n  api-routes.mdc       # globs: src/app/api/**\n  migration-guide.mdc  # Manual: DB 마이그레이션 시 @멘션\n  review-checklist.mdc # Manual: PR 제출 전 @멘션\n\n# typescript.mdc\n---\ndescription: 이 프로젝트의 TypeScript 엄격 규칙\nglobs: **/*.ts,**/*.tsx\nalwaysApply: false\n---\n\n- any 금지. unknown + 타입 좁히기 사용.\n- 선택적 필드보다 구별 유니온 선호.\n- 모든 async 함수는 오류 처리 (떠다니는 프로미스 금지).\n- 정상 실패 가능 작업에는 Result<T,E> 패턴 사용.' },
      ],
    },
  },
  {
    id: 'cursor-context',
    icon: '🔍',
    en: {
      title: '@ Context System',
      blocks: [
        { t: 'p', text: "@ references are Cursor's precision context tool. In Composer or Agent mode, you explicitly inject what Claude needs — instead of hoping it finds the right files via codebase search." },
        { t: 'table', headers: ['Reference', 'What it injects', 'When to use'], rows: [
          ['@filename / @folder', 'Full file or directory tree', 'Primary source to edit'],
          ['@codebase', 'Semantic search across entire repo', 'Finding relevant code'],
          ['@web', 'Real-time web search results', 'Latest APIs, error codes, docs'],
          ['@docs', 'Indexed documentation library', 'Library-specific APIs (React, Next.js…)'],
          ['@git', 'Commits, diffs, branches', 'Understanding recent changes, blame'],
          ['@terminal', 'Recent terminal output', 'Error messages, build logs'],
          ['@Cursor Rules', 'A specific .mdc rule file', 'Applying a manual/checklist rule'],
        ]},
        { t: 'tip', text: 'Pattern: Rules (.mdc) = ambient always-on context. @ references = precise per-session context. Together they give the AI exactly what it needs without wasting tokens on irrelevant material.' },
      ],
    },
    ko: {
      title: '@ 컨텍스트 시스템',
      blocks: [
        { t: 'p', text: '@ 참조는 Cursor의 정밀 컨텍스트 도구입니다. Composer나 Agent 모드에서 Claude가 알아야 할 것을 명시적으로 주입합니다 — 코드베이스 검색으로 올바른 파일을 찾기를 바라는 대신.' },
        { t: 'table', headers: ['참조', '주입 내용', '사용 시점'], rows: [
          ['@파일명 / @폴더', '전체 파일 또는 디렉토리 트리', '편집할 주요 소스'],
          ['@codebase', '전체 레포 시맨틱 검색', '관련 코드 찾기'],
          ['@web', '실시간 웹 검색 결과', '최신 API, 오류 코드, 문서'],
          ['@docs', '인덱싱된 문서 라이브러리', '라이브러리별 API (React, Next.js…)'],
          ['@git', '커밋, diff, 브랜치', '최근 변경 이해, blame'],
          ['@terminal', '최근 터미널 출력', '오류 메시지, 빌드 로그'],
          ['@Cursor Rules', '특정 .mdc 규칙 파일', '수동/체크리스트 규칙 적용'],
        ]},
        { t: 'tip', text: '패턴: Rules (.mdc) = 항상 켜져 있는 앰비언트 컨텍스트. @ 참조 = 세션별 정밀 컨텍스트. 함께 사용하면 AI가 관련 없는 내용에 토큰을 낭비하지 않고 필요한 정보를 정확히 받습니다.' },
      ],
    },
  },
  {
    id: 'cursor-rules-writing',
    icon: '💡',
    en: {
      title: 'Writing Rules That Work',
      blocks: [
        { t: 'p', text: 'Rules compete with your code and @-references for token budget. Poor rules dilute the quality of every AI response. One principle: rules are constraints and conventions, not documentation.' },
        { t: 'table', headers: ['✅ Effective', '❌ Ineffective'], rows: [
          ['"No `any` — use `unknown` + narrowing"', '"TypeScript is a statically typed language"'],
          ['"All API handlers return NextResponse, never raw Response"', '"Make sure to follow Next.js best practices"'],
          ['"Validate with zod before any db call"', '"Always validate your inputs"'],
          ['"Never `// ...` to omit code — emit full blocks"', '"Write complete implementations"'],
        ]},
        { t: 'ul', items: [
          'Imperative mood: "Use X", "Never Y", "Always Z before W"',
          'One constraint per line — scannable, impossible to miss',
          'Name the exact thing: function name, type, import path',
          'Under 100 lines per file — split by topic if longer',
          'No prose or explanation — just the rule itself',
        ]},
        { t: 'tip', text: 'Ask yourself: "Would this surprise a senior developer on their first day?" If yes, it\'s a rule. If it\'s obvious from the code, skip it.' },
      ],
    },
    ko: {
      title: '실제로 작동하는 규칙 작성법',
      blocks: [
        { t: 'p', text: '규칙은 코드와 @-참조와 함께 토큰 예산을 놓고 경쟁합니다. 나쁜 규칙은 모든 AI 응답의 품질을 저하시킵니다. 핵심 원칙 하나: 규칙은 제약과 관례입니다, 문서가 아닙니다.' },
        { t: 'table', headers: ['✅ 효과적', '❌ 비효과적'], rows: [
          ['"any 금지 — unknown + 타입 좁히기 사용"', '"TypeScript는 정적으로 타입이 지정된 언어"'],
          ['"모든 API 핸들러는 NextResponse 반환, raw Response 금지"', '"Next.js 모범 사례를 따르세요"'],
          ['"db 호출 전 zod로 검증 필수"', '"항상 입력을 검증하세요"'],
          ['"코드 생략에 // ... 금지 — 전체 블록 출력"', '"완전한 구현을 작성해 주세요"'],
        ]},
        { t: 'ul', items: [
          '명령형: "X 사용", "Y 절대 금지", "W 전에 항상 Z"',
          '한 줄에 제약 하나 — 스캔 가능, 놓치기 불가',
          '정확한 것 명시: 함수 이름, 타입, import 경로',
          '파일당 100줄 미만 — 더 길면 주제별 분리',
          '산문이나 설명 없음 — 규칙 그 자체만',
        ]},
        { t: 'tip', text: '"첫날 시니어 개발자를 놀라게 할까?"라고 자문하세요. 그렇다면 규칙입니다. 코드에서 명백하다면 생략하세요.' },
      ],
    },
  },
]

// ─── Guide Data Registry ────────────────────────────────────────────────────────

const GUIDE_DATA: Record<GuideTool, { sections: Section[] }> = {
  claude: { sections: CLAUDE_SECTIONS },
  codex:  { sections: CODEX_SECTIONS },
  cursor: { sections: CURSOR_SECTIONS },
}

const TOOLS: { id: GuideTool; label: string; badge: string }[] = [
  { id: 'claude', label: 'Claude Code', badge: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30' },
  { id: 'codex',  label: 'Codex CLI',   badge: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' },
  { id: 'cursor', label: 'Cursor',      badge: 'bg-violet-500/15 text-violet-300 border-violet-500/30' },
]

// ─── Block Renderer ─────────────────────────────────────────────────────────────

function BlockRenderer({ block }: { block: Block }) {
  switch (block.t) {
    case 'p':
      return <p className="text-[12px] text-gray-400 leading-relaxed">{block.text}</p>

    case 'ul':
      return (
        <ul className="space-y-1.5">
          {block.items.map((item, i) => (
            <li key={i} className="flex gap-2 text-[12px] text-gray-400 leading-relaxed">
              <span className="text-gray-600 shrink-0 mt-px select-none">•</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      )

    case 'ol':
      return (
        <ol className="space-y-2 list-none">
          {block.items.map((item, i) => (
            <li key={i} className="flex gap-2 text-[12px] text-gray-400 leading-relaxed">
              <span className="text-indigo-500/70 shrink-0 tabular-nums select-none font-mono text-[11px] mt-[1px]">{i + 1}.</span>
              <span>{item}</span>
            </li>
          ))}
        </ol>
      )

    case 'code':
      return (
        <pre className="bg-black/30 border border-white/8 rounded-lg px-3 py-2.5 text-[11px] text-gray-300 font-mono overflow-auto whitespace-pre leading-relaxed">
          {block.text}
        </pre>
      )

    case 'tip':
      return (
        <div className="flex gap-2.5 px-3 py-2.5 rounded-lg bg-indigo-950/40 border border-indigo-500/20">
          <span className="text-indigo-400 text-xs shrink-0 mt-px">💡</span>
          <p className="text-[12px] text-indigo-300/90 leading-relaxed">{block.text}</p>
        </div>
      )

    case 'warn':
      return (
        <div className="flex gap-2.5 px-3 py-2.5 rounded-lg bg-amber-950/30 border border-amber-500/20">
          <span className="text-amber-400 text-xs shrink-0 mt-px">⚠️</span>
          <p className="text-[12px] text-amber-300/90 leading-relaxed">{block.text}</p>
        </div>
      )

    case 'table':
      return (
        <div className="overflow-auto rounded-lg border border-white/8">
          <table className="w-full text-[11px] border-collapse">
            <thead>
              <tr className="bg-white/[0.04]">
                {block.headers.map((h, i) => (
                  <th key={i} className="px-3 py-2 text-left text-gray-400 font-semibold border-b border-white/8 whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row, ri) => (
                <tr key={ri} className="border-b border-white/[0.04] last:border-0 hover:bg-white/[0.02]">
                  {row.map((cell, ci) => (
                    <td key={ci} className={`px-3 py-2 text-gray-400 align-top ${ci === 0 ? 'font-mono text-gray-300 whitespace-nowrap' : ''}`}>
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )
  }
}

// ─── Main Component ─────────────────────────────────────────────────────────────

export default function GuideTab({ locale }: { locale: Locale }) {
  const [tool, setTool] = useState<GuideTool>('claude')
  const [openId, setOpenId] = useState<string | null>('agent-loop')
  const isKo = locale === 'ko'

  const sections = GUIDE_DATA[tool].sections

  return (
    <div className="flex flex-col gap-3">
      {/* Tool sub-tabs */}
      <div className="flex border-b border-white/8 -mb-1">
        {TOOLS.map(({ id, label, badge }) => (
          <button
            key={id}
            onClick={() => {
              setTool(id)
              setOpenId(GUIDE_DATA[id].sections[0].id)
            }}
            className={`px-3 py-2 text-xs font-medium border-b-2 -mb-px transition-colors flex items-center gap-1.5 ${
              tool === id
                ? 'border-indigo-500 text-white'
                : 'border-transparent text-gray-500 hover:text-gray-300'
            }`}
          >
            {label}
            {tool === id && (
              <span className={`text-[9px] px-1.5 py-px rounded-full border font-bold uppercase tracking-wide ${badge}`}>
                {id === 'claude' ? 'Anthropic' : id === 'codex' ? 'OpenAI' : 'Anysphere'}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Accordion sections */}
      <div className="space-y-2">
        {sections.map((section) => {
          const isOpen = openId === section.id
          const content = isKo ? section.ko : section.en
          return (
            <div
              key={section.id}
              className={`rounded-xl border transition-colors ${
                isOpen ? 'border-white/10 bg-white/[0.025]' : 'border-white/6 hover:border-white/10'
              }`}
            >
              <button
                onClick={() => setOpenId(isOpen ? null : section.id)}
                className="w-full flex items-center gap-2.5 px-4 py-3 text-left group"
              >
                <span className="text-sm leading-none shrink-0">{section.icon}</span>
                <span className="text-xs font-semibold text-gray-200 flex-1 leading-snug group-hover:text-white transition-colors">
                  {content.title}
                </span>
                <span className={`text-[10px] text-gray-600 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>
                  ▼
                </span>
              </button>

              {isOpen && (
                <div className="px-4 pb-4 space-y-3 border-t border-white/[0.06] pt-3">
                  {content.blocks.map((block, i) => (
                    <BlockRenderer key={i} block={block} />
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
