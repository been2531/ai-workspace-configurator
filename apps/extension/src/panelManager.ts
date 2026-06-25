import * as vscode from 'vscode'
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
      { enableScripts: true, retainContextWhenHidden: true },
    )

    this.panel.webview.html = this.getHtml()

    this.panel.webview.onDidReceiveMessage(
      (message: { command: string; payload?: unknown }) => {
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
