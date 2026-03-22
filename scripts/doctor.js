import { getBrowserStatus, listTabs } from "../src/browser-service.js";

try {
  const status = await getBrowserStatus();
  const tabs = await listTabs();
  console.log(
    JSON.stringify(
      {
        ok: true,
        executable: status.executable,
        port: status.port,
        target: status.target,
        requestedTarget: status.requestedTarget,
        backend: status.backend,
        cdpReachable: status.cdpReachable,
        javascriptFromAppleEvents: status.javascriptFromAppleEvents,
        assistiveAccess: status.assistiveAccess,
        domAutomation: status.domAutomation,
        tabCount: tabs.length,
        tabs,
      },
      null,
      2
    )
  );
} catch (error) {
  console.error(
    JSON.stringify(
      {
        ok: false,
        error: error instanceof Error ? error.message : String(error),
      },
      null,
      2
    )
  );
  process.exitCode = 1;
}
