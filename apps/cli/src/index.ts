#!/usr/bin/env node
import { Command } from 'commander'
import { initCommand } from './commands/init'
import { profileCommand } from './commands/profile'
import { applyCommand } from './commands/apply'

const program = new Command()

program
  .name('ai-workspace')
  .description('Claude Code & Codex 최적화 파일 자동 생성기')
  .version('0.1.0')

program
  .command('init [dir]')
  .description('현재 프로젝트에 AI workspace 설정 파일 생성')
  .action((dir: string = '.') => initCommand(dir))

program
  .command('profile')
  .description('내 개인 프로필 설정 (한 번만 — 모든 프로젝트에 적용)')
  .action(() => profileCommand())

program
  .command('apply [preset]')
  .description('커뮤니티 프리셋 적용 (예: karpathy/agent-os)')
  .action((preset?: string) => applyCommand(preset))

program.parse()
