# Contributing to AI Workspace Configurator

## 시작하기

```bash
git clone https://github.com/been2531/ai-workspace-configurator.git
cd ai-workspace-configurator
pnpm install
pnpm build
```

## 개발 환경

- Node.js 20+
- pnpm 9+

```bash
pnpm dev          # webview 개발 서버
pnpm dev:ext      # extension watch 빌드
pnpm dev:cli      # CLI watch 빌드
pnpm dev:mcp      # MCP 서버 watch 빌드
pnpm lint         # 전체 lint
```

## 기여 방법

### 버그 리포트
GitHub Issues에서 **Bug Report** 템플릿을 사용해주세요.

### 커뮤니티 프리셋 추가
`apps/cli/src/commands/apply.ts`의 `BUNDLED_PRESETS`에 PR을 보내주세요.
또는 `ai-workspace publish` 명령으로 직접 레지스트리에 올릴 수 있습니다.

### 스택 감지 개선
`apps/cli/src/stackDetector.ts` — 새 프레임워크/언어 감지 로직 추가를 환영합니다.

### 규칙 템플릿 개선
`packages/core/src/generateRules/` — 각 빌더 함수에 PR을 보내주세요.

## 코드 컨벤션

- `any` 타입 금지 — `unknown` + narrowing 사용
- 주석은 WHY만 (WHAT은 코드가 설명)
- 커밋 메시지: `feat:` / `fix:` / `chore:` / `docs:` / `refactor:`

## 패키지 경계

- `packages/core` — Node.js / 브라우저 양쪽 호환. VS Code API / DOM API 직접 의존 금지
- `apps/extension` — `vscode` 모듈 전용
- `apps/webview` — `acquireVsCodeApi()`로만 extension과 통신
- `services/workers` — LLM API 키는 Workers 환경변수에만
