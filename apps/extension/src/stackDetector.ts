import * as fs from 'fs'
import * as path from 'path'
import type { DetectedStack } from '@ai-workspace-configurator/core'

const MANIFEST_FILES = [
  'package.json',
  'pom.xml',
  'requirements.txt',
  'Pipfile',
  'pyproject.toml',
  'Cargo.toml',
  'go.mod',
  'composer.json',
  'Gemfile',
]

export async function detectStack(workspaceRoot: string): Promise<DetectedStack> {
  const foundManifests: string[] = []
  for (const f of MANIFEST_FILES) {
    if (fs.existsSync(path.join(workspaceRoot, f))) foundManifests.push(f)
  }

  if (foundManifests.length === 0) {
    return {
      language: 'Unknown',
      frameworks: [],
      manifests: [],
      packageManager: 'unknown',
      hasClaude: false,
      hasCursor: false,
      hasMcp: false,
      hasAgents: false,
      hasSkills: false,
      confidence: 'empty',
      ambiguities: [],
    }
  }

  const frameworks: string[] = []
  const ambiguities: string[] = []
  const language = detectLanguage(foundManifests)

  if (foundManifests.includes('package.json')) {
    const pkg = readJson<{
      dependencies?: Record<string, string>
      devDependencies?: Record<string, string>
    }>(path.join(workspaceRoot, 'package.json'))
    const deps = { ...pkg?.dependencies, ...pkg?.devDependencies }

    // UI 프레임워크 — 동시에 여러 개 있으면 ambiguous
    const uiFrameworks: string[] = []
    if (deps['react']) uiFrameworks.push('React')
    if (deps['vue'] || deps['vue3']) uiFrameworks.push('Vue')
    if (deps['svelte']) uiFrameworks.push('Svelte')

    if (uiFrameworks.length > 1) {
      ambiguities.push(`UI 프레임워크 중복 감지: ${uiFrameworks.join(', ')}`)
    }

    // Next.js가 있으면 React 대신 Next.js로 단일화
    if (deps['next']) {
      frameworks.push('Next.js')
    } else {
      frameworks.push(...uiFrameworks)
    }

    if (deps['express']) frameworks.push('Express')
    if (deps['fastify']) frameworks.push('Fastify')
    if (deps['nestjs'] || deps['@nestjs/core']) frameworks.push('NestJS')
    if (deps['vite']) frameworks.push('Vite')
    if (deps['typescript'] || deps['ts-node']) frameworks.push('TypeScript')
    if (deps['tailwindcss']) frameworks.push('Tailwind CSS')
    if (deps['firebase'] || deps['firebase-admin']) frameworks.push('Firebase')
    if (deps['prisma'] || deps['@prisma/client']) frameworks.push('Prisma')
    if (deps['drizzle-orm']) frameworks.push('Drizzle')
  }

  if (
    foundManifests.includes('requirements.txt') ||
    foundManifests.includes('pyproject.toml') ||
    foundManifests.includes('Pipfile')
  ) {
    // 모든 Python 매니페스트를 합쳐서 파싱
    const pythonContent = [
      foundManifests.includes('requirements.txt')
        ? readText(path.join(workspaceRoot, 'requirements.txt'))
        : '',
      foundManifests.includes('pyproject.toml')
        ? readText(path.join(workspaceRoot, 'pyproject.toml'))
        : '',
      foundManifests.includes('Pipfile')
        ? readText(path.join(workspaceRoot, 'Pipfile'))
        : '',
    ].join('\n')

    const pythonFrameworks: string[] = []
    if (pythonContent.includes('django')) pythonFrameworks.push('Django')
    if (pythonContent.includes('fastapi')) pythonFrameworks.push('FastAPI')
    if (pythonContent.includes('flask')) pythonFrameworks.push('Flask')

    if (pythonFrameworks.length > 1) {
      ambiguities.push(`Python 프레임워크 중복 감지: ${pythonFrameworks.join(', ')}`)
    }
    frameworks.push(...pythonFrameworks)
  }

  // Java 백엔드인데 프론트가 별도 존재하는지 확인
  if (foundManifests.includes('pom.xml') && foundManifests.includes('package.json')) {
    ambiguities.push('Java 백엔드 + JS 프론트엔드 혼합 구조 감지')
  }

  const hasClaude = fs.existsSync(path.join(workspaceRoot, 'CLAUDE.md'))
  const hasCursor = fs.existsSync(path.join(workspaceRoot, '.cursorrules'))
  const hasMcp = fs.existsSync(path.join(workspaceRoot, '.mcp.json'))
  const hasAgents = fs.existsSync(path.join(workspaceRoot, 'AGENTS.md'))
  const hasSkills = detectSkillsDir(workspaceRoot)
  const packageManager = detectPackageManager(workspaceRoot)

  const confidence =
    ambiguities.length > 0 ? 'ambiguous' : frameworks.length > 0 ? 'certain' : 'ambiguous'

  return {
    language,
    frameworks,
    manifests: foundManifests,
    packageManager,
    hasClaude,
    hasCursor,
    hasMcp,
    hasAgents,
    hasSkills,
    confidence,
    ambiguities,
  }
}

function detectLanguage(manifests: string[]): string {
  if (manifests.includes('package.json')) return 'JavaScript/TypeScript'
  if (manifests.includes('pom.xml')) return 'Java'
  if (
    manifests.includes('requirements.txt') ||
    manifests.includes('pyproject.toml') ||
    manifests.includes('Pipfile')
  )
    return 'Python'
  if (manifests.includes('Cargo.toml')) return 'Rust'
  if (manifests.includes('go.mod')) return 'Go'
  if (manifests.includes('composer.json')) return 'PHP'
  if (manifests.includes('Gemfile')) return 'Ruby'
  return 'Unknown'
}

function detectPackageManager(
  workspaceRoot: string,
): 'npm' | 'pnpm' | 'yarn' | 'unknown' {
  if (fs.existsSync(path.join(workspaceRoot, 'pnpm-lock.yaml'))) return 'pnpm'
  if (fs.existsSync(path.join(workspaceRoot, 'yarn.lock'))) return 'yarn'
  if (fs.existsSync(path.join(workspaceRoot, 'package-lock.json'))) return 'npm'
  return 'unknown'
}

function detectSkillsDir(workspaceRoot: string): boolean {
  const skillsDir = path.join(workspaceRoot, '.claude', 'skills')
  if (!fs.existsSync(skillsDir)) return false
  try {
    return fs.readdirSync(skillsDir).some((f) => f.endsWith('.md'))
  } catch {
    return false
  }
}

function readJson<T>(filePath: string): T | null {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8')) as T
  } catch {
    return null
  }
}

function readText(filePath: string): string {
  try {
    return fs.readFileSync(filePath, 'utf-8').toLowerCase()
  } catch {
    return ''
  }
}
