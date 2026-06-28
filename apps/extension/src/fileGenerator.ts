import * as fs from 'fs'
import * as path from 'path'
import { composeRules } from '@ai-workspace-configurator/core'
import type {
  DetectedStack,
  UserProfile,
  CommunityPreset,
  GeneratedPreview,
} from '@ai-workspace-configurator/core'

function readSafe(filePath: string): string {
  try { return fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf-8') : '' } catch { return '' }
}

export async function generateWorkspaceFiles(
  workspaceRoot: string,
  stack: DetectedStack,
  profile?: UserProfile,
  preset?: CommunityPreset,
  fileSelection?: { mcp?: boolean; skills?: boolean; hooks?: boolean; subPackages?: boolean },
): Promise<GeneratedPreview> {
  const previous = {
    claudeMd:   readSafe(path.join(workspaceRoot, 'CLAUDE.md')),
    agentsMd:   readSafe(path.join(workspaceRoot, 'AGENTS.md')),
    cursorRules: readSafe(path.join(workspaceRoot, '.cursorrules')),
    mcpConfig:  readSafe(path.join(workspaceRoot, '.mcp.json')),
  }

  const rules = composeRules({ stack, profile, preset })
  const mcpJson = JSON.stringify(rules.mcpConfig, null, 2)

  const writes: Array<{ file: string; content: string; skip?: boolean }> = [
    { file: 'CLAUDE.md', content: rules.claudeMd, skip: stack.hasClaude },
    { file: '.cursorrules', content: rules.cursorRules, skip: profile?.tools?.cursor !== true },
    { file: 'AGENTS.md', content: rules.agentsMd, skip: stack.hasAgents },
    { file: '.mcp.json', content: mcpJson, skip: stack.hasMcp || fileSelection?.mcp === false },
  ]

  for (const { file, content, skip } of writes) {
    if (skip) continue
    try {
      fs.writeFileSync(path.join(workspaceRoot, file), content, 'utf-8')
    } catch (err) {
      throw new Error(`Failed to write ${file}: ${err instanceof Error ? err.message : String(err)}`)
    }
  }

  // Write .cursor/rules/project.mdc (Cursor's new format, replaces .cursorrules)
  if (profile?.tools?.cursor === true && !stack.hasCursorMdc) {
    const cursorRulesDir = path.join(workspaceRoot, '.cursor', 'rules')
    try {
      fs.mkdirSync(cursorRulesDir, { recursive: true })
      fs.writeFileSync(path.join(cursorRulesDir, 'project.mdc'), rules.cursorMdc, 'utf-8')
    } catch (err) {
      throw new Error(`Failed to write .cursor/rules/project.mdc: ${err instanceof Error ? err.message : String(err)}`)
    }
  }

  // Write .claude/skills/<name>/SKILL.md — Agent Skills open-standard layout
  // (https://code.claude.com/docs/en/skills). Skipped if a skills dir already exists.
  if (!stack.hasSkills && Object.keys(rules.skills).length > 0 && fileSelection?.skills !== false) {
    const skillsDir = path.join(workspaceRoot, '.claude', 'skills')
    try {
      for (const [name, content] of Object.entries(rules.skills)) {
        const dir = path.join(skillsDir, name)
        fs.mkdirSync(dir, { recursive: true })
        fs.writeFileSync(path.join(dir, 'SKILL.md'), content, 'utf-8')
      }
    } catch (err) {
      throw new Error(`Failed to write skills: ${err instanceof Error ? err.message : String(err)}`)
    }
  }

  // Write .claude/settings.json (hooks template) if selected and not already present
  const settingsPath = path.join(workspaceRoot, '.claude', 'settings.json')
  if (fileSelection?.hooks !== false && !fs.existsSync(settingsPath)) {
    try {
      fs.mkdirSync(path.join(workspaceRoot, '.claude'), { recursive: true })
      fs.writeFileSync(settingsPath, buildHooksConfig(stack), 'utf-8')
    } catch (err) {
      throw new Error(`Failed to write .claude/settings.json: ${err instanceof Error ? err.message : String(err)}`)
    }
  }

  // Write per-package CLAUDE.md for monorepo sub-packages
  if (stack.isMonorepo && fileSelection?.subPackages !== false && stack.subPackages?.length) {
    for (const pkg of stack.subPackages) {
      const pkgRoot = path.join(workspaceRoot, pkg.relativePath)
      const pkgClaudePath = path.join(pkgRoot, 'CLAUDE.md')
      if (fs.existsSync(pkgClaudePath)) continue
      try {
        const fw = pkg.frameworks.join(', ') || 'N/A'
        const pm = stack.packageManager === 'unknown' ? 'npm' : stack.packageManager
        const content = [
          `# ${pkg.name}`,
          '',
          `> See root \`CLAUDE.md\` for project-wide coding rules.`,
          '',
          `## Tech Stack`,
          `- Language: ${pkg.language}`,
          `- Framework: ${fw}`,
          '',
          `## Build Commands`,
          '```bash',
          `${pm} run dev      # development server`,
          `${pm} run build    # production build`,
          `${pm} test         # test suite`,
          '```',
        ].join('\n')
        fs.writeFileSync(pkgClaudePath, content, 'utf-8')
      } catch {
        // Skip packages we can't write to
      }
    }
  }

  return {
    claudeMd: rules.claudeMd,
    agentsMd: rules.agentsMd,
    cursorRules: rules.cursorRules,
    cursorMdc: rules.cursorMdc,
    mcpConfig: mcpJson,
    skills: rules.skills,
    claudeMdLineCount: rules.claudeMd.split('\n').length,
    previous,
  }
}

function buildHooksConfig(stack: DetectedStack): string {
  const isJs = stack.manifests.includes('package.json')

  // Claude Code passes hook input as JSON on stdin (NOT env vars) — read it with jq.
  // https://code.claude.com/docs/en/hooks. If jq is missing, the var resolves empty
  // and the hook safely no-ops (does not block).
  const hooks: Record<string, unknown[]> = {
    PreToolUse: [
      {
        matcher: 'Bash',
        hooks: [
          {
            type: 'command',
            // exit 2 blocks the command and forwards stderr to Claude
            command: 'command=$(jq -r ".tool_input.command // empty" < /dev/stdin 2>/dev/null); printf "%s" "$command" | grep -qE "rm[[:space:]]+-[a-zA-Z]*[rf]" && { echo "Blocked: destructive rm detected. Use an explicit path, or confirm with the user." >&2; exit 2; }; exit 0',
          },
        ],
      },
    ],
  }

  if (isJs) {
    hooks.PostToolUse = [
      {
        matcher: 'Edit|Write|MultiEdit',
        hooks: [
          {
            type: 'command',
            // auto-fix lint errors after every file write; no-ops if jq or eslint is absent
            command: 'file=$(jq -r ".tool_input.file_path // empty" < /dev/stdin 2>/dev/null); [ -n "$file" ] && [ -x "$(pwd)/node_modules/.bin/eslint" ] && npx eslint --fix "$file" 2>/dev/null; exit 0',
          },
        ],
      },
    ]
  }

  return JSON.stringify({ hooks }, null, 2)
}
