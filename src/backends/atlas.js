import fs from "node:fs";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import path from "node:path";
import {
  DEFAULT_ATLAS_APP,
  DEFAULT_ATLAS_BIN,
  DEFAULT_ATLAS_CDP_PORT,
} from "../constants.js";

const execFileAsync = promisify(execFile);

function quoteAppleScriptString(value) {
  return `"${String(value).replaceAll("\\", "\\\\").replaceAll("\"", "\\\"")}"`;
}

function getAtlasAppPathFromExecutable(executable) {
  if (executable.endsWith(".app")) {
    return executable;
  }

  const marker = ".app/Contents/MacOS/";
  if (executable.includes(marker)) {
    return executable.slice(0, executable.indexOf(marker) + 4);
  }

  return DEFAULT_ATLAS_APP;
}

async function runAppleScript(script) {
  const { stdout } = await execFileAsync("osascript", ["-e", script], {
    maxBuffer: 1024 * 1024 * 4,
  });
  return stdout.trim();
}

export function resolveAtlasBinary() {
  const envPath = process.env.ATLAS_APP_PATH;
  if (envPath) {
    const candidate = envPath.endsWith(".app")
      ? path.join(envPath, "Contents", "MacOS", "ChatGPT Atlas")
      : envPath;
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  if (fs.existsSync(DEFAULT_ATLAS_BIN)) {
    return DEFAULT_ATLAS_BIN;
  }

  throw new Error(
    `Could not find ChatGPT Atlas. Set ATLAS_APP_PATH or install Atlas at ${DEFAULT_ATLAS_APP}.`
  );
}

export function getAtlasSettings(overrides = {}) {
  const port = Number(
    overrides.port ?? process.env.ATLAS_CDP_PORT ?? DEFAULT_ATLAS_CDP_PORT
  );
  const executable = resolveAtlasBinary();
  return { port, executable };
}

export async function fetchJson(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 1000);
  const response = await fetch(url, { signal: controller.signal }).finally(() =>
    clearTimeout(timeout)
  );
  if (!response.ok) {
    throw new Error(`Request failed: ${response.status} ${response.statusText}`);
  }
  return response.json();
}

export async function getWsEndpoint(port = DEFAULT_ATLAS_CDP_PORT) {
  const version = await fetchJson(`http://127.0.0.1:${port}/json/version`);
  if (!version.webSocketDebuggerUrl) {
    throw new Error(`No webSocketDebuggerUrl exposed on port ${port}.`);
  }
  return version.webSocketDebuggerUrl;
}

export async function isAtlasReachable(port = DEFAULT_ATLAS_CDP_PORT) {
  try {
    await getWsEndpoint(port);
    return true;
  } catch {
    return false;
  }
}

export async function launchAtlas() {
  const executable = resolveAtlasBinary();
  await execFileAsync("open", ["-a", getAtlasAppPathFromExecutable(executable)]);
  return true;
}

export async function ensureAtlasRunning(overrides = {}) {
  const settings = getAtlasSettings(overrides);
  await launchAtlas();
  return {
    launched: true,
    backend: "applescript",
    cdpReachable: await isAtlasReachable(settings.port),
    ...settings,
  };
}

export async function checkJavaScriptFromAppleEvents() {
  const script = `
tell application "ChatGPT Atlas"
  try
    tell active tab of front window
      execute javascript "document.title"
    end tell
    return "enabled"
  on error errMsg
    return errMsg
  end try
end tell`;
  const result = await runAppleScript(script);
  return !result.includes("Allow JavaScript from Apple Events");
}

export async function checkAssistiveAccess() {
  try {
    const result = await runAppleScript(`
tell application "System Events"
  return name of first process
end tell`);
    return Boolean(result);
  } catch {
    return false;
  }
}

export async function listAtlasTabs() {
  const script = `
tell application "ChatGPT Atlas"
  activate
  set output to ""
  repeat with winIndex from 1 to count of windows
    set w to window winIndex
    repeat with tabIndex from 1 to count of tabs of w
      set t to tab tabIndex of w
      set output to output & winIndex & "||" & tabIndex & "||" & id of t & "||" & title of t & "||" & URL of t & linefeed
    end repeat
  end repeat
  return output
end tell`;
  const output = await runAppleScript(script);
  return output
    .split("\n")
    .filter(Boolean)
    .map((line) => {
      const [windowIndex, tabIndex, id, title, url] = line.split("||");
      return {
        windowIndex: Number(windowIndex),
        tabIndex: Number(tabIndex),
        id: Number(id),
        title,
        url,
      };
    });
}

async function getTabDescriptor(windowIndex = 1, tabIndex = 1) {
  const script = `
tell application "ChatGPT Atlas"
  set w to window ${windowIndex}
  set t to tab ${tabIndex} of w
  return (id of w as string) & "||" & (id of t as string) & "||" & (title of t as string) & "||" & (URL of t as string)
end tell`;
  const [windowId, tabId, title, url] = (await runAppleScript(script)).split("||");
  return {
    windowIndex,
    tabIndex,
    windowId: Number(windowId),
    id: Number(tabId),
    title,
    url,
  };
}

export async function openAtlasUrl(url, { newTab = true, tabIndex = 1, windowIndex = 1 } = {}) {
  const targetUrl = quoteAppleScriptString(url);
  const script = newTab
    ? `
tell application "ChatGPT Atlas"
  activate
  tell window ${windowIndex}
    make new tab at end of tabs with properties {URL:${targetUrl}}
    set active tab index to (count of tabs)
  end tell
end tell`
    : `
tell application "ChatGPT Atlas"
  activate
  set URL of tab ${tabIndex} of window ${windowIndex} to ${targetUrl}
end tell`;
  await runAppleScript(script);
  const tabs = await listAtlasTabs();
  if (newTab) {
    const matching = tabs
      .filter((tab) => tab.windowIndex === windowIndex)
      .sort((left, right) => right.tabIndex - left.tabIndex)[0];
    return matching;
  }
  return tabs.find((tab) => tab.windowIndex === windowIndex && tab.tabIndex === tabIndex);
}

export async function closeAtlasTab({ tabIndex = 1, windowIndex = 1 } = {}) {
  const descriptor = await getTabDescriptor(windowIndex, tabIndex);
  await runAppleScript(`
tell application "ChatGPT Atlas"
  close tab ${tabIndex} of window ${windowIndex}
end tell`);
  return descriptor;
}

export async function pressAtlasKey(key, { modifiers = [], tabIndex = 1, windowIndex = 1 } = {}) {
  const assistiveAccess = await checkAssistiveAccess();
  if (!assistiveAccess) {
    throw new Error(
      "System Events does not have assistive access. Enable Accessibility permissions for the host app to use press_key in Atlas mode."
    );
  }
  const modString = modifiers.length
    ? ` using {${modifiers.map((modifier) => `${modifier.toLowerCase()} down`).join(", ")}}`
    : "";
  await runAppleScript(`
tell application "ChatGPT Atlas" to activate
tell application "System Events"
  keystroke ${quoteAppleScriptString(key)}${modString}
end tell`);
  return getTabDescriptor(windowIndex, tabIndex);
}

export async function evaluateAtlasJavaScript(expression, { tabIndex = 1, windowIndex = 1 } = {}) {
  const script = `
tell application "ChatGPT Atlas"
  tell tab ${tabIndex} of window ${windowIndex}
    return execute javascript ${quoteAppleScriptString(expression)}
  end tell
end tell`;
  return runAppleScript(script);
}

export async function clickAtlasSelector(selector, options = {}) {
  const escaped = JSON.stringify(selector);
  const expression = `
(() => {
  const el = document.querySelector(${escaped});
  if (!el) return JSON.stringify({ ok: false, error: "Selector not found" });
  el.click();
  return JSON.stringify({ ok: true });
})()
`;
  return evaluateAtlasJavaScript(expression, options);
}

export async function fillAtlasSelector(selector, value, options = {}) {
  const escapedSelector = JSON.stringify(selector);
  const escapedValue = JSON.stringify(value);
  const expression = `
(() => {
  const el = document.querySelector(${escapedSelector});
  if (!el) return JSON.stringify({ ok: false, error: "Selector not found" });
  el.focus();
  el.value = ${escapedValue};
  el.dispatchEvent(new Event("input", { bubbles: true }));
  el.dispatchEvent(new Event("change", { bubbles: true }));
  return JSON.stringify({ ok: true });
})()
`;
  return evaluateAtlasJavaScript(expression, options);
}

export async function snapshotAtlasPage({ tabIndex = 1, windowIndex = 1 } = {}) {
  const descriptor = await getTabDescriptor(windowIndex, tabIndex);
  let text = "";
  let javascriptEnabled = true;
  try {
    text = await evaluateAtlasJavaScript(
      "document.body ? document.body.innerText.slice(0, 12000) : ''",
      {
        tabIndex,
        windowIndex,
      }
    );
  } catch {
    javascriptEnabled = false;
    text =
      "JavaScript from Apple Events is disabled in Atlas. Enable View > Developer > Allow JavaScript from Apple Events for DOM text snapshots.";
  }

  return { ...descriptor, text, javascriptEnabled };
}

export async function screenshotAtlasWindow(outputPath, { windowIndex = 1 } = {}) {
  const script = `
tell application "ChatGPT Atlas"
  activate
  set w to window ${windowIndex}
  set b to bounds of w
  return (item 1 of b as string) & "||" & (item 2 of b as string) & "||" & (item 3 of b as string) & "||" & (item 4 of b as string)
end tell`;
  const [left, top, right, bottom] = (await runAppleScript(script))
    .split("||")
    .map((value) => Number(value));
  const width = Math.max(1, right - left);
  const height = Math.max(1, bottom - top);
  await execFileAsync("screencapture", ["-R", `${left},${top},${width},${height}`, "-x", outputPath]);
  return { path: outputPath, windowIndex, bounds: { left, top, right, bottom, width, height } };
}
