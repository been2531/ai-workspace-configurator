import * as fs from 'fs'
import * as path from 'path'
import { detectStack } from '../stackDetector'

export async function handleStatus(args: Record<string, unknown>): Promise<string> {
  const root = path.resolve((args['path'] as string | undefined) ?? process.cwd())

  if (!fs.existsSync(root)) {
    return `❌ 경로를 찾을 수 없습니다: ${root}`
  }

  const stack = detectStack(root)
  const files = [
    { name: 'CLAUDE.md',    exists: stack.hasClaude,  desc: 'Claude Code 에이전트 지침' },
    { name: 'AGENTS.md',    exists: stack.hasAgents,  desc: '멀티에이전트 핸드오프 룰' },
    { name: '.cursorrules', exists: stack.hasCursor,  desc: 'Codex / Cursor 토큰 다이어트' },
    { name: '.mcp.json',    exists: stack.hasMcp,     desc: 'MCP 서버 설정' },
  ]

  const lines = [
    `📁 ${root}`,
    '',
    `언어: ${stack.language}`,
    `프레임워크: ${stack.frameworks.join(', ') || '(감지 안 됨)'}`,
    `신뢰도: ${stack.confidence}`,
    stack.ambiguities.length ? `⚠ ${stack.ambiguities.join(', ')}` : '',
    '',
    'AI 설정 파일:',
    ...files.map(f => `  ${f.exists ? '✅' : '❌'} ${f.name.padEnd(14)} ${f.desc}`),
  ]

  const missing = files.filter(f => !f.exists)
  if (missing.length) {
    lines.push('', `💡 누락 파일 생성: workspace_init 도구를 호출하세요.`)
  } else {
    lines.push('', '✨ 모든 AI 설정 파일이 존재합니다.')
  }

  return lines.filter(l => l !== null).join('\n')
}
