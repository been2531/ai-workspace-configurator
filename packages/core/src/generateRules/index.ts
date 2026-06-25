import type { DetectedStack, GeneratedRules } from '../types'
import { buildClaudeMd } from './buildClaudeMd'
import { buildAgentsMd } from './buildAgentsMd'
import { buildCursorRules } from './buildCursorRules'
import { buildMcpConfig } from './buildMcpConfig'

export function generateRules(stack: DetectedStack): GeneratedRules {
  return {
    claudeMd: buildClaudeMd(stack),
    agentsMd: buildAgentsMd(stack),
    cursorRules: buildCursorRules(stack),
    mcpConfig: buildMcpConfig(stack),
  }
}
