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
    codeRules: string
    typing: string
    typingPublicApi: string
    paradigm: string
    commentsSection: string
    security: string
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
    codeRules: '## Code Rules',
    typing: '### Typing',
    typingPublicApi: '- All public API types must be explicit.',
    paradigm: '### Paradigm',
    commentsSection: '### Comments',
    security: '### Security',
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
      rules:
        '- Define Server/Client Component boundaries explicitly.\n- Follow `NEXT_PUBLIC_` convention for env vars.\n- Prefer data fetching in Server Components.',
    },
    fwReact: {
      title: '### React',
      rules:
        '- Functional components + Hooks only.\n- Isolate side-effects in `useEffect`.\n- Split components that exceed 150 lines.',
    },
    fwVue: {
      title: '### Vue',
      rules: '- Use Composition API.\n- Prefer `<script setup>`.',
    },
    fwNestjs: {
      title: '### NestJS',
      rules: '- Encapsulate by module.\n- Business logic in service layer only.',
    },
    fwFirebase: {
      title: '### Firebase',
      rules:
        '- All SDK calls go through `services/firebase.ts`.\n- No direct calls from components.',
    },
    orm: {
      title: '### {orm}',
      rules:
        '- Isolate DB access in a dedicated repository layer.\n- Never edit migration files manually.',
    },
    fwDjango: {
      title: '### Django',
      rules: '- Business logic in services, not views.\n- Use Django ORM exclusively for DB access.',
    },
    fwFastApi: {
      title: '### FastAPI',
      rules:
        '- Pydantic models for all request/response schemas.\n- Route handlers delegate to service functions.',
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
      "- Analyze requirements. List files and change order.\n- Does not write code directly.",
    implTitle: '### Implementer',
    implRules:
      "- Write code based solely on the Planner's plan.\n- No unsolicited refactoring.",
    reviewerTitle: '### Reviewer',
    reviewerRules:
      '- Check security vulnerabilities, type safety, performance.\n- Route issues back to Implementer.',
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
    codeRules: '## 코드 규칙',
    typing: '### 타이핑',
    typingPublicApi: '- 모든 public API 타입은 명시적으로 정의.',
    paradigm: '### 패러다임',
    commentsSection: '### 주석',
    security: '### 보안',
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
      rules:
        '- Server / Client Component 경계를 명확히.\n- 환경변수는 `NEXT_PUBLIC_` 규칙 준수.\n- 데이터 페칭은 Server Component 우선.',
    },
    fwReact: {
      title: '### React',
      rules:
        '- 함수형 컴포넌트 + Hooks만 사용.\n- 사이드이펙트는 `useEffect`로 격리.\n- 150줄 초과 컴포넌트는 분리.',
    },
    fwVue: {
      title: '### Vue',
      rules: '- Composition API 사용.\n- `<script setup>` 권장.',
    },
    fwNestjs: {
      title: '### NestJS',
      rules: '- 모듈 단위 캡슐화.\n- 서비스 레이어에서만 비즈니스 로직.',
    },
    fwFirebase: {
      title: '### Firebase',
      rules:
        '- SDK 직접 호출은 `services/firebase.ts`에서만.\n- 컴포넌트에서 직접 호출 금지.',
    },
    orm: {
      title: '### {orm}',
      rules: '- DB 접근은 전용 repository 레이어로 격리.\n- 마이그레이션 파일은 직접 편집 금지.',
    },
    fwDjango: {
      title: '### Django',
      rules: '- 비즈니스 로직은 views가 아닌 services에.\n- DB 접근은 Django ORM만 사용.',
    },
    fwFastApi: {
      title: '### FastAPI',
      rules:
        '- 모든 요청/응답 스키마에 Pydantic 모델 사용.\n- 라우트 핸들러는 서비스 함수에 위임.',
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
    reviewerRules: '- 보안 취약점, 타입 안전성, 성능 이슈 검토.\n- 문제 발견 시 Implementer로 피드백.',
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
