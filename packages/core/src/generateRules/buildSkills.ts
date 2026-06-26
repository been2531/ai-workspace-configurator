import type { ComposeInput } from '../types'

// Skill files are always in English — they are instructions to Claude,
// and English produces more reliable AI behavior.
export function buildSkills({ stack }: ComposeInput): Record<string, string> {
  const skills: Record<string, string> = {}
  const pm = stack.packageManager === 'pnpm' ? 'pnpm' : stack.packageManager === 'yarn' ? 'yarn' : 'npm'
  const isJs = stack.manifests.includes('package.json')

  // ── Universal: code review ──────────────────────────────────────────────────
  skills['review'] = `Review the current code changes for quality, correctness, and security.

Steps:
1. Run \`git diff HEAD\` and \`git diff --staged\` to see all pending changes
2. For each changed file, check:
   - Type safety and null-safety
   - Security risks: hardcoded secrets, injection vectors, missing input validation
   - Logic correctness and untested edge cases
   - Error handling completeness
   - Naming consistency with the rest of the codebase
3. Report findings with **file:line** references
4. Label each finding: **[BLOCKING]** / **[SUGGESTION]** / **[NITPICK]**
5. If there are no issues, say so explicitly
`

  // ── Stack-specific: run ─────────────────────────────────────────────────────
  const runCmd = buildRunCommand(stack, pm)
  if (runCmd) {
    skills['run'] = `Start the development server and confirm it is running correctly.

Command: \`${runCmd}\`

Steps:
1. Execute the command above using the Bash tool
2. Wait for the ready / listening message in the output
3. Confirm there are no compilation or startup errors
4. Report the local URL (e.g. http://localhost:3000)
5. If the server fails to start, diagnose the error and attempt a fix before reporting failure
`
  }

  // ── Stack-specific: test ────────────────────────────────────────────────────
  const testCmd = buildTestCommand(stack, pm)
  if (testCmd) {
    skills['test'] = `Run the full test suite and analyze results.

Command: \`${testCmd}\`

Steps:
1. Execute the command above
2. Show total pass / fail counts and coverage if available
3. For each failing test: show the error message, diagnose the root cause, suggest a fix
4. If a fix is straightforward and low-risk, apply it and re-run only the affected tests
5. Summarize final test health and any remaining action items
`
  }

  // ── DB migration ────────────────────────────────────────────────────────────
  if (isJs) {
    if (stack.frameworks.includes('Prisma')) {
      skills['db-migrate'] = `Apply pending Prisma database migrations safely.

Steps:
1. Check current status: \`npx prisma migrate status\`
2. Review any pending migrations in \`prisma/migrations/\` before applying
3. Development: \`npx prisma migrate dev\`
   Production:  \`npx prisma migrate deploy\`
4. Verify schema sync: \`npx prisma db pull\` then compare with \`schema.prisma\`
5. If migration fails, provide rollback guidance — do NOT automatically run destructive SQL
`
    } else if (stack.frameworks.includes('Drizzle')) {
      skills['db-migrate'] = `Apply pending Drizzle database migrations safely.

Steps:
1. Generate migration: \`${pm} run db:generate\` (or the project's equivalent)
2. Review the generated SQL file in the migrations directory before applying
3. Apply: \`${pm} run db:migrate\`
4. Verify the schema is in sync with the running database
5. If migration fails, provide rollback guidance — do NOT automatically run destructive SQL
`
    }
  }

  if (stack.frameworks.includes('Django')) {
    skills['db-migrate'] = `Apply pending Django database migrations safely.

Steps:
1. Check pending migrations: \`python manage.py showmigrations\`
2. Preview the SQL that will run: \`python manage.py sqlmigrate <app> <migration>\`
3. Apply: \`python manage.py migrate\`
4. Verify no unapplied migrations remain
5. If migration fails, provide rollback guidance using \`python manage.py migrate <app> <previous>\`
`
  }

  // ── Next.js: deploy helper ──────────────────────────────────────────────────
  if (stack.frameworks.includes('Next.js')) {
    skills['deploy'] = `Build and prepare the Next.js app for deployment.

Steps:
1. Run \`${pm} run build\` and confirm it succeeds with no errors
2. Check the build output size and warn if any route exceeds 1 MB
3. Verify all required environment variables are documented in \`.env.example\`
4. If deploying to Vercel: confirm \`vercel.json\` (if present) has correct settings
5. Summarize what changed since the last deploy using \`git log --oneline origin/main..HEAD\`
`
  }

  return skills
}

function buildRunCommand(
  { manifests, frameworks, packageManager }: ComposeInput['stack'],
  pm: string,
): string | null {
  if (manifests.includes('package.json')) {
    const hasDev = frameworks.some((f) => ['Vite', 'Next.js', 'React', 'Vue', 'Svelte'].includes(f))
    if (hasDev) return `${pm} run dev`
    if (frameworks.includes('Express') || frameworks.includes('Fastify') || frameworks.includes('NestJS')) {
      return `${pm} run start:dev`
    }
    return `${pm} run dev`
  }
  if (manifests.includes('pom.xml')) return './mvnw spring-boot:run'
  if (manifests.includes('requirements.txt') || manifests.includes('pyproject.toml') || manifests.includes('Pipfile')) {
    if (frameworks.includes('Django')) return 'python manage.py runserver'
    if (frameworks.includes('FastAPI')) return 'uvicorn main:app --reload'
    return 'python -m flask run'
  }
  if (manifests.includes('Cargo.toml')) return 'cargo run'
  if (manifests.includes('go.mod')) return 'go run .'
  return null
}

function buildTestCommand(
  { manifests, frameworks, packageManager }: ComposeInput['stack'],
  pm: string,
): string | null {
  if (manifests.includes('package.json')) {
    if (frameworks.includes('Vitest')) return `${pm} run test`
    return `${pm} test`
  }
  if (manifests.includes('pom.xml')) return './mvnw test'
  if (manifests.includes('requirements.txt') || manifests.includes('pyproject.toml') || manifests.includes('Pipfile')) {
    if (frameworks.includes('Django')) return 'python manage.py test'
    return 'pytest'
  }
  if (manifests.includes('Cargo.toml')) return 'cargo test'
  if (manifests.includes('go.mod')) return 'go test ./...'
  return null
}
