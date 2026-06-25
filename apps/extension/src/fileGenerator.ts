import * as fs from 'fs'
import * as path from 'path'
import { generateRules } from '@ai-workspace-configurator/core'
import type { DetectedStack } from '@ai-workspace-configurator/core'

export async function generateWorkspaceFiles(workspaceRoot: string, stack: DetectedStack): Promise<void> {
  const rules = generateRules(stack)

  const writes: Array<{ file: string; content: string; skip?: boolean }> = [
    { file: 'CLAUDE.md', content: rules.claudeMd, skip: stack.hasClaude },
    { file: '.cursorrules', content: rules.cursorRules },
    { file: 'AGENTS.md', content: rules.agentsMd },
    { file: '.mcp.json', content: JSON.stringify(rules.mcpConfig, null, 2), skip: stack.hasMcp },
  ]

  for (const { file, content, skip } of writes) {
    if (skip) continue
    fs.writeFileSync(path.join(workspaceRoot, file), content, 'utf-8')
  }
}
