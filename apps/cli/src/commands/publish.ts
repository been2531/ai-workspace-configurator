import * as fs from 'fs'
import * as path from 'path'
import * as p from '@clack/prompts'
import { getStoredUser } from '../firebase/auth'
import { publishPreset } from '../firebase/registry'
import { isFirebaseConfigured } from '../firebase/config'

export async function publishCommand(targetDir: string): Promise<void> {
  p.intro('AI Workspace — 프리셋 퍼블리시')

  if (!isFirebaseConfigured()) {
    p.log.error('Firebase가 설정되지 않았습니다.')
    process.exit(1)
  }

  const user = getStoredUser()
  if (!user) {
    p.log.error('로그인이 필요합니다. ai-workspace login 을 먼저 실행하세요.')
    process.exit(1)
  }

  const workspaceRoot = path.resolve(targetDir)

  // 현재 디렉토리의 AI config 파일 읽기
  const claudeMd = readFile(workspaceRoot, 'CLAUDE.md')
  const agentsMd = readFile(workspaceRoot, 'AGENTS.md')
  const cursorRules = readFile(workspaceRoot, '.cursorrules')
  const mcpJson = readFile(workspaceRoot, '.mcp.json')

  if (!claudeMd && !agentsMd) {
    p.log.error('CLAUDE.md 또는 AGENTS.md 파일이 없습니다. 먼저 ai-workspace init 을 실행하세요.')
    process.exit(1)
  }

  p.log.info(`퍼블리시할 파일: ${[claudeMd && 'CLAUDE.md', agentsMd && 'AGENTS.md', cursorRules && '.cursorrules', mcpJson && '.mcp.json'].filter(Boolean).join(', ')}`)

  const name = await p.text({
    message: '프리셋 이름',
    placeholder: 'My Next.js Config',
    validate: (v) => (v.trim().length >= 3 ? undefined : '3자 이상 입력하세요'),
  })
  if (p.isCancel(name)) { p.cancel('취소'); return }

  const description = await p.text({
    message: '설명',
    placeholder: '어떤 프로젝트에 최적화된 설정인지',
    validate: (v) => (v.trim().length >= 10 ? undefined : '10자 이상 입력하세요'),
  })
  if (p.isCancel(description)) { p.cancel('취소'); return }

  const tagsRaw = await p.text({
    message: '태그 (쉼표 구분)',
    placeholder: 'nextjs, typescript, claude-code',
  })
  if (p.isCancel(tagsRaw)) { p.cancel('취소'); return }

  const isPublic = await p.confirm({
    message: '공개 프리셋으로 퍼블리시하시겠습니까?',
    initialValue: true,
  })
  if (p.isCancel(isPublic)) { p.cancel('취소'); return }

  const tags = (tagsRaw as string)
    .split(',')
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean)

  const overrides: Record<string, string> = {}
  if (claudeMd) overrides['claudeMd'] = claudeMd
  if (agentsMd) overrides['agentsMd'] = agentsMd
  if (cursorRules) overrides['cursorRules'] = cursorRules

  let mcpServers: Record<string, unknown> | undefined
  if (mcpJson) {
    try {
      const parsed = JSON.parse(mcpJson) as { mcpServers?: Record<string, unknown> }
      mcpServers = parsed.mcpServers
    } catch { /* 파싱 실패는 무시 */ }
  }

  const spinner = p.spinner()
  spinner.start('Firestore에 업로드 중...')

  try {
    const docId = await publishPreset({
      name: name as string,
      author: user.displayName ?? user.email.split('@')[0],
      authorUid: user.uid,
      description: description as string,
      tags,
      overrides: { ...overrides, ...(mcpServers ? { mcpServers } : {}) } as never,
      isPublic: isPublic as boolean,
    })
    spinner.stop('업로드 완료!')
    p.note(`프리셋 ID: ${docId}\n적용: ai-workspace apply ${docId}`, '퍼블리시 완료')
    p.outro('커뮤니티에서 공유됩니다.')
  } catch (err) {
    spinner.stop('실패')
    p.log.error(String(err))
    process.exit(1)
  }
}

function readFile(dir: string, filename: string): string | null {
  const fp = path.join(dir, filename)
  try {
    return fs.existsSync(fp) ? fs.readFileSync(fp, 'utf-8') : null
  } catch {
    return null
  }
}
