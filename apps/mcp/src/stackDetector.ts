import * as fs from 'fs'
import * as path from 'path'
import type { DetectedStack } from '@ai-workspace-configurator/core'

const MANIFESTS = [
  'package.json', 'pom.xml', 'requirements.txt',
  'Pipfile', 'pyproject.toml', 'Cargo.toml',
  'go.mod', 'composer.json', 'Gemfile',
]

export function detectStack(root: string): DetectedStack {
  const foundManifests = MANIFESTS.filter(f => fs.existsSync(path.join(root, f)))

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
    const pkg = readJson<{ dependencies?: Record<string, string>; devDependencies?: Record<string, string> }>(
      path.join(root, 'package.json'),
    )
    const deps = { ...pkg?.dependencies, ...pkg?.devDependencies }
    const ui: string[] = []
    if (deps['react']) ui.push('React')
    if (deps['vue'] || deps['vue3']) ui.push('Vue')
    if (deps['svelte']) ui.push('Svelte')
    if (ui.length > 1) ambiguities.push(`UI 프레임워크 중복: ${ui.join(', ')}`)
    if (deps['next']) frameworks.push('Next.js')
    else frameworks.push(...ui)
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

  const pyFiles = ['requirements.txt', 'pyproject.toml', 'Pipfile'].filter(f => foundManifests.includes(f))
  if (pyFiles.length) {
    const content = pyFiles.map(f => readText(path.join(root, f))).join('\n')
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

  const pm = detectPm(root)
  const confidence = ambiguities.length > 0 ? 'ambiguous' : frameworks.length > 0 ? 'certain' : 'ambiguous'

  return {
    language, frameworks, manifests: foundManifests, packageManager: pm,
    hasClaude: fs.existsSync(path.join(root, 'CLAUDE.md')),
    hasCursor: fs.existsSync(path.join(root, '.cursorrules')),
    hasMcp: fs.existsSync(path.join(root, '.mcp.json')),
    hasAgents: fs.existsSync(path.join(root, 'AGENTS.md')),
    hasSkills: detectSkillsDir(root),
    confidence, ambiguities,
  }
}

function detectLanguage(m: string[]): string {
  if (m.includes('package.json')) return 'JavaScript/TypeScript'
  if (m.includes('pom.xml')) return 'Java'
  if (['requirements.txt', 'pyproject.toml', 'Pipfile'].some(f => m.includes(f))) return 'Python'
  if (m.includes('Cargo.toml')) return 'Rust'
  if (m.includes('go.mod')) return 'Go'
  if (m.includes('composer.json')) return 'PHP'
  if (m.includes('Gemfile')) return 'Ruby'
  return 'Unknown'
}

function detectPm(root: string): 'npm' | 'pnpm' | 'yarn' | 'unknown' {
  if (fs.existsSync(path.join(root, 'pnpm-lock.yaml'))) return 'pnpm'
  if (fs.existsSync(path.join(root, 'yarn.lock'))) return 'yarn'
  if (fs.existsSync(path.join(root, 'package-lock.json'))) return 'npm'
  return 'unknown'
}

function detectSkillsDir(root: string): boolean {
  const dir = path.join(root, '.claude', 'skills')
  try { return fs.existsSync(dir) && fs.readdirSync(dir).some((f) => f.endsWith('.md')) } catch { return false }
}

function readJson<T>(p: string): T | null {
  try { return JSON.parse(fs.readFileSync(p, 'utf-8')) as T } catch { return null }
}
function readText(p: string): string {
  try { return fs.readFileSync(p, 'utf-8').toLowerCase() } catch { return '' }
}
