import * as fs from 'fs'
import * as path from 'path'
import { composeRules } from '@ai-workspace-configurator/core'
import type {
  DetectedStack,
  UserProfile,
  CommunityPreset,
  GeneratedPreview,
} from '@ai-workspace-configurator/core'

export async function generateWorkspaceFiles(
  workspaceRoot: string,
  stack: DetectedStack,
  profile?: UserProfile,
  preset?: CommunityPreset,
): Promise<GeneratedPreview> {
  const rules = composeRules({ stack, profile, preset })
  const mcpJson = JSON.stringify(rules.mcpConfig, null, 2)

  const writes: Array<{ file: string; content: string; skip?: boolean }> = [
    { file: 'CLAUDE.md', content: rules.claudeMd, skip: stack.hasClaude },
    { file: '.cursorrules', content: rules.cursorRules, skip: profile?.tools?.cursor !== true },
    { file: 'AGENTS.md', content: rules.agentsMd, skip: stack.hasAgents },
    { file: '.mcp.json', content: mcpJson, skip: stack.hasMcp },
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

  // Write .claude/skills/ only if the directory does not already exist
  if (!stack.hasSkills && Object.keys(rules.skills).length > 0) {
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

  return {
    claudeMd: rules.claudeMd,
    agentsMd: rules.agentsMd,
    cursorRules: rules.cursorRules,
    cursorMdc: rules.cursorMdc,
    mcpConfig: mcpJson,
    skills: rules.skills,
  }
}
