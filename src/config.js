import fs from "node:fs";
import path from "node:path";
import { DEFAULT_CONFIG_PATH, MCP_SERVER_NAME } from "./constants.js";

function escapeTomlString(value) {
  return value.replaceAll("\\", "\\\\").replaceAll("\"", "\\\"");
}

export function buildMcpBlock({ repoRoot, nodePath = process.execPath }) {
  const command = escapeTomlString(nodePath);
  const scriptPath = escapeTomlString(path.join(repoRoot, "bin", "local-browser-mcp.js"));
  const envEntries = [
    process.env.BROWSER_TARGET
      ? `BROWSER_TARGET = "${escapeTomlString(process.env.BROWSER_TARGET)}"`
      : null,
    process.env.ATLAS_APP_PATH
      ? `ATLAS_APP_PATH = "${escapeTomlString(process.env.ATLAS_APP_PATH)}"`
      : null,
    process.env.ATLAS_CDP_PORT
      ? `ATLAS_CDP_PORT = "${escapeTomlString(process.env.ATLAS_CDP_PORT)}"`
      : null,
    process.env.CHROME_APP_PATH
      ? `CHROME_APP_PATH = "${escapeTomlString(process.env.CHROME_APP_PATH)}"`
      : null,
    process.env.CHROME_PROFILE_DIR
      ? `CHROME_PROFILE_DIR = "${escapeTomlString(process.env.CHROME_PROFILE_DIR)}"`
      : null,
    process.env.CHROME_CDP_PORT
      ? `CHROME_CDP_PORT = "${escapeTomlString(process.env.CHROME_CDP_PORT)}"`
      : null,
  ].filter(Boolean);
  return [
    `[mcp_servers.${MCP_SERVER_NAME}]`,
    `command = "${command}"`,
    `args = ["${scriptPath}", "serve"]`,
    ...(envEntries.length ? [`env = { ${envEntries.join(", ")} }`] : []),
    "",
  ].join("\n");
}

export function installMcpConfig({ configPath = DEFAULT_CONFIG_PATH, repoRoot, nodePath }) {
  const block = buildMcpBlock({ repoRoot, nodePath });
  fs.mkdirSync(path.dirname(configPath), { recursive: true });

  const existing = fs.existsSync(configPath) ? fs.readFileSync(configPath, "utf8") : "";
  const lines = existing.split("\n");
  const sectionHeader = `[mcp_servers.${MCP_SERVER_NAME}]`;
  const output = [];
  let inTargetSection = false;
  let inserted = false;

  for (const line of lines) {
    const isSectionHeader = /^\[[^\]]+\]$/.test(line.trim());
    if (line.trim() === sectionHeader) {
      if (!inserted) {
        output.push(block.trimEnd());
        inserted = true;
      }
      inTargetSection = true;
      continue;
    }

    if (inTargetSection) {
      if (isSectionHeader) {
        inTargetSection = false;
        output.push(line);
      }
      continue;
    }

    output.push(line);
  }

  if (!inserted) {
    if (output.length && output[output.length - 1] !== "") {
      output.push("");
    }
    output.push(block.trimEnd());
  }

  const next = `${output.join("\n").replace(/\n{3,}/g, "\n\n")}\n`;

  fs.writeFileSync(configPath, next);
  return configPath;
}
