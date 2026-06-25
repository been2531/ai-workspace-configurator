# AI Workspace Configurator — 개발 가이드라인

## 프로젝트 개요
VS Code 확장 프로그램 기반 AI 워크스페이스 오케스트레이터.
개발자가 프로젝트를 열면 Claude Code / Codex 성능을 극대화하는 지침서를 자동 생성·주입한다.

## 모노레포 구조

```
apps/extension/   VS Code Extension 코어 엔진 (TypeScript → CommonJS)
apps/webview/     확장 내부 UI (React 18 + Vite + Tailwind CSS)
packages/core/    generateRules 엔진 + 템플릿 — extension·webview 공용
services/workers/ Cloudflare Workers (LLM 프록시, 팀 동기화)
```

## 빌드 명령어

```bash
pnpm install              # 전체 의존성 설치
pnpm build                # 전체 빌드 (turbo)
pnpm dev                  # webview 개발 서버
pnpm dev:ext              # extension watch 빌드
pnpm lint                 # 전체 lint
pnpm test                 # 전체 테스트
pnpm --filter extension build   # 확장 단독 빌드
pnpm --filter webview dev       # webview 단독 실행
pnpm --filter core build        # core 단독 빌드
```

## 코드 스타일 규칙

### 1. 타이핑
- `any` 금지. 불확실한 타입은 `unknown` + narrowing.
- 모든 public API는 `packages/core/src/types.ts`에 타입 정의.
- VS Code API는 `@types/vscode`만 사용, 직접 `require('vscode')` 금지.

### 2. 패키지 경계
- `packages/core`는 Node.js / 브라우저 양쪽에서 동작해야 함 — VS Code API, DOM API 직접 의존 금지.
- `apps/extension`만 `vscode` 모듈에 접근 가능.
- `apps/webview`는 VS Code `acquireVsCodeApi()`로만 extension과 통신.

### 3. generateRules 엔진 원칙
- 파일 I/O는 extension 레이어에서 수행 후 core에 데이터만 전달.
- core는 순수 함수(입력 → 출력) 형태로 규칙 문자열을 반환.
- 템플릿은 `packages/core/src/generateRules/templates/` 에 스택별로 분리.

### 4. Workers
- LLM API 키는 Workers 환경변수에만 존재, 클라이언트로 절대 노출 금지.
- 모든 외부 LLM 호출은 `services/workers/src/` 경유.

### 5. 커밋 컨벤션
```
feat:  새 기능
fix:   버그 수정
chore: 설정·빌드·의존성
docs:  문서
refactor: 로직 변경(기능 추가 없음)
```

## 무료 티어 운영 원칙
- Firebase Spark 플랜 (Firestore + Auth) — 서버 비용 0원.
- Cloudflare Workers Free (10만 req/일) — 프록시 비용 0원.
- 스택 감지·규칙 생성은 100% 로컬 연산 — AI API 비용 0원.
- 유료($7/월) 기능만 Workers → LLM 경유.
