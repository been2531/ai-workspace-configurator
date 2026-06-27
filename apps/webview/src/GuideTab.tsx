import { useState } from 'react'
import type { Locale } from './i18n'

interface GuideTabProps {
  locale: Locale
}

interface Section {
  id: string
  icon: string
  en: { title: string; lines: (string | { type: 'code'; text: string } | { type: 'bullet'; items: string[] })[] }
  ko: { title: string; lines: (string | { type: 'code'; text: string } | { type: 'bullet'; items: string[] })[] }
}

const SECTIONS: Section[] = [
  {
    id: 'workflow',
    icon: '⚡',
    en: {
      title: 'How to Use',
      lines: [
        { type: 'bullet', items: [
          '① (Optional) Go to Presets → pick a rule template',
          '② Go to Settings → configure coding style & agent behavior → Save',
          '③ Go to Home → click ⚡ Generate Config',
          '④ Preview the generated files in the Preview tab',
          '⑤ Re-generate any time your stack or preferences change',
        ]},
        'Tip: Generate auto-saves your current settings, so you can skip the Save button.',
      ],
    },
    ko: {
      title: '사용 방법',
      lines: [
        { type: 'bullet', items: [
          '① (선택) Presets 탭 → 규칙 템플릿 선택',
          '② Settings 탭 → 코딩 스타일 & 에이전트 설정 → 저장',
          '③ Home 탭 → ⚡ 설정 파일 생성 클릭',
          '④ Preview 탭에서 생성된 파일 확인',
          '⑤ 스택이나 설정이 바뀌면 언제든 재생성',
        ]},
        '팁: 생성 버튼은 현재 설정을 자동 저장하므로 저장 버튼을 따로 누르지 않아도 됩니다.',
      ],
    },
  },
  {
    id: 'claude-md',
    icon: '📄',
    en: {
      title: 'CLAUDE.md — Session Memory',
      lines: [
        'Claude Code reads CLAUDE.md at the start of every conversation. It acts as persistent memory across sessions.',
        { type: 'bullet', items: [
          'Project overview & architecture constraints',
          'Coding style rules (type strictness, paradigm, comments)',
          'Commands to avoid, files not to touch',
          'Any context Claude should always know',
        ]},
        'Keep it concise (under 200 lines). Claude reads the whole file each session — longer = more tokens consumed.',
      ],
    },
    ko: {
      title: 'CLAUDE.md — 세션 메모리',
      lines: [
        'Claude Code는 모든 대화를 시작할 때 CLAUDE.md를 읽습니다. 세션 간 지속되는 메모리 역할을 합니다.',
        { type: 'bullet', items: [
          '프로젝트 개요 & 아키텍처 제약',
          '코딩 스타일 규칙 (타입 엄격도, 패러다임, 주석)',
          '수정 금지 명령/파일 목록',
          'Claude가 항상 알아야 할 컨텍스트',
        ]},
        '200줄 이하로 간결하게 유지하세요. 세션마다 전체를 읽기 때문에 길수록 토큰 비용이 증가합니다.',
      ],
    },
  },
  {
    id: 'agents-md',
    icon: '🤖',
    en: {
      title: 'AGENTS.md — Multi-Agent Protocol',
      lines: [
        'AGENTS.md is read by Claude Code in agentic / multi-step task mode. It defines how agents should behave and hand off work.',
        { type: 'bullet', items: [
          'Agent roles and responsibilities',
          'Task hand-off rules between agents',
          'Prohibited actions (e.g. no large-scale changes without a plan)',
          'Pre-reasoning requirements (<think> blocks)',
        ]},
        'Critical for complex tasks where Claude breaks work into multiple sub-tasks. Without it, agents may act unpredictably.',
      ],
    },
    ko: {
      title: 'AGENTS.md — 멀티 에이전트 프로토콜',
      lines: [
        'AGENTS.md는 Claude Code가 에이전트 / 멀티스텝 작업 모드에서 읽습니다. 에이전트 동작과 작업 인계 방식을 정의합니다.',
        { type: 'bullet', items: [
          '에이전트 역할과 책임 정의',
          '에이전트 간 작업 인계 규칙',
          '금지 행동 (예: 계획 없이 대규모 변경 금지)',
          '사전 추론 요구사항 (<think> 블록)',
        ]},
        '여러 서브태스크로 나뉘는 복잡한 작업에 필수입니다. 없으면 에이전트가 예측 불가능하게 동작할 수 있습니다.',
      ],
    },
  },
  {
    id: 'cursorrules',
    icon: '✏️',
    en: {
      title: '.cursorrules — Cursor AI Rules  (Optional)',
      lines: [
        'Generated only when "Cursor AI" is enabled in Settings → Tools. Two formats are created:',
        { type: 'code', text: '.cursorrules              ← legacy format\n.cursor/rules/project.mdc ← new MDC format (preferred)' },
        { type: 'bullet', items: [
          'Token-efficient rules for Cursor\'s inline AI completions',
          'Architecture hints and ignore patterns',
          'Does NOT affect Claude Code — only Cursor editor',
        ]},
        'Enable this only if you use the Cursor editor. Disabling it keeps your workspace cleaner.',
      ],
    },
    ko: {
      title: '.cursorrules — Cursor AI 규칙  (선택사항)',
      lines: [
        'Settings → Tools에서 "Cursor AI"를 활성화할 때만 생성됩니다. 두 가지 포맷이 생성됩니다:',
        { type: 'code', text: '.cursorrules              ← 기존 포맷\n.cursor/rules/project.mdc ← 새 MDC 포맷 (권장)' },
        { type: 'bullet', items: [
          'Cursor 인라인 AI 자동완성을 위한 토큰 절약형 규칙',
          '아키텍처 힌트 및 무시할 파일 패턴',
          'Claude Code에는 영향 없음 — Cursor 에디터 전용',
        ]},
        'Cursor 에디터를 사용할 때만 활성화하세요. 비활성화하면 워크스페이스가 더 깔끔해집니다.',
      ],
    },
  },
  {
    id: 'mcp',
    icon: '🔌',
    en: {
      title: '.mcp.json — MCP Server Config',
      lines: [
        'Model Context Protocol (MCP) lets Claude Code access external tools and data sources beyond the codebase.',
        { type: 'bullet', items: [
          'filesystem — read/write files outside the project',
          'git — git log, diff, blame operations',
          'Additional servers can be added manually',
        ]},
        { type: 'code', text: '{ "mcpServers": { "filesystem": { "command": "npx", "args": [...] } } }' },
        'Claude Code picks up .mcp.json automatically. Restart Claude Code after changing it.',
      ],
    },
    ko: {
      title: '.mcp.json — MCP 서버 설정',
      lines: [
        'MCP(Model Context Protocol)는 Claude Code가 코드베이스 외부의 도구와 데이터에 접근하게 해줍니다.',
        { type: 'bullet', items: [
          'filesystem — 프로젝트 외부 파일 읽기/쓰기',
          'git — git log, diff, blame 작업',
          '추가 서버를 수동으로 등록 가능',
        ]},
        { type: 'code', text: '{ "mcpServers": { "filesystem": { "command": "npx", "args": [...] } } }' },
        'Claude Code가 .mcp.json을 자동으로 인식합니다. 변경 후 Claude Code를 재시작하세요.',
      ],
    },
  },
  {
    id: 'skills',
    icon: '⌨️',
    en: {
      title: '.claude/skills/ — Slash Commands',
      lines: [
        'Custom slash commands you can invoke directly in Claude Code chat with /command-name.',
        { type: 'bullet', items: [
          '/run — run the project',
          '/test — run test suite',
          '/review — code review',
          '/deploy — deployment steps',
        ]},
        'Each skill is a Markdown file in .claude/skills/. You can edit them directly to customize behavior.',
        { type: 'code', text: '.claude/skills/\n  run.md\n  test.md\n  review.md' },
      ],
    },
    ko: {
      title: '.claude/skills/ — 슬래시 커맨드',
      lines: [
        'Claude Code 채팅에서 /command-name으로 직접 호출할 수 있는 커스텀 명령어입니다.',
        { type: 'bullet', items: [
          '/run — 프로젝트 실행',
          '/test — 테스트 실행',
          '/review — 코드 리뷰',
          '/deploy — 배포 절차',
        ]},
        '각 skill은 .claude/skills/ 디렉토리의 Markdown 파일입니다. 직접 편집해서 동작을 커스터마이즈할 수 있습니다.',
        { type: 'code', text: '.claude/skills/\n  run.md\n  test.md\n  review.md' },
      ],
    },
  },
  {
    id: 'presets',
    icon: '📦',
    en: {
      title: 'Presets — Rule Templates',
      lines: [
        'Presets override or replace the generated file content with opinionated rule sets.',
        { type: 'bullet', items: [
          'Built-in: curated presets (Karpathy Agent OS, Minimal, Strict TypeScript)',
          'GitHub: community presets tagged with claude-code / cursorrules / ai-rules',
          'Each preset card shows which files it overwrites',
        ]},
        'Presets are applied on top of your Settings. Your coding style and agent mode still influence the base content; the preset overwrites specific files.',
        'To remove a preset effect: clear the preset selection and re-generate.',
      ],
    },
    ko: {
      title: 'Presets — 규칙 템플릿',
      lines: [
        '프리셋은 생성된 파일 내용을 의견이 담긴 규칙 세트로 대체합니다.',
        { type: 'bullet', items: [
          '기본 제공: 큐레이션된 프리셋 (Karpathy Agent OS, Minimal, Strict TypeScript)',
          'GitHub: claude-code / cursorrules / ai-rules 태그가 달린 커뮤니티 프리셋',
          '각 카드에 덮어쓰는 파일 목록 표시',
        ]},
        '프리셋은 Settings 위에 적용됩니다. 코딩 스타일과 에이전트 모드는 기본 내용에 영향을 주고, 프리셋이 특정 파일을 덮어씁니다.',
        '프리셋 효과를 제거하려면 선택을 해제하고 재생성하세요.',
      ],
    },
  },
]

type LineItem = string | { type: 'code'; text: string } | { type: 'bullet'; items: string[] }

function RenderLine({ line }: { line: LineItem }) {
  if (typeof line === 'string') {
    return <p className="text-[12px] text-gray-400 leading-relaxed">{line}</p>
  }
  if (line.type === 'code') {
    return (
      <pre className="bg-black/30 border border-white/8 rounded-lg px-3 py-2 text-[11px] text-gray-400 font-mono overflow-auto whitespace-pre">
        {line.text}
      </pre>
    )
  }
  return (
    <ul className="space-y-1">
      {line.items.map((item, i) => (
        <li key={i} className="flex gap-2 text-[12px] text-gray-400 leading-relaxed">
          <span className="text-gray-600 shrink-0 mt-px">•</span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  )
}

export default function GuideTab({ locale }: GuideTabProps) {
  const [openId, setOpenId] = useState<string | null>('workflow')

  return (
    <div className="space-y-2">
      {SECTIONS.map((section) => {
        const content = locale === 'ko' ? section.ko : section.en
        const isOpen = openId === section.id

        return (
          <div
            key={section.id}
            className={`rounded-xl border transition-colors ${
              isOpen ? 'border-white/10 bg-white/[0.03]' : 'border-white/6 bg-transparent'
            }`}
          >
            <button
              onClick={() => setOpenId(isOpen ? null : section.id)}
              className="w-full flex items-center gap-2.5 px-4 py-3 text-left"
            >
              <span className="text-base leading-none shrink-0">{section.icon}</span>
              <span className="text-xs font-semibold text-gray-200 flex-1">{content.title}</span>
              <span className={`text-[11px] text-gray-600 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`}>
                ▼
              </span>
            </button>

            {isOpen && (
              <div className="px-4 pb-4 space-y-3 border-t border-white/[0.06] pt-3">
                {content.lines.map((line, i) => (
                  <RenderLine key={i} line={line} />
                ))}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
