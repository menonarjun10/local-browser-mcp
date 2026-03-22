# Example Use Cases

This document is meant to help different kinds of users understand where `local-browser-mcp` is useful.

The key idea is simple:

`This project helps an agent use a browser that is already running on the user's machine.`

That matters most when:

- the user is already signed in
- there is no good API
- the workflow is personal or desktop-local
- a cloud browser would not have the right context

## For AI-curious users

These users are not trying to build agent systems. They just want useful outcomes.

### Example 1: Check notifications

Prompt:

`Open my X notifications and summarize the important ones.`

Why this fits:

- the browser is already signed in
- the agent only needs lightweight navigation and inspection
- the user gets value without configuring APIs

### Example 2: Confirm local session state

Prompt:

`Open GitHub in my local browser and tell me whether I am signed in.`

Why this fits:

- the answer depends on the real local session
- a cloud agent would not have that context

### Example 3: Summarize a real page

Prompt:

`Open my analytics dashboard and summarize the current page.`

Why this fits:

- the value is in using the user's existing authenticated view
- the agent does not need direct backend credentials

## For AI-native users

These users already think in terms of agents, workflows, and personal AI infrastructure.

### Example 4: Use a real signed-in workflow

Prompt:

`Check the status of my applications across three sites that do not have APIs and summarize the differences.`

Why this fits:

- many real workflows live behind browser-only interfaces
- local auth is the hard part, not navigation

### Example 5: Draft but do not send

Prompt:

`Open LinkedIn messages, review unread threads, and draft suggested replies without sending anything.`

Why this fits:

- the agent can help inside a real account
- the user can keep final approval
- it naturally suggests future permission boundaries

### Example 6: Cross-check local context

Prompt:

`Open GitHub, then open Linear, and tell me whether the issue status matches the merged PR state.`

Why this fits:

- the browser is acting as the user's local context surface
- the workflow spans tools that may not be integrated elsewhere

## For developers and agent builders

These users care about architecture, not just end-user prompts.

### Example 7: Expose local browser access to an MCP client

Use case:

- connect Codex, ChatGPT, or another MCP client to a local browser bridge
- provide standardized browser tools through MCP

Why this fits:

- MCP gives a consistent tool contract
- the browser stays local
- the agent gains real local context it otherwise would not have

### Example 8: Use local auth without copying credentials

Use case:

- let an agent operate inside an already signed-in browser profile
- avoid handing raw cookies, passwords, or tokens to the agent

Why this fits:

- the local browser becomes the trust boundary
- the project is stronger as a bridge than as a generic automation library

### Example 9: Build a local companion for a cloud agent

Use case:

- a cloud-hosted agent decides what to do
- a local runtime executes browser actions on the user's machine

Why this fits:

- the cloud agent cannot directly use a laptop browser
- a local MCP server is the missing piece

## When this project is a poor fit

`local-browser-mcp` is weaker when the job is:

- large-scale scraping
- deterministic browser testing
- headless cloud automation
- workflows that already have good APIs

In those cases, Playwright or direct APIs are usually the better tool.

## Practical takeaway

The most useful framing is:

`Give an agent access to a user's real browser context through a local MCP bridge.`

That is easier to understand than "browser automation," and it points to the real value of the project.
