export type Locale = 'en' | 'ko'

export interface GeneratedLocale {
  claude: {
    title: string
    techStack: string
    labelLang: string
    labelFw: string
    labelPm: string
    noFw: string
    buildCmds: string
    projectStructure: string
    codeRules: string
    typing: string
    typingPublicApi: string
    paradigm: string
    commentsSection: string
    security: string
    testingSection: string
    testingGeneric: string
    aiWorkflowTitle: string
    enterManually: string
    typeStrict: string
    typeMod: string
    typeLoose: string
    pdgmFunctional: string
    pdgmOop: string
    pdgmMixed: string
    cmntNone: string
    cmntJsdoc: string
    cmntMinimal: string
    secApiKey: string
    secUserInput: string
    cmdDevServer: string
    cmdProdBuild: string
    cmdLint: string
    cmdTest: string
    cmdRun: string
    cmdBuild: string
    fwNextjs: { title: string; rules: string }
    fwReact: { title: string; rules: string }
    fwVue: { title: string; rules: string }
    fwNestjs: { title: string; rules: string }
    fwFirebase: { title: string; rules: string }
    fwExpress: { title: string; rules: string }
    fwSvelte: { title: string; rules: string }
    fwNuxt: { title: string; rules: string }
    orm: { title: string; rules: string }
    fwDjango: { title: string; rules: string }
    fwFastApi: { title: string; rules: string }
  }
  agents: {
    title: string
    preReasoningTitle: string
    preReasoningBody: string
    noOmissionTitle: string
    noOmissionBody: string
    rolesTitle: string
    plannerTitle: string
    plannerRules: string
    implTitle: string
    implRules: string
    reviewerTitle: string
    reviewerRules: string
    reviewerStackTitle: string
    autonomyTitle: string
    autonomyAskFirst: string
    autonomyProceed: string
    autonomyAutonomous: string
    contextTitle: string
    contextLang: string
    contextFw: string
    contextNoFw: string
  }
}

const en: GeneratedLocale = {
  claude: {
    title: '# Project Guidelines',
    techStack: '## Tech Stack',
    labelLang: '**Language**',
    labelFw: '**Framework**',
    labelPm: '**Package Manager**',
    noFw: 'not detected',
    buildCmds: '## Build Commands',
    projectStructure: '## Project Structure',
    codeRules: '## Code Rules',
    typing: '### Typing',
    typingPublicApi: '- All public API types must be explicit.',
    paradigm: '### Paradigm',
    commentsSection: '### Comments',
    security: '### Security',
    testingSection: '## Testing',
    testingGeneric:
      '- Co-locate unit tests with source files (`*.test.ts`).\n- Test behavior, not implementation details.\n- Mock only external dependencies (network, filesystem, DB).',
    aiWorkflowTitle: '## Working with this Codebase',
    enterManually: 'Enter build commands manually.',
    typeStrict: '- No `any`. Use `unknown` + narrowing for uncertain types.',
    typeMod: '- `any` allowed only at external API boundaries.',
    typeLoose: '- Add type annotations where needed.',
    pdgmFunctional: '- Pure functions first. Isolate side-effects at boundaries.',
    pdgmOop: '- Class-based encapsulation. Single responsibility principle.',
    pdgmMixed: '- Mix functional/OOP as context demands.',
    cmntNone: '- No comments. Let the code speak for itself.',
    cmntJsdoc: '- JSDoc required on public APIs. Internal code: WHY only.',
    cmntMinimal: '- Comments explain WHY, not WHAT.',
    secApiKey: '- API keys in environment variables only. Never hardcode.',
    secUserInput: '- Validate user input only at system boundaries.',
    cmdDevServer: '# dev server',
    cmdProdBuild: '# production build',
    cmdLint: '# lint',
    cmdTest: '# test',
    cmdRun: '# run',
    cmdBuild: '# build',
    fwNextjs: {
      title: '### Next.js',
      rules: [
        '- App Router only — never mix with Pages Router patterns.',
        '- `"use client"` only for event handlers, browser APIs, or hooks. Everything else is a Server Component.',
        '- Data fetching in Server Components via `fetch()` with cache options, or via Server Actions (`"use server"`).',
        '- Route handlers in `app/api/**/route.ts` — validate input with Zod, return `NextResponse.json()`.',
        '- `NEXT_PUBLIC_` prefix required for browser-exposed env vars.',
        '- `next/image` for all images; `next/link` for all internal navigation.',
        '- Add `loading.tsx` and `error.tsx` for every new route segment.',
        '- Metadata: use `generateMetadata()` or the `metadata` export — never `<Head>` from Pages Router.',
      ].join('\n'),
    },
    fwReact: {
      title: '### React',
      rules: [
        '- Functional components + Hooks only. No class components.',
        '- Keep components under 150 lines — extract sub-components or custom hooks when needed.',
        '- Lift state only as high as necessary — co-locate state with the component that owns it.',
        '- `key` in lists must be stable IDs, never array indexes.',
        '- Avoid prop drilling beyond 2 levels — use Context or a dedicated state library.',
        '- `useMemo` / `useCallback` only when a profiler reveals a real bottleneck.',
      ].join('\n'),
    },
    fwVue: {
      title: '### Vue',
      rules: [
        '- Composition API with `<script setup>` only. No Options API.',
        '- Composables in `composables/` directory, prefixed with `use`.',
        '- `defineProps` / `defineEmits` with TypeScript generics — no runtime-only declarations.',
        '- Never mutate props directly — emit events upward.',
        '- `v-for` always requires `:key` with stable IDs.',
        '- Async data: Pinia actions or `useAsyncData` (Nuxt) — not raw `fetch` inside `setup()`.',
      ].join('\n'),
    },
    fwNestjs: {
      title: '### NestJS',
      rules: [
        '- One module per domain feature — encapsulate providers, controllers, and exports.',
        '- Controllers are thin routers only — all business logic in `*.service.ts`.',
        '- Validate all incoming data with `class-validator` DTOs + `ValidationPipe`.',
        '- Use constructor-based DI. Never instantiate services with `new`.',
        '- Guards for authentication/authorization, Interceptors for logging/transform, Pipes for validation.',
        '- No circular dependencies — restructure via a shared module if needed.',
      ].join('\n'),
    },
    fwFirebase: {
      title: '### Firebase',
      rules: [
        '- All Firestore/Auth/Storage calls go through a single `services/firebase.ts` module.',
        '- Write Firestore security rules before writing client code — never rely solely on client-side checks.',
        '- Use `serverTimestamp()` — never `new Date()` for Firestore timestamps.',
        '- Batch writes (`writeBatch`) for 3+ related document mutations.',
        '- Real-time listeners must be unsubscribed in cleanup to prevent memory leaks.',
        '- Offline: enable persistence only if UX requires it — it adds complexity.',
      ].join('\n'),
    },
    fwExpress: {
      title: '### Express',
      rules: [
        '- Route handlers delegate to controller/service functions — keep them thin.',
        '- Centralized error handling via a single `errorHandler` middleware registered last.',
        '- Never trust `req.body` without validation (use `zod`, `joi`, or `express-validator`).',
        '- Async route handlers must catch errors and call `next(err)` — or wrap with `express-async-handler`.',
        '- Group routes by domain in separate `routers/` files.',
      ].join('\n'),
    },
    fwSvelte: {
      title: '### Svelte / SvelteKit',
      rules: [
        '- Load data in `+page.server.ts` (server) or `+page.ts` (universal) — not in component `onMount`.',
        '- Form actions in `+page.server.ts` for mutations.',
        '- Stores for shared state across components — use `$` auto-subscription syntax.',
        '- `$effect` replaces `onMount`/reactive statements in Svelte 5 — prefer it.',
        '- Never import server-only code into `+page.ts` (runs on client too).',
      ].join('\n'),
    },
    fwNuxt: {
      title: '### Nuxt',
      rules: [
        '- `useAsyncData` / `useFetch` for data fetching — not raw `fetch` in `setup()`.',
        '- Auto-imports are active — no need to import `ref`, `computed`, composables, or components.',
        '- Server routes in `server/api/` — use `defineEventHandler` and `readBody`.',
        '- Env vars: `NUXT_PUBLIC_` for browser-safe, `NUXT_` for server-only.',
        '- Plugins in `plugins/` for global setup; middleware in `middleware/` for route guards.',
      ].join('\n'),
    },
    orm: {
      title: '### {orm}',
      rules: [
        '- All DB access through a dedicated `repositories/` or `services/` layer — never from route handlers directly.',
        '- Never edit generated migration files manually.',
        '- Use transactions for any multi-step write: `prisma.$transaction([...])` or `db.transaction()`.',
        '- Always specify `select` / `include` to avoid over-fetching.',
        '- Run `generate` after schema changes before starting the dev server.',
      ].join('\n'),
    },
    fwDjango: {
      title: '### Django',
      rules: [
        '- Apps represent bounded domains — keep each app small and focused.',
        '- Business logic in `services.py` — not in `views.py` or `models.py`.',
        '- Use the Django ORM exclusively. Raw SQL only when ORM cannot express the query.',
        '- DRF serializers validate all input — never trust `request.data` directly.',
        '- Signals for cross-app side effects; avoid tight coupling between app modules.',
        '- `select_related` / `prefetch_related` to prevent N+1 query problems.',
      ].join('\n'),
    },
    fwFastApi: {
      title: '### FastAPI',
      rules: [
        '- Pydantic v2 models for all request/response schemas.',
        '- Route handlers delegate to service functions — keep handlers thin.',
        '- `Depends()` for dependency injection: DB sessions, auth verification, shared config.',
        '- `async def` for I/O-bound routes; plain `def` for CPU-bound (FastAPI runs it in a threadpool).',
        '- Use `lifespan` context manager for startup/shutdown logic — `@app.on_event` is deprecated.',
        '- `HTTPException` with explicit `status_code` for all error responses.',
      ].join('\n'),
    },
  },
  agents: {
    title: '# AGENTS.md — Agent Collaboration Guidelines',
    preReasoningTitle: '## Pre-Reasoning (Required Before Every Task)',
    preReasoningBody: `Reason step-by-step before starting:
1. **Goal**: What does this change achieve?
2. **Scope**: Which files/modules are affected?
3. **Side effects**: Does this break existing behavior?
4. **Minimal change**: Do only what the goal requires.`,
    noOmissionTitle: '## No Code Omission',
    noOmissionBody: `- Never write \`// ... rest of code\`, \`// TODO\`, or \`// omitted\`.
- Modified functions must be shown in full.
- Never present partial files — always complete.`,
    rolesTitle: '## Agent Roles',
    plannerTitle: '### Planner',
    plannerRules:
      '- Analyze requirements. List files and change order.\n- Does not write code directly.',
    implTitle: '### Implementer',
    implRules:
      "- Write code based solely on the Planner's plan.\n- No unsolicited refactoring.",
    reviewerTitle: '### Reviewer',
    reviewerRules:
      '- Check security vulnerabilities, type safety, performance.\n- Route issues back to Implementer.',
    reviewerStackTitle: '### Stack-Specific Review Checklist',
    autonomyTitle: '## Autonomy Level',
    autonomyAskFirst: '- Present a plan and get approval before implementing.',
    autonomyProceed:
      '- Small changes: proceed directly. 3+ file changes: present plan first.',
    autonomyAutonomous:
      '- Implement immediately for clear requirements. Summarize after completion.',
    contextTitle: '## Project Context',
    contextLang: '**Language**',
    contextFw: '**Framework**',
    contextNoFw: 'none',
  },
}

const ko: GeneratedLocale = {
  claude: {
    title: '# 프로젝트 가이드라인',
    techStack: '## 기술 스택',
    labelLang: '**언어**',
    labelFw: '**프레임워크**',
    labelPm: '**패키지 매니저**',
    noFw: '미감지',
    buildCmds: '## 빌드 명령어',
    projectStructure: '## 프로젝트 구조',
    codeRules: '## 코드 규칙',
    typing: '### 타이핑',
    typingPublicApi: '- 모든 public API 타입은 명시적으로 정의.',
    paradigm: '### 패러다임',
    commentsSection: '### 주석',
    security: '### 보안',
    testingSection: '## 테스팅',
    testingGeneric:
      '- 단위 테스트는 소스 파일 옆에 위치 (`*.test.ts`).\n- 구현이 아닌 동작을 테스트.\n- 외부 의존성(네트워크, 파일시스템, DB)만 모킹.',
    aiWorkflowTitle: '## 이 코드베이스와 협업하기',
    enterManually: '빌드 명령어를 직접 입력해주세요.',
    typeStrict: '- `any` 금지. 불확실한 타입은 `unknown` + narrowing.',
    typeMod: '- `any`는 외부 API 경계에서만 허용.',
    typeLoose: '- 타입은 필요한 곳에 명시.',
    pdgmFunctional: '- 순수 함수 우선. 사이드이펙트는 경계로 격리.',
    pdgmOop: '- 클래스 기반 캡슐화. 단일 책임 원칙.',
    pdgmMixed: '- 함수형/OOP 혼용. 컨텍스트에 맞게 선택.',
    cmntNone: '- 주석 금지. 코드가 스스로 설명하게.',
    cmntJsdoc: '- public API는 JSDoc 필수. 내부 로직은 WHY만.',
    cmntMinimal: '- 주석은 WHY만. WHAT은 코드 자체가 설명.',
    secApiKey: '- API 키는 환경변수로만. 코드 하드코딩 절대 금지.',
    secUserInput: '- 사용자 입력은 시스템 경계에서만 검증.',
    cmdDevServer: '# 개발 서버',
    cmdProdBuild: '# 프로덕션 빌드',
    cmdLint: '# 린트',
    cmdTest: '# 테스트',
    cmdRun: '# 실행',
    cmdBuild: '# 빌드',
    fwNextjs: {
      title: '### Next.js',
      rules: [
        '- App Router만 사용. Pages Router 패턴과 절대 혼용 금지.',
        '- `"use client"`는 이벤트 핸들러·브라우저 API·Hook이 필요한 경우만. 나머지는 Server Component.',
        '- 데이터 페칭은 Server Component (`fetch()` + cache 옵션) 또는 Server Action (`"use server"`).',
        '- Route Handler는 `app/api/**/route.ts` — Zod로 입력 검증 후 `NextResponse.json()` 반환.',
        '- 브라우저에 노출되는 환경변수는 `NEXT_PUBLIC_` 접두사 필수.',
        '- 이미지는 `next/image`, 내부 링크는 `next/link` 사용.',
        '- 새 Route Segment마다 `loading.tsx`와 `error.tsx` 추가.',
        '- 메타데이터: `generateMetadata()` 또는 `metadata` export 사용. Pages Router의 `<Head>` 금지.',
      ].join('\n'),
    },
    fwReact: {
      title: '### React',
      rules: [
        '- 함수형 컴포넌트 + Hooks만 사용. 클래스 컴포넌트 금지.',
        '- 컴포넌트는 150줄 이하 유지. 초과 시 서브 컴포넌트나 커스텀 Hook으로 분리.',
        '- 상태는 필요한 최소 레벨에서 관리. 불필요한 상태 끌어올리기 금지.',
        '- 리스트의 `key`는 안정적인 ID 사용. 배열 인덱스 금지.',
        '- prop drilling 2단계 초과 시 Context 또는 상태 라이브러리 사용.',
        '- `useMemo` / `useCallback`은 프로파일러로 병목 확인 후에만 적용.',
      ].join('\n'),
    },
    fwVue: {
      title: '### Vue',
      rules: [
        '- Composition API + `<script setup>` 만 사용. Options API 금지.',
        '- Composable은 `composables/` 디렉토리에 위치, `use` 접두사 사용.',
        '- `defineProps` / `defineEmits`는 TypeScript 제네릭 방식으로 선언.',
        '- props 직접 변경 금지. 이벤트를 위로 emit.',
        '- `v-for`는 항상 안정적인 ID로 `:key` 설정.',
        '- 비동기 데이터: Pinia action 또는 `useAsyncData` 사용. `setup()` 내 raw fetch 금지.',
      ].join('\n'),
    },
    fwNestjs: {
      title: '### NestJS',
      rules: [
        '- 도메인 기능별로 하나의 모듈. provider·controller·export를 모듈 내에 캡슐화.',
        '- Controller는 얇은 라우터 역할만. 모든 비즈니스 로직은 `*.service.ts`에.',
        '- 모든 입력 데이터는 `class-validator` DTO + `ValidationPipe`로 검증.',
        '- 생성자 DI만 사용. `new`로 서비스 직접 생성 금지.',
        '- 인증/인가는 Guard, 로깅/변환은 Interceptor, 검증은 Pipe.',
        '- 순환 의존성 발생 시 공유 모듈로 구조 변경.',
      ].join('\n'),
    },
    fwFirebase: {
      title: '### Firebase',
      rules: [
        '- Firestore/Auth/Storage 직접 호출은 `services/firebase.ts` 한 곳에서만.',
        '- 클라이언트 코드 작성 전에 Firestore 보안 규칙 먼저 작성. 클라이언트 검증만 믿으면 안 됨.',
        '- Firestore 타임스탬프는 `serverTimestamp()` 사용. `new Date()` 금지.',
        '- 관련 문서 3개 이상 동시 쓰기는 `writeBatch` 사용.',
        '- 리얼타임 리스너는 반드시 cleanup에서 구독 해제 (메모리 누수 방지).',
        '- 오프라인 persistence는 UX상 필요한 경우에만 활성화 — 복잡도 증가 주의.',
      ].join('\n'),
    },
    fwExpress: {
      title: '### Express',
      rules: [
        '- Route Handler는 Controller/Service 함수에 위임. 얇게 유지.',
        '- 에러 처리는 마지막에 등록하는 단일 `errorHandler` 미들웨어로 중앙화.',
        '- `req.body`는 검증 없이 절대 신뢰 금지 (zod, joi, express-validator 사용).',
        '- async Route Handler는 반드시 `next(err)` 호출 또는 `express-async-handler`로 래핑.',
        '- 라우트는 도메인별로 `routers/` 디렉토리에 분리.',
      ].join('\n'),
    },
    fwSvelte: {
      title: '### Svelte / SvelteKit',
      rules: [
        '- 데이터 로딩은 `+page.server.ts` (서버) 또는 `+page.ts` (유니버설). `onMount` 내 fetch 금지.',
        '- mutation은 `+page.server.ts`의 Form Action 사용.',
        '- 컴포넌트 간 공유 상태는 Svelte Store + `$` 자동 구독 문법.',
        '- Svelte 5: `$effect`가 `onMount`/reactive 문을 대체.',
        '- `+page.ts`에 서버 전용 코드 import 금지 (클라이언트에서도 실행됨).',
      ].join('\n'),
    },
    fwNuxt: {
      title: '### Nuxt',
      rules: [
        '- 데이터 페칭은 `useAsyncData` / `useFetch` 사용. `setup()` 내 raw fetch 금지.',
        '- Auto-import 활성화 — `ref`, `computed`, composable, 컴포넌트 직접 import 불필요.',
        '- Server Route는 `server/api/` 내 `defineEventHandler`와 `readBody`로 작성.',
        '- 환경변수: 브라우저 노출은 `NUXT_PUBLIC_`, 서버 전용은 `NUXT_`.',
        '- 전역 설정은 `plugins/`, 라우트 가드는 `middleware/`에 위치.',
      ].join('\n'),
    },
    orm: {
      title: '### {orm}',
      rules: [
        '- DB 접근은 전용 `repositories/` 또는 `services/` 레이어에서만. Route Handler 직접 접근 금지.',
        '- 마이그레이션 파일 직접 편집 절대 금지.',
        '- 멀티 스텝 쓰기는 트랜잭션 사용: `prisma.$transaction([...])` 또는 `db.transaction()`.',
        '- 항상 `select` / `include` 명시 — 전체 레코드 over-fetch 금지.',
        '- 스키마 변경 후 반드시 `generate` 실행 후 서버 재시작.',
      ].join('\n'),
    },
    fwDjango: {
      title: '### Django',
      rules: [
        '- 앱은 경계가 명확한 도메인 단위로 분리. 작고 집중적으로 유지.',
        '- 비즈니스 로직은 `services.py`에. `views.py`나 `models.py`에 넣지 말 것.',
        '- DB 접근은 Django ORM 전용. ORM으로 표현 불가한 경우만 raw SQL 허용.',
        '- DRF Serializer로 모든 입력 검증. `request.data` 직접 신뢰 금지.',
        '- 앱 간 사이드이펙트는 Signal 사용. 앱 간 직접 의존 금지.',
        '- N+1 방지: `select_related` / `prefetch_related` 적극 활용.',
      ].join('\n'),
    },
    fwFastApi: {
      title: '### FastAPI',
      rules: [
        '- 모든 요청/응답 스키마에 Pydantic v2 모델 사용.',
        '- Route Handler는 Service 함수에 위임. 얇게 유지.',
        '- `Depends()`로 의존성 주입: DB 세션, 인증, 공유 설정.',
        '- I/O 바운드 라우트는 `async def`, CPU 바운드는 `def` (FastAPI가 threadpool 실행).',
        '- 시작/종료 로직은 `lifespan` context manager 사용. `@app.on_event` deprecated.',
        '- 에러 응답은 명시적 `status_code`가 있는 `HTTPException` 사용.',
      ].join('\n'),
    },
  },
  agents: {
    title: '# AGENTS.md — 에이전트 협업 지침',
    preReasoningTitle: '## 사전 추론 (작업 시작 전 필수)',
    preReasoningBody: `작업 전 반드시 순서대로 추론하라:
1. **목적**: 이 변경이 무엇을 달성하는가?
2. **범위**: 어떤 파일/모듈이 영향을 받는가?
3. **부작용**: 기존 동작을 깨뜨리는가?
4. **최소 변경**: 목적 달성에 필요한 최소 코드만 수행.`,
    noOmissionTitle: '## 코드 생략 금지',
    noOmissionBody: `- \`// ... rest of code\`, \`// TODO\`, \`// 생략\` 절대 금지.
- 수정한 함수는 전체 코드를 반드시 포함.
- 파일 일부만 제시하는 것 금지 — 항상 완전한 형태로.`,
    rolesTitle: '## 에이전트 역할',
    plannerTitle: '### Planner',
    plannerRules: '- 요구사항 분석 후 파일 목록·변경 순서 명시.\n- 코드를 직접 작성하지 않음.',
    implTitle: '### Implementer',
    implRules: '- Planner 계획에만 근거해 코드 작성.\n- 계획에 없는 리팩토링 금지.',
    reviewerTitle: '### Reviewer',
    reviewerRules:
      '- 보안 취약점, 타입 안전성, 성능 이슈 검토.\n- 문제 발견 시 Implementer로 피드백.',
    reviewerStackTitle: '### 스택별 리뷰 체크리스트',
    autonomyTitle: '## 자율성 수준',
    autonomyAskFirst: '- 구현 전 반드시 계획을 제시하고 승인을 받을 것.',
    autonomyProceed: '- 소규모 변경은 바로 진행. 파일 3개 이상 수정 시 계획 먼저 제시.',
    autonomyAutonomous: '- 명확한 요구사항이면 바로 구현. 완료 후 요약 보고.',
    contextTitle: '## 프로젝트 컨텍스트',
    contextLang: '**언어**',
    contextFw: '**프레임워크**',
    contextNoFw: '없음',
  },
}

export const locales: Record<Locale, GeneratedLocale> = { en, ko }

export function getLocaleStrings(locale: Locale): GeneratedLocale {
  return locales[locale]
}
