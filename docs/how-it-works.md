# How It Works

This document explains what `local-browser-mcp` is actually doing under the hood and where its reliability limits come from.

## Mental model

This project is a local MCP bridge.

It does not give a cloud agent magical direct access to a laptop browser. Instead, it provides a local server process that runs on the same machine as the browser and exposes browser actions through MCP tools.

```text
cloud or local agent
        |
        v
     MCP client
        |
        v
  local-browser-mcp
        |
        v
   backend adapter
        |
        v
   local browser/app
```

## Why MCP is a good fit

MCP is useful here because it lets an agent treat local browser control as a tool instead of a hidden side channel.

That gives you:

- a clear interface
- explicit tool boundaries
- structured inputs and outputs
- a natural place to add permissions, logging, and safety checks later

## Connection layers

When people ask whether the connection is reliable, there are actually several different connections involved.

### 1. MCP client to server

This is usually the most reliable layer. The MCP client starts the local server and communicates with it through the normal MCP transport.

### 2. Server to backend

This is where most practical failures start showing up.

- In `chrome` mode, the server connects to Chrome over CDP using Playwright.
- In `atlas` mode, the server drives Atlas through AppleScript and optional JavaScript execution.

These are very different reliability profiles even though they share the same MCP tool interface.

### 3. Backend to page

Once the backend has the browser, it still has to interact with a real website:

- the page may load slowly
- the DOM may change after render
- auth state may expire
- the page may use iframes or complex client-side rendering
- the site may resist automation

This is ordinary browser automation brittleness.

## Backend comparison

## Chrome backend

The Chrome backend is the stronger implementation today.

Why:

- it uses a real automation surface
- DOM interactions are more predictable
- selector-driven actions are more practical
- reconnecting is easier when Chrome is still running

Tradeoff:

- it uses a dedicated automation profile unless you deliberately point it elsewhere

## Atlas backend

The Atlas backend is valuable because it is local and lightweight, but it is a weaker transport.

Why:

- AppleScript is less robust than CDP
- some capabilities depend on app-specific scripting support
- some actions require Accessibility permissions
- JavaScript execution depends on Atlas exposing the needed menu capability

Atlas is best treated as a useful adapter, not the strongest backend.

## Sleep and reconnect behavior

The automation connection should be treated as temporary.

After the computer sleeps:

- the MCP process may need to be restarted
- the browser automation handle may be stale
- local ports may need to be reattached
- the browser may still be logged in even if the automation session is gone

That means the correct design assumption is:

- browser session may persist
- automation connection probably needs recovery

A stronger future implementation should explicitly detect stale sessions and reconnect automatically.

## What this project should optimize for

If this project tries to compete with Playwright as a testing framework, it will be weak.

If it focuses on this problem, it makes sense:

`Give an MCP client safe access to a user's real local browser context.`

That means the highest-value improvements are:

- profile and session visibility
- reconnect handling
- safety boundaries for sensitive actions
- better retries and waits
- clear capability reporting per backend

## Current repo structure

- [src/server.js](../src/server.js) registers the MCP tools.
- [src/browser-service.js](../src/browser-service.js) routes tool calls to the active backend.
- [src/browser-target.js](../src/browser-target.js) resolves the requested or default browser target.
- [src/backends/atlas.js](../src/backends/atlas.js) implements the Atlas adapter.
- [src/backends/chrome.js](../src/backends/chrome.js) implements the Chrome adapter.

## Practical summary

This project makes sense if you want:

- a local MCP bridge
- authenticated browser access from an agent
- a standard tool interface over local browser capabilities

It makes less sense if you want:

- a full browser testing framework
- high-scale cloud automation
- a browser that works without a local runtime
