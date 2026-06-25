import type { ComposeInput, GeneratedRules } from '../types'
import { buildClaudeMd } from './buildClaudeMd'
import { buildAgentsMd } from './buildAgentsMd'
import { buildCursorRules } from './buildCursorRules'
import { buildMcpConfig } from './buildMcpConfig'

export function composeRules(input: ComposeInput): GeneratedRules {
  const base: GeneratedRules = {
    claudeMd: buildClaudeMd(input),
    agentsMd: buildAgentsMd(input),
    cursorRules: buildCursorRules(input),
    mcpConfig: buildMcpConfig(input),
  }

  // Layer 3: 커뮤니티 프리셋이 있으면 override
  if (!input.preset) return base

  const { overrides } = input.preset
  return {
    claudeMd: overrides.claudeMd ?? base.claudeMd,
    agentsMd: overrides.agentsMd ?? base.agentsMd,
    cursorRules: overrides.cursorRules ?? base.cursorRules,
    mcpConfig: overrides.mcpServers
      ? { mcpServers: { ...base.mcpConfig.mcpServers, ...overrides.mcpServers } }
      : base.mcpConfig,
  }
}

// 하위 호환 — extension의 기존 코드가 generateRules를 쓰고 있으므로 유지
export { composeRules as generateRules }
