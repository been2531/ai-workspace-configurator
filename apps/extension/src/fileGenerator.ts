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
  fileSelection?: { mcp?: boolean; skills?: boolean; hooks?: boolean },
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

  // Write .claude/skills/ only if the directory does not already exist and not skipped
  if (!stack.hasSkills && Object.keys(rules.skills).length > 0 && fileSelection?.skills !== false) {
    const skillsDir = path.join(workspaceRoot, '.claude', 'skills')
    try {
      fs.mkdirSync(skillsDir, { recursive: true })
      for (const [name, content] of Object.entries(rules.skills)) {
        fs.writeFileSync(path.join(skillsDir, `${name}.md`), content, 'utf-8')
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

  return {
    claudeMd: rules.claudeMd,
    agentsMd: rules.agentsMd,
    cursorRules: rules.cursorRules,
    cursorMdc: rules.cursorMdc,
    mcpConfig: mcpJson,
    skills: rules.skills,
    previous,
  }
}

function buildHooksConfig(stack: DetectedStack): string {
  const isJs = stack.manifests.includes('package.json')

  const hooks: Record<string, unknown[]> = {
    PreToolUse: [
      {
        matcher: 'Bash',
        hooks: [
          {
            type: 'command',
            // exit 2 blocks the command; output is forwarded to Claude
            command: 'cmd="$CLAUDE_TOOL_INPUT_COMMAND"; echo "$cmd" | grep -qE \'rm\\s+-[rRfF]*rf|rm\\s+-[rRfF]*f[rRfF]\' && { echo "Blocked: rm -rf detected. Use explicit paths or confirm with user."; exit 2; }; exit 0',
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
            // auto-fix lint errors after every file write; fails silently if eslint is absent
            command: '[ -f "$(pwd)/node_modules/.bin/eslint" ] && npx eslint --fix "$CLAUDE_TOOL_INPUT_FILE" 2>/dev/null; exit 0',
          },
        ],
      },
    ]
  }

  return JSON.stringify({ hooks }, null, 2)
}
