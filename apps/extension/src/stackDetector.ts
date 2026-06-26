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

  // ── JavaScript / TypeScript ──────────────────────────────────────────────────
  if (foundManifests.includes('package.json')) {
    const pkg = readJson<{
      dependencies?: Record<string, string>
      devDependencies?: Record<string, string>
    }>(path.join(workspaceRoot, 'package.json'))
    const deps = { ...pkg?.dependencies, ...pkg?.devDependencies }

    // Meta-frameworks override their base UI library
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
      if (uiFrameworks.length > 1) {
        ambiguities.push(`Multiple UI frameworks detected: ${uiFrameworks.join(', ')}`)
      }
      frameworks.push(...uiFrameworks)
    }

    // Backend frameworks
    if (deps['@nestjs/core']) frameworks.push('NestJS')
    if (deps['express']) frameworks.push('Express')
    if (deps['fastify']) frameworks.push('Fastify')

    // Data layer
    if (deps['prisma'] || deps['@prisma/client']) frameworks.push('Prisma')
    if (deps['drizzle-orm']) frameworks.push('Drizzle')
    if (deps['graphql'] || deps['@apollo/server'] || deps['apollo-server'] || deps['@apollo/client']) {
      frameworks.push('GraphQL')
    }
    if (deps['@trpc/server'] || deps['@trpc/client']) frameworks.push('tRPC')

    // Infrastructure / tooling
    if (deps['firebase'] || deps['firebase-admin']) frameworks.push('Firebase')
    if (deps['tailwindcss']) frameworks.push('Tailwind CSS')
    // Vite only surfaced when not implied by a meta-framework
    if (deps['vite'] && !isNext && !isNuxt && !isSvelteKit && !isRemix && !isAstro) {
      frameworks.push('Vite')
    }

    // Test frameworks — detected to drive testing section content
    if (deps['vitest']) {
      frameworks.push('Vitest')
    } else if (deps['jest']) {
      frameworks.push('Jest')
    }
    if (deps['cypress']) frameworks.push('Cypress')
    if (deps['@playwright/test']) frameworks.push('Playwright')
    if (deps['@testing-library/react'] || deps['@testing-library/vue'] || deps['@testing-library/svelte']) {
      frameworks.push('Testing Library')
    }
  }

  // ── Python ───────────────────────────────────────────────────────────────────
  if (
    foundManifests.includes('requirements.txt') ||
    foundManifests.includes('pyproject.toml') ||
    foundManifests.includes('Pipfile')
  ) {
    const pythonContent = [
      foundManifests.includes('requirements.txt') ? readText(path.join(workspaceRoot, 'requirements.txt')) : '',
      foundManifests.includes('pyproject.toml') ? readText(path.join(workspaceRoot, 'pyproject.toml')) : '',
      foundManifests.includes('Pipfile') ? readText(path.join(workspaceRoot, 'Pipfile')) : '',
    ].join('\n')

    const pythonFrameworks: string[] = []
    if (pythonContent.includes('django')) pythonFrameworks.push('Django')
    if (pythonContent.includes('fastapi')) pythonFrameworks.push('FastAPI')
    if (pythonContent.includes('flask')) pythonFrameworks.push('Flask')
    if (pythonFrameworks.length > 1) {
      ambiguities.push(`Multiple Python frameworks: ${pythonFrameworks.join(', ')}`)
    }
    frameworks.push(...pythonFrameworks)
    if (pythonContent.includes('sqlalchemy')) frameworks.push('SQLAlchemy')
    if (pythonContent.includes('celery')) frameworks.push('Celery')
  }

  // ── Java / Kotlin ─────────────────────────────────────────────────────────
  const hasJvmManifest =
    foundManifests.includes('pom.xml') ||
    foundManifests.includes('build.gradle') ||
    foundManifests.includes('build.gradle.kts')
  if (hasJvmManifest) {
    const jvmContent = [
      foundManifests.includes('pom.xml') ? readText(path.join(workspaceRoot, 'pom.xml')) : '',
      foundManifests.includes('build.gradle') ? readText(path.join(workspaceRoot, 'build.gradle')) : '',
      foundManifests.includes('build.gradle.kts') ? readText(path.join(workspaceRoot, 'build.gradle.kts')) : '',
    ].join('\n')
    if (jvmContent.includes('spring-boot') || jvmContent.includes('org.springframework')) {
      frameworks.push('Spring Boot')
    }
    // Java backend + JS frontend is a common hybrid
    if (foundManifests.includes('package.json')) {
      ambiguities.push('JVM backend + JS frontend detected')
    }
  }

  // ── PHP ───────────────────────────────────────────────────────────────────
  if (foundManifests.includes('composer.json')) {
    const composer = readJson<{ require?: Record<string, string> }>(
      path.join(workspaceRoot, 'composer.json'),
    )
    const phpDeps = Object.keys(composer?.require ?? {})
    if (phpDeps.some((d) => d.startsWith('laravel/'))) {
      frameworks.push('Laravel')
    } else if (phpDeps.some((d) => d.startsWith('symfony/'))) {
      frameworks.push('Symfony')
    }
  }

  // ── Ruby ──────────────────────────────────────────────────────────────────
  if (foundManifests.includes('Gemfile')) {
    const gemContent = readText(path.join(workspaceRoot, 'Gemfile'))
    if (gemContent.includes("gem 'rails'") || gemContent.includes('gem "rails"')) {
      frameworks.push('Rails')
    }
  }

  // ── Flutter / Dart ────────────────────────────────────────────────────────
  if (foundManifests.includes('pubspec.yaml')) {
    const pubspec = readText(path.join(workspaceRoot, 'pubspec.yaml'))
    if (pubspec.includes('flutter:') || pubspec.includes('sdk: flutter')) {
      frameworks.push('Flutter')
    }
  }

  const language = detectLanguage(workspaceRoot, foundManifests)
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

function detectPackageManager(workspaceRoot: string): 'npm' | 'pnpm' | 'yarn' | 'unknown' {
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
