# Contributing

Thanks for helping with `local-browser-mcp`.

This project is still early. The most valuable contributions are the ones that make the product easier to trust, easier to understand, and safer to use.

## Before you start

Read these first:

- [README.md](README.md)
- [docs/how-it-works.md](docs/how-it-works.md)
- [docs/use-cases.md](docs/use-cases.md)
- [docs/roadmap.md](docs/roadmap.md)
- [docs/limitations-and-risks.md](docs/limitations-and-risks.md)

Those documents explain the current product thesis:

`This is a local MCP bridge for agent access to a user's real browser context.`

That framing matters. If a change pushes the project toward "generic browser automation" without strengthening the local-agent story, it is probably the wrong priority.

## Best areas to contribute

The highest-value work right now is:

- reconnect and recovery behavior
- clearer backend capability reporting
- auditability and usage logs
- scope restriction and safety controls
- profile and session visibility
- documentation that makes the idea easier to understand

## Good contribution shape

Good changes usually do one of these:

- make the local bridge more reliable
- make the active backend and its limits more visible
- make local execution safer or more attributable
- improve docs so new users understand the point quickly

## Less useful contribution shape

Less useful changes usually do one of these:

- turn the project into a generic Playwright wrapper
- add broad automation surface without safety boundaries
- optimize for scraping or cloud browser use cases instead of local context

## Development workflow

Install dependencies:

```bash
npm install
```

Useful commands:

```bash
npm run serve
npm run doctor
npm run launch
```

## Issues

The roadmap is being turned into a small issue backlog. If you want to contribute, start with an issue that aligns with:

- reliability
- observability
- policy and scope restriction
- documentation and onboarding

If you want to propose a new direction, open an issue first and explain how it strengthens the core thesis of the project.
