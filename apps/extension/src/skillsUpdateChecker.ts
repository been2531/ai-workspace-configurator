import * as https from 'https'
import * as vscode from 'vscode'

const SKILLS_REPO = 'anthropics/skills'
const STATE_KEY = 'aiWorkspace.skillsUpdate'
const CHECK_INTERVAL_MS = 24 * 60 * 60 * 1000 // 1일에 한 번만 체크

interface SkillsState {
  sha: string
  checkedAt: number
}

const MESSAGES = {
  en: {
    updated: 'anthropics/skills has been updated — new skill templates available.',
    viewBtn: 'View on GitHub',
  },
  ko: {
    updated: 'anthropics/skills가 업데이트되었습니다. 새 skill 템플릿을 확인하세요.',
    viewBtn: 'GitHub에서 보기',
  },
}

export async function checkSkillsUpdate(
  ctx: vscode.ExtensionContext,
  locale: 'en' | 'ko',
): Promise<void> {
  try {
    const stored = ctx.globalState.get<SkillsState>(STATE_KEY)
    const now = Date.now()

    // 마지막 체크 후 24시간이 안 지났으면 skip
    if (stored && now - stored.checkedAt < CHECK_INTERVAL_MS) return

    const token = vscode.workspace.getConfiguration('aiWorkspace').get<string>('githubToken') ?? ''
    const latestSha = await fetchLatestCommitSha(token)
    if (!latestSha) return

    await ctx.globalState.update(STATE_KEY, { sha: latestSha, checkedAt: now } satisfies SkillsState)

    // 처음 실행이거나 SHA가 같으면 알림 없음
    if (!stored || stored.sha === latestSha) return

    const M = MESSAGES[locale]
    const result = await vscode.window.showInformationMessage(M.updated, M.viewBtn)
    if (result === M.viewBtn) {
      void vscode.env.openExternal(vscode.Uri.parse(`https://github.com/${SKILLS_REPO}`))
    }
  } catch {
    // 업데이트 체크 실패는 무시 — 선택적 기능
  }
}

function fetchLatestCommitSha(token: string): Promise<string | null> {
  return new Promise((resolve) => {
    const options: https.RequestOptions = {
      hostname: 'api.github.com',
      path: `/repos/${SKILLS_REPO}/commits?per_page=1`,
      method: 'GET',
      headers: {
        'User-Agent': 'ai-workspace-configurator',
        Accept: 'application/vnd.github.v3+json',
        ...(token ? { Authorization: `token ${token}` } : {}),
      },
    }

    const req = https.request(options, (res) => {
      let data = ''
      res.on('data', (chunk: Buffer) => { data += chunk.toString() })
      res.on('end', () => {
        try {
          const commits = JSON.parse(data) as Array<{ sha: string }>
          resolve(Array.isArray(commits) && commits[0]?.sha ? commits[0].sha : null)
        } catch {
          resolve(null)
        }
      })
    })
    req.on('error', () => resolve(null))
    req.end()
  })
}
