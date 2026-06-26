# AI Workspace Configurator

> Auto-generate Claude Code & Codex optimization files the moment you open a project.

## What it does

When you open a workspace, **AI Workspace Configurator** detects your project stack (language, frameworks, package manager) and writes a set of AI instruction files tailored to it — no manual editing required.

| File | Purpose |
|------|---------|
| `CLAUDE.md` | Agent guidelines for Claude Code |
| `AGENTS.md` | Multi-agent handoff protocol (Codex / GPT) |
| `.cursorrules` | Cursor AI rules |
| `.mcp.json` | MCP server auto-configuration |
| `.claude/skills/*.md` | Slash commands (`/run`, `/test`, `/review`, `/db-migrate`) |

## Features

- **Zero-config stack detection** — React, Next.js, Vue, Django, FastAPI, Go, Rust, and more
- **Community presets** — browse and apply community-maintained rule sets (e.g. Karpathy Agent OS)
- **EN / KO bilingual UI** — toggle language in the dashboard
- **Generated file language** — choose whether CLAUDE.md / AGENTS.md are written in English or Korean
- **Coding style settings** — type strictness, paradigm, comment style, autonomy level
- **100% local computation** — stack detection and rule generation run entirely on your machine; no data is sent anywhere

## Quick start

1. Open any project in VS Code
2. Run **"AI Workspace: Generate Config Files"** from the Command Palette (`Ctrl+Shift+P` / `Cmd+Shift+P`)
   — or click **"⚡ Generate Config"** in the dashboard
3. The files appear in your workspace root

## Dashboard

Open the dashboard with:
- Command Palette → **AI Workspace: Open Dashboard**

The dashboard has four tabs:

| Tab | Contents |
|-----|---------|
| **Home** | File status, generate button, active preset |
| **Settings** | Language, coding style, agent mode |
| **Preview** | Read generated file content before saving |
| **Presets** | Browse and apply community presets |

## Stack support

| Language / Framework | Detected via |
|----------------------|-------------|
| TypeScript / JavaScript | `package.json` |
| React, Next.js, Vue, Svelte | package dependencies |
| Python (Django, FastAPI, Flask) | `requirements.txt`, `pyproject.toml` |
| Go | `go.mod` |
| Rust | `Cargo.toml` |
| Java / Kotlin | `pom.xml`, `build.gradle` |
| Ruby on Rails | `Gemfile` |
| PHP (Laravel) | `composer.json` |

## Community presets

The **Presets** tab lets you search and apply community rule sets. Built-in presets:

- **Karpathy Agent OS** — LLM OS pre-reasoning + multi-agent hierarchy
- **Minimal** — Minimal guidelines, maximum agent autonomy
- **Strict TypeScript** — Enforced type safety and Result pattern

## Configuration is persisted

Settings (language preference, coding style, active preset) are saved in VS Code global state and restored the next time you open VS Code.

## Privacy

- No telemetry is collected
- No code is sent to any server
- Firebase is used only to browse community presets (read-only, public data)
- LLM features (Pro) go through a Cloudflare Worker proxy — API keys never leave the server

## Contributing

Issues and PRs welcome at [github.com/been2531/ai-workspace-configurator](https://github.com/been2531/ai-workspace-configurator).

## License

MIT
