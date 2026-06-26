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
    ? `${L.preReasoningTitle}

${L.preReasoningBody}

`
    : ''

  const omissionBlock = omissionGuard
    ? `${L.noOmissionTitle}

${L.noOmissionBody}

`
    : ''

  return `${L.title}

${reasoningBlock}${omissionBlock}${L.rolesTitle}

${L.plannerTitle}
${L.plannerRules}

${L.implTitle}
${L.implRules}

${L.reviewerTitle}
${L.reviewerRules}

${L.autonomyTitle}

${autonomyRule}

${L.contextTitle}
- ${L.contextLang}: ${stack.language}
- ${L.contextFw}: ${stack.frameworks.join(', ') || L.contextNoFw}
`
}
