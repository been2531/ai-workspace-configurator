import * as fs from 'fs'
import * as path from 'path'
import * as os from 'os'
import { composeRules, DEFAULT_PROFILE } from '@ai-workspace-configurator/core'
import type { UserProfile, CommunityPreset } from '@ai-workspace-configurator/core'
import { detectStack } from '../stackDetector'
import { getPreset } from '../registry'

function loadProfile(): UserProfile {
  const profilePath = path.join(os.homedir(), '.ai-workspace', 'profile.json')
  try {
    if (fs.existsSync(profilePath)) {
      return JSON.parse(fs.readFileSync(profilePath, 'utf-8')) as UserProfile
    }
  } catch { /* 손상된 프로필이면 기본값 */ }
  return DEFAULT_PROFILE
}

export async function handleInit(args: Record<string, unknown>): Promise<string> {
  const root = path.resolve((args['path'] as string | undefined) ?? process.cwd())
  const presetId = args['preset'] as string | undefined
  const force = (args['force'] as boolean | undefined) ?? false

  if (!fs.existsSync(root)) {
    return `❌ 경로를 찾을 수 없습니다: ${root}`
  }

  // 스택 감지
  const stack = detectStack(root)
  const profile = loadProfile()

  // 프리셋 조회 (지정된 경우)
  let preset: CommunityPreset | undefined
  if (presetId) {
    try {
      preset = (await getPreset(presetId)) ?? undefined
      if (!preset) {
        return `❌ 프리셋을 찾을 수 없습니다: ${presetId}\n\nworkspace_search 도구로 사용 가능한 프리셋을 확인하세요.`
      }
    } catch (e) {
      return `❌ 프리셋 로드 실패: ${(e as Error).message}`
    }
  } else if (profile.basePreset) {
    // 프로필 기본 프리셋 자동 적용
    try {
      preset = (await getPreset(profile.basePreset)) ?? undefined
    } catch { /* 네트워크 실패 시 무시 */ }
  }

  // 규칙 생성 (3레이어 합성)
  const rules = composeRules({ stack, profile, preset })

  const writes: Array<{ file: string; content: string; skip: boolean }> = [
    { file: 'CLAUDE.md',    content: rules.claudeMd,                       skip: !force && stack.hasClaude },
    { file: 'AGENTS.md',    content: rules.agentsMd,                       skip: !force && stack.hasAgents },
    { file: '.cursorrules', content: rules.cursorRules,                    skip: !force && stack.hasCursor },
    { file: '.mcp.json',    content: JSON.stringify(rules.mcpConfig, null, 2), skip: !force && stack.hasMcp },
  ]

  const created: string[] = []
  const skipped: string[] = []

  for (const { file, content, skip } of writes) {
    if (skip) { skipped.push(file); continue }
    fs.writeFileSync(path.join(root, file), content, 'utf-8')
    created.push(file)
  }

  // Write .cursor/rules/project.mdc (Cursor's new format)
  if (!force && stack.hasCursorMdc) {
    skipped.push('.cursor/rules/project.mdc')
  } else {
    const cursorRulesDir = path.join(root, '.cursor', 'rules')
    fs.mkdirSync(cursorRulesDir, { recursive: true })
    fs.writeFileSync(path.join(cursorRulesDir, 'project.mdc'), rules.cursorMdc, 'utf-8')
    created.push('.cursor/rules/project.mdc')
  }

  // 요약 출력
  const lines = [
    `✅ AI Workspace 설정 완료`,
    '',
    `📁 ${root}`,
    `언어: ${stack.language}`,
    `프레임워크: ${stack.frameworks.join(', ') || '(감지 안 됨)'}`,
  ]

  if (stack.confidence === 'ambiguous') {
    lines.push(`⚠ 감지 불확실: ${stack.ambiguities.join(', ')}`)
  }

  if (preset) {
    lines.push(`프리셋: ${preset.name} (by ${preset.author})`)
  }

  lines.push('')

  if (created.length) {
    lines.push('생성된 파일:', ...created.map(f => `  ✅ ${f}`))
  }
  if (skipped.length) {
    lines.push('건너뜀 (이미 존재):', ...skipped.map(f => `  — ${f}`))
    lines.push('', '💡 덮어쓰려면 force: true 옵션을 사용하세요.')
  }

  if (created.length === 0) {
    lines.push('모든 파일이 이미 존재합니다. 재생성하려면 force: true를 전달하세요.')
  }

  return lines.join('\n')
}
