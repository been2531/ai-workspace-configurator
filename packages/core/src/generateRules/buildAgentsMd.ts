import type { ComposeInput } from '../types'

export function buildAgentsMd({ stack, profile }: ComposeInput): string {
  const autonomy = profile?.agentMode.autonomyLevel ?? 'proceed'
  const preReasoning = profile?.agentMode.preReasoning ?? true
  const omissionGuard = profile?.agentMode.codeOmissionGuard ?? true

  const autonomyRule =
    autonomy === 'ask-first'
      ? '- 구현 전 반드시 계획을 제시하고 승인을 받을 것.'
      : autonomy === 'autonomous'
        ? '- 명확한 요구사항이면 바로 구현. 완료 후 요약 보고.'
        : '- 소규모 변경은 바로 진행. 파일 3개 이상 수정 시 계획 먼저 제시.'

  const reasoningBlock = preReasoning
    ? `## 사전 추론 (작업 시작 전 필수)

작업 전 반드시 순서대로 추론하라:
1. **목적**: 이 변경이 무엇을 달성하는가?
2. **범위**: 어떤 파일/모듈이 영향을 받는가?
3. **부작용**: 기존 동작을 깨뜨리는가?
4. **최소 변경**: 목적 달성에 필요한 최소 코드만 수행.

`
    : ''

  const omissionBlock = omissionGuard
    ? `## 코드 생략 금지

- \`// ... rest of code\`, \`// TODO\`, \`// 생략\` 절대 금지.
- 수정한 함수는 전체 코드를 반드시 포함.
- 파일 일부만 제시하는 것 금지 — 항상 완전한 형태로.

`
    : ''

  return `# AGENTS.md — 에이전트 협업 지침

${reasoningBlock}${omissionBlock}## 에이전트 역할

### Planner
- 요구사항 분석 후 파일 목록·변경 순서 명시.
- 코드를 직접 작성하지 않음.

### Implementer
- Planner 계획에만 근거해 코드 작성.
- 계획에 없는 리팩토링 금지.

### Reviewer
- 보안 취약점, 타입 안전성, 성능 이슈 검토.
- 문제 발견 시 Implementer로 피드백.

## 자율성 수준

${autonomyRule}

## 프로젝트 컨텍스트
- **언어**: ${stack.language}
- **프레임워크**: ${stack.frameworks.join(', ') || '없음'}
`
}
