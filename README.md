# AI Workspace Configurator

> 새 프로젝트를 열 때마다 CLAUDE.md를 직접 쓰는 작업, 이제 그만.

스택을 자동 감지하고 `CLAUDE.md`, `AGENTS.md`, `.cursorrules`, `.mcp.json`을 즉시 생성합니다.
Karpathy 스타일 같은 커뮤니티 프리셋을 한 줄로 적용하고, 팀 전체가 동일한 AI 설정으로 일할 수 있습니다.

[![CI](https://github.com/been2531/ai-workspace-configurator/actions/workflows/ci.yml/badge.svg)](https://github.com/been2531/ai-workspace-configurator/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

## 왜 만들었나

Claude Code, Cursor, Codex를 쓰는 개발자라면 이 경험이 익숙합니다:

- 새 프로젝트마다 CLAUDE.md 처음부터 작성
- Karpathy의 agent-os 가이드를 매번 복붙
- 팀원마다 제각각인 AI 설정

**AI Workspace Configurator**는 이 반복 작업을 없앱니다.

---

## 빠른 시작

### CLI (모든 에디터에서 동작)

```bash
# 설치
npm install -g @ai-workspace-configurator/cli

# 새 프로젝트에서 실행
cd my-project
ai-workspace init
```

스택을 감지해서 질문 없이 즉시 생성합니다. Next.js 프로젝트면 Next.js에 맞는 규칙이, Python이면 Python에 맞는 규칙이 들어갑니다.

### Claude Code MCP 서버 (네이티브 통합)

`.mcp.json`에 추가:

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

이후 Claude Code 대화에서 바로 사용:

```
나: 이 프로젝트 AI 설정 만들어줘
나: karpathy 스타일로 설정해줘
나: 커뮤니티 프리셋 검색해줘
```

---

## 생성되는 파일

| 파일 | 용도 |
|------|------|
| `CLAUDE.md` | Claude Code 에이전트 지침 — 타이핑·패러다임·프레임워크별 규칙 |
| `AGENTS.md` | 멀티에이전트 핸드오프 룰 — 사전 추론, 코드 생략 금지 |
| `.cursorrules` | Codex / Cursor 토큰 절약 규칙 |
| `.mcp.json` | MCP 서버 자동 구성 (filesystem, git) |

---

## 3레이어 합성

```
Layer 1: 스택 자동 감지
         package.json / requirements.txt / pom.xml / Cargo.toml ...
         → Next.js인지, Django인지, NestJS인지 자동 판별

Layer 2: 내 스타일 (한 번만 설정, 모든 프로젝트에 적용)
         ai-workspace profile
         → 타입 strictness, 주석 스타일, 에이전트 자율성 수준 등

Layer 3: 커뮤니티 프리셋 (선택)
         ai-workspace apply karpathy/agent-os
         → Layer 1+2 위에 덮어씌우기
```

---

## 커뮤니티 프리셋

```bash
# 검색
ai-workspace search typescript
ai-workspace search karpathy

# 적용
ai-workspace apply iRiu3S4jwfpNdnSdOS9t

# 내 설정을 커뮤니티에 공유
ai-workspace publish
```

### 번들 프리셋 (설치 즉시 사용 가능)

| 이름 | 설명 |
|------|------|
| `karpathy/agent-os` | LLM OS 사전 추론 프로토콜, 에이전트 계층 구조 |
| `minimal` | 에이전트 자율성 최대화, 최소한의 제약 |

---

## 지원 스택

**JavaScript / TypeScript**
Next.js, React, Vue, Svelte, NestJS, Express, Fastify, Vite, Tailwind, Firebase, Prisma, Drizzle

**Python**
FastAPI, Django, Flask

**그 외**
Java (Maven), Go, Rust, PHP, Ruby

---

## CLI 전체 명령어

```bash
ai-workspace init [dir]       # 스택 감지 후 파일 생성
ai-workspace profile          # 내 스타일 설정 (한 번만)
ai-workspace search [tag]     # 커뮤니티 프리셋 검색
ai-workspace apply [id]       # 프리셋 적용
ai-workspace publish [dir]    # 내 설정 공유
ai-workspace star <id>        # 프리셋 즐겨찾기
ai-workspace login            # 계정 로그인 (publish·star 필요)
ai-workspace logout
```

---

## 모노레포 구조

```
apps/
  extension/   VS Code 확장 프로그램
  webview/     확장 내부 React UI (Vite + Tailwind)
  cli/         npm CLI 도구
  mcp/         Claude Code MCP 서버
packages/
  core/        generateRules 엔진 + 타입 (공용)
services/
  workers/     Cloudflare Workers LLM 프록시
```

---

## 로컬 개발

```bash
git clone https://github.com/been2531/ai-workspace-configurator.git
cd ai-workspace-configurator
pnpm install
pnpm build

# CLI 직접 실행
node apps/cli/dist/index.js init .
```

---

## 비용

| 서비스 | 비용 |
|--------|------|
| 스택 감지 + 규칙 생성 | 무료 (100% 로컬) |
| 커뮤니티 레지스트리 | 무료 (Firebase Spark) |
| MCP 서버 | 무료 |
| VS Code 확장 | 무료 |

---

## 기여하기

PR과 이슈를 환영합니다. [CONTRIBUTING.md](./CONTRIBUTING.md)를 참고해주세요.

새 스택 감지 추가, 프리셋 개선, 번역 모두 환영합니다.

---

## License

MIT © [jhahn](https://github.com/been2531)
