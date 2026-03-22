# Roadmap

This roadmap reflects the product direction that makes `local-browser-mcp` more useful and defensible.

The project should not just become "more browser automation."

It should become a safer local execution layer for agents.

## Product thesis

The long-term value is:

`Let agents use a real local browser context while making that access observable, reviewable, and bounded.`

That means the roadmap should optimize for:

- agent identity
- auditability
- scope restriction
- safe local execution
- reliability around reconnect and state recovery

## Near term

### 1. Better examples and positioning

Goal:

- make the product understandable to AI-curious users, AI-native operators, and developers

Why:

- distribution fails if people do not immediately understand what the project is for

### 2. Clear backend capability reporting

Goal:

- surface which backend is active
- report what it can and cannot do
- make weak paths explicit

Why:

- agent behavior gets better when capability mismatch is visible

### 3. Reconnect-aware runtime

Goal:

- treat sleep/wake and stale browser connections as recoverable states
- retry or reattach automatically where possible

Why:

- local systems are not stable in the same way as cloud workers

## Next phase

### 4. Per-agent audit logs

Goal:

- record which agent called which tool
- log target URLs, timestamps, backend used, and action result
- make it easy to inspect what happened after the fact

Why:

- once multiple agents can use the same local bridge, auditability becomes core infrastructure

Possible shape:

- append-only local event log
- session ids per client or agent
- optional export for debugging and review

### 5. Scope restrictions for local access

Goal:

- restrict which local browser surfaces an agent can use
- restrict which actions it can take
- restrict which domains or profiles are allowed

Why:

- local execution is only trustworthy if it can be bounded

Possible controls:

- allowlisted domains
- read-only mode
- no-submit mode
- profile-specific access
- per-tool permissions

### 6. Safer sensitive actions

Goal:

- require stronger confirmation for actions like posting, deleting, purchasing, or changing account settings

Why:

- not all browser actions should have the same trust level

## Longer term

### 7. Policy layer

Goal:

- express local execution rules as policy instead of hardcoded behavior

Examples:

- agent A can read from `github.com` and `linear.app`
- agent B can only inspect pages, never type or submit
- all social posting requires confirmation

### 8. Profile and session visibility

Goal:

- make the active local profile explicit
- show whether the browser is signed in
- distinguish everyday profile vs automation profile

Why:

- session ambiguity is one of the biggest sources of confusion today

### 9. Multi-agent local runtime

Goal:

- support multiple agents safely using the same local companion
- separate sessions, logs, permissions, and policies by agent

Why:

- this becomes much more interesting once local browser access is shared infrastructure instead of a one-off tool

## Non-goals

The project should avoid drifting into:

- a generic Playwright competitor
- a cloud browser platform
- a headless scraping framework
- unrestricted local automation without policy or auditability

## Success criteria

The project is succeeding if:

- users immediately understand what it is for
- agents can reliably use local browser context where APIs are missing
- actions are attributable to a specific agent or session
- local scope can be restricted before trust is lost
- the safety story gets stronger as capability expands
