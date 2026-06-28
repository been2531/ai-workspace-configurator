# AI Workspace Configurator

> 프로젝트를 열면 Claude Code & Codex 최적화 파일을 자동으로 생성합니다.

**[English README →](README.md)**

[![VS Code Marketplace](https://img.shields.io/visual-studio-marketplace/v/ai-workspace-configurator.ai-workspace-configurator?label=Marketplace&color=blue)](https://marketplace.visualstudio.com/items?itemName=ai-workspace-configurator.ai-workspace-configurator)
[![CI](https://github.com/been2531/ai-workspace-configurator/actions/workflows/ci.yml/badge.svg)](https://github.com/been2531/ai-workspace-configurator/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

---

## 무엇을 하나요

**AI Workspace Configurator**는 프로젝트 스택(언어, 프레임워크, 패키지 매니저)을 자동 감지하고 그에 맞는 AI 지침 파일을 즉시 생성합니다. Claude Code, Cursor, Codex가 첫 번째 프롬프트부터 코드베이스를 이해할 수 있도록 합니다.

| 생성 파일 | 용도 |
|-----------|------|
| `CLAUDE.md` | Claude Code용 스택별 에이전트 규칙 |
| `AGENTS.md` | 멀티에이전트 핸드오프 프로토콜 + 리뷰어 체크리스트 |
| `.cursorrules` | Cursor AI 규칙 (레거시 형식) |
| `.cursor/rules/project.mdc` | Cursor AI 규칙 (새 MDC 형식) |
| `.mcp.json` | MCP 서버 자동 구성 |
| `.claude/skills/<name>/SKILL.md` | 슬래시 커맨드 (Agent Skills 포맷): `/run`, `/test`, `/review`, `/commit`, `/fix`, `/pr`, `/security`, `/doctor` + 스택별 `/type-check`, `/db-migrate`, `/deploy` |

모든 처리는 **100% 로컬**에서 실행됩니다 — API 호출 없음, 데이터 전송 없음.

---

## 주요 기능

### 설정 없는 스택 감지 — 20개 이상의 프레임워크

| 생태계 | 감지 가능한 프레임워크 |
|--------|----------------------|
| **JS / TS** | Next.js, Nuxt, SvelteKit, Remix, Astro, React, Vue, Svelte, NestJS, Express, Fastify |
| **데이터 레이어** | Prisma, Drizzle, GraphQL / Apollo, tRPC, Firebase |
| **테스트** | Vitest, Jest, Cypress, Playwright, Testing Library |
| **Python** | Django, FastAPI, Flask, SQLAlchemy, Celery |
| **Java / Kotlin** | Spring Boot (Maven + Gradle / Gradle Kotlin DSL) |
| **Go** | `go.mod` |
| **Rust** | `Cargo.toml` |
| **PHP** | Laravel, Symfony |
| **Ruby** | Rails |
| **Flutter / Dart** | `pubspec.yaml` |

메타 프레임워크 우선순위: Next.js > Nuxt > SvelteKit > Remix (React + Next.js 중복 항목 방지).

---

### 풍부한 생성 콘텐츠

`CLAUDE.md` 포함 내용:
- **프로젝트 구조 가이드** — 스택별 디렉토리 레이아웃 (Next.js App Router, Django 앱, Go 패키지, Rust 모듈 등)
- **테스트 컨벤션** — 스택별 테스트 패턴 (pytest fixtures, Vitest, Go 테이블 테스트, Rust `#[cfg(test)]`)
- **AI 워크플로우 힌트** — TypeScript 타입 체크, Prisma 마이그레이션, 린터 실행 가이드
- **프레임워크 규칙** — 감지된 프레임워크별 5~8개 구체적 규칙

`AGENTS.md`에는 TypeScript, NestJS, Django, FastAPI, Prisma, Drizzle, Firebase, Go, Rust를 포함하는 **스택별 리뷰어 체크리스트**가 포함됩니다.

---

### 오래된 설정 자동 감지

워크스페이스를 열 때마다 `CLAUDE.md`가 이 도구로 생성되었는지 확인하고, 마지막 생성 이후 스택 변경 사항을 비교합니다. 새로운 프레임워크가 추가된 경우 경고를 표시합니다:

> _"AI Workspace 파일이 오래된 것 같습니다 (new: Prisma, Vitest). 재생성할까요?"_

세 가지 시작 상태:
1. **설정 파일 없음** → 생성 제안
2. **오래된 설정** → 변경된 내용과 함께 노란색 경고 표시
3. **최신 상태** → 재생성 / 대시보드 열기 옵션 제공

---

### 슬래시 커맨드

`.claude/skills/`에 바로 사용 가능한 Claude Code 스킬 파일 제공:

| 커맨드 | 동작 |
|--------|------|
| `/run` | 프로젝트 개발 서버 시작 |
| `/test` | 테스트 스위트 실행 |
| `/review` | 스택별 체크리스트로 코드 리뷰 |
| `/db-migrate` | 데이터베이스 마이그레이션 안전하게 실행 |
| `/commit` | 올바른 형식의 git 커밋 작성 및 생성 |
| `/fix` | 특정 에러 진단 및 수정 |
| `/type-check` | TypeScript 타입 체크 실행 및 모든 에러 수정 |

---

### 커뮤니티 프리셋

**Presets** 탭에서 커뮤니티 규칙 세트를 검색하고 적용할 수 있습니다.

내장 프리셋:
- **Karpathy Agent OS** — LLM OS 사전 추론 + 멀티에이전트 계층 구조
- **Minimal** — 최소한의 제약, 최대한의 에이전트 자율성
- **Strict TypeScript** — 엄격한 타입 안전성과 Result 패턴 적용

---

### 이중 언어 지원

- 대시보드 UI: **영어 / 한국어** 전환
- 생성 파일 언어: EN / KO 독립적으로 선택 가능

---

## 빠른 시작

1. [VS Code 마켓플레이스](https://marketplace.visualstudio.com/items?itemName=ai-workspace-configurator.ai-workspace-configurator)에서 **AI Workspace Configurator** 설치
2. VS Code에서 프로젝트 폴더 열기
3. 시작 알림에서 **"⚡ 지금 생성"** 클릭
   — 또는 커맨드 팔레트(`Ctrl+Shift+P`)에서 **"AI Workspace: Generate Config Files"** 실행
4. 파일이 워크스페이스 루트에 생성됨 — 즉시 Claude Code 사용 시작

---

## CLI

```bash
npm install -g @ai-workspace-configurator/cli

cd my-project
ai-workspace init          # 스택 감지 후 파일 생성
ai-workspace profile       # 코딩 스타일 설정 (한 번만 설정, 모든 프로젝트에 적용)
ai-workspace search react  # 커뮤니티 프리셋 검색
ai-workspace apply <id>    # 프리셋 적용
ai-workspace publish       # 내 설정을 프리셋으로 공유
```

## MCP 서버 (Claude Code 네이티브)

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

Claude Code 대화에서 바로 사용:

```
이 프로젝트 AI 설정 만들어줘
karpathy 스타일로 설정해줘
TypeScript 관련 커뮤니티 프리셋 검색해줘
```

---

## 대시보드

열기: **커맨드 팔레트 → "AI Workspace: Open Dashboard"**

| 탭 | 내용 |
|----|------|
| **Home** | 파일 상태, 생성 / 재생성 버튼 |
| **Settings** | 언어, 코딩 스타일, 에이전트 모드 |
| **Preview** | 저장 전 생성된 파일 내용 미리보기 |
| **Presets** | 커뮤니티 프리셋 탐색 및 적용 |

---

## 개인정보

- 텔레메트리 없음
- 서버로 코드 전송 없음
- Firebase는 커뮤니티 프리셋 읽기/쓰기에만 사용 (공개 데이터)
- LLM 기능은 Cloudflare Worker 프록시를 통해 라우팅 — API 키가 클라이언트에 도달하지 않음

---

## 무료 티어 인프라

| 서비스 | 사용 | 비용 |
|--------|------|------|
| Firebase Spark (Firestore + Auth) | 커뮤니티 프리셋 레지스트리 | $0 |
| Cloudflare Workers Free | LLM 프록시 (하루 10만 요청) | $0 |
| 스택 감지 + 규칙 생성 | 100% 로컬 연산 | $0 |

---

## 모노레포 구조

```
apps/extension/   VS Code 확장 프로그램 — 코어 엔진 (TypeScript → CommonJS, esbuild)
apps/webview/     확장 대시보드 UI (React 18 + Vite 6 + Tailwind CSS)
apps/cli/         CLI 도구 — `ai-workspace init`
apps/mcp/         MCP 서버 — Claude Code 네이티브 통합
packages/core/    generateRules 엔진 + 템플릿 (Node.js + 브라우저 호환)
services/workers/ Cloudflare Workers — LLM 프록시, 팀 동기화
```

### 로컬 개발

```bash
git clone https://github.com/been2531/ai-workspace-configurator.git
cd ai-workspace-configurator
pnpm install
pnpm build          # 전체 빌드 (turbo)
pnpm dev            # webview 개발 서버
pnpm dev:ext        # extension watch 빌드
```

---

## 기여하기

이슈와 PR을 환영합니다. 새 스택 감지 추가, 템플릿 개선, 번역 모두 환영합니다.

[github.com/been2531/ai-workspace-configurator](https://github.com/been2531/ai-workspace-configurator)

---

## 라이선스

[MIT](LICENSE) © [jhahn](https://github.com/been2531)
