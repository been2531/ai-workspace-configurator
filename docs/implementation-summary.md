# AI Workspace Configurator — 구현 현황

> 최종 업데이트: 2026-06-25

---

## 프로젝트 개요

**무엇을 만드는가?**

새 프로젝트를 열 때마다 CLAUDE.md, AGENTS.md, .cursorrules, .mcp.json을 수동으로 작성하는 번거로움을 없애는 도구.
스택을 자동 감지하고, 개인 스타일 + 커뮤니티 프리셋(Karpathy 스타일 등)을 3레이어로 합성해서 즉시 주입한다.

**배포 형태:** CLI(주) + VS Code Extension(부) + Claude Code MCP 서버(네이티브)

---

## 모노레포 구조

```
apps/
  extension/     VS Code 확장 프로그램 (TypeScript → CommonJS)
  webview/       확장 내부 React UI (React 18 + Vite + Tailwind)
  cli/           npm 글로벌 CLI (ai-workspace)
  mcp/           Claude Code MCP 서버 (stdio JSON-RPC)
packages/
  core/          generateRules 엔진 + 타입 (Node/브라우저 공용)
services/
  workers/       Cloudflare Workers LLM 프록시 (유료 Pro 기능)
docs/            가이드 문서
scripts/         Firebase 시딩 / E2E 테스트
```

---

## 구현 완료 항목

### P0 버그 수정

| 버그 | 수정 내용 |
|------|-----------|
| 확장 자동 실행 | 워크스페이스 열릴 때 동의 없이 파일 생성 → 알림 + 사용자 확인 후 실행 |
| 기존 파일 덮어쓰기 | CLAUDE.md 등 이미 있는 파일을 무조건 덮어씀 → skip 로직 추가 |

---

### Stage 1 — 3레이어 composeRules 엔진 + CLI

#### `packages/core` — 공용 엔진

- **`types.ts`** — 전체 타입 정의
  - `DetectedStack` (confidence: certain / ambiguous / empty)
  - `UserProfile` (codingStyle, agentMode, mcpDefaults, basePreset)
  - `CommunityPreset` (id, name, author, tags, overrides)
  - `ComposeInput`, `GeneratedRules`, `McpConfig`, `McpServer`
  - `DEFAULT_PROFILE` (strict 타이핑, functional 패러다임, minimal 주석)

- **`generateRules/index.ts`** — `composeRules(input)` 3레이어 합성
  1. Layer 1: 스택 자동 감지 기반 베이스 규칙
  2. Layer 2: UserProfile 코딩 스타일 오버레이
  3. Layer 3: CommunityPreset 오버라이드 (claudeMd / agentsMd / cursorRules / mcpServers)

- **4개 빌더 함수**
  - `buildClaudeMd` — 언어·프레임워크·타이핑·패러다임·보안 규칙
  - `buildAgentsMd` — 에이전트 모드·자율성·코드 생략 방지
  - `buildCursorRules` — Codex 토큰 절약 규칙
  - `buildMcpConfig` — profile.mcpDefaults 기반 MCP 서버 목록

#### `apps/cli` — CLI 도구 (`ai-workspace`)

**8개 명령어:**

| 명령어 | 동작 |
|--------|------|
| `ai-workspace init [dir]` | 스택 감지 → confidence 분기 → 3레이어 합성 → 파일 생성 |
| `ai-workspace profile` | UserProfile 대화형 설정 (`~/.ai-workspace/profile.json`) |
| `ai-workspace search [tag]` | Firestore 레지스트리에서 프리셋 검색 |
| `ai-workspace apply [id]` | 프리셋 적용 (번들 프리셋 또는 Firestore) |
| `ai-workspace publish [dir]` | 현재 AI 설정 파일을 커뮤니티 레지스트리에 업로드 |
| `ai-workspace star <id>` | 프리셋 스타 토글 |
| `ai-workspace login` | Firebase 이메일/비밀번호 로그인 |
| `ai-workspace logout` | 로컬 토큰 삭제 |

**confidence 기반 UX:**
- `certain` → 질문 없이 즉시 생성
- `ambiguous` → 중복 감지된 부분만 질문 (UI 프레임워크 중복, Java+JS 혼합 구조 등)
- `empty` → 신규 프로젝트 설정 (언어 → 프레임워크 단계별 선택)

**번들 프리셋 (Firebase 없이 동작):**
- `karpathy/agent-os` — LLM OS 사전 추론, 에이전트 계층 구조
- `minimal` — 에이전트 자율성 최대화

**스택 감지 대상:**
- JS/TS: React, Vue, Svelte, Next.js, Express, Fastify, NestJS, Vite, Tailwind, Firebase, Prisma, Drizzle
- Python: Django, FastAPI, Flask
- Java (pom.xml), Go (go.mod), Rust (Cargo.toml), PHP (composer.json), Ruby (Gemfile)

---

### Stage 2 — Firebase 레지스트리 연결

#### Firebase 프로젝트
- **Project ID:** `ai-workspace-configurator`
- **서비스:** Firestore (Spark 무료 티어), Firebase Auth (이메일/비밀번호)

#### Firestore 구조

```
presets/{docId}
  name, author, authorUid, description
  tags[], overrides{}, stars, appliedCount, isPublic
  createdAt, updatedAt

presetStars/{uid}_{presetId}
  uid, presetId, starredAt
```

#### 보안 규칙 (`firestore.rules`)
- 공개 프리셋 읽기: 누구나
- 쓰기: 로그인 사용자 본인만
- 스타: 중복 방지 (presetStars 문서 확인)

#### 복합 인덱스 (`firestore.indexes.json`)
- `isPublic + tags + stars` (태그 검색)
- `isPublic + stars` (인기순 전체 목록)

#### 시딩된 프리셋 4개

| 이름 | ID | 태그 |
|------|----|------|
| Karpathy Agent OS | iRiu3S4jwfpNdnSdOS9t | claude-code, multi-agent, reasoning |
| Minimal | LwatXntGtdTplESHfPGI | minimal, autonomous |
| Strict TypeScript | bv3SKFSxPYigKzecHYbM | typescript, strict, best-practices |
| Next.js App Router | IERTlO3V45kONYzsr2Db | nextjs, react, fullstack |

#### E2E 테스트 (`scripts/e2e-test.js`)
- 10개 테스트 전체 통과 (회원가입 → 로그인 → 퍼블리시 → 검색 → 스타 → 정리)

---

### Stage 3 — MCP 서버

#### `apps/mcp` — Claude Code 네이티브 통합

Claude Code 대화 중에 자연어로 AI 설정 파일을 생성·관리할 수 있는 MCP 서버.

**4개 도구:**

| 도구 | 설명 |
|------|------|
| `workspace_status` | 현재 프로젝트 AI 설정 현황 + 스택 감지 결과 |
| `workspace_init` | 스택 감지 → 3레이어 합성 → 파일 생성 (force, preset 옵션) |
| `workspace_search` | Firestore 레지스트리 태그 검색 |
| `workspace_apply` | 프리셋 ID로 현재 프로젝트에 즉시 적용 |

**사용법 (Claude Code `.mcp.json`):**
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

**사용 예시:**
```
나: 이 프로젝트 AI 설정 상태 확인해줘
나: karpathy 스타일로 설정해줘
나: Next.js 프로젝트에 AI 설정 파일 만들어줘
```

---

### VS Code Extension

#### 구현된 기능
- **`aiWorkspace.configure`** — 스택 감지 → 3레이어 합성 → 파일 생성 (Progress 알림)
- **`aiWorkspace.openPanel`** — React 웹뷰 패널 열기
- **`aiWorkspace.syncTeam`** — 팀 동기화 (Pro 안내)
- **동의 후 실행** — 워크스페이스 열릴 때 알림, 사용자 확인 후 실행

#### React 웹뷰 연동
- `apps/webview` → Vite 빌드 → `apps/extension/dist/webview/` 출력
- `panelManager.ts` → 빌드된 HTML 로드 → CSP nonce 처리 → webview URI 교체
- 폴백 UI (빌드 결과물 없을 때 인라인 HTML)

---

### Cloudflare Workers (`services/workers`)

**Pro 기능: `/api/analyze`**
- 코드베이스 컨텍스트 수신 → Claude Haiku로 커스텀 CLAUDE.md 생성
- `ANTHROPIC_API_KEY` / `OPENAI_API_KEY` Workers 환경변수에만 존재 (클라이언트 노출 없음)
- `/api/health` 헬스체크 엔드포인트

---

## 보안 원칙 준수 현황

| 원칙 | 상태 |
|------|------|
| LLM API 키 — Workers 환경변수에만 | ✅ |
| Firebase 서비스 계정 키 — gitignore | ✅ |
| Firestore 규칙 — 인증 기반 쓰기 제한 | ✅ |
| `any` 타입 금지 (`unknown` + narrowing) | ✅ |
| core 패키지 — VS Code API / DOM API 의존 없음 | ✅ |
| extension만 `vscode` 모듈 접근 | ✅ |
| 자동 파일 생성 금지 (동의 후 실행) | ✅ |

---

## 빌드 현황

```bash
pnpm build   # 전체 빌드
# Tasks: 6 successful, 6 total
# core / cli / mcp / extension / webview / workers 모두 통과
```

---

## 남은 작업

### 중간 우선순위
- **단위 테스트** — `packages/core`의 `composeRules` Vitest 테스트 추가
- **stackDetector 중복 제거** — extension/cli/mcp 3곳에 동일 로직 복사 → `packages/node-utils`로 통합

### 낮은 우선순위
- **Google OAuth 로그인** — CLI에서 localhost redirect 서버로 OAuth 흐름 구현
- **팀 동기화** — Firebase 기반 팀 프리셋 공유 (현재 Pro 안내만)
- **Workers wrangler v4 업그레이드** — 현재 v3 사용 (경고만, 동작은 정상)

---

## 무료 티어 비용 구조

| 서비스 | 플랜 | 비용 |
|--------|------|------|
| Firebase Firestore | Spark (무료) | $0 |
| Firebase Auth | Spark (무료) | $0 |
| Cloudflare Workers | Free (10만 req/일) | $0 |
| 스택 감지 / 규칙 생성 | 100% 로컬 연산 | $0 |
| LLM API (코드베이스 분석) | Workers 경유, 유료 기능만 | $0 기본 |
