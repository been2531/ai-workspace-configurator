# AI Workspace Configurator

> Auto-generate Claude Code & Codex optimization files the moment you open a project.

When you open a workspace, **AI Workspace Configurator** detects your stack and writes AI instruction files tailored to it — no manual editing, no copy-pasting templates.

---

## Generated files

| File | Purpose |
|------|---------|
| `CLAUDE.md` | Stack-specific agent rules for Claude Code |
| `AGENTS.md` | Multi-agent handoff protocol + reviewer checklist |
| `.cursorrules` | Cursor AI rules (legacy format) |
| `.cursor/rules/project.mdc` | Cursor AI rules (new MDC format) |
| `.mcp.json` | MCP server auto-configuration |
| `.claude/skills/*.md` | Slash commands: `/run`, `/test`, `/review`, `/db-migrate`, `/commit`, `/fix`, `/type-check` |

Everything runs **100% locally** — no API calls, no data sent anywhere.

---

## Stack detection — 20+ frameworks

Detects your language and frameworks automatically from manifest files:

**JavaScript / TypeScript** — Next.js, Nuxt, SvelteKit, Remix, Astro, React, Vue, Svelte, NestJS, Express, Fastify, Prisma, Drizzle, GraphQL, tRPC, Firebase, Vitest, Jest, Cypress, Playwright

**Python** — Django, FastAPI, Flask, SQLAlchemy, Celery

**Java / Kotlin** — Spring Boot (Maven + Gradle)

**Go, Rust, PHP (Laravel / Symfony), Ruby (Rails), Flutter / Dart**

---

## What gets generated

### CLAUDE.md
- Project structure guide for your specific stack
- Testing conventions (pytest, Vitest, Go table tests, Rust `#[cfg(test)]`, …)
- AI workflow hints — TypeScript type-checking steps, Prisma migration workflow, linter commands
- 5–8 framework-specific rules per detected framework

### AGENTS.md
- Multi-agent handoff protocol
- Stack-specific reviewer checklist (TypeScript, NestJS, Django, Prisma, Go, Rust, …)

### Slash commands
| Command | Action |
|---------|--------|
| `/run` | Start dev server |
| `/test` | Run tests |
| `/review` | Code review with checklist |
| `/db-migrate` | Run migrations safely |
| `/commit` | Draft + create git commit |
| `/fix` | Diagnose and fix an error |
| `/type-check` | TypeScript error sweep |

---

## Stale config detection

On every workspace open, the extension checks whether your `CLAUDE.md` is still current. If you've added new frameworks since the last generation, a warning appears:

> _"AI Workspace files may be outdated (new: Prisma, Vitest). Regenerate?"_

---

## Quick start

1. Open any project in VS Code
2. Click **"⚡ Generate Now"** in the startup notification
   — or run **"AI Workspace: Generate Config Files"** from the Command Palette (`Ctrl+Shift+P`)
3. Start using Claude Code immediately

---

## Dashboard

**Command Palette → "AI Workspace: Open Dashboard"**

| Tab | Contents |
|-----|---------|
| **Home** | File status, generate / regenerate |
| **Settings** | UI language, generated file language, coding style, agent mode |
| **Preview** | Read file content before writing |
| **Presets** | Browse and apply community presets |

---

## Community presets

The Presets tab lets you search and apply community rule sets.

Built-in presets:
- **Karpathy Agent OS** — LLM OS pre-reasoning + multi-agent hierarchy
- **Minimal** — minimal guidelines, maximum agent autonomy
- **Strict TypeScript** — enforced type safety and Result pattern

---

## Privacy

- No telemetry
- No code sent to any server
- Firebase used only for community presets (public, read-only)
- LLM proxy via Cloudflare Workers — API keys never reach the client

---

## Links

- [GitHub Repository](https://github.com/been2531/ai-workspace-configurator)
- [Changelog](https://github.com/been2531/ai-workspace-configurator/blob/master/apps/extension/CHANGELOG.md)
- [Issues](https://github.com/been2531/ai-workspace-configurator/issues)
