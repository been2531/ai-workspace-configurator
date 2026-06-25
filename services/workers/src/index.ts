export interface Env {
  ANTHROPIC_API_KEY: string
  OPENAI_API_KEY: string
  ENVIRONMENT: string
}

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: CORS_HEADERS })
    }

    const url = new URL(request.url)

    if (url.pathname === '/api/analyze' && request.method === 'POST') {
      return handleAnalyze(request, env)
    }

    if (url.pathname === '/api/health') {
      return Response.json({ status: 'ok', env: env.ENVIRONMENT }, { headers: CORS_HEADERS })
    }

    return new Response('Not Found', { status: 404 })
  },
}

/**
 * Pro 기능: 코드베이스 AI 역분석
 * 확장 프로그램이 소스 컨텍스트를 보내면 LLM이 커스텀 규칙을 반환
 */
async function handleAnalyze(request: Request, env: Env): Promise<Response> {
  if (!env.ANTHROPIC_API_KEY) {
    return Response.json({ error: 'API key not configured' }, { status: 500, headers: CORS_HEADERS })
  }

  const body = await request.json<{ context: string; stack: string }>()

  const llmRes = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 2048,
      messages: [
        {
          role: 'user',
          content: `다음 코드베이스 컨텍스트를 분석하여 Claude Code용 최적화된 CLAUDE.md 규칙을 생성해줘.\n\n스택: ${body.stack}\n\n컨텍스트:\n${body.context}`,
        },
      ],
    }),
  })

  const data = await llmRes.json()
  return Response.json(data, { headers: CORS_HEADERS })
}
