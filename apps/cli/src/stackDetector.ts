import * as fs from 'fs'
import * as path from 'path'
import type { DetectedStack } from '@ai-workspace-configurator/core'

const MANIFEST_FILES = [
  'package.json', 'pom.xml', 'requirements.txt',
  'Pipfile', 'pyproject.toml', 'Cargo.toml',
  'go.mod', 'composer.json', 'Gemfile',
]

export function detectStack(workspaceRoot: string): DetectedStack {
  const foundManifests: string[] = []
  for (const f of MANIFEST_FILES) {
    if (fs.existsSync(path.join(workspaceRoot, f))) foundManifests.push(f)
  }

  if (foundManifests.length === 0) {
    return {
      language: 'Unknown', frameworks: [], manifests: [],
      packageManager: 'unknown', hasClaude: false, hasCursor: false,
      hasMcp: false, hasAgents: false, hasSkills: false, confidence: 'empty', ambiguities: [],
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

    const uiFrameworks: string[] = []
    if (deps['react']) uiFrameworks.push('React')
    if (deps['vue'] || deps['vue3']) uiFrameworks.push('Vue')
    if (deps['svelte']) uiFrameworks.push('Svelte')

    if (uiFrameworks.length > 1) {
      ambiguities.push(`UI 프레임워크 중복: ${uiFrameworks.join(', ')}`)
    }

    if (deps['next']) frameworks.push('Next.js')
    else frameworks.push(...uiFrameworks)

    if (deps['express']) frameworks.push('Express')
    if (deps['fastify']) frameworks.push('Fastify')
    if (deps['@nestjs/core']) frameworks.push('NestJS')
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
    const content = ['requirements.txt', 'pyproject.toml', 'Pipfile']
      .filter((f) => foundManifests.includes(f))
      .map((f) => readText(path.join(workspaceRoot, f)))
      .join('\n')

    const pf: string[] = []
    if (content.includes('django')) pf.push('Django')
    if (content.includes('fastapi')) pf.push('FastAPI')
    if (content.includes('flask')) pf.push('Flask')
    if (pf.length > 1) ambiguities.push(`Python 프레임워크 중복: ${pf.join(', ')}`)
    frameworks.push(...pf)
  }

  if (foundManifests.includes('pom.xml') && foundManifests.includes('package.json')) {
    ambiguities.push('Java 백엔드 + JS 프론트 혼합 구조')
  }

  const packageManager = detectPackageManager(workspaceRoot)
  const confidence = ambiguities.length > 0 ? 'ambiguous' : frameworks.length > 0 ? 'certain' : 'ambiguous'

  return {
    language, frameworks, manifests: foundManifests, packageManager,
    hasClaude: fs.existsSync(path.join(workspaceRoot, 'CLAUDE.md')),
    hasCursor: fs.existsSync(path.join(workspaceRoot, '.cursorrules')),
    hasMcp: fs.existsSync(path.join(workspaceRoot, '.mcp.json')),
    hasAgents: fs.existsSync(path.join(workspaceRoot, 'AGENTS.md')),
    hasSkills: detectSkillsDir(workspaceRoot),
    confidence, ambiguities,
  }
}

function detectLanguage(manifests: string[]): string {
  if (manifests.includes('package.json')) return 'JavaScript/TypeScript'
  if (manifests.includes('pom.xml')) return 'Java'
  if (['requirements.txt', 'pyproject.toml', 'Pipfile'].some((f) => manifests.includes(f))) return 'Python'
  if (manifests.includes('Cargo.toml')) return 'Rust'
  if (manifests.includes('go.mod')) return 'Go'
  if (manifests.includes('composer.json')) return 'PHP'
  if (manifests.includes('Gemfile')) return 'Ruby'
  return 'Unknown'
}

function detectPackageManager(root: string): 'npm' | 'pnpm' | 'yarn' | 'unknown' {
  if (fs.existsSync(path.join(root, 'pnpm-lock.yaml'))) return 'pnpm'
  if (fs.existsSync(path.join(root, 'yarn.lock'))) return 'yarn'
  if (fs.existsSync(path.join(root, 'package-lock.json'))) return 'npm'
  return 'unknown'
}

function detectSkillsDir(root: string): boolean {
  const dir = path.join(root, '.claude', 'skills')
  try { return fs.existsSync(dir) && fs.readdirSync(dir).some((f) => f.endsWith('.md')) } catch { return false }
}

function readJson<T>(filePath: string): T | null {
  try { return JSON.parse(fs.readFileSync(filePath, 'utf-8')) as T } catch { return null }
}

function readText(filePath: string): string {
  try { return fs.readFileSync(filePath, 'utf-8').toLowerCase() } catch { return '' }
}
