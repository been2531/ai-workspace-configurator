import type { ComposeInput } from '../types'

// Skill files are always in English — instructions to Claude, and English produces more reliable AI behavior.
export function buildSkills({ stack }: ComposeInput): Record<string, string> {
  const skills: Record<string, string> = {}
  const pm = stack.packageManager === 'pnpm' ? 'pnpm' : stack.packageManager === 'yarn' ? 'yarn' : 'npm'
  const isJs = stack.manifests.includes('package.json')
  const isTs = stack.language === 'TypeScript'

  // ── /review — universal ─────────────────────────────────────────────────────
  skills['review'] = skill(
    'review',
    'Review current changes for quality, correctness, and security. Use after making code changes.',
    `Review the current code changes for quality, correctness, and security.

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
`,
  )

  // ── /commit — universal ─────────────────────────────────────────────────────
  skills['commit'] = skill(
    'commit',
    'Draft and create a git commit for staged changes. Use when ready to commit work.',
    `Draft and create a git commit for the current staged changes.

Steps:
1. Run \`git diff --staged\` to see exactly what is staged
2. If nothing is staged, run \`git status\` and ask which files to include
3. Analyze the diff and draft a commit message following this format:
   - First line: \`<type>: <short description>\` (max 72 chars)
   - Types: feat | fix | chore | docs | refactor | test | perf
   - Body (optional): explain WHY, not what — the diff already shows what
4. Show the draft message and confirm with the user before committing
5. Run \`git commit -m "<message>"\` after approval
6. Report the commit hash and title
`,
  )

  // ── /fix — universal ────────────────────────────────────────────────────────
  skills['fix'] = skill(
    'fix',
    'Diagnose and fix an error or failing test. Pass the error message or test name as context.',
    `Diagnose and fix the error or failing test described by the user.

Steps:
1. Read the full error message carefully — identify the error type, file, and line number
2. Open the affected file and read the context around the reported line
3. Identify the root cause (do not treat the symptom)
4. Propose the minimal fix — do not refactor unrelated code
5. Apply the fix
6. Verify: re-run the failing command or test to confirm the error is resolved
7. If the fix introduces new failures, diagnose and resolve them before finishing
`,
  )

  // ── /pr — universal ─────────────────────────────────────────────────────────
  skills['pr'] = skill(
    'pr',
    'Draft and open a pull request for the current branch. Use when ready to merge.',
    `Draft and open a pull request for the current branch.

Steps:
1. Run \`git log --oneline main..HEAD\` (or the base branch) to list commits in this PR
2. Run \`git diff main...HEAD --stat\` for a file-level summary of changes
3. Draft a PR title (≤70 chars) and body:
   - Title: imperative mood, type prefix where applicable (feat/fix/chore)
   - Body sections: ## Summary (3–5 bullet points), ## Test plan (checklist)
4. Show the draft and confirm with the user before creating
5. Run \`gh pr create --title "<title>" --body "<body>"\`
6. Return the PR URL
`,
  )

  // ── /issue — universal ──────────────────────────────────────────────────────
  skills['issue'] = skill(
    'issue',
    'Create a GitHub issue for a bug report or feature request.',
    `Create a GitHub issue for a bug report or feature request.

Steps:
1. Identify the issue type: bug | feature | chore
2. Draft a title and body:
   - Bug: steps to reproduce, expected vs actual behavior, environment info
   - Feature: problem it solves, proposed solution, acceptance criteria
3. Show the draft and confirm with the user before creating
4. Run \`gh issue create --title "<title>" --body "<body>" --label "<type>"\`
5. Return the issue URL
`,
  )

  // ── /changelog — universal ──────────────────────────────────────────────────
  skills['changelog'] = skill(
    'changelog',
    'Update CHANGELOG.md with changes from the current branch.',
    `Update CHANGELOG.md with changes from the current branch.

Steps:
1. Run \`git log --oneline main..HEAD\` to list commits since the last release
2. Group commits by type: Added | Changed | Fixed | Removed | Security
3. Read the existing CHANGELOG.md to match its format and versioning scheme
4. Insert a new entry at the top under \`## [Unreleased]\` or the new version header
5. Write user-facing descriptions — not raw commit message text
6. Show the diff and confirm before writing the file
`,
  )

  // ── /security — universal ───────────────────────────────────────────────────
  skills['security'] = skill(
    'security',
    'Security review of current changes against OWASP Top 10. Use before merging security-sensitive code.',
    `Perform a focused security review of the current changes (OWASP Top 10).

Steps:
1. Run \`git diff HEAD\` and \`git diff --staged\` to see all pending changes
2. Check each changed file against:
   - **Injection**: SQL, command, or template injection via unsanitized input
   - **Broken Auth**: hardcoded credentials, weak tokens, missing auth checks
   - **Sensitive Data**: API keys, passwords, or PII in logs, responses, or source
   - **Security Misconfiguration**: debug flags on, permissive CORS, stack traces in errors
   - **Vulnerable Dependencies**: new packages added — flag any with known CVEs
   - **Insecure Design**: missing rate limiting, no input size limits, SSRF vectors
3. Label each finding: **[CRITICAL]** / **[HIGH]** / **[MEDIUM]** / **[LOW]**
4. For CRITICAL and HIGH findings, provide a concrete fix
5. If no issues are found, state that explicitly
`,
  )

  // ── /run — stack-specific ───────────────────────────────────────────────────
  const runCmd = buildRunCommand(stack, pm)
  if (runCmd) {
    skills['run'] = skill(
      'run',
      'Start the development server and confirm it is running correctly.',
      `Start the development server and confirm it is running correctly.

Command: \`${runCmd}\`

Steps:
1. Execute the command above using the Bash tool
2. Wait for the ready / listening message in the output
3. Confirm there are no compilation or startup errors
4. Report the local URL (e.g. http://localhost:3000)
5. If the server fails to start, diagnose the error and attempt a fix before reporting failure
`,
    )
  }

  // ── /test — stack-specific ──────────────────────────────────────────────────
  const testCmd = buildTestCommand(stack, pm)
  if (testCmd) {
    skills['test'] = skill(
      'test',
      'Run the full test suite and analyze results. Use to verify changes do not break existing behavior.',
      `Run the full test suite and analyze results.

Command: \`${testCmd}\`

Steps:
1. Execute the command above
2. Show total pass / fail counts and coverage if available
3. For each failing test: show the error message, diagnose the root cause, suggest a fix
4. If a fix is straightforward and low-risk, apply it and re-run only the affected tests
5. Summarize final test health and any remaining action items
`,
    )
  }

  // ── /type-check — TypeScript only ──────────────────────────────────────────
  if (isTs && isJs) {
    skills['type-check'] = skill(
      'type-check',
      'Run TypeScript type checker and fix all type errors. Use after making changes to typed code.',
      `Run the TypeScript compiler in check-only mode and fix all type errors.

Command: \`${pm} run typecheck\` or \`npx tsc --noEmit\`

Steps:
1. Run the type-check command above
2. Parse the output — group errors by file
3. For each error:
   a. Read the file and understand the context
   b. Apply the minimal fix (narrow types, add guards, fix signatures)
   c. Do NOT use \`any\` or \`@ts-ignore\` as a shortcut unless absolutely unavoidable
4. After fixing all errors, re-run the type-check to confirm zero errors
5. Report a summary: how many errors were found and fixed
`,
    )
  }

  // ── /db-migrate — ORM-specific ──────────────────────────────────────────────
  if (isJs) {
    if (stack.frameworks.includes('Prisma')) {
      skills['db-migrate'] = skill(
        'db-migrate',
        'Apply pending Prisma database migrations safely. Use after schema changes.',
        `Apply pending Prisma database migrations safely.

Steps:
1. Check current status: \`npx prisma migrate status\`
2. Review any pending migrations in \`prisma/migrations/\` before applying
3. Development: \`npx prisma migrate dev\`
   Production:  \`npx prisma migrate deploy\`
4. Regenerate the client: \`npx prisma generate\`
5. Verify schema sync: \`npx prisma db pull\` then compare with \`schema.prisma\`
6. If migration fails, provide rollback guidance — do NOT automatically run destructive SQL
`,
      )
    } else if (stack.frameworks.includes('Drizzle')) {
      skills['db-migrate'] = skill(
        'db-migrate',
        'Apply pending Drizzle database migrations safely. Use after schema changes.',
        `Apply pending Drizzle database migrations safely.

Steps:
1. Generate migration: \`${pm} run db:generate\` (or the project's equivalent)
2. Review the generated SQL file in the migrations directory before applying
3. Apply: \`${pm} run db:migrate\`
4. Verify the schema is in sync with the running database
5. If migration fails, provide rollback guidance — do NOT automatically run destructive SQL
`,
      )
    }
  }

  if (stack.frameworks.includes('Django')) {
    skills['db-migrate'] = skill(
      'db-migrate',
      'Apply pending Django database migrations safely. Use after model changes.',
      `Apply pending Django database migrations safely.

Steps:
1. Check pending migrations: \`python manage.py showmigrations\`
2. Preview the SQL that will run: \`python manage.py sqlmigrate <app> <migration>\`
3. Apply: \`python manage.py migrate\`
4. Verify no unapplied migrations remain
5. If migration fails, provide rollback guidance using \`python manage.py migrate <app> <previous>\`
`,
    )
  }

  // ── /deploy — Next.js ───────────────────────────────────────────────────────
  if (stack.frameworks.includes('Next.js')) {
    skills['deploy'] = skill(
      'deploy',
      'Build and prepare the Next.js app for deployment. Use before pushing to production.',
      `Build and prepare the Next.js app for deployment.

Steps:
1. Run \`${pm} run build\` and confirm it succeeds with no errors
2. Check the build output size — warn if any route bundle exceeds 1 MB
3. Verify all required environment variables are documented in \`.env.example\`
4. Confirm no \`console.log\` debug statements remain in production paths
5. If deploying to Vercel: verify \`vercel.json\` (if present) has correct settings
6. Summarize what changed since the last deploy: \`git log --oneline origin/main..HEAD\`
`,
    )
  }

  return skills
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function skill(name: string, description: string, body: string): string {
  return `---\nname: ${name}\ndescription: ${description}\n---\n\n${body}`
}

function buildRunCommand(
  { manifests, frameworks, packageManager }: ComposeInput['stack'],
  pm: string,
): string | null {
  if (manifests.includes('package.json')) {
    const hasDev = frameworks.some((f) =>
      ['Vite', 'Next.js', 'React', 'Vue', 'Svelte', 'SvelteKit', 'Nuxt'].includes(f),
    )
    if (hasDev) return `${pm} run dev`
    if (frameworks.some((f) => ['Express', 'Fastify', 'NestJS'].includes(f))) {
      return `${pm} run start:dev`
    }
    return `${pm} run dev`
  }
  if (manifests.includes('pom.xml')) return './mvnw spring-boot:run'
  if (
    manifests.includes('requirements.txt') ||
    manifests.includes('pyproject.toml') ||
    manifests.includes('Pipfile')
  ) {
    if (frameworks.includes('Django')) return 'python manage.py runserver'
    if (frameworks.includes('FastAPI')) return 'uvicorn main:app --reload'
    return 'python -m flask run'
  }
  if (manifests.includes('Cargo.toml')) return 'cargo run'
  if (manifests.includes('go.mod')) return 'go run .'
  return null
}

function buildTestCommand(
  { manifests, frameworks }: ComposeInput['stack'],
  pm: string,
): string | null {
  if (manifests.includes('package.json')) {
    if (frameworks.includes('Vitest')) return `${pm} run test`
    return `${pm} test`
  }
  if (manifests.includes('pom.xml')) return './mvnw test'
  if (
    manifests.includes('requirements.txt') ||
    manifests.includes('pyproject.toml') ||
    manifests.includes('Pipfile')
  ) {
    if (frameworks.includes('Django')) return 'python manage.py test'
    return 'pytest'
  }
  if (manifests.includes('Cargo.toml')) return 'cargo test'
  if (manifests.includes('go.mod')) return 'go test ./...'
  return null
}
