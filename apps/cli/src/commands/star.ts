import * as p from '@clack/prompts'
import { getStoredUser } from '../firebase/auth'
import { starPreset, isStarred } from '../firebase/registry'
import { isFirebaseConfigured } from '../firebase/config'

export async function starCommand(presetId: string): Promise<void> {
  p.intro('AI Workspace — 스타')

  if (!isFirebaseConfigured()) {
    p.log.error('Firebase가 설정되지 않았습니다.')
    process.exit(1)
  }

  const user = getStoredUser()
  if (!user) {
    p.log.error('로그인이 필요합니다. ai-workspace login 을 먼저 실행하세요.')
    process.exit(1)
  }

  const spinner = p.spinner()
  spinner.start('처리 중...')

  try {
    const already = await isStarred(presetId, user.uid)
    await starPreset(presetId, user.uid)
    spinner.stop(already ? `★ 스타 취소: ${presetId}` : `★ 스타 추가: ${presetId}`)
    p.outro('완료')
  } catch (err) {
    spinner.stop('실패')
    p.log.error(String(err))
    process.exit(1)
  }
}
