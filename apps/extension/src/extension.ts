import * as fs from 'fs'
import * as path from 'path'
import * as vscode from 'vscode'
import { detectStack } from './stackDetector'
import { generateWorkspaceFiles } from './fileGenerator'
import { PanelManager } from './panelManager'
import { getProfile, saveProfile, getSelectedPreset } from './profileStore'
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
  teamSyncPro: string
  alreadyConfigured: string
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
    teamSyncPro: 'Team sync is available in the Pro plan.',
    alreadyConfigured: 'AI Workspace already configured. Regenerate?',
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
    teamSyncPro: '팀 동기화 기능은 Pro 플랜에서 제공됩니다.',
    alreadyConfigured: 'AI Workspace가 이미 설정되어 있습니다. 재생성할까요?',
    regenerate: '↺ 재생성',
    openDashboard: '대시보드 열기',
    selectLanguage: '프로젝트의 주 언어를 선택하세요',
  },
}

export function activate(context: vscode.ExtensionContext) {
  const panelManager = new PanelManager(context)

  async function runConfigure() {
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
        ['TypeScript', 'JavaScript', 'Python', 'Go', 'Rust', 'Java', 'C#', 'Ruby', 'PHP', 'Other'],
        { placeHolder: M.selectLanguage, title: M.selectLanguage },
      )
      if (!picked) return
      stack = { ...stack, language: picked, confidence: 'certain' }
    }

    await vscode.window.withProgress(
      { location: vscode.ProgressLocation.Notification, title: M.configuring, cancellable: false },
      async (progress) => {
        try {
          progress.report({ message: M.generating, increment: 50 })
          const preset = getSelectedPreset(context) ?? undefined
          const preview = await generateWorkspaceFiles(workspaceRoot, stack, profile, preset)

          progress.report({ message: M.done, increment: 50 })
          vscode.window.showInformationMessage(
            M.success(stack.frameworks.join(', ') || stack.language),
          )

          panelManager.postMessage({
            type: 'configured',
            payload: {
              success: true,
              fileStatus: { claude: true, agents: true, cursor: true, mcp: true, skills: true },
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
    vscode.commands.registerCommand('aiWorkspace.configure', runConfigure),

    vscode.commands.registerCommand('aiWorkspace.openPanel', () => {
      panelManager.show()
    }),

    vscode.commands.registerCommand('aiWorkspace.syncTeam', () => {
      const profile = getProfile(context)
      const M = MESSAGES[profile.locale ?? 'en']
      vscode.window.showInformationMessage(M.teamSyncPro)
    }),
  )

  // Handle webview messages that need extension-level access
  panelManager.onMessage(async (message) => {
    switch (message.command) {
      case 'configure':
        await runConfigure()
        break
      case 'saveProfile':
        await saveProfile(context, message.payload)
        break
      case 'syncTeam':
        vscode.commands.executeCommand('aiWorkspace.syncTeam')
        break
    }
  })

  // Suggest setup on workspace open
  const startupRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath
  if (startupRoot) {
    const profile = getProfile(context)
    const M = MESSAGES[profile.locale ?? 'en']
    const alreadyConfigured =
      fs.existsSync(path.join(startupRoot, 'CLAUDE.md')) ||
      fs.existsSync(path.join(startupRoot, '.cursorrules'))

    if (alreadyConfigured) {
      vscode.window
        .showInformationMessage(M.alreadyConfigured, M.regenerate, M.openDashboard)
        .then((choice) => {
          if (choice === M.regenerate) vscode.commands.executeCommand('aiWorkspace.configure')
          else if (choice === M.openDashboard) panelManager.show()
        })
    } else {
      vscode.window
        .showInformationMessage(M.prompt, M.generateNow, M.later)
        .then((choice) => {
          if (choice === M.generateNow) vscode.commands.executeCommand('aiWorkspace.configure')
        })
    }
  }
}

export function deactivate() {}
