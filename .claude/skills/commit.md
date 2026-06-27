Draft and create a git commit for the current staged changes.

Steps:
1. Run `git diff --staged` to see exactly what is staged
2. If nothing is staged, run `git status` and ask which files to include
3. Analyze the diff and draft a commit message following this format:
   - First line: `<type>: <short description>` (max 72 chars)
   - Types: feat | fix | chore | docs | refactor | test | perf
   - Body (optional): explain WHY, not what — the diff already shows what
4. Show the draft message and confirm with the user before committing
5. Run `git commit -m "<message>"` after approval
6. Report the commit hash and title
