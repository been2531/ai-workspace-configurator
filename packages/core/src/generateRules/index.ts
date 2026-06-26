import type { ComposeInput, GeneratedRules } from '../types'
import { buildClaudeMd } from './buildClaudeMd'
import { buildAgentsMd } from './buildAgentsMd'
import { buildCursorRules } from './buildCursorRules'
import { buildMcpConfig } from './buildMcpConfig'
import { buildSkills } from './buildSkills'

export function composeRules(input: ComposeInput): GeneratedRules {
  const { stack } = input
  const cursorRules = buildCursorRules(input)
  const stackLabel = `${stack.language}${stack.frameworks.length ? ` / ${stack.frameworks.join(', ')}` : ''}`
  const cursorMdc = `---\ndescription: AI Workspace rules for ${stackLabel}\nglobs:\nalwaysApply: true\n---\n\n${cursorRules}`

  const base: GeneratedRules = {
    claudeMd: buildClaudeMd(input),
    agentsMd: buildAgentsMd(input),
    cursorRules,
    cursorMdc,
    mcpConfig: buildMcpConfig(input),
    skills: buildSkills(input),
  }

  if (!input.preset) return base

  const { overrides } = input.preset
  const mergedCursorRules = overrides.cursorRules ?? base.cursorRules
  const mergedCursorMdc = overrides.cursorRules
    ? `---\ndescription: AI Workspace rules for ${stackLabel}\nglobs:\nalwaysApply: true\n---\n\n${overrides.cursorRules}`
    : base.cursorMdc
  return {
    claudeMd: overrides.claudeMd ?? base.claudeMd,
    agentsMd: overrides.agentsMd ?? base.agentsMd,
    cursorRules: mergedCursorRules,
    cursorMdc: mergedCursorMdc,
    mcpConfig: overrides.mcpServers
      ? { mcpServers: { ...base.mcpConfig.mcpServers, ...overrides.mcpServers } }
      : base.mcpConfig,
    skills: base.skills,
  }
}

export { composeRules as generateRules }
