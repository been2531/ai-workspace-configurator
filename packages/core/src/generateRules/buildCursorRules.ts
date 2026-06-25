import type { ComposeInput } from '../types'

export function buildCursorRules({ stack }: ComposeInput): string {
  return `${buildIgnorePatterns(stack)}

${buildArchitectureHints(stack)}`
}

function buildIgnorePatterns({ language, frameworks, manifests }: ComposeInput['stack']): string {
  const patterns = [
    'node_modules/**',
    'dist/**',
    'build/**',
    '.git/**',
    '*.lock',
    '*.log',
    'coverage/**',
  ]

  if (frameworks.includes('Next.js')) patterns.push('.next/**', 'out/**')
  if (manifests.includes('package.json')) patterns.push('package-lock.json', 'pnpm-lock.yaml', 'yarn.lock')
  if (language === 'Python') patterns.push('__pycache__/**', '*.pyc', '.venv/**', 'venv/**', '.pytest_cache/**')
  if (language === 'Java') patterns.push('target/**', '*.class', '.gradle/**')
  if (language === 'Rust') patterns.push('target/**')
  if (language === 'Go') patterns.push('vendor/**')

  return patterns.map((p) => `!${p}`).join('\n')
}

function buildArchitectureHints({ language, frameworks }: ComposeInput['stack']): string {
  const hints: string[] = [
    `# Stack: ${language}${frameworks.length ? ` / ${frameworks.join(', ')}` : ''}`,
    '# Rules: no any types, pure functions preferred, side-effects at boundaries',
  ]

  if (frameworks.includes('Next.js')) {
    hints.push('# Next.js: Server Components default, Client only when needed (state/events)')
  }
  if (frameworks.includes('React')) {
    hints.push('# React: functional components + hooks only, custom hooks for business logic')
  }
  if (frameworks.includes('NestJS')) {
    hints.push('# NestJS: business logic in services, controllers handle HTTP only')
  }
  if (language === 'Python') {
    hints.push('# Python: type hints required, dataclasses/pydantic for data models')
  }

  return hints.join('\n')
}
