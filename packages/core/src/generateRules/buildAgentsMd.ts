import type { ComposeInput } from '../types'
import { getLocaleStrings } from '../i18n'

export function buildAgentsMd({ stack, profile }: ComposeInput): string {
  const locale = profile?.generatedLocale ?? 'en'
  const L = getLocaleStrings(locale).agents
  const autonomy = profile?.agentMode.autonomyLevel ?? 'proceed'
  const preReasoning = profile?.agentMode.preReasoning ?? true
  const omissionGuard = profile?.agentMode.codeOmissionGuard ?? true

  const autonomyRule =
    autonomy === 'ask-first'
      ? L.autonomyAskFirst
      : autonomy === 'autonomous'
        ? L.autonomyAutonomous
        : L.autonomyProceed

  const reasoningBlock = preReasoning
    ? `${L.preReasoningTitle}\n\n${L.preReasoningBody}\n\n`
    : ''

  const omissionBlock = omissionGuard
    ? `${L.noOmissionTitle}\n\n${L.noOmissionBody}\n\n`
    : ''

  const stackChecklist = buildReviewerChecklist(stack)

  return `${L.title}

${reasoningBlock}${omissionBlock}${L.rolesTitle}

${L.plannerTitle}
${L.plannerRules}

${L.implTitle}
${L.implRules}

${L.reviewerTitle}
${L.reviewerRules}
${stackChecklist ? `\n${L.reviewerStackTitle}\n${stackChecklist}` : ''}

${L.autonomyTitle}

${autonomyRule}

${L.contextTitle}
- ${L.contextLang}: ${stack.language}
- ${L.contextFw}: ${stack.frameworks.join(', ') || L.contextNoFw}
`
}

// English only — technical review criteria are universal
function buildReviewerChecklist({ language, frameworks, manifests }: ComposeInput['stack']): string {
  const checks: string[] = []

  // TypeScript
  if (language === 'TypeScript') {
    checks.push('- No `any` types introduced. No `@ts-ignore` without explanation comment.')
    checks.push('- All new functions have explicit return types.')
  }

  // Next.js
  if (frameworks.includes('Next.js')) {
    checks.push('- New Server Components do not import client-only APIs (window, document, localStorage).')
    checks.push('- `"use client"` directive present where hooks or event handlers are used.')
    checks.push('- No sensitive data (API keys, secrets) passed to Client Components as props.')
    checks.push('- `next/image` used for images; raw `<img>` tags are a red flag.')
    checks.push('- Server Actions validate input before any DB write.')
  }

  // React
  if (frameworks.includes('React') && !frameworks.includes('Next.js')) {
    checks.push('- No direct DOM manipulation — use refs or state instead.')
    checks.push('- `useEffect` dependencies array is complete (no missing deps).')
    checks.push('- Expensive computations wrapped in `useMemo` when re-renders are likely.')
  }

  // NestJS
  if (frameworks.includes('NestJS')) {
    checks.push('- New endpoints have a DTO with `class-validator` decorators.')
    checks.push('- Controllers contain no business logic — delegates entirely to service.')
    checks.push('- No hardcoded configuration values — use `ConfigService`.')
    checks.push('- New modules are registered in the appropriate parent module.')
  }

  // Express
  if (frameworks.includes('Express')) {
    checks.push('- All routes validate and sanitize `req.body` before use.')
    checks.push('- Async route handlers use `next(err)` for error propagation.')
    checks.push('- No sensitive data leaked in error responses to clients.')
  }

  // Prisma / Drizzle
  if (frameworks.includes('Prisma') || frameworks.includes('Drizzle')) {
    const orm = frameworks.includes('Prisma') ? 'Prisma' : 'Drizzle'
    checks.push(`- ${orm} client not called directly from controllers/routes — goes through service/repo layer.`)
    checks.push('- Multi-document writes use a transaction.')
    checks.push('- `select` clauses present — no unbounded record fetching.')
  }

  // Firebase
  if (frameworks.includes('Firebase')) {
    checks.push('- No Firebase SDK calls outside `services/firebase.ts`.')
    checks.push('- Real-time subscriptions have corresponding unsubscribe calls in cleanup.')
  }

  // Django
  if (frameworks.includes('Django')) {
    checks.push('- Business logic not in views — moved to `services.py`.')
    checks.push('- QuerySets use `select_related` / `prefetch_related` to avoid N+1.')
    checks.push('- User input never reaches the ORM without serializer validation.')
  }

  // FastAPI
  if (frameworks.includes('FastAPI')) {
    checks.push('- All endpoints have Pydantic response models (no bare `dict` returns).')
    checks.push('- Auth dependencies applied to protected endpoints via `Depends()`.')
    checks.push('- Background tasks use `BackgroundTasks`, not `asyncio.create_task()` in routes.')
  }

  // Go
  if (manifests.includes('go.mod')) {
    checks.push('- All errors are handled — no `_` discards for error return values.')
    checks.push('- Context propagated through the call chain — no `context.Background()` inside handlers.')
    checks.push('- No goroutine leaks — confirm goroutines have a clear termination path.')
  }

  // Rust
  if (manifests.includes('Cargo.toml')) {
    checks.push('- No `.unwrap()` or `.expect()` in production paths — use `?` or proper error handling.')
    checks.push('- No unnecessary `clone()` calls — verify borrowing cannot solve the problem.')
    checks.push('- `clippy` warnings addressed before merge.')
  }

  return checks.join('\n')
}
