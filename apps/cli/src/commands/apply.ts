import * as p from '@clack/prompts'
import type { CommunityPreset } from '@ai-workspace-configurator/core'
import { getPreset, incrementApplied } from '../firebase/registry'
import { isFirebaseConfigured } from '../firebase/config'

// ─── 번들 프리셋 (Firebase 없이도 사용 가능) ────────────────────────────────

export const BUNDLED_PRESETS: Record<string, CommunityPreset> = {
  'karpathy/agent-os': {
    id: 'karpathy/agent-os',
    name: 'Karpathy Agent OS',
    author: 'karpathy',
    description: 'LLM OS 기반 멀티에이전트 사전 추론 시스템.',
    tags: ['claude-code', 'multi-agent', 'reasoning'],
    overrides: {
      agentsMd: `# AGENTS.md — Karpathy Agent OS

## LLM OS 사전 추론 프로토콜

작업 전 반드시 순서대로 추론하라:

<think>
1. 이 변경의 목적은 무엇인가?
2. 시스템의 어떤 부분이 영향을 받는가?
3. 무엇이 잘못될 수 있는가?
4. 최소한의 변경으로 목적을 달성하는 방법은?
</think>

## 에이전트 계층

| 계층 | 역할 |
|------|------|
| System Agent | 아키텍처 결정, 불변 제약 정의 |
| Planner | 요구사항 → 구현 계획 |
| Implementer | 계획 → 코드 |
| Critic | 코드 → 검토 및 피드백 |

## 절대 금지

- 코드 생략 (\`// ...\`, \`// rest\`) 절대 금지
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
      agentsMd: `# AGENTS.md\n\n## 원칙\n- 명확하면 바로 구현.\n- 불명확하면 핵심 질문 하나만.\n- 완료 후 간결하게 보고.\n`,
    },
  },
}

// ─── apply 커맨드 ─────────────────────────────────────────────────────────────

export async function applyCommand(presetId?: string): Promise<void> {
  p.intro('AI Workspace — 프리셋 적용')

  let selectedId = presetId

  if (!selectedId) {
    const choice = await p.select({
      message: '적용할 프리셋을 선택하세요',
      options: [
        ...Object.values(BUNDLED_PRESETS).map((pr) => ({
          value: pr.id,
          label: `[번들] ${pr.name} — ${pr.description}`,
          hint: pr.tags.join(', '),
        })),
        { value: '__search', label: '커뮤니티에서 검색...' },
      ],
    })
    if (p.isCancel(choice)) { p.cancel('취소'); return }
    selectedId = choice as string
  }

  if (selectedId === '__search') {
    p.log.info('ai-workspace search 를 실행하고 프리셋 ID를 확인하세요.')
    return
  }

  const preset = await resolvePreset(selectedId)
  if (!preset) {
    p.log.error(`프리셋을 찾을 수 없습니다: ${selectedId}`)
    process.exit(1)
  }

  p.log.success(`"${preset.name}" (by ${preset.author}) 로드 완료`)

  // 프로필의 basePreset 에 저장 제안
  const save = await p.confirm({
    message: '이 프리셋을 기본값으로 저장할까요? (새 프로젝트마다 자동 적용)',
    initialValue: false,
  })
  if (!p.isCancel(save) && save) {
    const { loadProfile, saveProfile } = await import('../profile')
    const profile = loadProfile()
    profile.basePreset = preset.id
    saveProfile(profile)
    p.log.success('프로필에 저장됨')
  }

  p.note(
    Object.keys(preset.overrides)
      .map((k) => `✓ ${k}`)
      .join('\n'),
    '덮어쓸 파일',
  )
  p.outro(`ai-workspace init 을 실행하면 이 프리셋이 적용됩니다.`)
}

// ─── 프리셋 해석 (Firestore 우선 → 번들 폴백) ───────────────────────────────

export async function resolvePreset(presetId: string): Promise<CommunityPreset | null> {
  // 번들 프리셋 먼저 확인
  if (BUNDLED_PRESETS[presetId]) return BUNDLED_PRESETS[presetId]

  // Firestore에서 조회
  if (!isFirebaseConfigured()) return null

  try {
    const doc = await getPreset(presetId)
    if (!doc) return null

    // 적용 카운트 증가 (fire-and-forget)
    void incrementApplied(presetId)

    return {
      id: doc.id,
      name: doc.name,
      author: doc.author,
      description: doc.description,
      tags: doc.tags,
      overrides: doc.overrides,
    }
  } catch {
    return null
  }
}
