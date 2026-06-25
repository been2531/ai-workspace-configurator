const { initializeApp, cert } = require('firebase-admin/app')
const { getFirestore, FieldValue } = require('firebase-admin/firestore')
const serviceAccount = require('../service-account.json')

initializeApp({ credential: cert(serviceAccount) })
const admin = { firestore: { FieldValue } }

const db = getFirestore()

const PRESETS = [
  {
    name: 'Karpathy Agent OS',
    author: 'karpathy',
    authorUid: 'seed',
    description: 'LLM OS 기반 멀티에이전트 사전 추론 시스템. 강력한 추론과 코드 생략 금지 가드레일.',
    tags: ['claude-code', 'multi-agent', 'reasoning', 'karpathy'],
    overrides: {
      agentsMd: `# AGENTS.md — Karpathy Agent OS

## LLM OS 사전 추론 프로토콜

작업 전 반드시 순서대로 추론하라:

<think>
1. 이 변경의 목적은 무엇인가?
2. 시스템의 어떤 부분이 영향을 받는가?
3. 무엇이 잘못될 수 있는가?
4. 최소한의 변경으로 목적을 달성하는 방법은?
</think>

## 에이전트 계층 (LLM OS)

| 계층 | 역할 |
|------|------|
| System Agent | 아키텍처 결정, 불변 제약 정의 |
| Planner | 요구사항 → 구현 계획 |
| Implementer | 계획 → 코드 |
| Critic | 코드 → 검토 및 피드백 |

## 절대 금지

- 코드 생략 (\`// ...\`, \`// rest\`) 절대 금지
- 계획 없는 대규모 변경 금지
- 타입 단언(\`as any\`) 금지
`,
    },
    stars: 0,
    appliedCount: 0,
    isPublic: true,
  },
  {
    name: 'Minimal',
    author: 'built-in',
    authorUid: 'seed',
    description: '최소한의 지침. 에이전트 자율성 최대화.',
    tags: ['minimal', 'autonomous', 'claude-code'],
    overrides: {
      agentsMd: `# AGENTS.md

## 원칙
- 명확하면 바로 구현.
- 불명확하면 핵심 질문 하나만.
- 완료 후 간결하게 보고.
`,
    },
    stars: 0,
    appliedCount: 0,
    isPublic: true,
  },
  {
    name: 'Strict TypeScript',
    author: 'community',
    authorUid: 'seed',
    description: 'any 완전 금지, 모든 타입 명시, Zod 런타임 검증 강제.',
    tags: ['typescript', 'strict', 'zod', 'claude-code'],
    overrides: {
      claudeMd: `# 프로젝트 가이드라인 — Strict TypeScript

## 타입 규칙
- any 완전 금지. unknown + narrowing 필수.
- 외부 API 응답은 반드시 Zod 스키마로 검증.
- 모든 함수 반환 타입 명시.
- as 단언 금지 (테스트 코드 제외).

## 에러 처리
- Result<T, E> 패턴 또는 명시적 throw.
- unhandled promise rejection 금지.
`,
    },
    stars: 0,
    appliedCount: 0,
    isPublic: true,
  },
  {
    name: 'Next.js App Router',
    author: 'community',
    authorUid: 'seed',
    description: 'Next.js 14+ App Router 전용. Server/Client 경계, 데이터 페칭 패턴 명시.',
    tags: ['nextjs', 'react', 'typescript', 'app-router'],
    overrides: {
      claudeMd: `# 프로젝트 가이드라인 — Next.js App Router

## 컴포넌트 원칙
- Server Component 기본. 상태/이벤트 필요 시만 'use client'.
- 데이터 페칭은 Server Component에서. Client에서 fetch 금지.
- Loading UI는 loading.tsx, 에러는 error.tsx로 분리.

## 파일 구조
- app/ 라우트 폴더별 page.tsx / layout.tsx
- components/ 재사용 컴포넌트 (ui/, features/ 분리)
- lib/ 유틸, 서버 액션, DB 쿼리

## 환경변수
- NEXT_PUBLIC_ 없으면 서버 전용 — 클라이언트 접근 불가.
`,
    },
    stars: 0,
    appliedCount: 0,
    isPublic: true,
  },
]

async function seed() {
  console.log('🌱 Firestore 시드 시작...\n')
  const ref = db.collection('presets')

  for (const preset of PRESETS) {
    const doc = await ref.add({
      ...preset,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    })
    console.log(`✅ ${preset.name.padEnd(25)} → ${doc.id}`)
  }

  console.log('\n🎉 시드 완료!')
  process.exit(0)
}

seed().catch((e) => {
  console.error('❌ 실패:', e.message)
  process.exit(1)
})
