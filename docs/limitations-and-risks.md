# Limitations and Risks

This project is worth building, but the current implementation has real limits. This document is here so people understand both the idea and the current state honestly.

## The idea is ahead of the implementation

The core idea is:

`Give an agent access to a user's real local browser context through a local MCP bridge.`

That idea is strong.

The current implementation is an early proof of that idea. It is useful today, but it is not yet a mature local agent runtime.

## Product risk: people may misunderstand what this is

The biggest positioning risk is that people read this as:

- a generic browser automation framework
- a Playwright competitor
- a fully reliable end-user product

Those are the wrong expectations.

The stronger framing is:

- local bridge for agent access
- focused on real signed-in browser context
- early-stage infrastructure with a roadmap around safety and observability

## Current implementation limitations

### 1. Backend reliability is uneven

The repo supports multiple backends, but they are not equally strong.

- `chrome` is the better backend for DOM automation
- `atlas` is useful, but weaker and more brittle

This means capability is backend-dependent even though the MCP surface is uniform.

### 2. Sleep and reconnect are not fully handled

The local automation connection should be treated as temporary.

After sleep, wake, restart, or browser crashes:

- the MCP process may need recovery
- the browser automation handle may be stale
- local ports may need to be reattached
- login state may still exist even when automation state does not

This is not fully abstracted away yet.

### 3. Session and profile visibility are weak

One of the biggest sources of confusion is: which browser profile is actually in use?

Today, users may not immediately know:

- which local profile is active
- whether it is signed in
- whether it is their everyday profile or an automation profile

That ambiguity weakens trust.

### 4. The current tool surface is thin

The MCP tools are useful, but still basic.

Missing or immature areas include:

- richer waits and retries
- stronger page-state detection
- better element discovery
- more structured error reporting
- clearer capability signaling

### 5. Sensitive actions are not yet governed well enough

The project is moving toward powerful local execution. That means actions like:

- posting
- deleting
- purchasing
- changing settings
- submitting forms

should not be treated the same as read-only browsing or inspection.

That policy layer is not fully built yet.

## Security and trust risks

### 1. Local execution increases the trust bar

A local browser bridge is only valuable if users trust it.

That means the project must eventually answer:

- Which agent is acting?
- What exactly did it do?
- What local surfaces was it allowed to touch?
- Can the user review or restrict those actions?

Without strong answers here, capability growth becomes a liability.

### 2. Multi-agent use introduces attribution problems

Once multiple agents can share the same local bridge, you need attribution.

Otherwise users cannot answer:

- which agent opened this site
- which agent typed this input
- which session made this change

That is why audit logs are not a nice-to-have. They are a core part of the future product.

### 3. Domain and scope boundaries are not yet first-class

The future product likely needs controls such as:

- allowlisted domains
- read-only mode
- no-submit mode
- per-tool permissions
- per-agent permissions
- profile-specific access

Those controls are only partially expressed today.

## Adoption risk

### 1. The concept may be easier to believe than to install

The idea is intuitive once explained, but local tooling still creates friction:

- install step
- local permissions
- browser-specific quirks
- login state confusion

That means good documentation matters a lot. The project has to be easy to understand before it becomes easy to trust.

### 2. Users may expect cloud convenience from a local system

This is a local bridge. That means:

- it depends on the user's machine
- it depends on local browser state
- it depends on reconnect and runtime recovery

That is a different reliability model from a pure cloud product.

## Why this is still worth building

Even with these limitations, the project points at a real gap:

- cloud agents do not have the user's local browser context
- many workflows still live behind browser-only interfaces
- users want agents to work in their real environment, not just in isolated cloud sandboxes

That gap is real enough that even an early implementation is useful.

## The right way to present the project

The right story is not:

`This already solves local browser automation.`

The better story is:

`This is an early but real MCP bridge for agent access to local authenticated browser context, and the next work is making that access observable, restrictable, and trustworthy.`

## Near-term priorities implied by these risks

- improve reconnect handling
- make backend capabilities explicit
- add per-agent audit logs
- add scope and permission boundaries
- make profile and session state visible
- keep documentation honest and easy to understand
