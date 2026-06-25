import * as vscode from 'vscode'
import * as fs from 'fs'
import * as path from 'path'

export class PanelManager {
  private panel: vscode.WebviewPanel | undefined
  private readonly context: vscode.ExtensionContext

  constructor(context: vscode.ExtensionContext) {
    this.context = context
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
      (message: { command: string }) => {
        switch (message.command) {
          case 'configure':
            vscode.commands.executeCommand('aiWorkspace.configure')
            break
          case 'syncTeam':
            vscode.commands.executeCommand('aiWorkspace.syncTeam')
            break
        }
      },
      undefined,
      this.context.subscriptions,
    )

    this.panel.onDidDispose(() => { this.panel = undefined }, null, this.context.subscriptions)
  }

  private getHtml(): string {
    const webview = this.panel!.webview
    const webviewDir = vscode.Uri.joinPath(this.context.extensionUri, 'dist', 'webview')
    const htmlPath = path.join(webviewDir.fsPath, 'index.html')

    // React 빌드 결과물이 있으면 사용, 없으면 폴백 UI
    if (fs.existsSync(htmlPath)) {
      let html = fs.readFileSync(htmlPath, 'utf-8')

      // Vite 빌드는 절대 경로(/webview.js)를 사용 — webview URI로 교체
      const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(webviewDir, 'webview.js'))
      const cssUri = webview.asWebviewUri(vscode.Uri.joinPath(webviewDir, 'webview.css'))
      const nonce = getNonce()

      html = html
        .replace(/src="\/webview\.js"/, `src="${scriptUri}" nonce="${nonce}"`)
        .replace(/href="\/webview\.css"/, `href="${cssUri}"`)

      // CSP: module script는 nonce 필수
      const csp = `<meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'nonce-${nonce}'; style-src ${webview.cspSource} 'unsafe-inline'; img-src ${webview.cspSource} data:;">`
      html = html.replace('<head>', `<head>\n  ${csp}`)

      return html
    }

    // 폴백: 인라인 UI
    return this.getFallbackHtml()
  }

  private getFallbackHtml(): string {
    return `<!DOCTYPE html>
<html lang="ko">
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
  <p>프로젝트 스택을 감지하고 Claude Code / Codex 최적화 파일을 자동 생성합니다.</p>
  <button onclick="configure()">⚡ 지금 설정 생성</button>
  <button onclick="syncTeam()">☁️ 팀 동기화 (Pro)</button>
  <script>
    const vscode = acquireVsCodeApi()
    function configure() { vscode.postMessage({ command: 'configure' }) }
    function syncTeam() { vscode.postMessage({ command: 'syncTeam' }) }
  </script>
</body>
</html>`
  }
}

function getNonce(): string {
  let text = ''
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length))
  }
  return text
}
