import type { ComposeInput, McpConfig } from '../types'

// 검증된 공식 MCP 서버 패키지만 사용
const MCP_SERVERS = {
  filesystem: {
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-filesystem', '.'],
  },
  git: {
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-git', '--repository', '.'],
  },
  sqlite: {
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-sqlite'],
  },
  postgres: {
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-postgres'],
  },
  fetch: {
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-fetch'],
  },
} as const

export function buildMcpConfig({ stack, profile }: ComposeInput): McpConfig {
  const servers: McpConfig['mcpServers'] = {}

  // 프로필 기본값 적용
  const defaults = profile?.mcpDefaults ?? ['filesystem', 'git']
  for (const key of defaults) {
    if (key in MCP_SERVERS) {
      servers[key] = MCP_SERVERS[key as keyof typeof MCP_SERVERS]
    }
  }

  // 스택 기반 추가 추천
  if (stack.frameworks.includes('Prisma') || stack.frameworks.includes('Drizzle')) {
    servers['sqlite'] = MCP_SERVERS.sqlite
  }

  if (stack.frameworks.includes('Firebase')) {
    // Firebase는 공식 MCP 서버 없음 — fetch로 대체
    servers['fetch'] = MCP_SERVERS.fetch
  }

  // 항상 filesystem, git은 포함
  if (!servers['filesystem']) servers['filesystem'] = MCP_SERVERS.filesystem
  if (!servers['git']) servers['git'] = MCP_SERVERS.git

  return { mcpServers: servers }
}
