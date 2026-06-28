import type { Locale } from './i18n'
export type { Locale }

// ─── Stack Detection ────────────────────────────────────────────────────────

export interface SubPackage {
  name: string
  relativePath: string
  frameworks: string[]
  language: string
}

export interface DetectedStack {
  language: string
  frameworks: string[]
  manifests: string[]
  packageManager: 'npm' | 'pnpm' | 'yarn' | 'bun' | 'unknown'
  hasClaude: boolean
  hasCursor: boolean
  hasCursorMdc: boolean
  hasMcp: boolean
  hasAgents: boolean
  hasSkills: boolean
  confidence: 'certain' | 'ambiguous' | 'empty'
  ambiguities: string[]
  description?: string
  isMonorepo?: boolean
  subPackages?: SubPackage[]
}

// ─── User Profile ────────────────────────────────────────────────────────────

export interface UserProfile {
  version: string
  locale: Locale
  generatedLocale: Locale
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
  tools?: {
    cursor: boolean
  }
  mcpDefaults: string[]
  basePreset?: string
}

export const DEFAULT_PROFILE: UserProfile = {
  version: '1',
  locale: 'en',
  generatedLocale: 'en',
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
  tools: { cursor: false },
  mcpDefaults: ['filesystem', 'git'],
}

// ─── Community Preset ────────────────────────────────────────────────────────

export interface CommunityPreset {
  id: string
  name: string
  author: string
  description: string
  tags: string[]
  publishedAt?: string
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
  cursorMdc: string
  mcpConfig: McpConfig
  skills: Record<string, string>
}

// ─── MCP ────────────────────────────────────────────────────────────────────

export interface McpConfig {
  mcpServers: Record<string, McpServer>
}

export interface McpServer {
  command: string
  args: readonly string[]
  env?: Readonly<Record<string, string>>
}

// ─── CLI Prompts ────────────────────────────────────────────────────────────

export interface StackChoice {
  primaryFramework: string
  hasSeparateFrontend?: boolean
  frontendFramework?: string
}

// ─── Community Preset Summary (for webview display) ─────────────────────────

export interface PresetSummary {
  id: string
  name: string
  author: string
  description: string
  tags: string[]
  stars: number
  isBuiltIn: boolean
  githubUrl?: string
  overrideKeys: string[]
  publishedAt?: string
}

// ─── Webview ↔ Extension Messages ──────────────────────────────────────────

export interface FileStatus {
  claude: boolean
  agents: boolean
  cursor: boolean
  mcp: boolean
  skills: boolean
  hooks: boolean
  isMonorepo?: boolean
}

export interface GeneratedPreview {
  claudeMd: string
  agentsMd: string
  cursorRules: string
  cursorMdc: string
  mcpConfig: string
  skills: Record<string, string>
  claudeMdLineCount: number
  previous: {
    claudeMd: string
    agentsMd: string
    cursorRules: string
    mcpConfig: string
  }
}

// ─── Stack Summary (for init payload) ───────────────────────────────────────

export interface StackSummary {
  language: string
  frameworks: string[]
  packageManager: 'npm' | 'pnpm' | 'yarn' | 'bun' | 'unknown'
  isMonorepo: boolean
}

// Extension → Webview
export type ExtensionMessage =
  | { type: 'init'; payload: { profile: UserProfile; fileStatus: FileStatus; selectedPreset: { id: string; name: string } | null; stackSummary?: StackSummary } }
  | { type: 'configured'; payload: { success: true; fileStatus: FileStatus; preview: GeneratedPreview } }
  | { type: 'configured'; payload: { success: false; error: string } }
  | { type: 'presetsResult'; payload: PresetSummary[] }
  | { type: 'presetApplied'; payload: { id: string; name: string; overrideKeys: string[] } | null }

// Webview → Extension
export type WebviewMessage =
  | { command: 'ready' }
  | { command: 'configure'; fileSelection?: { mcp: boolean; skills: boolean; hooks: boolean; subPackages?: boolean } }
  | { command: 'saveProfile'; payload: UserProfile }
  | { command: 'exportProfile' }
  | { command: 'importProfile' }
  | { command: 'searchPresets'; query: string }
  | { command: 'selectPreset'; presetId: string | null }
  | { command: 'openUrl'; url: string }
