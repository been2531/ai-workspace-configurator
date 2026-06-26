import * as fs from 'fs'
import * as path from 'path'
import type { DetectedStack } from '@ai-workspace-configurator/core'

const MANIFESTS = [
  'package.json',
  'pom.xml',
  'build.gradle',
  'build.gradle.kts',
  'requirements.txt',
  'Pipfile',
  'pyproject.toml',
  'Cargo.toml',
  'go.mod',
  'composer.json',
  'Gemfile',
  'pubspec.yaml',
]

export function detectStack(root: string): DetectedStack {
  const foundManifests = MANIFESTS.filter((f) => fs.existsSync(path.join(root, f)))

  if (foundManifests.length === 0) {
    return {
      language: 'Unknown', frameworks: [], manifests: [],
      packageManager: 'unknown', hasClaude: false, hasCursor: false, hasCursorMdc: false,
      hasMcp: false, hasAgents: false, hasSkills: false, confidence: 'empty', ambiguities: [],
    }
  }

  const frameworks: string[] = []
  const ambiguities: string[] = []

  if (foundManifests.includes('package.json')) {
    const pkg = readJson<{ dependencies?: Record<string, string>; devDependencies?: Record<string, string> }>(
      path.join(root, 'package.json'),
    )
    const deps = { ...pkg?.dependencies, ...pkg?.devDependencies }

    const isNext = Boolean(deps['next'])
    const isNuxt = Boolean(deps['nuxt'])
    const isSvelteKit = Boolean(deps['@sveltejs/kit'])
    const isRemix = Boolean(deps['@remix-run/node'] || deps['@remix-run/react'])
    const isAstro = Boolean(deps['astro'])

    if (isNext) {
      frameworks.push('Next.js')
    } else if (isNuxt) {
      frameworks.push('Nuxt')
    } else if (isSvelteKit) {
      frameworks.push('SvelteKit')
    } else if (isRemix) {
      frameworks.push('Remix')
    } else {
      const ui: string[] = []
      if (deps['react']) ui.push('React')
      if (deps['vue'] || deps['vue3']) ui.push('Vue')
      if (deps['svelte']) ui.push('Svelte')
      if (isAstro) ui.push('Astro')
      if (ui.length > 1) ambiguities.push(`Multiple UI frameworks: ${ui.join(', ')}`)
      frameworks.push(...ui)
    }

    if (deps['@nestjs/core']) frameworks.push('NestJS')
    if (deps['express']) frameworks.push('Express')
    if (deps['fastify']) frameworks.push('Fastify')
    if (deps['prisma'] || deps['@prisma/client']) frameworks.push('Prisma')
    if (deps['drizzle-orm']) frameworks.push('Drizzle')
    if (deps['graphql'] || deps['@apollo/server'] || deps['apollo-server'] || deps['@apollo/client']) frameworks.push('GraphQL')
    if (deps['@trpc/server'] || deps['@trpc/client']) frameworks.push('tRPC')
    if (deps['firebase'] || deps['firebase-admin']) frameworks.push('Firebase')
    if (deps['tailwindcss']) frameworks.push('Tailwind CSS')
    if (deps['vite'] && !isNext && !isNuxt && !isSvelteKit && !isRemix && !isAstro) frameworks.push('Vite')
    if (deps['vitest']) frameworks.push('Vitest')
    else if (deps['jest']) frameworks.push('Jest')
    if (deps['cypress']) frameworks.push('Cypress')
    if (deps['@playwright/test']) frameworks.push('Playwright')
    if (deps['@testing-library/react'] || deps['@testing-library/vue'] || deps['@testing-library/svelte']) frameworks.push('Testing Library')
  }

  const pyFiles = ['requirements.txt', 'pyproject.toml', 'Pipfile'].filter((f) => foundManifests.includes(f))
  if (pyFiles.length) {
    const content = pyFiles.map((f) => readText(path.join(root, f))).join('\n')
    const pf: string[] = []
    if (content.includes('django')) pf.push('Django')
    if (content.includes('fastapi')) pf.push('FastAPI')
    if (content.includes('flask')) pf.push('Flask')
    if (pf.length > 1) ambiguities.push(`Multiple Python frameworks: ${pf.join(', ')}`)
    frameworks.push(...pf)
    if (content.includes('sqlalchemy')) frameworks.push('SQLAlchemy')
    if (content.includes('celery')) frameworks.push('Celery')
  }

  const hasJvm = foundManifests.includes('pom.xml') || foundManifests.includes('build.gradle') || foundManifests.includes('build.gradle.kts')
  if (hasJvm) {
    const jvmContent = [
      foundManifests.includes('pom.xml') ? readText(path.join(root, 'pom.xml')) : '',
      foundManifests.includes('build.gradle') ? readText(path.join(root, 'build.gradle')) : '',
      foundManifests.includes('build.gradle.kts') ? readText(path.join(root, 'build.gradle.kts')) : '',
    ].join('\n')
    if (jvmContent.includes('spring-boot') || jvmContent.includes('org.springframework')) frameworks.push('Spring Boot')
    if (foundManifests.includes('package.json')) ambiguities.push('JVM backend + JS frontend detected')
  }

  if (foundManifests.includes('composer.json')) {
    const composer = readJson<{ require?: Record<string, string> }>(path.join(root, 'composer.json'))
    const phpDeps = Object.keys(composer?.require ?? {})
    if (phpDeps.some((d) => d.startsWith('laravel/'))) frameworks.push('Laravel')
    else if (phpDeps.some((d) => d.startsWith('symfony/'))) frameworks.push('Symfony')
  }

  if (foundManifests.includes('Gemfile')) {
    const gemContent = readText(path.join(root, 'Gemfile'))
    if (gemContent.includes("gem 'rails'") || gemContent.includes('gem "rails"')) frameworks.push('Rails')
  }

  if (foundManifests.includes('pubspec.yaml')) {
    const pubspec = readText(path.join(root, 'pubspec.yaml'))
    if (pubspec.includes('flutter:') || pubspec.includes('sdk: flutter')) frameworks.push('Flutter')
  }

  const language = detectLanguage(root, foundManifests)
  const pm = detectPm(root)
  const confidence = ambiguities.length > 0 ? 'ambiguous' : frameworks.length > 0 ? 'certain' : 'ambiguous'

  return {
    language, frameworks, manifests: foundManifests, packageManager: pm,
    hasClaude: fs.existsSync(path.join(root, 'CLAUDE.md')),
    hasCursor: fs.existsSync(path.join(root, '.cursorrules')),
    hasCursorMdc: detectCursorMdcDir(root),
    hasMcp: fs.existsSync(path.join(root, '.mcp.json')),
    hasAgents: fs.existsSync(path.join(root, 'AGENTS.md')),
    hasSkills: detectSkillsDir(root),
    confidence, ambiguities,
  }
}

function detectLanguage(root: string, m: string[]): string {
  if (m.includes('pubspec.yaml')) return 'Dart'
  if (m.includes('build.gradle.kts')) return 'Kotlin'
  if (m.includes('package.json')) {
    return fs.existsSync(path.join(root, 'tsconfig.json')) ? 'TypeScript' : 'JavaScript'
  }
  if (m.includes('pom.xml') || m.includes('build.gradle')) return 'Java'
  if (['requirements.txt', 'pyproject.toml', 'Pipfile'].some((f) => m.includes(f))) return 'Python'
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

function detectCursorMdcDir(root: string): boolean {
  const dir = path.join(root, '.cursor', 'rules')
  try { return fs.existsSync(dir) && fs.readdirSync(dir).some((f) => f.endsWith('.mdc')) } catch { return false }
}

function readJson<T>(p: string): T | null {
  try { return JSON.parse(fs.readFileSync(p, 'utf-8')) as T } catch { return null }
}

function readText(p: string): string {
  try { return fs.readFileSync(p, 'utf-8').toLowerCase() } catch { return '' }
}
