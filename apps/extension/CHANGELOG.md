# Changelog

## 0.2.0 — 2026-06-26

### Added
- Empty-workspace language picker: QuickPick appears when no manifest is detected so you can select your language before generating
- Preset → Generate button: "Generate Config" button appears inline in the Presets tab after selecting a preset, no tab-switching needed

### Improved
- Startup notification now detects existing config files and offers "Regenerate / Open Dashboard" instead of the first-time prompt
- Profile settings deep-merge fixed — coding style and agent mode sub-fields are no longer lost on reload
- File write errors now report the exact filename that failed

## 0.1.0 — 2026-06-26

### Added
- Stack detection for 10+ languages and frameworks
- Auto-generation of `CLAUDE.md`, `AGENTS.md`, `.cursorrules`, `.mcp.json`
- `.claude/skills/` slash command files (`/run`, `/test`, `/review`, `/db-migrate`)
- Dashboard webview with Home / Settings / Preview / Presets tabs
- EN / KO bilingual UI and generated file language selection
- Community preset browser (bundled + Firebase-backed)
- Coding style and agent mode settings with VS Code global state persistence
