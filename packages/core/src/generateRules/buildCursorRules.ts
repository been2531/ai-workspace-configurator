import type { DetectedStack } from '../types'

export function buildCursorRules(stack: DetectedStack): string {
  const ignorePatterns = buildIgnorePatterns(stack)

  return `# .cursorrules — Codex 토큰 다이어트 (Auto-generated)
# 불필요한 파일을 컨텍스트에서 제외하여 토큰 낭비를 방지합니다.

## 핵심 아키텍처
- 언어: ${stack.language}
- 프레임워크: ${stack.frameworks.join(', ') || '없음'}

## 컨텍스트 제외 패턴
${ignorePatterns}

## 인라인 완성 규칙
- 함수 시그니처와 반환 타입을 항상 명시.
- 주석은 WHY만. WHAT은 코드 자체가 설명.
- 테스트 파일에서는 describe/it/expect 패턴 유지.
`
}

function buildIgnorePatterns(stack: DetectedStack): string {
  const base = [
    'node_modules/**',
    'dist/**',
    'build/**',
    '.git/**',
    '*.lock',
    '*.log',
    'coverage/**',
  ]

  if (stack.frameworks.includes('Next.js')) base.push('.next/**')
  if (stack.manifests.includes('package.json')) base.push('package-lock.json', 'pnpm-lock.yaml')
  if (stack.language === 'Python') base.push('__pycache__/**', '*.pyc', '.venv/**', 'venv/**')
  if (stack.language === 'Java') base.push('target/**', '*.class')
  if (stack.language === 'Go') base.push('vendor/**')

  return base.map((p) => `- ${p}`).join('\n')
}
