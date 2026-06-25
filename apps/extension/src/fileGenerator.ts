import * as fs from 'fs'
import * as path from 'path'
import { composeRules } from '@ai-workspace-configurator/core'
import type { DetectedStack, UserProfile, CommunityPreset } from '@ai-workspace-configurator/core'

export async function generateWorkspaceFiles(
  workspaceRoot: string,
  stack: DetectedStack,
  profile?: UserProfile,
  preset?: CommunityPreset,
): Promise<void> {
  const rules = composeRules({ stack, profile, preset })

  const writes: Array<{ file: string; content: string; skip?: boolean }> = [
    { file: 'CLAUDE.md', content: rules.claudeMd, skip: stack.hasClaude },
    { file: '.cursorrules', content: rules.cursorRules, skip: stack.hasCursor },
    { file: 'AGENTS.md', content: rules.agentsMd, skip: stack.hasAgents },
    { file: '.mcp.json', content: JSON.stringify(rules.mcpConfig, null, 2), skip: stack.hasMcp },
  ]

  for (const { file, content, skip } of writes) {
    if (skip) continue
    fs.writeFileSync(path.join(workspaceRoot, file), content, 'utf-8')
  }
}
