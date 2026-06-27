import type { CommunityPreset, PresetSummary } from '@ai-workspace-configurator/core'

// ─── Built-in Presets ─────────────────────────────────────────────────────────

export const BUNDLED_PRESETS: CommunityPreset[] = [
  {
    id: 'karpathy/agent-os',
    name: 'Karpathy Agent OS',
    author: 'karpathy',
    description: 'Inspired by Andrej Karpathy\'s LLM OS concept. Adds structured <think> pre-reasoning blocks and a 4-tier agent hierarchy to AGENTS.md.',
    tags: ['claude-code', 'multi-agent', 'reasoning'],
    publishedAt: '2025-06-01',
    overrides: {
      agentsMd: `# AGENTS.md — Karpathy Agent OS

## LLM OS Pre-Reasoning Protocol

Before every task, reason step-by-step:

<think>
1. What is the purpose of this change?
2. Which parts of the system are affected?
3. What could go wrong?
4. What is the minimal change to achieve the goal?
</think>

## Agent Hierarchy

| Layer | Role |
|-------|------|
| System Agent | Architecture decisions, defines invariants |
| Planner | Requirements → implementation plan |
| Implementer | Plan → code |
| Critic | Code → review and feedback |

## Absolute Prohibitions

- No code omission (\`// ...\`, \`// rest\`) ever
- No large-scale changes without a plan
- No type assertions (\`as any\`)
`,
    },
  },
  {
    id: 'minimal',
    name: 'Minimal',
    author: 'built-in',
    description: 'Bare-minimum AGENTS.md for maximum agent autonomy. Three rules: implement directly if clear, ask one question if not, report concisely.',
    tags: ['minimal', 'autonomous'],
    publishedAt: '2025-06-01',
    overrides: {
      agentsMd: `# AGENTS.md\n\n## Principles\n- If clear, implement directly.\n- If unclear, ask one core question.\n- Report concisely after completion.\n`,
    },
  },
  {
    id: 'strict-typescript',
    name: 'Strict TypeScript',
    author: 'built-in',
    description: 'Overrides CLAUDE.md with strict TypeScript rules: no `any`, discriminated union errors, Result<T,E> pattern, pure functions first.',
    tags: ['typescript', 'strict', 'type-safety'],
    publishedAt: '2025-06-01',
    overrides: {
      claudeMd: `# Project Guidelines

## Code Rules

### Typing
- No \`any\` anywhere — use \`unknown\` + type narrowing.
- No type assertions (\`as X\`) except at boundaries with explicit comments.
- All function parameters and return types must be explicitly typed.
- Prefer \`readonly\` arrays and object properties.

### Error Handling
- Never swallow errors silently — always log or rethrow.
- Use discriminated unions for error states, not \`throw\` in business logic.
- \`Result<T, E>\` pattern preferred over exceptions.

### Paradigm
- Pure functions first. Side-effects isolated at system boundaries.
- No global mutable state.

### Security
- API keys in environment variables only. Never hardcode.
- Validate all user input at system boundaries.
`,
    },
  },
]

// ─── GitHub Presets ───────────────────────────────────────────────────────────

interface GitHubRepo {
  full_name: string
  name: string
  owner: { login: string }
  description: string | null
  stargazers_count: number
  topics: string[]
  html_url: string
}

interface GitHubFileContent {
  content: string
  encoding: string
}

const GITHUB_API = 'https://api.github.com'
const CACHE_TTL = 60 * 60 * 1000 // 1 hour

let githubCache: { presets: PresetSummary[]; time: number } | null = null

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toBuiltInSummary(preset: CommunityPreset): PresetSummary {
  return {
    id: preset.id,
    name: preset.name,
    author: preset.author,
    description: preset.description,
    tags: preset.tags,
    stars: 0,
    isBuiltIn: true,
    publishedAt: preset.publishedAt,
    overrideKeys: Object.keys(preset.overrides),
  }
}

function repoToSummary(repo: GitHubRepo): PresetSummary {
  return {
    id: `github:${repo.full_name}`,
    name: repo.name.replace(/[-_]/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
    author: repo.owner.login,
    description: repo.description ?? '',
    tags: (repo.topics ?? []).slice(0, 5),
    stars: repo.stargazers_count,
    isBuiltIn: false,
    githubUrl: repo.html_url,
    overrideKeys: [],
  }
}

async function githubFetch(path: string): Promise<Response> {
  return fetch(`${GITHUB_API}${path}`, {
    headers: {
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'ai-workspace-configurator-vscode',
    },
  })
}

// ─── Search ───────────────────────────────────────────────────────────────────

export async function searchPresets(queryStr: string): Promise<PresetSummary[]> {
  const bundled = BUNDLED_PRESETS.map(toBuiltInSummary)
  const github = await fetchGitHubPresets(queryStr.trim())
  return [...bundled, ...github]
}

async function fetchGitHubPresets(query: string): Promise<PresetSummary[]> {
  if (!query && githubCache && Date.now() - githubCache.time < CACHE_TTL) {
    return githubCache.presets
  }

  try {
    const q = query
      ? `${query} topic:cursorrules OR topic:claude-code OR topic:ai-rules`
      : 'topic:cursorrules OR topic:claude-code OR topic:ai-rules stars:>5'

    const res = await githubFetch(
      `/search/repositories?q=${encodeURIComponent(q)}&sort=stars&order=desc&per_page=20`,
    )

    if (!res.ok) return []

    const data = await res.json() as { items: GitHubRepo[] }
    const presets = data.items.map(repoToSummary)

    if (!query) {
      githubCache = { presets, time: Date.now() }
    }

    return presets
  } catch {
    return []
  }
}

// ─── Load single preset ───────────────────────────────────────────────────────

export async function loadPreset(presetId: string): Promise<CommunityPreset | null> {
  const bundled = BUNDLED_PRESETS.find((p) => p.id === presetId)
  if (bundled) return bundled

  if (presetId.startsWith('github:')) {
    return loadGitHubPreset(presetId.slice('github:'.length))
  }

  return null
}

async function loadGitHubPreset(fullName: string): Promise<CommunityPreset | null> {
  const slashIdx = fullName.indexOf('/')
  if (slashIdx === -1) return null
  const owner = fullName.slice(0, slashIdx)
  const repo = fullName.slice(slashIdx + 1)

  const [cursorRules, claudeMd, agentsMd] = await Promise.all([
    fetchFileContent(owner, repo, '.cursorrules'),
    fetchFileContent(owner, repo, 'CLAUDE.md'),
    fetchFileContent(owner, repo, 'AGENTS.md'),
  ])

  const overrides: CommunityPreset['overrides'] = {}
  if (cursorRules) overrides.cursorRules = cursorRules
  if (claudeMd) overrides.claudeMd = claudeMd
  if (agentsMd) overrides.agentsMd = agentsMd

  if (Object.keys(overrides).length === 0) return null

  return {
    id: `github:${fullName}`,
    name: repo,
    author: owner,
    description: '',
    tags: [],
    overrides,
  }
}

async function fetchFileContent(owner: string, repo: string, filePath: string): Promise<string | null> {
  try {
    const res = await githubFetch(`/repos/${owner}/${repo}/contents/${filePath}`)
    if (!res.ok) return null
    const data = await res.json() as GitHubFileContent
    if (data.encoding !== 'base64') return null
    return Buffer.from(data.content.replace(/\n/g, ''), 'base64').toString('utf-8')
  } catch {
    return null
  }
}
