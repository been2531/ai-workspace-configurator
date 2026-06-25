import * as p from '@clack/prompts'
import type { UserProfile } from '@ai-workspace-configurator/core'
import { loadProfile, saveProfile, profileExists } from '../profile'

export async function profileCommand(): Promise<void> {
  p.intro('AI Workspace — 내 프로필 설정')

  const existing = profileExists()
  if (existing) {
    const overwrite = await p.confirm({
      message: '기존 프로필이 있습니다. 다시 설정하시겠습니까?',
    })
    if (p.isCancel(overwrite) || !overwrite) {
      p.outro('기존 프로필을 유지합니다.')
      return
    }
  }

  const typeStrictness = await p.select({
    message: '타입 엄격도',
    options: [
      { value: 'strict', label: 'Strict — any 금지, 모든 타입 명시 (추천)' },
      { value: 'moderate', label: 'Moderate — 외부 경계에서만 any 허용' },
      { value: 'loose', label: 'Loose — 필요한 곳만 타입 명시' },
    ],
  })
  if (p.isCancel(typeStrictness)) { p.cancel('취소'); process.exit(0) }

  const paradigm = await p.select({
    message: '코딩 패러다임',
    options: [
      { value: 'functional', label: '함수형 — 순수 함수, 불변 상태 우선' },
      { value: 'oop', label: '객체지향 — 클래스, 캡슐화 우선' },
      { value: 'mixed', label: '혼용 — 컨텍스트에 따라 선택' },
    ],
  })
  if (p.isCancel(paradigm)) { p.cancel('취소'); process.exit(0) }

  const autonomyLevel = await p.select({
    message: '에이전트 자율성 수준',
    options: [
      { value: 'proceed', label: 'Proceed — 소규모는 바로, 대규모는 계획 먼저 (추천)' },
      { value: 'ask-first', label: 'Ask First — 항상 계획 승인 후 구현' },
      { value: 'autonomous', label: 'Autonomous — 명확한 요구면 바로 완료 후 보고' },
    ],
  })
  if (p.isCancel(autonomyLevel)) { p.cancel('취소'); process.exit(0) }

  const preReasoning = await p.confirm({
    message: '작업 전 사전 추론 단계 (Karpathy 방식) 활성화?',
    initialValue: true,
  })
  if (p.isCancel(preReasoning)) { p.cancel('취소'); process.exit(0) }

  const basePreset = await p.select({
    message: '기본 에이전트 프리셋 (나중에 변경 가능)',
    options: [
      { value: undefined, label: '없음 — 내 설정만 사용' },
      { value: 'karpathy/agent-os', label: 'Karpathy Agent OS — 강력한 추론 중심 에이전트' },
      { value: 'minimal', label: 'Minimal — 최소한의 지침, 에이전트 자율성 최대화' },
    ],
  })
  if (p.isCancel(basePreset)) { p.cancel('취소'); process.exit(0) }

  const profile: UserProfile = {
    version: '1',
    codingStyle: {
      typeStrictness: typeStrictness as UserProfile['codingStyle']['typeStrictness'],
      paradigm: paradigm as UserProfile['codingStyle']['paradigm'],
      commentStyle: 'minimal',
    },
    agentMode: {
      preReasoning: preReasoning as boolean,
      codeOmissionGuard: true,
      autonomyLevel: autonomyLevel as UserProfile['agentMode']['autonomyLevel'],
    },
    mcpDefaults: ['filesystem', 'git'],
    basePreset: basePreset as string | undefined,
  }

  saveProfile(profile)
  p.outro('프로필이 저장되었습니다. 이제 모든 프로젝트에 자동 적용됩니다.')
}
