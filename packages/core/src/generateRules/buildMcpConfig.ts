import type { DetectedStack, McpConfig } from '../types'

export function buildMcpConfig(stack: DetectedStack): McpConfig {
  const servers: McpConfig['mcpServers'] = {
    filesystem: {
      command: 'npx',
      args: ['-y', '@modelcontextprotocol/server-filesystem', '.'],
    },
    git: {
      command: 'npx',
      args: ['-y', '@modelcontextprotocol/server-git', '--repository', '.'],
    },
  }

  if (stack.manifests.includes('package.json')) {
    servers['node-runner'] = {
      command: 'npx',
      args: ['-y', '@modelcontextprotocol/server-node'],
    }
  }

  if (stack.language === 'Python') {
    servers['python-runner'] = {
      command: 'uvx',
      args: ['mcp-server-python'],
    }
  }

  return { mcpServers: servers }
}
