import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { DEFAULT_BROWSER_TARGET } from "./constants.js";

const LS_PLIST_PATH = path.join(
  os.homedir(),
  "Library",
  "Preferences",
  "com.apple.LaunchServices",
  "com.apple.launchservices.secure.plist"
);

function readLaunchServicesJson() {
  if (!fs.existsSync(LS_PLIST_PATH)) {
    return null;
  }

  const json = execFileSync("plutil", ["-convert", "json", "-o", "-", LS_PLIST_PATH], {
    encoding: "utf8",
  });
  return JSON.parse(json);
}

export function getDefaultBrowserBundleId() {
  const launchServices = readLaunchServicesJson();
  const handlers = launchServices?.LSHandlers;
  if (!Array.isArray(handlers)) {
    return null;
  }

  const httpsHandler = handlers.find((entry) => entry.LSHandlerURLScheme === "https");
  if (httpsHandler?.LSHandlerRoleAll) {
    return httpsHandler.LSHandlerRoleAll;
  }

  const httpHandler = handlers.find((entry) => entry.LSHandlerURLScheme === "http");
  return httpHandler?.LSHandlerRoleAll ?? null;
}

export function resolveBrowserTarget(bundleId) {
  switch (bundleId) {
    case "com.google.Chrome":
      return "chrome";
    case "com.openai.atlas":
      return "atlas";
    default:
      return "atlas";
  }
}

export function getBrowserTargetInfo() {
  const requestedTarget = DEFAULT_BROWSER_TARGET;
  const defaultBrowserBundleId = getDefaultBrowserBundleId();
  const target =
    requestedTarget === "default"
      ? resolveBrowserTarget(defaultBrowserBundleId)
      : requestedTarget;

  return {
    requestedTarget,
    target,
    defaultBrowserBundleId,
  };
}
