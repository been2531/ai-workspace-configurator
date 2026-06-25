import { useState } from 'react'

export default function App() {
  const [status, setStatus] = useState<'idle' | 'scanning' | 'done'>('idle')

  function handleConfigure() {
    setStatus('scanning')
    // VS Code extension과 통신 (postMessage)
    // @ts-expect-error acquireVsCodeApi는 webview 환경에서만 존재
    if (typeof acquireVsCodeApi !== 'undefined') {
      // @ts-expect-error
      acquireVsCodeApi().postMessage({ command: 'configure' })
    }
    setTimeout(() => setStatus('done'), 1500)
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center p-8">
      <div className="max-w-md w-full space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">AI Workspace Configurator</h1>
          <p className="text-sm text-gray-400 mt-1">
            Claude Code & Codex 성능 최적화 파일을 자동으로 생성합니다.
          </p>
        </div>

        <div className="space-y-3">
          <button
            onClick={handleConfigure}
            disabled={status === 'scanning'}
            className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50
              rounded-lg text-sm font-semibold transition-colors"
          >
            {status === 'scanning' ? '스캔 중…' : status === 'done' ? '✅ 완료' : '⚡ 원클릭 설정 생성'}
          </button>

          <button
            className="w-full py-3 px-4 bg-white/5 hover:bg-white/10 border border-white/10
              rounded-lg text-sm font-semibold transition-colors"
          >
            ☁️ 팀 동기화 <span className="text-xs text-indigo-400 ml-1">Pro</span>
          </button>
        </div>

        <div className="border border-white/8 rounded-lg p-4 space-y-2 text-xs text-gray-500">
          <p className="font-semibold text-gray-400">생성되는 파일</p>
          <p>📄 CLAUDE.md — Claude Code 에이전트 지침</p>
          <p>📄 AGENTS.md — 멀티 에이전트 핸드오프 룰</p>
          <p>📄 .cursorrules — Codex 토큰 다이어트</p>
          <p>📄 .mcp.json — MCP 서버 자동 구성</p>
        </div>
      </div>
    </div>
  )
}
