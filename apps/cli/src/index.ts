#!/usr/bin/env node
import { Command } from 'commander'
import { initCommand } from './commands/init'
import { profileCommand } from './commands/profile'
import { applyCommand } from './commands/apply'
import { loginCommand, logoutCommand } from './commands/login'
import { searchCommand } from './commands/search'
import { publishCommand } from './commands/publish'
import { starCommand } from './commands/star'

const program = new Command()

program
  .name('ai-workspace')
  .description('Claude Code & Codex 최적화 파일 자동 생성기')
  .version('0.1.0')

// ─── 로컬 커맨드 ─────────────────────────────────────────────────────────────

program
  .command('init [dir]')
  .description('현재 프로젝트에 AI workspace 설정 파일 생성')
  .action((dir: string = '.') => initCommand(dir))

program
  .command('profile')
  .description('내 개인 프로필 설정 (한 번만 — 모든 프로젝트에 적용)')
  .action(() => profileCommand())

// ─── 레지스트리 커맨드 ───────────────────────────────────────────────────────

program
  .command('search [query]')
  .description('커뮤니티 프리셋 검색 (예: ai-workspace search karpathy)')
  .action((query?: string) => searchCommand(query))

program
  .command('apply [preset]')
  .description('프리셋 적용 (예: ai-workspace apply karpathy/agent-os)')
  .action((preset?: string) => applyCommand(preset))

program
  .command('publish [dir]')
  .description('현재 프로젝트 AI 설정을 커뮤니티에 퍼블리시')
  .action((dir: string = '.') => publishCommand(dir))

program
  .command('star <presetId>')
  .description('프리셋 스타 추가/취소 (예: ai-workspace star abc123)')
  .action((presetId: string) => starCommand(presetId))

// ─── 인증 커맨드 ─────────────────────────────────────────────────────────────

program
  .command('login')
  .description('AI Workspace 계정 로그인 (퍼블리시·스타에 필요)')
  .action(() => loginCommand())

program
  .command('logout')
  .description('로그아웃')
  .action(() => logoutCommand())

program.parse()
