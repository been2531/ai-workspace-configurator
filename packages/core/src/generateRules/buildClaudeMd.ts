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

  const projectStructure = buildProjectStructure(stack)
  const testingSection = buildTestingSection(stack, L)
  const fwRules = frameworkRules(stack, L)
  const aiHints = buildAiWorkflowHints(stack, L)

  return `${L.title}

${L.techStack}
- ${L.labelLang}: ${language}
- ${L.labelFw}: ${fw}
- ${L.labelPm}: ${packageManager}

${L.buildCmds}
${buildCommands(stack, L)}
${projectStructure ? `\n${L.projectStructure}\n${projectStructure}\n` : ''}
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
${testingSection}${fwRules}${aiHints}`
}

// ─── Project Structure ────────────────────────────────────────────────────────

function buildProjectStructure({ frameworks, manifests }: ComposeInput['stack']): string {
  const hasOrm = frameworks.some((f) => ['Prisma', 'Drizzle'].includes(f))

  if (frameworks.includes('Next.js')) {
    return [
      '```',
      'app/                # Route segments (App Router)',
      '  (auth)/           # Route group: requires authentication',
      '  api/              # Route handlers (route.ts files)',
      '  layout.tsx        # Root layout',
      'components/         # Shared React components',
      'lib/                # Utilities, helpers, constants',
      'services/           # Business logic layer',
      hasOrm ? 'prisma/ or db/      # Schema and migrations' : '',
      'public/             # Static assets',
      '```',
    ].filter(Boolean).join('\n')
  }

  if (frameworks.includes('Remix')) {
    return [
      '```',
      'app/',
      '  root.tsx          # Root layout + ErrorBoundary',
      '  routes/           # File-based routes',
      '    _index.tsx      # / route',
      '    <name>.tsx      # loader + action + component in one file',
      '  components/       # Shared UI components',
      '  services/         # Business logic (called from loaders/actions)',
      'public/             # Static assets',
      '```',
    ].join('\n')
  }

  if (frameworks.includes('Astro')) {
    return [
      '```',
      'src/',
      '  pages/            # .astro file = one route',
      '  layouts/          # Shared page wrappers',
      '  components/       # .astro + framework components (islands)',
      '  content/          # Content Collections (Markdown/MDX)',
      '  lib/              # Utilities',
      'public/             # Static assets (copied as-is)',
      '```',
    ].join('\n')
  }

  if (frameworks.includes('NestJS')) {
    return [
      '```',
      'src/',
      '  app.module.ts     # Root module',
      '  <domain>/         # Feature module (e.g. users/, auth/, posts/)',
      '    <domain>.module.ts',
      '    <domain>.controller.ts',
      '    <domain>.service.ts',
      '    dto/            # Request/response DTOs',
      '  common/           # Guards, interceptors, pipes, decorators',
      '  config/           # Environment config',
      'test/               # e2e tests',
      '```',
    ].join('\n')
  }

  if (frameworks.includes('Express') || frameworks.includes('Fastify')) {
    return [
      '```',
      'src/',
      '  app.ts            # App factory + middleware setup',
      '  server.ts         # Entry point',
      '  routes/           # Route definitions grouped by domain',
      '  controllers/      # Request/response handling',
      '  services/         # Business logic',
      '  models/           # DB models / schemas',
      '  middleware/       # Custom middleware',
      '  config/           # Environment + app config',
      '```',
    ].join('\n')
  }

  if (frameworks.includes('Vue') || frameworks.includes('Nuxt')) {
    const isNuxt = frameworks.includes('Nuxt')
    return [
      '```',
      isNuxt ? 'server/api/         # Nuxt server routes' : '',
      'composables/        # Shared Composition API logic (use* prefix)',
      'components/         # Reusable Vue components',
      'stores/             # Pinia stores',
      'pages/              # Route-level components',
      'assets/             # Images, fonts, global CSS',
      '```',
    ].filter(Boolean).join('\n')
  }

  if (frameworks.includes('SvelteKit') || frameworks.includes('Svelte')) {
    return [
      '```',
      'src/',
      '  routes/           # SvelteKit file-based routes',
      '    +layout.svelte  # Shared layout',
      '    +page.svelte    # Page component',
      '    +page.server.ts # Server-side load + actions',
      '  lib/              # Shared utilities ($lib alias)',
      '    components/     # Reusable Svelte components',
      '    stores/         # Svelte stores',
      '```',
    ].join('\n')
  }

  if (frameworks.includes('Django')) {
    return [
      '```',
      'config/             # Django project settings',
      '  settings/         # Split settings (base, dev, prod)',
      '  urls.py           # Root URL config',
      '<app>/              # Domain app (e.g. users/, products/)',
      '  models.py         # Data models',
      '  services.py       # Business logic',
      '  views.py          # Thin request handlers',
      '  serializers.py    # DRF serializers (validation)',
      '  urls.py           # App URL config',
      'tests/              # Test suite',
      '```',
    ].join('\n')
  }

  if (frameworks.includes('FastAPI')) {
    return [
      '```',
      'app/',
      '  main.py           # FastAPI app factory + lifespan',
      '  routers/          # Route handlers grouped by domain',
      '  schemas/          # Pydantic models (request + response)',
      '  services/         # Business logic',
      '  models/           # ORM models',
      '  dependencies.py   # Shared Depends() functions',
      '  core/             # Config, security, constants',
      'tests/              # pytest test suite',
      '```',
    ].join('\n')
  }

  if (manifests.includes('go.mod')) {
    return [
      '```',
      'cmd/                # Application entry points',
      '  api/main.go',
      'internal/           # Private application code',
      '  <domain>/         # Feature package (handler, service, repo)',
      '  middleware/        # HTTP middleware',
      'pkg/                # Exported shared utilities',
      '```',
    ].join('\n')
  }

  if (manifests.includes('Cargo.toml')) {
    return [
      '```',
      'src/',
      '  main.rs or lib.rs # Entry point',
      '  <module>/         # Domain module',
      '    mod.rs',
      'tests/              # Integration tests',
      'benches/            # Benchmarks',
      '```',
    ].join('\n')
  }

  if (frameworks.includes('Spring Boot')) {
    return [
      '```',
      'src/main/java/<package>/',
      '  controller/       # @RestController — thin request handlers',
      '  service/          # @Service — business logic',
      '  repository/       # @Repository — JPA data access',
      '  entity/           # @Entity — JPA models',
      '  dto/              # Request / response DTOs',
      '  config/           # @Configuration beans',
      'src/main/resources/',
      '  application.yml   # Application config',
      'src/test/java/      # Unit and integration tests',
      '```',
    ].join('\n')
  }

  if (frameworks.includes('Laravel')) {
    return [
      '```',
      'app/',
      '  Http/Controllers/ # Thin request handlers',
      '  Services/         # Business logic',
      '  Models/           # Eloquent models',
      'routes/',
      '  web.php           # Web routes',
      '  api.php           # API routes',
      'database/',
      '  migrations/       # Schema migrations',
      '  factories/        # Model factories for testing',
      '```',
    ].join('\n')
  }

  if (frameworks.includes('Rails')) {
    return [
      '```',
      'app/',
      '  controllers/      # Thin request handlers',
      '  models/           # ActiveRecord models',
      '  services/         # Business logic objects',
      '  jobs/             # ActiveJob background jobs',
      'db/',
      '  migrate/          # Schema migrations',
      'config/',
      '  routes.rb         # URL routing',
      '```',
    ].join('\n')
  }

  if (frameworks.includes('Flutter')) {
    return [
      '```',
      'lib/',
      '  main.dart         # Entry point',
      '  app.dart          # App widget + router',
      '  features/         # Feature-based organization',
      '    <feature>/',
      '      screens/      # Full-page widgets',
      '      widgets/      # Reusable sub-widgets',
      '      providers/    # State management',
      '  core/             # Shared utilities, constants, theme',
      '  data/             # Repositories, API clients, models',
      'test/               # Widget and unit tests',
      '```',
    ].join('\n')
  }

  return ''
}

// ─── Testing Section ──────────────────────────────────────────────────────────

function buildTestingSection(
  { language, frameworks, manifests }: ComposeInput['stack'],
  L: GeneratedLocale['claude'],
): string {
  const lines: string[] = []

  if (manifests.includes('package.json')) {
    const isTs = language === 'TypeScript'
    const hasVitest = frameworks.includes('Vitest')
    const hasJest = frameworks.includes('Jest')
    const hasCypress = frameworks.includes('Cypress')
    const hasPlaywright = frameworks.includes('Playwright')

    lines.push(`- Co-locate unit tests: \`*.test.${isTs ? 'ts' : 'js'}\` next to source files.`)
    if (hasVitest) lines.push('- Test runner: **Vitest**. Run with `pnpm run test`.')
    else if (hasJest) lines.push('- Test runner: **Jest**. Run with `pnpm test`.')
    else lines.push('- Test runner: Jest or Vitest (check `package.json` scripts).')
    lines.push('- Mock only external dependencies. Never mock the module under test.')
    lines.push('- Test behavior, not implementation details.')
    if (hasCypress) lines.push('- E2E tests in `cypress/e2e/`. Run with `pnpm run cy:run`.')
    if (hasPlaywright) lines.push('- E2E tests in `tests/` or `e2e/`. Run with `pnpm exec playwright test`.')
    if (frameworks.includes('React') || frameworks.includes('Next.js')) {
      lines.push('- Component tests: React Testing Library — query by role/label, not by class.')
    }
  } else if (manifests.includes('requirements.txt') || manifests.includes('pyproject.toml') || manifests.includes('Pipfile')) {
    lines.push('- Tests in `tests/` mirroring the source structure.')
    lines.push('- Test runner: **pytest**. Run with `pytest` or `python -m pytest`.')
    lines.push('- Use fixtures for setup/teardown — avoid `setUp`/`tearDown` in test classes.')
    if (frameworks.includes('Django')) {
      lines.push('- Django: use `TestCase` for DB tests, `SimpleTestCase` for pure logic.')
      lines.push('- Factory Boy for test data — avoid raw model creation in tests.')
    }
  } else if (manifests.includes('go.mod')) {
    lines.push('- Tests in `*_test.go` in the same package as source.')
    lines.push('- Use table-driven tests for multiple input cases.')
    lines.push('- `testify/assert` for readable assertions.')
    lines.push('- Integration tests require a running service — use build tags to separate.')
  } else if (manifests.includes('Cargo.toml')) {
    lines.push('- Unit tests in `#[cfg(test)]` modules inside the source file.')
    lines.push('- Integration tests in `tests/` directory (separate crate).')
    lines.push('- `cargo test -- --nocapture` to see `println!` output during tests.')
  } else {
    return `\n${L.testingSection}\n${L.testingGeneric}\n`
  }

  return `\n${L.testingSection}\n${lines.map(l => l).join('\n')}\n`
}

// ─── Build Commands ───────────────────────────────────────────────────────────

function buildCommands(
  { manifests, frameworks, packageManager }: ComposeInput['stack'],
  L: GeneratedLocale['claude'],
): string {
  const pm = packageManager === 'pnpm' ? 'pnpm' : packageManager === 'yarn' ? 'yarn' : 'npm'

  if (manifests.includes('package.json')) {
    const hasDev = frameworks.some((f) => ['Vite', 'Next.js', 'React', 'Vue', 'Svelte', 'Nuxt', 'SvelteKit'].includes(f))
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

// ─── Framework Rules ──────────────────────────────────────────────────────────

function frameworkRules(
  { frameworks }: ComposeInput['stack'],
  L: GeneratedLocale['claude'],
): string {
  const rules: string[] = []

  // Frontend / meta-framework (pick one primary)
  if (frameworks.includes('Next.js')) {
    rules.push(`\n${L.fwNextjs.title}\n${L.fwNextjs.rules}`)
  } else if (frameworks.includes('Remix')) {
    rules.push(`\n${L.fwRemix.title}\n${L.fwRemix.rules}`)
  } else if (frameworks.includes('Nuxt')) {
    rules.push(`\n${L.fwNuxt.title}\n${L.fwNuxt.rules}`)
  } else if (frameworks.includes('Astro')) {
    rules.push(`\n${L.fwAstro.title}\n${L.fwAstro.rules}`)
  } else if (frameworks.includes('SvelteKit') || frameworks.includes('Svelte')) {
    rules.push(`\n${L.fwSvelte.title}\n${L.fwSvelte.rules}`)
  } else if (frameworks.includes('React')) {
    rules.push(`\n${L.fwReact.title}\n${L.fwReact.rules}`)
  }

  if (frameworks.includes('Vue') && !frameworks.includes('Nuxt')) {
    rules.push(`\n${L.fwVue.title}\n${L.fwVue.rules}`)
  }

  // Backend framework
  if (frameworks.includes('NestJS')) {
    rules.push(`\n${L.fwNestjs.title}\n${L.fwNestjs.rules}`)
  } else if (frameworks.includes('Express')) {
    rules.push(`\n${L.fwExpress.title}\n${L.fwExpress.rules}`)
  } else if (frameworks.includes('Spring Boot')) {
    rules.push(`\n${L.fwSpringBoot.title}\n${L.fwSpringBoot.rules}`)
  } else if (frameworks.includes('Laravel')) {
    rules.push(`\n${L.fwLaravel.title}\n${L.fwLaravel.rules}`)
  } else if (frameworks.includes('Rails')) {
    rules.push(`\n${L.fwRails.title}\n${L.fwRails.rules}`)
  } else if (frameworks.includes('Django')) {
    rules.push(`\n${L.fwDjango.title}\n${L.fwDjango.rules}`)
  } else if (frameworks.includes('FastAPI')) {
    rules.push(`\n${L.fwFastApi.title}\n${L.fwFastApi.rules}`)
  }

  // Mobile
  if (frameworks.includes('Flutter')) {
    rules.push(`\n${L.fwFlutter.title}\n${L.fwFlutter.rules}`)
  }

  // Data / API layer
  if (frameworks.includes('GraphQL')) {
    rules.push(`\n${L.fwGraphql.title}\n${L.fwGraphql.rules}`)
  }
  if (frameworks.includes('Firebase')) {
    rules.push(`\n${L.fwFirebase.title}\n${L.fwFirebase.rules}`)
  }
  if (frameworks.includes('Prisma') || frameworks.includes('Drizzle')) {
    const orm = frameworks.includes('Prisma') ? 'Prisma' : 'Drizzle'
    rules.push(`\n${L.orm.title.replace('{orm}', orm)}\n${L.orm.rules}`)
  }

  return rules.join('\n')
}

// ─── AI Workflow Hints ────────────────────────────────────────────────────────
// English only — these are instructions for the AI agent

function buildAiWorkflowHints(
  { frameworks, language, manifests }: ComposeInput['stack'],
  L: GeneratedLocale['claude'],
): string {
  const hints: string[] = []

  if (language === 'TypeScript' || frameworks.some(f => ['Next.js', 'React', 'Vue', 'NestJS'].includes(f))) {
    hints.push('- Run `tsc --noEmit` after making changes to verify type correctness before finishing.')
  }

  if (frameworks.includes('Next.js')) {
    hints.push('- When adding a new route, always create the directory + `page.tsx` + `loading.tsx` together.')
    hints.push('- For data mutation, prefer Server Actions over separate API routes when the call originates from a form.')
    hints.push('- Check `next build` output for bundle size regressions before considering a task complete.')
  }

  if (frameworks.includes('NestJS')) {
    hints.push('- When adding a new feature, create the full module scaffold: module → service → controller → DTO.')
    hints.push('- Register new modules in the parent module\'s `imports` array.')
  }

  if (frameworks.includes('Django') || frameworks.includes('FastAPI')) {
    hints.push('- After modifying models or schemas, run and review the migration before writing more code.')
  }

  if (frameworks.includes('Prisma')) {
    hints.push('- Schema change workflow: edit `schema.prisma` → `npx prisma migrate dev` → `npx prisma generate`.')
  }

  if (frameworks.includes('Drizzle')) {
    hints.push('- Schema change workflow: edit schema → `pnpm run db:generate` → review SQL → `pnpm run db:migrate`.')
  }

  if (manifests.includes('go.mod')) {
    hints.push('- Run `go vet ./...` and `golangci-lint run` after changes.')
    hints.push('- New packages go in `internal/` unless they are meant to be imported externally.')
  }

  if (manifests.includes('Cargo.toml')) {
    hints.push('- Run `cargo clippy` after changes. Address all warnings before finishing.')
    hints.push('- Prefer `?` operator over `.unwrap()` in production code.')
  }

  if (hints.length === 0) return ''

  return `\n${L.aiWorkflowTitle}\n${hints.join('\n')}\n`
}
