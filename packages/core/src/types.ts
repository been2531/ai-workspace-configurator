export interface DetectedStack {
  language: string
  frameworks: string[]
  manifests: string[]
  hasClaude: boolean
  hasCursor: boolean
  hasMcp: boolean
}

export interface GeneratedRules {
  claudeMd: string
  agentsMd: string
  cursorRules: string
  mcpConfig: McpConfig
}

export interface McpConfig {
  mcpServers: Record<string, McpServer>
}

export interface McpServer {
  command: string
  args: string[]
  env?: Record<string, string>
}
