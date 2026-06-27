Diagnose and fix the error or failing test described by the user.

Steps:
1. Read the full error message carefully — identify the error type, file, and line number
2. Open the affected file and read the context around the reported line
3. Identify the root cause (do not treat the symptom)
4. Propose the minimal fix — do not refactor unrelated code
5. Apply the fix
6. Verify: re-run the failing command or test to confirm the error is resolved
7. If the fix introduces new failures, diagnose and resolve them before finishing
