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

  const frameworks: string[] = []
  const language = detectLanguage(foundManifests)

  if (foundManifests.includes('package.json')) {
    const pkg = readJson<{ dependencies?: Record<string, string>; devDependencies?: Record<string, string> }>(
      path.join(workspaceRoot, 'package.json'),
    )
    const deps = { ...pkg?.dependencies, ...pkg?.devDependencies }
    if (deps['react']) frameworks.push('React')
    if (deps['next']) frameworks.push('Next.js')
    if (deps['vue']) frameworks.push('Vue')
    if (deps['svelte']) frameworks.push('Svelte')
    if (deps['express']) frameworks.push('Express')
    if (deps['fastify']) frameworks.push('Fastify')
    if (deps['vite']) frameworks.push('Vite')
    if (deps['typescript'] || deps['ts-node']) frameworks.push('TypeScript')
    if (deps['tailwindcss']) frameworks.push('Tailwind CSS')
    if (deps['firebase']) frameworks.push('Firebase')
    if (deps['prisma'] || deps['@prisma/client']) frameworks.push('Prisma')
  }

  if (foundManifests.includes('requirements.txt') || foundManifests.includes('pyproject.toml')) {
    const content = readText(path.join(workspaceRoot, foundManifests.includes('requirements.txt') ? 'requirements.txt' : 'pyproject.toml'))
    if (content.includes('django')) frameworks.push('Django')
    if (content.includes('fastapi')) frameworks.push('FastAPI')
    if (content.includes('flask')) frameworks.push('Flask')
  }

  const hasClaude = fs.existsSync(path.join(workspaceRoot, 'CLAUDE.md'))
  const hasCursor = fs.existsSync(path.join(workspaceRoot, '.cursorrules'))
  const hasMcp = fs.existsSync(path.join(workspaceRoot, '.mcp.json'))

  return { language, frameworks, manifests: foundManifests, hasClaude, hasCursor, hasMcp }
}

function detectLanguage(manifests: string[]): string {
  if (manifests.includes('package.json')) return 'JavaScript/TypeScript'
  if (manifests.includes('pom.xml')) return 'Java'
  if (manifests.includes('requirements.txt') || manifests.includes('pyproject.toml') || manifests.includes('Pipfile')) return 'Python'
  if (manifests.includes('Cargo.toml')) return 'Rust'
  if (manifests.includes('go.mod')) return 'Go'
  if (manifests.includes('composer.json')) return 'PHP'
  if (manifests.includes('Gemfile')) return 'Ruby'
  return 'Unknown'
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
