import type { ComposeInput, GeneratedRules } from '../types'
import { buildClaudeMd } from './buildClaudeMd'
import { buildAgentsMd } from './buildAgentsMd'
import { buildCursorRules } from './buildCursorRules'
import { buildMcpConfig } from './buildMcpConfig'
import { buildSkills } from './buildSkills'

export function composeRules(input: ComposeInput): GeneratedRules {
  const base: GeneratedRules = {
    claudeMd: buildClaudeMd(input),
    agentsMd: buildAgentsMd(input),
    cursorRules: buildCursorRules(input),
    mcpConfig: buildMcpConfig(input),
    skills: buildSkills(input),
  }

  if (!input.preset) return base

  const { overrides } = input.preset
  return {
    claudeMd: overrides.claudeMd ?? base.claudeMd,
    agentsMd: overrides.agentsMd ?? base.agentsMd,
    cursorRules: overrides.cursorRules ?? base.cursorRules,
    mcpConfig: overrides.mcpServers
      ? { mcpServers: { ...base.mcpConfig.mcpServers, ...overrides.mcpServers } }
      : base.mcpConfig,
    skills: base.skills,
  }
}

export { composeRules as generateRules }
