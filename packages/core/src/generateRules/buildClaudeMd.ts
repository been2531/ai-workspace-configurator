import type { ComposeInput } from '../types'
import { getLocaleStrings } from '../i18n'
import type { GeneratedLocale } from '../i18n'

export function buildClaudeMd({ stack, profile }: ComposeInput): string {
  const locale = profile?.generatedLocale ?? 'en'
  const L = getLocaleStrings(locale).claude
  const { language, frameworks, packageManager } = stack
  const fw = frameworks.join(', ') || L.noFw

  const typeRule =
    profile?.codingStyle.typeStrictness === 'strict'
      ? L.typeStrict
      : profile?.codingStyle.typeStrictness === 'moderate'
        ? L.typeMod
        : L.typeLoose

  const paradigmRule =
    profile?.codingStyle.paradigm === 'functional'
      ? L.pdgmFunctional
      : profile?.codingStyle.paradigm === 'oop'
        ? L.pdgmOop
        : L.pdgmMixed

  const commentRule =
    profile?.codingStyle.commentStyle === 'none'
      ? L.cmntNone
      : profile?.codingStyle.commentStyle === 'jsdoc'
        ? L.cmntJsdoc
        : L.cmntMinimal

  return `${L.title}

${L.techStack}
- ${L.labelLang}: ${language}
- ${L.labelFw}: ${fw}
- ${L.labelPm}: ${packageManager}

${L.buildCmds}
${buildCommands(stack, L)}

${L.codeRules}

${L.typing}
${typeRule}
${L.typingPublicApi}

${L.paradigm}
${paradigmRule}

${L.commentsSection}
${commentRule}

${L.security}
${L.secApiKey}
${L.secUserInput}
${frameworkRules(stack, L)}
`
}

function buildCommands(
  { manifests, frameworks, packageManager }: ComposeInput['stack'],
  L: GeneratedLocale['claude'],
): string {
  const pm = packageManager === 'pnpm' ? 'pnpm' : packageManager === 'yarn' ? 'yarn' : 'npm'

  if (manifests.includes('package.json')) {
    const hasDev = frameworks.some((f) => ['Vite', 'Next.js', 'React', 'Vue'].includes(f))
    return `\`\`\`bash
${hasDev ? `${pm} run dev      ${L.cmdDevServer}\n` : ''}\
${pm} run build    ${L.cmdProdBuild}
${pm} run lint     ${L.cmdLint}
${pm} test         ${L.cmdTest}
\`\`\``
  }

  if (manifests.includes('pom.xml')) {
    return `\`\`\`bash
./mvnw spring-boot:run   ${L.cmdDevServer}
./mvnw package           ${L.cmdBuild}
./mvnw test              ${L.cmdTest}
\`\`\``
  }

  if (
    manifests.includes('requirements.txt') ||
    manifests.includes('pyproject.toml') ||
    manifests.includes('Pipfile')
  ) {
    if (frameworks.includes('Django')) {
      return `\`\`\`bash
python manage.py runserver   ${L.cmdDevServer}
python manage.py test        ${L.cmdTest}
\`\`\``
    }
    if (frameworks.includes('FastAPI')) {
      return `\`\`\`bash
uvicorn main:app --reload    ${L.cmdDevServer}
pytest                       ${L.cmdTest}
\`\`\``
    }
    return `\`\`\`bash
python -m flask run          ${L.cmdDevServer}
pytest                       ${L.cmdTest}
\`\`\``
  }

  if (manifests.includes('Cargo.toml')) {
    return `\`\`\`bash
cargo run       ${L.cmdRun}
cargo build     ${L.cmdBuild}
cargo test      ${L.cmdTest}
\`\`\``
  }

  if (manifests.includes('go.mod')) {
    return `\`\`\`bash
go run .        ${L.cmdRun}
go build .      ${L.cmdBuild}
go test ./...   ${L.cmdTest}
\`\`\``
  }

  return L.enterManually
}

function frameworkRules(
  { frameworks }: ComposeInput['stack'],
  L: GeneratedLocale['claude'],
): string {
  const rules: string[] = []

  if (frameworks.includes('Next.js')) {
    rules.push(`\n${L.fwNextjs.title}\n${L.fwNextjs.rules}`)
  } else if (frameworks.includes('React')) {
    rules.push(`\n${L.fwReact.title}\n${L.fwReact.rules}`)
  }

  if (frameworks.includes('Vue')) {
    rules.push(`\n${L.fwVue.title}\n${L.fwVue.rules}`)
  }

  if (frameworks.includes('NestJS')) {
    rules.push(`\n${L.fwNestjs.title}\n${L.fwNestjs.rules}`)
  }

  if (frameworks.includes('Firebase')) {
    rules.push(`\n${L.fwFirebase.title}\n${L.fwFirebase.rules}`)
  }

  if (frameworks.includes('Django')) {
    rules.push(`\n${L.fwDjango.title}\n${L.fwDjango.rules}`)
  }

  if (frameworks.includes('FastAPI')) {
    rules.push(`\n${L.fwFastApi.title}\n${L.fwFastApi.rules}`)
  }

  if (frameworks.includes('Prisma') || frameworks.includes('Drizzle')) {
    const orm = frameworks.includes('Prisma') ? 'Prisma' : 'Drizzle'
    const title = L.orm.title.replace('{orm}', orm)
    rules.push(`\n${title}\n${L.orm.rules}`)
  }

  return rules.join('\n')
}
