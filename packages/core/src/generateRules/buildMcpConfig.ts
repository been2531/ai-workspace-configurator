import type { ComposeInput, McpConfig } from '../types'

// 앤트로픽 공식 MCP 서버 패키지
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
    args: ['-y', '@modelcontextprotocol/server-postgres', '${POSTGRES_CONNECTION_STRING}'],
  },
  fetch: {
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-fetch'],
  },
  puppeteer: {
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-puppeteer'],
  },
  slack: {
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-slack'],
    env: { SLACK_BOT_TOKEN: '${SLACK_BOT_TOKEN}', SLACK_TEAM_ID: '${SLACK_TEAM_ID}' },
  },
  github: {
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-github'],
    env: { GITHUB_PERSONAL_ACCESS_TOKEN: '${GITHUB_PERSONAL_ACCESS_TOKEN}' },
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
  if (stack.frameworks.some((f) => ['Django', 'FastAPI', 'Spring Boot', 'Rails', 'Laravel'].includes(f))) {
    servers['postgres'] = MCP_SERVERS.postgres
  }

  if (stack.frameworks.includes('Prisma') || stack.frameworks.includes('Drizzle')) {
    if (!servers['postgres']) servers['sqlite'] = MCP_SERVERS.sqlite
  }

  if (stack.frameworks.includes('Next.js') || stack.frameworks.some((f) => ['NestJS', 'Express', 'Fastify'].includes(f))) {
    servers['github'] = MCP_SERVERS.github
  }

  if (stack.frameworks.some((f) => ['Playwright', 'Cypress'].includes(f))) {
    servers['puppeteer'] = MCP_SERVERS.puppeteer
  }

  if (stack.frameworks.includes('Firebase')) {
    servers['fetch'] = MCP_SERVERS.fetch
  }

  // 항상 filesystem, git은 포함
  if (!servers['filesystem']) servers['filesystem'] = MCP_SERVERS.filesystem
  if (!servers['git']) servers['git'] = MCP_SERVERS.git

  return { mcpServers: servers }
}
