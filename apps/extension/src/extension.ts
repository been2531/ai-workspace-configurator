import * as fs from 'fs'
import * as path from 'path'
import * as vscode from 'vscode'
import { detectStack } from './stackDetector'
import { generateWorkspaceFiles } from './fileGenerator'
import { PanelManager } from './panelManager'
import { getProfile, saveProfile, getSelectedPreset } from './profileStore'
import { readGeneratedMetadata, checkStaleness, describeStaleness } from './staleness'
import type { Locale, DetectedStack } from '@ai-workspace-configurator/core'

const MESSAGES: Record<Locale, {
  noWorkspace: string
  configuring: string
  scanning: string
  generating: string
  done: string
  success: (fw: string) => string
  prompt: string
  generateNow: string
  later: string
  alreadyConfigured: string
  staleConfig: (desc: string) => string
  regenerate: string
  openDashboard: string
  selectLanguage: string
}> = {
  en: {
    noWorkspace: 'Please open a workspace first.',
    configuring: 'Configuring AI Workspace…',
    scanning: 'Scanning stack…',
    generating: 'Generating rule files…',
    done: 'Done!',
    success: (fw) => `✅ AI Workspace configured${fw ? ` (${fw})` : ''}`,
    prompt: 'AI Workspace Configurator: Generate optimization files for Claude Code / Codex?',
    generateNow: '⚡ Generate Now',
    later: 'Later',
    alreadyConfigured: 'AI Workspace already configured. Regenerate?',
    staleConfig: (desc) => `AI Workspace files may be outdated (${desc}). Regenerate?`,
    regenerate: '↺ Regenerate',
    openDashboard: 'Open Dashboard',
    selectLanguage: "Select your project's primary language",
  },
  ko: {
    noWorkspace: '워크스페이스를 먼저 열어주세요.',
    configuring: 'AI Workspace 설정 중…',
    scanning: '스택 감지 중…',
    generating: '규칙 파일 생성 중…',
    done: '완료!',
    success: (fw) => `✅ AI Workspace 설정 완료${fw ? ` (${fw})` : ''}`,
    prompt: 'AI Workspace Configurator: Claude Code / Codex 최적화 파일을 생성할까요?',
    generateNow: '⚡ 지금 생성',
    later: '나중에',
    alreadyConfigured: 'AI Workspace가 이미 설정되어 있습니다. 재생성할까요?',
    staleConfig: (desc) => `AI Workspace 파일이 오래된 것 같습니다 (${desc}). 재생성할까요?`,
    regenerate: '↺ 재생성',
    openDashboard: '대시보드 열기',
    selectLanguage: '프로젝트의 주 언어를 선택하세요',
  },
}

export function activate(context: vscode.ExtensionContext) {
  const panelManager = new PanelManager(context)

  async function runConfigure(fileSelection?: { mcp: boolean; skills: boolean }) {
    const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath
    const profile = getProfile(context)
    const M = MESSAGES[profile.locale ?? 'en']

    if (!workspaceRoot) {
      vscode.window.showErrorMessage(M.noWorkspace)
      return
    }

    // Detect stack before showing progress so QuickPick can appear if needed
    let stack: DetectedStack = await detectStack(workspaceRoot)
    if (stack.confidence === 'empty') {
      const picked = await vscode.window.showQuickPick(
        ['TypeScript', 'JavaScript', 'Python', 'Go', 'Rust', 'Java', 'C#', 'Swift', 'Kotlin', 'Ruby', 'PHP', 'C++', 'Other…'],
        { placeHolder: M.selectLanguage, title: M.selectLanguage },
      )
      if (!picked) return
      let language = picked
      if (picked === 'Other…') {
        const custom = await vscode.window.showInputBox({
          prompt: M.selectLanguage,
          placeHolder: 'e.g. Elixir, Scala, Dart …',
        })
        if (!custom?.trim()) return
        language = custom.trim()
      }
      stack = { ...stack, language, confidence: 'certain' }
    }

    await vscode.window.withProgress(
      { location: vscode.ProgressLocation.Notification, title: M.configuring, cancellable: false },
      async (progress) => {
        try {
          progress.report({ message: M.generating, increment: 50 })
          const preset = getSelectedPreset(context) ?? undefined
          const preview = await generateWorkspaceFiles(workspaceRoot, stack, profile, preset, fileSelection)

          progress.report({ message: M.done, increment: 50 })
          vscode.window.showInformationMessage(
            M.success(stack.frameworks.join(', ') || stack.language),
          )

          const skillsDir = path.join(workspaceRoot, '.claude', 'skills')
          const actualFileStatus = {
            claude: fs.existsSync(path.join(workspaceRoot, 'CLAUDE.md')),
            agents: fs.existsSync(path.join(workspaceRoot, 'AGENTS.md')),
            cursor: fs.existsSync(path.join(workspaceRoot, '.cursorrules')),
            mcp: fs.existsSync(path.join(workspaceRoot, '.mcp.json')),
            skills: (() => {
              try {
                return fs.existsSync(skillsDir) && fs.readdirSync(skillsDir).some((f) => f.endsWith('.md'))
              } catch { return false }
            })(),
          }

          panelManager.postMessage({
            type: 'configured',
            payload: {
              success: true,
              fileStatus: actualFileStatus,
              preview,
            },
          })
        } catch (err) {
          panelManager.postMessage({
            type: 'configured',
            payload: { success: false, error: String(err) },
          })
        }
      },
    )
  }

  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider('aiWorkspace.sidebarView', panelManager, {
      webviewOptions: { retainContextWhenHidden: true },
    }),

    vscode.commands.registerCommand('aiWorkspace.configure', runConfigure),

    vscode.commands.registerCommand('aiWorkspace.openPanel', () => {
      panelManager.show()
    }),
  )

  // Handle webview messages that need extension-level access
  panelManager.onMessage(async (message) => {
    switch (message.command) {
      case 'configure':
        await runConfigure(message.fileSelection)
        break
      case 'saveProfile':
        await saveProfile(context, message.payload)
        break
    }
  })

  // Startup: suggest setup or warn about outdated config
  void (async () => {
    const startupRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath
    if (!startupRoot) return

    const profile = getProfile(context)
    const M = MESSAGES[profile.locale ?? 'en']
    const hasClaude = fs.existsSync(path.join(startupRoot, 'CLAUDE.md'))

    if (!hasClaude && !fs.existsSync(path.join(startupRoot, '.cursorrules'))) {
      // First time — offer to generate
      const choice = await vscode.window.showInformationMessage(M.prompt, M.generateNow, M.later)
      if (choice === M.generateNow) vscode.commands.executeCommand('aiWorkspace.configure')
      return
    }

    // Files exist — check if generated by us and whether stack has changed
    if (hasClaude) {
      const meta = readGeneratedMetadata(startupRoot)
      if (meta) {
        const currentStack = await detectStack(startupRoot)
        const staleness = checkStaleness(currentStack, meta)
        if (staleness.isStale) {
          const desc = describeStaleness(staleness)
          const choice = await vscode.window.showWarningMessage(
            M.staleConfig(desc),
            M.regenerate,
            M.later,
          )
          if (choice === M.regenerate) vscode.commands.executeCommand('aiWorkspace.configure')
          return
        }
      }
    }

    // Already configured and not stale — gentle reminder with dashboard option
    const choice = await vscode.window.showInformationMessage(
      M.alreadyConfigured,
      M.regenerate,
      M.openDashboard,
    )
    if (choice === M.regenerate) vscode.commands.executeCommand('aiWorkspace.configure')
    else if (choice === M.openDashboard) panelManager.show()
  })()
}

export function deactivate() {}
