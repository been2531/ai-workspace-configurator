import * as p from '@clack/prompts'
import { searchPresets, type PresetDoc } from '../firebase/registry'
import { isFirebaseConfigured } from '../firebase/config'
import { BUNDLED_PRESETS } from './apply'

export async function searchCommand(queryStr?: string): Promise<void> {
  p.intro('AI Workspace — 프리셋 검색')

  if (!isFirebaseConfigured()) {
    p.log.warn('Firebase 미연결 — 번들 프리셋만 표시합니다.')
    displayBundled()
    return
  }

  const term = queryStr ?? await p.text({
    message: '검색어 또는 태그 (빈칸 = 인기순 전체)',
    placeholder: 'karpathy, nextjs, python ...',
  }) as string

  if (p.isCancel(term)) { p.cancel('취소'); return }

  const spinner = p.spinner()
  spinner.start('Firestore 검색 중...')

  try {
    const results = await searchPresets(typeof term === 'string' ? term.trim() : '')
    spinner.stop(`${results.length}개 결과`)

    if (results.length === 0) {
      p.log.warn('결과가 없습니다.')
      return
    }

    displayResults(results)
    p.log.info('적용: ai-workspace apply <preset-id>')
  } catch (err) {
    spinner.stop('검색 실패')
    p.log.error(String(err))
    p.log.info('번들 프리셋으로 대체합니다.')
    displayBundled()
  }
}

function displayResults(presets: PresetDoc[]): void {
  const lines = presets.map(
    (p) =>
      `  ${p.id.padEnd(36)} ★${String(p.stars).padStart(5)}  ${p.description.slice(0, 50)}`,
  )
  p.note(
    ['ID                                   Stars  설명', '-'.repeat(80), ...lines].join('\n'),
    '검색 결과',
  )
}

function displayBundled(): void {
  const lines = Object.values(BUNDLED_PRESETS).map(
    (pr) => `  ${pr.id.padEnd(30)} ${pr.description.slice(0, 50)}`,
  )
  p.note(['번들 프리셋 (ID)', '-'.repeat(80), ...lines].join('\n'), '로컬 프리셋')
}
