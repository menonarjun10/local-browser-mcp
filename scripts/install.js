import path from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
import { installMcpConfig } from "../src/config.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");

function enableAtlasRemoteDebuggingPreference() {
  try {
    execFileSync("defaults", ["write", "com.openai.atlas.web", "RemoteDebuggingAllowed", "-bool", "true"]);
    console.log("Enabled Atlas remote debugging preference when Atlas is used as the backend.");
  } catch {
    console.log("Could not update the optional Atlas remote debugging preference. Continuing.");
  }
}

try {
  installMcpConfig({ repoRoot });
  enableAtlasRemoteDebuggingPreference();
  console.log("Registered local_browser in ~/.codex/config.toml");
  console.log("Running doctor check...");
  try {
    execFileSync(process.execPath, [path.join(repoRoot, "scripts", "doctor.js")], {
      stdio: "inherit",
    });
  } catch {
    console.log(
      "Backend verification did not fully pass on this machine. The MCP server is still installed."
    );
  }
  console.log("Restart Codex to load the new MCP server.");
} catch (error) {
  console.error(error instanceof Error ? error.stack || error.message : String(error));
  process.exitCode = 1;
}
