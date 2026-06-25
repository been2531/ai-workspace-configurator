# AI Workspace MCP Server — Claude Code 연동 가이드

## 설치

```bash
# 글로벌 설치
npm install -g @ai-workspace-configurator/mcp

# 또는 프로젝트 로컬 설치 후 npx 사용
npm install -D @ai-workspace-configurator/mcp
```

## Claude Code `.mcp.json` 설정

프로젝트 루트 또는 `~/.claude/.mcp.json`에 추가:

```json
{
  "mcpServers": {
    "ai-workspace": {
      "command": "ai-workspace-mcp",
      "args": []
    }
  }
}
```

npx를 사용하는 경우:

```json
{
  "mcpServers": {
    "ai-workspace": {
      "command": "npx",
      "args": ["@ai-workspace-configurator/mcp"]
    }
  }
}
```

## 사용 가능한 도구

Claude Code 대화 중 자연어로 호출하세요.

| 도구 | 설명 |
|------|------|
| `workspace_status` | 현재 프로젝트 AI 설정 파일 현황 확인 |
| `workspace_init` | 스택 감지 후 CLAUDE.md / AGENTS.md / .cursorrules / .mcp.json 생성 |
| `workspace_search` | 커뮤니티 레지스트리에서 프리셋 검색 |
| `workspace_apply` | 검색된 프리셋을 현재 프로젝트에 적용 |

## 사용 예시

```
나: 이 프로젝트 AI 설정 상태 어때?
Claude: [workspace_status 호출] → 스택 감지 결과와 누락 파일 표시

나: karpathy 스타일로 초기화해줘
Claude: [workspace_search "karpathy"] → [workspace_apply preset_id] → 파일 생성

나: 이 Next.js 프로젝트에 AI 설정 만들어줘
Claude: [workspace_init path="."] → CLAUDE.md, AGENTS.md 등 자동 생성
```
