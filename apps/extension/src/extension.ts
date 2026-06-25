import * as vscode from 'vscode'
import { detectStack } from './stackDetector'
import { generateWorkspaceFiles } from './fileGenerator'
import { PanelManager } from './panelManager'

export function activate(context: vscode.ExtensionContext) {
  const panelManager = new PanelManager(context)

  context.subscriptions.push(
    vscode.commands.registerCommand('aiWorkspace.configure', async () => {
      const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath
      if (!workspaceRoot) {
        vscode.window.showErrorMessage('워크스페이스를 먼저 열어주세요.')
        return
      }

      await vscode.window.withProgress(
        { location: vscode.ProgressLocation.Notification, title: 'AI Workspace 설정 중…', cancellable: false },
        async (progress) => {
          progress.report({ message: '스택 감지 중…' })
          const stack = await detectStack(workspaceRoot)

          progress.report({ message: '규칙 파일 생성 중…', increment: 50 })
          await generateWorkspaceFiles(workspaceRoot, stack)

          progress.report({ message: '완료!', increment: 50 })
          vscode.window.showInformationMessage(
            `✅ AI Workspace 설정 완료 (${stack.frameworks.join(', ')})`,
          )
        },
      )
    }),

    vscode.commands.registerCommand('aiWorkspace.openPanel', () => {
      panelManager.show()
    }),

    vscode.commands.registerCommand('aiWorkspace.syncTeam', async () => {
      vscode.window.showInformationMessage('팀 동기화 기능은 Pro 플랜에서 제공됩니다.')
    }),
  )

  // 워크스페이스 열릴 때 사용자에게 제안만 (자동 실행 금지)
  if (vscode.workspace.workspaceFolders?.length) {
    vscode.window.showInformationMessage(
      'AI Workspace Configurator: Claude Code / Codex 최적화 파일을 생성할까요?',
      '⚡ 지금 생성',
      '나중에',
    ).then((choice) => {
      if (choice === '⚡ 지금 생성') {
        vscode.commands.executeCommand('aiWorkspace.configure')
      }
    })
  }
}

export function deactivate() {}
