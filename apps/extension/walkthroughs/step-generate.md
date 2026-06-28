# Generate Config Files

Click **⚡ Generate** in the **Home** tab.

The extension writes all selected files in one shot:

| File | Purpose |
|------|---------|
| `CLAUDE.md` | Project guidelines, code rules, build commands |
| `AGENTS.md` | Multi-agent collaboration & reviewer checklist |
| `.mcp.json` | MCP server configuration (filesystem, git, …) |
| `.claude/skills/` | Slash commands: `/review` `/pr` `/security` `/commit` … |
| `.claude/settings.json` | Hooks: rm -rf guard, lint auto-fix after edits |

**Already have files?** The generator skips existing files by default and shows a diff in the Preview tab.
