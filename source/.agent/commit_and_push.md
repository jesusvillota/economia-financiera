## Git Commit & Push Instructions for Agents (Minimal)

### 1. Scope and Hard Constraints

- **Direct git commands only**  
  - Use git commands directly in the terminal: `git add`, `git diff`, `git commit`, `git push`.  
  - **Do NOT** create or use scripts or tools (Python, shell, or otherwise) to automate git operations.

- **End-of-task requirement**  
  - When you consider a task “finished”, all relevant changes must be:  
    - Committed following the rules below, and  
    - Successfully pushed to the current branch on the remote (usually `main`).

- **Forbidden**  
  - Any “Generated with Copilot” or “Co-Authored-By: Copilot” lines in commits.  
  - Vague commit messages such as “Update files”, “Fix issues”, “Minor changes”.  
  - Committing everything in one lump when changes are clearly unrelated.  
  - Leaving work uncommitted and/or unpushed at the end of a task.

---

### 2. Standard Workflow (Always Follow This Order)

1. **Inspect changes**  
   - Run `git status` to see modified/created/deleted files.

2. **Form logical groups**  
   - Group changes by a **single coherent purpose**, for example:  
     - Feature addition or enhancement  
     - Bug fix  
     - Refactor/cleanup  
     - Documentation/configuration updates  
   - Each group becomes **one commit**.  
   - If all changes clearly serve one purpose, a **single commit** is fine.

3. **Stage one group**  
   - Use `git add <file1> <file2> ...` for **only that group’s files**.  
   - Do not stage unrelated files yet.

4. **Review staged changes**  
   - Run `git diff --staged` and verify:  
     - Only the intended files are staged.  
     - The changes match the purpose of the group.

5. **Commit with a structured message**  
   - Use this structure:  
     - **Summary line** (≤ 50 characters, imperative, specific): e.g. “Fix delta aggregation bug”, “Update beamer tables layout”.  
     - **Body** (optional but recommended): brief bullet list of key changes and rationale.
   - Example:

     ```text
     Fix delta aggregation bug in eqt module

     - Correct bucket boundary in src/eqt/delta_aggregation.py
     - Add regression test in tests/trades/test_delta_aggregation.py
     - Prevent loss of final interval in summaries
     ```

6. **Verify commit**  
   - Run `git status` to confirm:  
     - No unintended files remain staged for this group.  
     - The current group’s changes are now committed.

7. **Push immediately**  
   - Run: `git push origin <current-branch>`.  
   - Confirm in the output that the push completed successfully.

8. **Repeat for remaining groups**  
   - Go back to step 3 for the next logical group (if any).

---

### 3. Commit Grouping Rules

- **Group together**  
  - Changes that address the **same feature** or **same bug**.  
  - Related refactors in the same area of the code.  
  - Documentation/config changes that support the same change.

- **Separate into different commits**  
  - Unrelated features.  
  - Independent bug fixes.  
  - Large refactors that are conceptually distinct from feature or bug work.  
  - Documentation-only work that is not tightly bound to a code change.

When in doubt, prefer **slightly more commits with clear purposes** over one large, mixed commit.

---

### 4. Commit Message Rules (Strict)

- **Summary line**  
  - Imperative mood, present tense: “Add …”, “Fix …”, “Refactor …”, “Update …”.  
  - Under 50 characters.  
  - Describe **what** and **where** (component/module), not how.

- **Body (recommended)**  
  - Use short bullet points that state:  
    - **What** changed in key files.  
    - **Why** (bug prevented, behavior improved, design decision).  
  - Mention 1–3 important files when relevant (with paths).

- **Do not**  
  - Use generic summaries like “Update code”, “Fix issues”, “Small changes”.  
  - Include tool-related footers or attributions (Copilot, etc.).

---

### 5. Minimal Example Workflow

```bash
# Inspect changes
git status

# Group 1: Bug fix in delta aggregation
git add src/eqt/delta_aggregation.py tests/trades/test_delta_aggregation.py
git diff --staged
git commit -m "Fix delta aggregation edge-case bug" -m "- Correct bucket boundary handling in src/eqt/delta_aggregation.py\n- Extend regression tests in tests/trades/test_delta_aggregation.py\n- Prevent loss of final interval in aggregation"
git push origin main

# Group 2: Documentation update
git add README.md TeX/beamer/main_beamer.tex
git diff --staged
git commit -m "Update documentation for whales pipeline" -m "- Clarify data flow in README.md\n- Sync notation in TeX/beamer/main_beamer.tex with current code"
git push origin main
```

---

### 6. Completion Checklist (Before Marking Task Done)

- [ ] All intended changes are committed in one or more logical commits.  
- [ ] Each commit:  
  - [ ] Has a clear, imperative summary line.  
  - [ ] Has, when needed, a short body explaining what and why.  
- [ ] Each commit was pushed (`git push origin <branch>`) and the push succeeded.  
- [ ] No remaining uncommitted changes relevant to the finished task.


