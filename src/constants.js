import os from "node:os";
import path from "node:path";

export const PACKAGE_NAME = "local-browser-mcp";
export const CLI_NAME = "local-browser-mcp";
export const MCP_SERVER_NAME = "local_browser";
export const DEFAULT_ATLAS_CDP_PORT = 9333;
export const DEFAULT_CHROME_CDP_PORT = 9224;
export const DEFAULT_BROWSER_TARGET = process.env.BROWSER_TARGET ?? "default";
export const DEFAULT_PROFILE_ROOT = path.join(
  os.homedir(),
  "Library",
  "Application Support",
  "com.openai.local-browser-mcp"
);
export const DEFAULT_CHROME_PROFILE_DIR = path.join(DEFAULT_PROFILE_ROOT, "chrome-profile");
export const DEFAULT_CONFIG_PATH = path.join(os.homedir(), ".codex", "config.toml");
export const DEFAULT_ATLAS_APP = "/Applications/ChatGPT Atlas.app";
export const DEFAULT_ATLAS_BIN = path.join(
  DEFAULT_ATLAS_APP,
  "Contents",
  "MacOS",
  "ChatGPT Atlas"
);
export const DEFAULT_CHROME_APP = "/Applications/Google Chrome.app";
export const DEFAULT_CHROME_BIN = path.join(
  DEFAULT_CHROME_APP,
  "Contents",
  "MacOS",
  "Google Chrome"
);
