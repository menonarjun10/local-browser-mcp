# Session Scoping and Tool Capabilities

This document explains the public product idea behind session-scoped tools without including private workspace history or internal operational notes.

## Why session scoping matters

A useful agent platform should not assume that every thread, chat, or agent session gets the same tools forever.

Different tasks need different capability bundles.

Examples:

- a research thread may only need read access
- a debugging thread may need shell, logs, and browser inspection
- a communications thread may need email or messaging write access

That leads to a simple principle:

`Tool availability should be session-scoped, not treated as a single permanent property of the user.`

## The basic model

The simplest system model is:

- a user identity exists globally
- each thread or session gets a capability bundle
- the agent only sees tools in that bundle
- risky tools are revalidated server-side before use

This allows the same user to have:

- one thread with read-only browsing
- another thread with browser plus shell
- another thread with temporary write permissions

## Why platforms would do this

Session scoping is useful for several reasons.

### 1. Least privilege

Most threads do not need broad write access.

That means a platform can keep the default surface smaller and safer.

### 2. Blast-radius reduction

If a model behaves badly or a tool is misused, damage is limited to the current session scope rather than every connected system.

### 3. Better approvals

Temporary or task-scoped approvals are easier to reason about than global permanent power.

Examples:

- allow this thread to post to a specific service for the next 30 minutes
- allow this session to inspect a browser but not submit forms

### 4. Better audits

Per-session scoping makes it easier to answer:

- what tools were available in this session
- why a risky action was permitted
- which approval or policy enabled it

## What this means for local-browser-mcp

For a project like `local-browser-mcp`, session scoping should eventually apply at multiple levels:

- which agents can use the local browser at all
- which domains they can access
- which profiles they can operate in
- which tools they can call
- which actions require confirmation

That is why policy and auditability are core roadmap items, not optional extras.

## Good future model

The stronger future architecture is:

- identity and agent/client context
- policy evaluation for session capabilities
- tool filtering before the agent sees the surface
- server-side enforcement before risky actions execute
- local logs that show what happened

The important security rule is:

`The model should never be the enforcement boundary. Prompt text is not security.`

## Questions this design should answer

As the project evolves, the runtime should be able to answer:

- which agent is acting
- what tools were available in this session
- what local scope the session was allowed to touch
- whether the session was read-only or write-enabled
- what sensitive actions required extra confirmation

## Relationship to the roadmap

This document connects directly to the roadmap themes:

- per-agent audit logs
- scope restriction for local access
- stronger confirmation for sensitive actions
- policy hooks
- profile and session visibility

Those are the natural next steps if the project is meant to become a trustworthy local agent bridge instead of a loose automation demo.
