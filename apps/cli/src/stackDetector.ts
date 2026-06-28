import * as fs from 'fs'
import * as path from 'path'
import type { DetectedStack } from '@ai-workspace-configurator/core'

const MANIFEST_FILES = [
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

export function detectStack(workspaceRoot: string): DetectedStack {
  const foundManifests: string[] = []
  for (const f of MANIFEST_FILES) {
    if (fs.existsSync(path.join(workspaceRoot, f))) foundManifests.push(f)
  }

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
    const pkg = readJson<{
      dependencies?: Record<string, string>
      devDependencies?: Record<string, string>
    }>(path.join(workspaceRoot, 'package.json'))
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
      const uiFrameworks: string[] = []
      if (deps['react']) uiFrameworks.push('React')
      if (deps['vue'] || deps['vue3']) uiFrameworks.push('Vue')
      if (deps['svelte']) uiFrameworks.push('Svelte')
      if (isAstro) uiFrameworks.push('Astro')
      if (uiFrameworks.length > 1) ambiguities.push(`Multiple UI frameworks: ${uiFrameworks.join(', ')}`)
      frameworks.push(...uiFrameworks)
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

  if (foundManifests.includes('requirements.txt') || foundManifests.includes('pyproject.toml') || foundManifests.includes('Pipfile')) {
    const content = ['requirements.txt', 'pyproject.toml', 'Pipfile']
      .filter((f) => foundManifests.includes(f))
      .map((f) => readText(path.join(workspaceRoot, f)))
      .join('\n')
    const pf: string[] = []
    if (content.includes('django')) pf.push('Django')
    if (content.includes('fastapi')) pf.push('FastAPI')
    if (content.includes('flask')) pf.push('Flask')
    if (pf.length > 1) ambiguities.push(`Multiple Python frameworks: ${pf.join(', ')}`)
    frameworks.push(...pf)
    if (content.includes('sqlalchemy')) frameworks.push('SQLAlchemy')
    if (content.includes('celery')) frameworks.push('Celery')
  }

  const hasJvmManifest = foundManifests.includes('pom.xml') || foundManifests.includes('build.gradle') || foundManifests.includes('build.gradle.kts')
  if (hasJvmManifest) {
    const jvmContent = [
      foundManifests.includes('pom.xml') ? readText(path.join(workspaceRoot, 'pom.xml')) : '',
      foundManifests.includes('build.gradle') ? readText(path.join(workspaceRoot, 'build.gradle')) : '',
      foundManifests.includes('build.gradle.kts') ? readText(path.join(workspaceRoot, 'build.gradle.kts')) : '',
    ].join('\n')
    if (jvmContent.includes('spring-boot') || jvmContent.includes('org.springframework')) frameworks.push('Spring Boot')
    if (foundManifests.includes('package.json')) ambiguities.push('JVM backend + JS frontend detected')
  }

  if (foundManifests.includes('composer.json')) {
    const composer = readJson<{ require?: Record<string, string> }>(path.join(workspaceRoot, 'composer.json'))
    const phpDeps = Object.keys(composer?.require ?? {})
    if (phpDeps.some((d) => d.startsWith('laravel/'))) frameworks.push('Laravel')
    else if (phpDeps.some((d) => d.startsWith('symfony/'))) frameworks.push('Symfony')
  }

  if (foundManifests.includes('Gemfile')) {
    const gemContent = readText(path.join(workspaceRoot, 'Gemfile'))
    if (gemContent.includes("gem 'rails'") || gemContent.includes('gem "rails"')) frameworks.push('Rails')
  }

  if (foundManifests.includes('pubspec.yaml')) {
    const pubspec = readText(path.join(workspaceRoot, 'pubspec.yaml'))
    if (pubspec.includes('flutter:') || pubspec.includes('sdk: flutter')) frameworks.push('Flutter')
  }

  const language = detectLanguage(workspaceRoot, foundManifests)
  const packageManager = detectPackageManager(workspaceRoot)
  const confidence = ambiguities.length > 0 ? 'ambiguous' : frameworks.length > 0 ? 'certain' : 'ambiguous'

  return {
    language, frameworks, manifests: foundManifests, packageManager,
    hasClaude: fs.existsSync(path.join(workspaceRoot, 'CLAUDE.md')),
    hasCursor: fs.existsSync(path.join(workspaceRoot, '.cursorrules')),
    hasCursorMdc: detectCursorMdcDir(workspaceRoot),
    hasMcp: fs.existsSync(path.join(workspaceRoot, '.mcp.json')),
    hasAgents: fs.existsSync(path.join(workspaceRoot, 'AGENTS.md')),
    hasSkills: detectSkillsDir(workspaceRoot),
    confidence, ambiguities,
  }
}

function detectLanguage(workspaceRoot: string, manifests: string[]): string {
  if (manifests.includes('pubspec.yaml')) return 'Dart'
  if (manifests.includes('build.gradle.kts')) return 'Kotlin'
  if (manifests.includes('package.json')) {
    return fs.existsSync(path.join(workspaceRoot, 'tsconfig.json')) ? 'TypeScript' : 'JavaScript'
  }
  if (manifests.includes('pom.xml') || manifests.includes('build.gradle')) return 'Java'
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
  try {
    if (!fs.existsSync(dir)) return false
    return fs.readdirSync(dir, { withFileTypes: true }).some(
      (e) =>
        (e.isDirectory() && fs.existsSync(path.join(dir, e.name, 'SKILL.md'))) ||
        (e.isFile() && e.name.endsWith('.md')),
    )
  } catch { return false }
}

function detectCursorMdcDir(root: string): boolean {
  const dir = path.join(root, '.cursor', 'rules')
  try { return fs.existsSync(dir) && fs.readdirSync(dir).some((f) => f.endsWith('.mdc')) } catch { return false }
}

function readJson<T>(filePath: string): T | null {
  try { return JSON.parse(fs.readFileSync(filePath, 'utf-8')) as T } catch { return null }
}

function readText(filePath: string): string {
  try { return fs.readFileSync(filePath, 'utf-8').toLowerCase() } catch { return '' }
}
