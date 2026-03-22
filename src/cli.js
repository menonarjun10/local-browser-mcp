import path from "node:path";
import { fileURLToPath } from "node:url";
import { getBrowserStatus, listTabs } from "./browser-service.js";
import { installMcpConfig } from "./config.js";
import { CLI_NAME, DEFAULT_CONFIG_PATH } from "./constants.js";
import { startServer } from "./server.js";

function repoRootFromMeta() {
  return path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
}

export async function runCli(args) {
  const command = args[0] ?? "help";
  const repoRoot = repoRootFromMeta();

  if (command === "serve") {
    await startServer();
    return;
  }

  if (command === "install") {
    const configPath = installMcpConfig({
      configPath: DEFAULT_CONFIG_PATH,
      repoRoot,
    });
    console.log(`Installed MCP config at ${configPath}`);
    console.log("Restart Codex to load the local_browser server.");
    return;
  }

  if (command === "launch") {
    const status = await getBrowserStatus();
    console.log(JSON.stringify(status, null, 2));
    return;
  }

  if (command === "doctor") {
    const status = await getBrowserStatus();
    const tabs = await listTabs();
    console.log(
      JSON.stringify(
        {
          ok: true,
          executable: status.executable,
          port: status.port,
          launched: status.launched,
          target: status.target,
          requestedTarget: status.requestedTarget,
          backend: status.backend,
          cdpReachable: status.cdpReachable,
          javascriptFromAppleEvents: status.javascriptFromAppleEvents,
          assistiveAccess: status.assistiveAccess,
          domAutomation: status.domAutomation,
          tabCount: tabs.length,
        },
        null,
        2
      )
    );
    return;
  }

  console.log(`Usage: ${CLI_NAME} <serve|install|launch|doctor>`);
}
