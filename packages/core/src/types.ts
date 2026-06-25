// ─── Stack Detection ────────────────────────────────────────────────────────

export interface DetectedStack {
  language: string
  frameworks: string[]
  manifests: string[]
  packageManager: 'npm' | 'pnpm' | 'yarn' | 'unknown'
  hasClaude: boolean
  hasCursor: boolean
  hasMcp: boolean
  hasAgents: boolean
  confidence: 'certain' | 'ambiguous' | 'empty'
  ambiguities: string[]
}

// ─── User Profile ────────────────────────────────────────────────────────────

export interface UserProfile {
  version: string
  codingStyle: {
    typeStrictness: 'strict' | 'moderate' | 'loose'
    paradigm: 'functional' | 'oop' | 'mixed'
    commentStyle: 'minimal' | 'jsdoc' | 'none'
  }
  agentMode: {
    preReasoning: boolean
    codeOmissionGuard: boolean
    autonomyLevel: 'ask-first' | 'proceed' | 'autonomous'
  }
  mcpDefaults: string[]
  basePreset?: string
}

export const DEFAULT_PROFILE: UserProfile = {
  version: '1',
  codingStyle: {
    typeStrictness: 'strict',
    paradigm: 'functional',
    commentStyle: 'minimal',
  },
  agentMode: {
    preReasoning: true,
    codeOmissionGuard: true,
    autonomyLevel: 'proceed',
  },
  mcpDefaults: ['filesystem', 'git'],
}

// ─── Community Preset ────────────────────────────────────────────────────────

export interface CommunityPreset {
  id: string
  name: string
  author: string
  description: string
  tags: string[]
  overrides: Partial<{
    claudeMd: string
    agentsMd: string
    cursorRules: string
    mcpServers: Record<string, McpServer>
  }>
}

// ─── Compose Input ───────────────────────────────────────────────────────────

export interface ComposeInput {
  stack: DetectedStack
  profile?: UserProfile
  preset?: CommunityPreset
}

// ─── Generated Output ────────────────────────────────────────────────────────

export interface GeneratedRules {
  claudeMd: string
  agentsMd: string
  cursorRules: string
  mcpConfig: McpConfig
}

// ─── MCP ────────────────────────────────────────────────────────────────────

export interface McpConfig {
  mcpServers: Record<string, McpServer>
}

export interface McpServer {
  command: string
  args: readonly string[]
  env?: Record<string, string>
}

// ─── CLI Prompts ────────────────────────────────────────────────────────────

export interface StackChoice {
  primaryFramework: string
  hasSeparateFrontend?: boolean
  frontendFramework?: string
}
