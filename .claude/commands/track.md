# Track Progress Update

Update the tracking documentation in `planning/phase1/` and `.dashboard/` based on work completed in this session.

## CRITICAL: Avoid Bloat

**Before making ANY update, ask yourself:**
- Is this a meaningful change worth recording?
- Does this change the project status or fix something notable?
- Would someone reading this doc need to know about this change?

**DO NOT update docs for:**
- Work that doesn't change overall progress
- Changes already covered by existing entries
- Exploratory work or research that led nowhere
- Trivial changes (typos, formatting, comments)

**DO update docs for:**
- New features or major functionality
- Bug fixes and tweaks (even minor ones)
- Config changes and refactors
- Completing a workstream milestone
- Significant architecture changes
- Changes that affect the roadmap
- Work that future sessions need to know about

## Documents & When to Update

### 1. `planning/phase1/progress-log.md`
**Update if:** Code was written, bugs fixed, config changed, or any meaningful work done.

**Skip if:** Pure research/exploration with no code changes, or work already logged.

Entry format (keep brief):
```markdown
## YYYY-MM-DD — [Brief Title]

### Overview
[1-2 sentences max]

### Files Created/Modified
- [Only list key files, not every touched file]

### Status
- [What's next]
- [Any blockers]
```

### 2. `planning/phase1/10-roadmap.md`
**Only update if:** Workstream status changed OR overall progress percentage changed significantly.

**Skip if:** Work is within an already-tracked workstream with no status change.

Update the status table:
```markdown
| Workstream | Status | Progress |
|------------|--------|----------|
| A: Assets  | 🟡 In Progress | 60% |
```

### 3. `.dashboard/state.json`
**Update if:** Any workstream or task status changed (completed, started, blocked).

**Skip if:** No status changes occurred.

Update these fields as needed:
- `lastUpdated` — Current ISO timestamp
- `currentPhase` — Current work focus
- `waves[].status` — Wave status (pending/in_progress/completed)
- `waves[].streams[].status` — Stream status (pending/implementing/completed)
- `waves[].streams[].acceptanceCriteria[].met` — Mark criteria as met (true/false)
- `summary` — Update task counts (completed, inProgress, pending)
- `testResults` — Update test counts if tests were run
- `notes` — Add dated note summarising session work

### 4. `ARCHITECTURE_DECISIONS.md` (if exists)
**Only update if:** A significant architectural decision was made or changed.

**Skip if:** No architectural decisions were involved.

## Instructions

1. Review conversation context
2. **Evaluate significance** — Is this worth documenting?
3. If YES: Read current doc state, apply minimal targeted updates
4. If NO: Report "No updates needed" with brief reason
5. Use British English, be concise

## After Evaluation

Report one of:
- **"No updates needed"** — explain why (already covered, no code changes, etc.)
- **"Updated [doc names]"** — list specific changes made

Keep entries concise. Don't pad with unnecessary detail.
