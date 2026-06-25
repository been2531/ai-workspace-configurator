import * as p from '@clack/prompts'
import type { CommunityPreset } from '@ai-workspace-configurator/core'

// 번들된 기본 프리셋 (1단계 — Firebase 연결 전)
const BUNDLED_PRESETS: Record<string, CommunityPreset> = {
  'karpathy/agent-os': {
    id: 'karpathy/agent-os',
    name: 'Karpathy Agent OS',
    author: 'karpathy',
    description: 'LLM OS 기반 멀티에이전트 사전 추론 시스템. 강력한 추론과 코드 생략 금지 가드레일.',
    tags: ['claude-code', 'multi-agent', 'reasoning'],
    overrides: {
      agentsMd: `# AGENTS.md — Karpathy Agent OS

## LLM OS 사전 추론 프로토콜

모든 작업 전 반드시 아래 순서로 추론하라:

<think>
1. 이 변경의 목적은 무엇인가?
2. 시스템의 어떤 부분이 영향을 받는가?
3. 무엇이 잘못될 수 있는가?
4. 최소한의 변경으로 목적을 달성하는 방법은?
</think>

## 에이전트 계층 (LLM OS)

| 계층 | 역할 |
|------|------|
| System Agent | 아키텍처 결정, 불변 제약 정의 |
| Planner | 요구사항 → 구현 계획 |
| Implementer | 계획 → 코드 |
| Critic | 코드 → 검토 및 피드백 |

## 절대 금지

- 코드 생략 (\`// ...\`, \`// rest\`, \`// 생략\`) 절대 금지
- 계획 없는 대규모 변경 금지
- 타입 단언(\`as any\`) 금지
`,
    },
  },

  'minimal': {
    id: 'minimal',
    name: 'Minimal',
    author: 'built-in',
    description: '최소한의 지침. 에이전트 자율성 최대화.',
    tags: ['minimal', 'autonomous'],
    overrides: {
      agentsMd: `# AGENTS.md

## 원칙
- 명확한 요구사항이면 바로 구현.
- 불명확하면 한 가지 핵심 질문만.
- 완료 후 간결하게 보고.
`,
    },
  },
}

export async function applyCommand(presetId?: string): Promise<void> {
  p.intro('AI Workspace — 프리셋 적용')

  let selectedId = presetId

  if (!selectedId) {
    const choice = await p.select({
      message: '적용할 프리셋을 선택하세요',
      options: Object.values(BUNDLED_PRESETS).map((preset) => ({
        value: preset.id,
        label: `${preset.name} — ${preset.description}`,
        hint: preset.tags.join(', '),
      })),
    })
    if (p.isCancel(choice)) { p.cancel('취소'); process.exit(0) }
    selectedId = choice as string
  }

  const preset = BUNDLED_PRESETS[selectedId]
  if (!preset) {
    p.log.error(`프리셋을 찾을 수 없습니다: ${selectedId}`)
    p.log.info('사용 가능한 프리셋: ' + Object.keys(BUNDLED_PRESETS).join(', '))
    process.exit(1)
  }

  p.log.success(`"${preset.name}" 프리셋을 로드했습니다.`)
  p.log.info('ai-workspace init을 실행하면 이 프리셋이 자동 적용됩니다.')
  p.log.info('프리셋을 기본값으로 저장하려면: ai-workspace profile')
  p.outro('완료')
}

export { BUNDLED_PRESETS }
