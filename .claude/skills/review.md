Review the current code changes for quality, correctness, and security.

Steps:
1. Run `git diff HEAD` and `git diff --staged` to see all pending changes
2. For each changed file, check:
   - Type safety and null-safety
   - Security risks: hardcoded secrets, injection vectors, missing input validation
   - Logic correctness and untested edge cases
   - Error handling completeness
   - Naming consistency with the rest of the codebase
3. Report findings with **file:line** references
4. Label each finding: **[BLOCKING]** / **[SUGGESTION]** / **[NITPICK]**
5. If there are no issues, say so explicitly
