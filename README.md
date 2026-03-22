# Local Browser MCP

`local-browser-mcp` is an MCP server that lets an agent use a browser running on your machine.

The point is not generic browser automation. The point is exposing local, user-owned browser capabilities to an MCP client such as Codex or ChatGPT through a local bridge.

## Client compatibility

The server is designed around MCP and should be portable to other MCP-capable clients, but the currently documented install path is verified for Codex only.

Today, this repo should be described as:

- working with Codex
- likely portable to other MCP-capable clients
- not yet documented or verified end-to-end for Claude Code or other clients

## Current stage

This project should be read as an early open-source idea with a working prototype, not as a finished platform.

The immediate job is:

- spread the idea clearly
- show that the approach is useful
- keep building toward a safer and more reliable local agent runtime

That means the repo should be explicit about where the implementation is strong, where it is weak, and what still needs to be built.

## Why this exists

Cloud agents cannot directly use the browser on your laptop. They need a local runtime that can:

- run on the user's machine
- talk to a real browser or browser-like app
- expose safe, structured tool calls back to the agent

That is what this project does.

## What it is

- an MCP server named `local_browser`
- a local bridge between an agent and a browser on the same machine
- a small tool surface for browsing, inspection, and lightweight interaction
- a backend-based runtime that can target different local browser implementations

## What it is not

- not a replacement for Playwright as a general testing framework
- not a cloud-hosted browser
- not a guarantee of perfect reliability across every site or sleep/wake cycle
- not a way for a cloud agent to use your local browser without a local companion process

## Core use cases

- Use an already signed-in browser context from an agent.
- Open pages, inspect visible text, and move through tabs.
- Perform lightweight authenticated actions on the user's machine.
- Give an MCP client access to local browser state without exposing raw cookies or credentials.

## Example use cases

Different people need different entry points. A useful local browser bridge should make sense to all of them.

### AI-curious user

- "Open my X notifications and tell me what changed."
- "Check whether I am logged into GitHub in the local browser."
- "Open a dashboard I already use and summarize what is on screen."

### AI-native operator

- "Use my signed-in browser session to check three vendor portals and compare the status."
- "Open LinkedIn messages, inspect unread threads, and draft suggested replies without sending anything."
- "Move through a real authenticated workflow where API access does not exist."

### Developer or agent builder

- "Expose a local browser as MCP tools to a ChatGPT or Codex workflow."
- "Let an agent inspect a page in my local browser instead of a cloud browser."
- "Build a local companion that gives a cloud agent access to a user-owned browser context."

For a fuller set of examples, see [docs/use-cases.md](docs/use-cases.md).

## How it works

```text
Agent / MCP client
        |
        v
  local-browser-mcp
        |
        v
 backend adapter
   |         |
   v         v
 Atlas    Chrome/CDP
        |
        v
 local browser session
```

At runtime:

1. The MCP client calls tools on the local `local_browser` server.
2. The server routes those calls through a backend adapter.
3. The backend talks to a real local browser surface.
4. Results are returned to the MCP client as structured tool output.

For a deeper explanation, see [docs/how-it-works.md](docs/how-it-works.md).
For implementation risks and open limitations, see [docs/limitations-and-risks.md](docs/limitations-and-risks.md).

## Quick start (Codex)

Install dependencies:

```bash
npm install
```

Install the repo as a local MCP server:

```bash
npm run install-local
```

That writes a `local_browser` entry into `~/.codex/config.toml`.

If you want a stable copy outside the repo for reuse across sessions:

```bash
npm run install-global
```

That copies the runtime to `~/.local/share/local-browser-mcp` and points the MCP config there.

After installing, restart your MCP client so it reloads the server.

## Other MCP clients

The runtime itself is not intended to be Codex-specific, but the helper install scripts currently target Codex configuration.

If you want to use another MCP client such as Claude Code, treat that as a manual integration:

1. install dependencies with `npm install`
2. inspect what `npm run install-local` writes for Codex
3. register the same server command in your other client's MCP configuration format
4. restart that client and verify that the `local_browser` tool namespace loads

Until that path is tested, avoid claiming direct Claude Code support in the README.

## Available tools

This server exposes these MCP tools:

- `status`
- `list_tabs`
- `open_url`
- `click`
- `fill`
- `press_key`
- `snapshot`
- `evaluate`
- `screenshot`
- `close_tab`

When loaded into an MCP client, these appear under the `local_browser` namespace.

## Backend model

`local-browser-mcp` currently supports two backends:

| Target | Transport | Strengths | Weaknesses |
| --- | --- | --- | --- |
| `chrome` | Playwright over CDP | Better DOM automation, more reliable interaction model | Uses a dedicated automation profile |
| `atlas` | AppleScript | Local control without Chrome CDP | Weaker automation surface, more app-specific quirks |

Target selection:

- `BROWSER_TARGET=default` resolves the macOS default browser bundle id and maps supported browsers to a backend
- `BROWSER_TARGET=chrome` forces the Chrome backend
- `BROWSER_TARGET=atlas` forces the Atlas backend

## Reliability notes

The connection has multiple layers:

- MCP client to local server
- local server to backend adapter
- backend adapter to browser
- browser to page or app

In practice:

- `chrome` is the better path for reliable DOM automation.
- `atlas` is useful, but should be treated as a weaker backend.
- sleep/wake should be treated as a reconnect boundary, not a permanently live session.
- browser login state may persist longer than the automation connection.

## Why talk about risks openly

For a project like this, honesty is part of the product.

If the repo overstates the current implementation, people will misread it as a generic browser automation framework and judge it against the wrong standard. The better framing is:

- the idea is strong
- the current implementation is real but early
- the value comes from local authenticated context
- the hard work ahead is safety, policy, observability, and reliability

## Roadmap direction

The interesting evolution is not "more browser automation."

The interesting evolution is:

- identify which agent is acting
- audit what it did
- restrict what local scope it is allowed to touch
- make sensitive actions explicit and reviewable

That means future work should focus on observability, policy, and safety boundaries around local execution, not just more action primitives.

See [docs/roadmap.md](docs/roadmap.md) for the planned direction.

## Current limitations

In current development and testing, Atlas works for window, tab, URL, and screenshot control, but tested Atlas builds have not exposed a usable CDP endpoint on `9333`.

For DOM-level actions in Atlas mode, `View > Developer > Allow JavaScript from Apple Events` must be enabled. In tested Atlas builds, that menu item has not been available even though AppleScript references it. In practice, `click`, `fill`, and `evaluate` may be unavailable in Atlas mode depending on the installed Atlas build.

If you need stronger DOM automation right now, use `BROWSER_TARGET=chrome`.

For keyboard automation through `press_key` in Atlas mode, macOS Accessibility permissions must be granted to the host app because that path uses `System Events`.

For a fuller discussion of implementation and product risk, see [docs/limitations-and-risks.md](docs/limitations-and-risks.md).

## Configuration

Environment overrides:

- `BROWSER_TARGET`
- `ATLAS_APP_PATH`
- `ATLAS_CDP_PORT`
- `CHROME_APP_PATH`
- `CHROME_PROFILE_DIR`
- `CHROME_CDP_PORT`

## Local development

Useful commands:

```bash
npm run serve
npm run doctor
npm run launch
```

## Contributing

If you want to help build the project, start here:

- [CONTRIBUTING.md](CONTRIBUTING.md)
- [docs/roadmap.md](docs/roadmap.md)
- [docs/limitations-and-risks.md](docs/limitations-and-risks.md)
