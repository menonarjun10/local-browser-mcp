import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { installMcpConfig } from "../src/config.js";

const sourceRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const targetRoot = path.join(os.homedir(), ".local", "share", "local-browser-mcp");

function enableAtlasRemoteDebuggingPreference() {
  try {
    execFileSync("defaults", ["write", "com.openai.atlas.web", "RemoteDebuggingAllowed", "-bool", "true"]);
    console.log("Enabled Atlas remote debugging preference when Atlas is used as the backend.");
  } catch {
    console.log("Could not update the optional Atlas remote debugging preference. Continuing.");
  }
}

function copyDir(source, target) {
  fs.mkdirSync(target, { recursive: true });
  for (const entry of fs.readdirSync(source, { withFileTypes: true })) {
    if (["node_modules", ".git", ".playwright-cli"].includes(entry.name)) {
      continue;
    }
    const sourcePath = path.join(source, entry.name);
    const targetPath = path.join(target, entry.name);
    if (entry.isDirectory()) {
      copyDir(sourcePath, targetPath);
    } else {
      fs.copyFileSync(sourcePath, targetPath);
    }
  }
}

fs.rmSync(targetRoot, { recursive: true, force: true });
copyDir(sourceRoot, targetRoot);
execFileSync("npm", ["install", "--omit=dev"], { cwd: targetRoot, stdio: "inherit" });
installMcpConfig({ repoRoot: targetRoot });
enableAtlasRemoteDebuggingPreference();

console.log(`Installed global local_browser runtime at ${targetRoot}`);
console.log("Restart Codex to load the updated global MCP server.");
