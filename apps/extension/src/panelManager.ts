import * as vscode from 'vscode'
import * as fs from 'fs'
import * as path from 'path'
import { getProfile, getSelectedPreset, saveSelectedPreset } from './profileStore'
import { searchPresets, loadPreset } from './presetService'
import type { WebviewMessage, FileStatus } from '@ai-workspace-configurator/core'

type MessageHandler = (msg: WebviewMessage) => void

export class PanelManager {
  private panel: vscode.WebviewPanel | undefined
  private readonly context: vscode.ExtensionContext
  private messageHandler: MessageHandler | undefined

  constructor(context: vscode.ExtensionContext) {
    this.context = context
  }

  onMessage(handler: MessageHandler): void {
    this.messageHandler = handler
  }

  show() {
    if (this.panel) {
      this.panel.reveal()
      return
    }

    this.panel = vscode.window.createWebviewPanel(
      'aiWorkspacePanel',
      'AI Workspace Configurator',
      vscode.ViewColumn.Beside,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [
          vscode.Uri.joinPath(this.context.extensionUri, 'dist', 'webview'),
        ],
      },
    )

    this.panel.webview.html = this.getHtml()

    this.panel.webview.onDidReceiveMessage(
      async (message: WebviewMessage) => {
        if (message.command === 'ready') {
          await this.sendInitState()
          return
        }
        if (message.command === 'searchPresets') {
          await this.handleSearchPresets(message.query)
          return
        }
        if (message.command === 'selectPreset') {
          await this.handleSelectPreset(message.presetId)
          return
        }
        this.messageHandler?.(message)
      },
      undefined,
      this.context.subscriptions,
    )

    this.panel.onDidDispose(() => { this.panel = undefined }, null, this.context.subscriptions)
  }

  postMessage(message: unknown): void {
    this.panel?.webview.postMessage(message)
  }

  private async sendInitState(): Promise<void> {
    const profile = getProfile(this.context)
    const selectedPreset = getSelectedPreset(this.context)
    const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath
    const skillsDir = workspaceRoot ? path.join(workspaceRoot, '.claude', 'skills') : ''
    const fileStatus: FileStatus = workspaceRoot
      ? {
          claude: fs.existsSync(path.join(workspaceRoot, 'CLAUDE.md')),
          agents: fs.existsSync(path.join(workspaceRoot, 'AGENTS.md')),
          cursor: fs.existsSync(path.join(workspaceRoot, '.cursorrules')),
          mcp: fs.existsSync(path.join(workspaceRoot, '.mcp.json')),
          skills: (() => {
            try {
              return fs.existsSync(skillsDir) &&
                fs.readdirSync(skillsDir).some((f) => f.endsWith('.md'))
            } catch { return false }
          })(),
        }
      : { claude: false, agents: false, cursor: false, mcp: false, skills: false }

    this.postMessage({
      type: 'init',
      payload: {
        profile,
        fileStatus,
        selectedPreset: selectedPreset
          ? { id: selectedPreset.id, name: selectedPreset.name }
          : null,
      },
    })
  }

  private async handleSearchPresets(query: string): Promise<void> {
    try {
      const results = await searchPresets(query)
      this.postMessage({ type: 'presetsResult', payload: results })
    } catch {
      this.postMessage({ type: 'presetsResult', payload: [] })
    }
  }

  private async handleSelectPreset(presetId: string | null): Promise<void> {
    if (!presetId) {
      await saveSelectedPreset(this.context, null)
      this.postMessage({ type: 'presetApplied', payload: null })
      return
    }

    const preset = await loadPreset(presetId)
    if (!preset) {
      this.postMessage({ type: 'presetApplied', payload: null })
      return
    }

    await saveSelectedPreset(this.context, preset)
    this.postMessage({ type: 'presetApplied', payload: { id: preset.id, name: preset.name } })
  }

  private getHtml(): string {
    const webview = this.panel!.webview
    const webviewDir = vscode.Uri.joinPath(this.context.extensionUri, 'dist', 'webview')
    const htmlPath = path.join(webviewDir.fsPath, 'index.html')

    if (fs.existsSync(htmlPath)) {
      let html = fs.readFileSync(htmlPath, 'utf-8')

      const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(webviewDir, 'webview.js'))
      const cssUri = webview.asWebviewUri(vscode.Uri.joinPath(webviewDir, 'webview.css'))
      const nonce = getNonce()

      html = html
        .replace(/src="\/webview\.js"/, `src="${scriptUri}" nonce="${nonce}"`)
        .replace(/href="\/webview\.css"/, `href="${cssUri}"`)

      const csp = `<meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'nonce-${nonce}'; style-src ${webview.cspSource} 'unsafe-inline'; img-src ${webview.cspSource} data:;">`
      html = html.replace('<head>', `<head>\n  ${csp}`)

      return html
    }

    return this.getFallbackHtml()
  }

  private getFallbackHtml(): string {
    const profile = getProfile(this.context)
    const isKo = profile.locale === 'ko'
    return `<!DOCTYPE html>
<html lang="${isKo ? 'ko' : 'en'}">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>AI Workspace Configurator</title>
  <style>
    body { font-family: var(--vscode-font-family); color: var(--vscode-foreground); background: var(--vscode-editor-background); padding: 24px; }
    h1 { font-size: 18px; margin-bottom: 4px; }
    p { font-size: 12px; opacity: 0.6; margin-bottom: 24px; }
    button { padding: 8px 16px; border: none; border-radius: 4px; cursor: pointer; font-size: 13px; background: var(--vscode-button-background); color: var(--vscode-button-foreground); margin-right: 8px; }
    button:hover { background: var(--vscode-button-hoverBackground); }
  </style>
</head>
<body>
  <h1>AI Workspace Configurator</h1>
  <p>${isKo ? '프로젝트 스택을 감지하고 Claude Code / Codex 최적화 파일을 자동 생성합니다.' : 'Auto-generate optimization files for Claude Code & Codex.'}</p>
  <button onclick="configure()">${isKo ? '⚡ 지금 설정 생성' : '⚡ Generate Config'}</button>
  <script>
    const vscode = acquireVsCodeApi()
    function configure() { vscode.postMessage({ command: 'configure' }) }
  </script>
</body>
</html>`
  }
}

function getNonce(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  return Array.from({ length: 32 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}
