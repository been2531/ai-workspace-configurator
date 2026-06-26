import { initializeApp, getApps } from 'firebase/app'
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
} from 'firebase/firestore'
import type { CommunityPreset, PresetSummary } from '@ai-workspace-configurator/core'

const FIREBASE_CONFIG = {
  apiKey:            'AIzaSyDzJaOqjPshPFJ4_6ES5AVmlthzPgokzFA',
  authDomain:        'ai-workspace-configurator.firebaseapp.com',
  projectId:         'ai-workspace-configurator',
  storageBucket:     'ai-workspace-configurator.firebasestorage.app',
  messagingSenderId: '1039429232744',
  appId:             '1:1039429232744:web:99d3686654de3e347f33dd',
}

function getApp() {
  return getApps().length === 0 ? initializeApp(FIREBASE_CONFIG) : getApps()[0]
}

// ─── 번들 프리셋 ──────────────────────────────────────────────────────────────

export const BUNDLED_PRESETS: CommunityPreset[] = [
  {
    id: 'karpathy/agent-os',
    name: 'Karpathy Agent OS',
    author: 'karpathy',
    description: 'LLM OS 기반 멀티에이전트 사전 추론 시스템.',
    tags: ['claude-code', 'multi-agent', 'reasoning'],
    overrides: {
      agentsMd: `# AGENTS.md — Karpathy Agent OS

## LLM OS Pre-Reasoning Protocol

Before every task, reason step-by-step:

<think>
1. What is the purpose of this change?
2. Which parts of the system are affected?
3. What could go wrong?
4. What is the minimal change to achieve the goal?
</think>

## Agent Hierarchy

| Layer | Role |
|-------|------|
| System Agent | Architecture decisions, defines invariants |
| Planner | Requirements → implementation plan |
| Implementer | Plan → code |
| Critic | Code → review and feedback |

## Absolute Prohibitions

- No code omission (\`// ...\`, \`// rest\`) ever
- No large-scale changes without a plan
- No type assertions (\`as any\`)
`,
    },
  },
  {
    id: 'minimal',
    name: 'Minimal',
    author: 'built-in',
    description: 'Minimal guidelines. Maximum agent autonomy.',
    tags: ['minimal', 'autonomous'],
    overrides: {
      agentsMd: `# AGENTS.md\n\n## Principles\n- If clear, implement directly.\n- If unclear, ask one core question.\n- Report concisely after completion.\n`,
    },
  },
  {
    id: 'strict-typescript',
    name: 'Strict TypeScript',
    author: 'built-in',
    description: '엄격한 TypeScript 프로젝트를 위한 규칙 강화 프리셋.',
    tags: ['typescript', 'strict', 'type-safety'],
    overrides: {
      claudeMd: `# Project Guidelines

## Code Rules

### Typing
- No \`any\` anywhere — use \`unknown\` + type narrowing.
- No type assertions (\`as X\`) except at boundaries with explicit comments.
- All function parameters and return types must be explicitly typed.
- Prefer \`readonly\` arrays and object properties.

### Error Handling
- Never swallow errors silently — always log or rethrow.
- Use discriminated unions for error states, not \`throw\` in business logic.
- \`Result<T, E>\` pattern preferred over exceptions.

### Paradigm
- Pure functions first. Side-effects isolated at system boundaries.
- No global mutable state.

### Security
- API keys in environment variables only. Never hardcode.
- Validate all user input at system boundaries.
`,
    },
  },
]

function toSummary(preset: CommunityPreset, stars = 0, isBuiltIn = false): PresetSummary {
  return {
    id: preset.id,
    name: preset.name,
    author: preset.author,
    description: preset.description,
    tags: preset.tags,
    stars,
    isBuiltIn,
    overrideKeys: Object.keys(preset.overrides),
  }
}

// ─── 검색 ─────────────────────────────────────────────────────────────────────

export async function searchPresets(queryStr: string): Promise<PresetSummary[]> {
  const bundled = BUNDLED_PRESETS.map((p) => toSummary(p, 0, true))

  try {
    const db = getFirestore(getApp())
    const ref = collection(db, 'presets')
    const trimmed = queryStr.trim().toLowerCase()
    const q = trimmed
      ? query(
          ref,
          where('isPublic', '==', true),
          where('tags', 'array-contains', trimmed),
          orderBy('stars', 'desc'),
          limit(15),
        )
      : query(ref, where('isPublic', '==', true), orderBy('stars', 'desc'), limit(15))

    const snapshot = await getDocs(q)
    const community: PresetSummary[] = snapshot.docs.map((d) => {
      const data = d.data() as CommunityPreset & { stars?: number }
      return {
        id: d.id,
        name: data.name,
        author: data.author,
        description: data.description,
        tags: data.tags ?? [],
        stars: data.stars ?? 0,
        isBuiltIn: false,
        overrideKeys: Object.keys(data.overrides ?? {}),
      }
    })

    // 번들 먼저, 커뮤니티 뒤
    return [...bundled, ...community]
  } catch {
    // Firebase 연결 실패 시 번들만 반환
    return bundled
  }
}

// ─── 단일 프리셋 로드 ─────────────────────────────────────────────────────────

export async function loadPreset(presetId: string): Promise<CommunityPreset | null> {
  // 번들 프리셋 우선
  const bundled = BUNDLED_PRESETS.find((p) => p.id === presetId)
  if (bundled) return bundled

  try {
    const db = getFirestore(getApp())
    const snap = await getDoc(doc(db, 'presets', presetId))
    if (!snap.exists()) return null
    const data = snap.data() as CommunityPreset
    return { ...data, id: snap.id }
  } catch {
    return null
  }
}
