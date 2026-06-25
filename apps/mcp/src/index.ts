#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js'
import { handleInit } from './tools/init'
import { handleSearch } from './tools/search'
import { handleApply } from './tools/apply'
import { handleStatus } from './tools/status'

const server = new Server(
  { name: 'ai-workspace-configurator', version: '0.1.0' },
  { capabilities: { tools: {} } },
)

// ─── 도구 목록 ───────────────────────────────────────────────────────────────

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: 'workspace_init',
      description:
        '현재 프로젝트의 기술 스택을 감지하고 CLAUDE.md, AGENTS.md, .cursorrules, .mcp.json을 자동 생성합니다. ' +
        '새 프로젝트를 시작하거나 AI 설정 파일이 없을 때 사용하세요.',
      inputSchema: {
        type: 'object',
        properties: {
          path: {
            type: 'string',
            description: '프로젝트 디렉토리 경로 (기본값: 현재 디렉토리)',
          },
          preset: {
            type: 'string',
            description: '적용할 커뮤니티 프리셋 ID (예: iRiu3S4jwfpNdnSdOS9t)',
          },
          force: {
            type: 'boolean',
            description: '이미 존재하는 파일도 덮어쓰기 (기본값: false)',
          },
        },
      },
    },
    {
      name: 'workspace_search',
      description:
        'AI Workspace 커뮤니티 레지스트리에서 설정 프리셋을 검색합니다. ' +
        'karpathy, nextjs, python, typescript 등 태그로 검색하세요.',
      inputSchema: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: '검색 태그 또는 키워드 (빈칸이면 인기순 전체 목록)',
          },
        },
      },
    },
    {
      name: 'workspace_apply',
      description:
        '커뮤니티 레지스트리의 프리셋을 현재 프로젝트에 적용합니다. ' +
        'workspace_search로 얻은 ID를 사용하세요.',
      inputSchema: {
        type: 'object',
        properties: {
          preset_id: {
            type: 'string',
            description: '적용할 프리셋 Firestore 문서 ID',
          },
          path: {
            type: 'string',
            description: '프로젝트 디렉토리 경로 (기본값: 현재 디렉토리)',
          },
          force: {
            type: 'boolean',
            description: '기존 파일 덮어쓰기 (기본값: true)',
          },
        },
        required: ['preset_id'],
      },
    },
    {
      name: 'workspace_status',
      description:
        '현재 프로젝트에 어떤 AI 설정 파일이 있는지 확인합니다. ' +
        '감지된 기술 스택과 누락된 파일을 보여줍니다.',
      inputSchema: {
        type: 'object',
        properties: {
          path: {
            type: 'string',
            description: '확인할 프로젝트 경로 (기본값: 현재 디렉토리)',
          },
        },
      },
    },
  ],
}))

// ─── 도구 실행 ───────────────────────────────────────────────────────────────

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args = {} } = request.params

  try {
    let text: string

    switch (name) {
      case 'workspace_init':   text = await handleInit(args as Record<string, unknown>);   break
      case 'workspace_search': text = await handleSearch(args as Record<string, unknown>); break
      case 'workspace_apply':  text = await handleApply(args as Record<string, unknown>);  break
      case 'workspace_status': text = await handleStatus(args as Record<string, unknown>); break
      default:
        return { content: [{ type: 'text', text: `알 수 없는 도구: ${name}` }], isError: true }
    }

    return { content: [{ type: 'text', text }] }
  } catch (e) {
    return {
      content: [{ type: 'text', text: `오류: ${(e as Error).message}` }],
      isError: true,
    }
  }
})

// ─── 서버 시작 ───────────────────────────────────────────────────────────────

async function main() {
  const transport = new StdioServerTransport()
  await server.connect(transport)
  // stderr에만 로그 (stdout은 MCP 프로토콜용)
  process.stderr.write('AI Workspace MCP Server 시작됨\n')
}

main().catch(e => {
  process.stderr.write(`MCP 서버 오류: ${e.message}\n`)
  process.exit(1)
})
