import * as fs from 'fs'
import * as path from 'path'
import * as p from '@clack/prompts'
import { composeRules } from '@ai-workspace-configurator/core'
import type { DetectedStack, StackChoice, CommunityPreset } from '@ai-workspace-configurator/core'
import { detectStack } from '../stackDetector'
import { loadProfile } from '../profile'
import { resolvePreset } from './apply'
import { isFirebaseConfigured } from '../firebase/config'

export async function initCommand(targetDir: string): Promise<void> {
  const workspaceRoot = path.resolve(targetDir)
  p.intro('AI Workspace Configurator')

  const spinner = p.spinner()
  spinner.start('프로젝트 스캔 중...')
  const stack = detectStack(workspaceRoot)
  spinner.stop(`스캔 완료 — ${stack.language}${stack.frameworks.length ? ` / ${stack.frameworks.join(', ')}` : ''}`)

  // 감지 결과에 따라 분기
  let resolvedStack = stack

  if (stack.confidence === 'empty') {
    resolvedStack = await promptNewProject(workspaceRoot, stack)
  } else if (stack.confidence === 'ambiguous') {
    resolvedStack = await promptAmbiguous(stack)
  }

  const profile = loadProfile()

  // profile.basePreset 자동 적용 (3레이어 합성)
  let preset: CommunityPreset | undefined
  if (profile.basePreset && isFirebaseConfigured()) {
    try {
      const resolved = await resolvePreset(profile.basePreset)
      if (resolved) {
        preset = resolved
        p.log.info(`프리셋 적용 중: ${preset.name} (by ${preset.author})`)
      }
    } catch { /* 네트워크 실패는 무시 */ }
  }

  const rules = composeRules({ stack: resolvedStack, profile, preset })

  const writes: Array<{ file: string; content: string; skip: boolean }> = [
    { file: 'CLAUDE.md', content: rules.claudeMd, skip: resolvedStack.hasClaude },
    { file: 'AGENTS.md', content: rules.agentsMd, skip: resolvedStack.hasAgents },
    { file: '.cursorrules', content: rules.cursorRules, skip: resolvedStack.hasCursor },
    { file: '.mcp.json', content: JSON.stringify(rules.mcpConfig, null, 2), skip: resolvedStack.hasMcp },
  ]

  const skipped: string[] = []
  const created: string[] = []

  for (const { file, content, skip } of writes) {
    if (skip) {
      skipped.push(file)
      continue
    }
    fs.writeFileSync(path.join(workspaceRoot, file), content, 'utf-8')
    created.push(file)
  }

  if (created.length > 0) {
    p.note(created.map((f) => `✓ ${f}`).join('\n'), '생성된 파일')
  }
  if (skipped.length > 0) {
    p.note(skipped.map((f) => `— ${f} (이미 존재, 건너뜀)`).join('\n'), '건너뜀')
  }

  p.outro('완료! Claude Code와 Codex가 최적화된 환경에서 실행됩니다.')
}

async function promptNewProject(
  workspaceRoot: string,
  base: DetectedStack,
): Promise<DetectedStack> {
  p.note('감지된 파일이 없습니다. 새 프로젝트 설정을 진행합니다.', '신규 프로젝트')

  const language = await p.select({
    message: '언어를 선택하세요',
    options: [
      { value: 'JavaScript/TypeScript', label: 'TypeScript / JavaScript' },
      { value: 'Python', label: 'Python' },
      { value: 'Java', label: 'Java' },
      { value: 'Go', label: 'Go' },
      { value: 'Rust', label: 'Rust' },
    ],
  })

  if (p.isCancel(language)) {
    p.cancel('취소되었습니다.')
    process.exit(0)
  }

  let frameworks: string[] = []

  if (language === 'JavaScript/TypeScript') {
    const fw = await p.select({
      message: '프레임워크를 선택하세요',
      options: [
        { value: 'Next.js', label: 'Next.js (풀스택)' },
        { value: 'React', label: 'React (SPA)' },
        { value: 'Vue', label: 'Vue' },
        { value: 'NestJS', label: 'NestJS (백엔드)' },
        { value: 'Express', label: 'Express (백엔드)' },
        { value: 'none', label: '없음 (순수 Node.js)' },
      ],
    })
    if (p.isCancel(fw)) { p.cancel('취소'); process.exit(0) }
    if (fw !== 'none') frameworks = [fw as string]
  }

  if (language === 'Python') {
    const fw = await p.select({
      message: '프레임워크를 선택하세요',
      options: [
        { value: 'FastAPI', label: 'FastAPI' },
        { value: 'Django', label: 'Django' },
        { value: 'Flask', label: 'Flask' },
        { value: 'none', label: '없음 (순수 Python)' },
      ],
    })
    if (p.isCancel(fw)) { p.cancel('취소'); process.exit(0) }
    if (fw !== 'none') frameworks = [fw as string]
  }

  return {
    ...base,
    language: language as string,
    frameworks,
    confidence: 'certain',
    ambiguities: [],
  }
}

async function promptAmbiguous(stack: DetectedStack): Promise<DetectedStack> {
  if (stack.ambiguities.length > 0) {
    p.note(stack.ambiguities.join('\n'), '⚠ 애매한 감지 결과')
  }

  // UI 프레임워크 중복 해소
  const uiFrameworks = stack.frameworks.filter((f) => ['React', 'Vue', 'Svelte', 'Next.js'].includes(f))
  let frameworks = [...stack.frameworks]

  if (uiFrameworks.length > 1) {
    const primary = await p.select({
      message: '주요 UI 프레임워크를 선택하세요',
      options: uiFrameworks.map((f) => ({ value: f, label: f })),
    })
    if (p.isCancel(primary)) { p.cancel('취소'); process.exit(0) }
    frameworks = frameworks.filter((f) => !uiFrameworks.includes(f))
    frameworks.unshift(primary as string)
  }

  // Java + JS 혼합 구조
  const hasJavaJsMix = stack.ambiguities.some((a) => a.includes('Java 백엔드'))
  if (hasJavaJsMix) {
    const frontendChoice = await p.select({
      message: 'Java 백엔드의 프론트엔드 구성은?',
      options: [
        { value: 'jsp', label: 'JSP (서버 사이드 렌더링)' },
        { value: 'separate', label: 'React/Vue 별도 프론트엔드' },
        { value: 'none', label: '프론트엔드 없음 (API 서버)' },
      ],
    })
    if (p.isCancel(frontendChoice)) { p.cancel('취소'); process.exit(0) }
    if (frontendChoice === 'jsp') frameworks.push('JSP')
  }

  return { ...stack, frameworks, confidence: 'certain', ambiguities: [] }
}
