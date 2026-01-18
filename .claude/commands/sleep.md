# Sleep — End of Session Wrap-up

Run the tracking update and provide a session summary before signing off.

## Steps

### 1. Run /track Logic

First, evaluate whether tracking docs need updating (follow `/track` criteria):

- Review conversation context for work done this session
- If meaningful work was done (code, fixes, config, features): update relevant docs
- If nothing worth logging: note "No tracking updates needed"

### 2. Session Summary

Provide a brief summary of the session based on:
- Conversation context (what was discussed/implemented)
- Latest progress log entry (if just updated or already exists for today)

## Summary Format

```
## Session Summary — [Date]

### Done
- [Bullet list of completed work]

### Files Touched
- [Key files created or modified, if any]

### Status
- [Current state: what's working, what's pending]
- [Which workstream(s) progressed]

### Next Session
- [Suggested starting point for next time]
- [Any blockers to address]
```

## Guidelines

- Keep summary concise (aim for 10-15 lines max)
- Focus on outcomes, not process
- "Files Touched" should only list significant files, not every edit
- "Next Session" should be actionable — what specifically to pick up
- Reference the relevant workstream (A, B, C, D, E)
- If tests were run, mention the result briefly
- Use British English

## Output Order

1. First, state whether tracking docs were updated (and which ones)
2. Then provide the session summary

Example:

```
**Tracking:** Updated progress-log.md

## Session Summary — 2025-01-18

### Done
- Implemented file upload handler with R2 storage
- Added image validation (type, size, dimensions)
- Created asset service tests

### Files Touched
- `app/routes/api.upload.ts`
- `app/services/storage.server.ts`
- `__tests__/services/storage.test.ts`

### Status
- Workstream A: 40% complete
- Upload flow working, generation pending

### Next Session
- Implement AI image generation with Replicate
- Add credit deduction before generation
```

Or:

```
**Tracking:** No updates needed (planning/research only)

## Session Summary — 2025-01-18
...
```
