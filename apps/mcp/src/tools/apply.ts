import * as fs from 'fs'
import * as path from 'path'
import * as os from 'os'
import { composeRules, DEFAULT_PROFILE } from '@ai-workspace-configurator/core'
import type { UserProfile } from '@ai-workspace-configurator/core'
import { detectStack } from '../stackDetector'
import { getPreset } from '../registry'

function loadProfile(): UserProfile {
  const p = path.join(os.homedir(), '.ai-workspace', 'profile.json')
  try {
    if (fs.existsSync(p)) return JSON.parse(fs.readFileSync(p, 'utf-8')) as UserProfile
  } catch { /* 기본값 */ }
  return DEFAULT_PROFILE
}

export async function handleApply(args: Record<string, unknown>): Promise<string> {
  const presetId = args['preset_id'] as string | undefined
  const root = path.resolve((args['path'] as string | undefined) ?? process.cwd())
  const force = (args['force'] as boolean | undefined) ?? true // apply는 기본 force

  if (!presetId) {
    return '❌ preset_id가 필요합니다.\n\nworkspace_search 도구로 프리셋 ID를 먼저 확인하세요.'
  }

  try {
    const preset = await getPreset(presetId)
    if (!preset) {
      return `❌ 프리셋을 찾을 수 없습니다: ${presetId}`
    }

    const stack = detectStack(root)
    const profile = loadProfile()
    const rules = composeRules({ stack, profile, preset })

    const targets = Object.keys(preset.overrides)
    const fileMap: Record<string, string> = {
      claudeMd:    'CLAUDE.md',
      agentsMd:    'AGENTS.md',
      cursorRules: '.cursorrules',
    }

    const written: string[] = []
    for (const [key, filename] of Object.entries(fileMap)) {
      if (!preset.overrides[key as keyof typeof preset.overrides]) continue
      const content = key === 'claudeMd' ? rules.claudeMd
        : key === 'agentsMd' ? rules.agentsMd
        : rules.cursorRules
      fs.writeFileSync(path.join(root, filename), content, 'utf-8')
      written.push(filename)
    }

    if (preset.overrides.mcpServers) {
      fs.writeFileSync(path.join(root, '.mcp.json'), JSON.stringify(rules.mcpConfig, null, 2), 'utf-8')
      written.push('.mcp.json')
    }

    return [
      `✅ "${preset.name}" (by ${preset.author}) 적용 완료`,
      '',
      `📁 ${root}`,
      '',
      '덮어쓴 파일:',
      ...written.map(f => `  ✅ ${f}`),
      '',
      preset.description,
      `태그: ${preset.tags.join(', ')}`,
    ].join('\n')
  } catch (e) {
    return `❌ 프리셋 적용 실패: ${(e as Error).message}`
  }
}
