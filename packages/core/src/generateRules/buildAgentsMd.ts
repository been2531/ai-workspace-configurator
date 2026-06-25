import type { DetectedStack } from '../types'

export function buildAgentsMd(stack: DetectedStack): string {
  return `# AGENTS.md — 멀티 에이전트 협업 지침 (Auto-generated)

## 사전 추론 룰 (Karpathy LLM OS 기반)

작업 시작 전 반드시 아래 순서로 추론하라:
1. **목적 파악**: 이 변경이 무엇을 달성하는가?
2. **영향 범위**: 어떤 파일/모듈이 영향을 받는가?
3. **부작용 탐지**: 기존 동작을 깨뜨리는가?
4. **최소 변경**: 목적 달성에 필요한 최소 코드 변경만 수행.

## 에이전트 역할 정의

### Planner (계획 에이전트)
- 요구사항을 분석하고 구현 계획을 작성.
- 파일 목록과 변경 순서를 명시.
- 코드를 직접 작성하지 않음.

### Implementer (구현 에이전트)
- Planner의 계획에만 근거해 코드 작성.
- 계획에 없는 리팩토링 금지.
- 구현 완료 후 Reviewer에게 핸드오프.

### Reviewer (검토 에이전트)
- 보안 취약점, 타입 안전성, 성능 이슈 검토.
- 문제 발견 시 Implementer로 피드백.

## 코드 생략 금지 가드레일

- \`// ... rest of code\`, \`// TODO\`, \`// 생략\` 절대 금지.
- 수정한 함수는 전체 코드를 반드시 포함.
- 파일 일부만 보여주는 것 금지 — 항상 완전한 파일로.

## 스택별 컨텍스트
- **언어**: ${stack.language}
- **프레임워크**: ${stack.frameworks.join(', ') || '없음'}
`
}
