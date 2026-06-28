import * as fs from 'fs'
import * as path from 'path'
import * as vscode from 'vscode'
import { detectStack } from './stackDetector'
import { generateWorkspaceFiles } from './fileGenerator'
import { PanelManager } from './panelManager'
import { getProfile, saveProfile, getSelectedPreset } from './profileStore'
import { DEFAULT_PROFILE } from '@ai-workspace-configurator/core'
import { readGeneratedMetadata, checkStaleness, describeStaleness } from './staleness'
import { checkSkillsUpdate } from './skillsUpdateChecker'
import type { Locale, DetectedStack } from '@ai-workspace-configurator/core'

const MESSAGES: Record<Locale, {
  noWorkspace: string
  configuring: string
  scanning: string
  generating: string
  done: string
  success: (fw: string) => string
  openClaudeMd: string
  prompt: string
  generateNow: string
  later: string
  staleConfig: (desc: string) => string
  regenerate: string
  selectLanguage: string
}> = {
  en: {
    noWorkspace: 'Please open a workspace first.',
    configuring: 'Configuring AI Workspace…',
    scanning: 'Scanning stack…',
    generating: 'Generating rule files…',
    done: 'Done!',
    success: (fw) => `✅ AI Workspace configured${fw ? ` (${fw})` : ''}`,
    openClaudeMd: 'Open CLAUDE.md',
    prompt: 'AI Workspace Configurator: Generate optimization files for Claude Code / Codex?',
    generateNow: '⚡ Generate Now',
    later: 'Later',
    staleConfig: (desc) => `AI Workspace files may be outdated (${desc}). Regenerate?`,
    regenerate: '↺ Regenerate',
    selectLanguage: "Select your project's primary language",
  },
  ko: {
    noWorkspace: '워크스페이스를 먼저 열어주세요.',
    configuring: 'AI Workspace 설정 중…',
    scanning: '스택 감지 중…',
    generating: '규칙 파일 생성 중…',
    done: '완료!',
    success: (fw) => `✅ AI Workspace 설정 완료${fw ? ` (${fw})` : ''}`,
    openClaudeMd: 'CLAUDE.md 열기',
    prompt: 'AI Workspace Configurator: Claude Code / Codex 최적화 파일을 생성할까요?',
    generateNow: '⚡ 지금 생성',
    later: '나중에',
    staleConfig: (desc) => `AI Workspace 파일이 오래된 것 같습니다 (${desc}). 재생성할까요?`,
    regenerate: '↺ 재생성',
    selectLanguage: '프로젝트의 주 언어를 선택하세요',
  },
}

export function activate(context: vscode.ExtensionContext) {
  const panelManager = new PanelManager(context)

  // ── Status Bar ────────────────────────────────────────────────────────────
  const statusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100)
  statusBar.command = 'aiWorkspace.openPanel'
  context.subscriptions.push(statusBar)

  function updateStatusBar(root: string | undefined): void {
    if (!root) { statusBar.hide(); return }
    const configured = fs.existsSync(path.join(root, 'CLAUDE.md'))
    statusBar.text = configured ? '$(check) AI Workspace' : '$(warning) AI Workspace'
    statusBar.tooltip = configured
      ? 'AI Workspace configured — click to open dashboard'
      : 'AI Workspace not configured — click to open dashboard'
    statusBar.show()
  }

  const workspaceRoot0 = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath
  updateStatusBar(workspaceRoot0)

  async function runConfigure(fileSelection?: { mcp: boolean; skills: boolean; hooks: boolean }) {
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

          const claudePath = path.join(workspaceRoot, 'CLAUDE.md')
          const result = await vscode.window.showInformationMessage(
            M.success(stack.frameworks.join(', ') || stack.language),
            M.openClaudeMd,
          )
          if (result === M.openClaudeMd && fs.existsSync(claudePath)) {
            const doc = await vscode.workspace.openTextDocument(vscode.Uri.file(claudePath))
            await vscode.window.showTextDocument(doc)
          }

          updateStatusBar(workspaceRoot)

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
            hooks: fs.existsSync(path.join(workspaceRoot, '.claude', 'settings.json')),
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
      case 'exportProfile': {
        const profile = getProfile(context)
        const uri = await vscode.window.showSaveDialog({
          filters: { JSON: ['json'] },
          defaultUri: vscode.Uri.file('ai-workspace-profile.json'),
          saveLabel: 'Export',
        })
        if (uri) {
          fs.writeFileSync(uri.fsPath, JSON.stringify(profile, null, 2), 'utf-8')
          vscode.window.showInformationMessage('Settings exported successfully.')
        }
        break
      }
      case 'importProfile': {
        const uris = await vscode.window.showOpenDialog({
          filters: { JSON: ['json'] },
          canSelectMany: false,
          openLabel: 'Import',
        })
        if (uris?.[0]) {
          try {
            const raw = fs.readFileSync(uris[0].fsPath, 'utf-8')
            const parsed = JSON.parse(raw) as Partial<typeof DEFAULT_PROFILE>
            const merged = {
              ...DEFAULT_PROFILE,
              ...parsed,
              codingStyle: { ...DEFAULT_PROFILE.codingStyle, ...parsed?.codingStyle },
              agentMode: { ...DEFAULT_PROFILE.agentMode, ...parsed?.agentMode },
              tools: { ...DEFAULT_PROFILE.tools, ...parsed?.tools },
            }
            await saveProfile(context, merged)
            panelManager.sendInit()
            vscode.window.showInformationMessage('Settings imported successfully.')
          } catch {
            vscode.window.showErrorMessage('Failed to import: file is not valid JSON.')
          }
        }
        break
      }
    }
  })

  // Startup: suggest setup (first time only) or warn about outdated config (stale only)
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

    // Files exist — only notify if stack has changed (stale)
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
        }
      }
    }
    // Already configured and not stale — status bar is sufficient, no popup
  })()

  // Background: check anthropics/skills for new skill templates (max once per day)
  void checkSkillsUpdate(context, getProfile(context).locale ?? 'en')
}

export function deactivate() {}
