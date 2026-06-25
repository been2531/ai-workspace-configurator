import { searchPresets } from '../registry'

export async function handleSearch(args: Record<string, unknown>): Promise<string> {
  const queryStr = (args['query'] as string | undefined) ?? ''

  try {
    const presets = await searchPresets(queryStr, 10)

    if (presets.length === 0) {
      return queryStr
        ? `"${queryStr}" 검색 결과가 없습니다.\n\n다른 태그를 시도해보세요: claude-code, typescript, nextjs, python, karpathy, minimal`
        : '등록된 프리셋이 없습니다.'
    }

    const lines = [
      queryStr ? `🔍 "${queryStr}" 검색 결과 (${presets.length}개)` : `⭐ 인기 프리셋 (${presets.length}개)`,
      '',
      ...presets.map((p, i) => [
        `${i + 1}. **${p.name}** [${p.id}]`,
        `   ${p.description}`,
        `   태그: ${p.tags.join(', ')}`,
        '',
      ].join('\n')),
      '💡 적용: workspace_apply 도구에 위 ID를 전달하세요.',
    ]

    return lines.join('\n')
  } catch (e) {
    return `❌ 검색 실패: ${(e as Error).message}\n\nFirebase 연결을 확인하세요.`
  }
}
