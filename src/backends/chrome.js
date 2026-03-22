import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { chromium } from "playwright-core";
import {
  DEFAULT_CHROME_APP,
  DEFAULT_CHROME_BIN,
  DEFAULT_CHROME_CDP_PORT,
  DEFAULT_CHROME_PROFILE_DIR,
} from "../constants.js";

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function toPlaywrightModifier(modifier) {
  switch (modifier) {
    case "command":
      return "Meta";
    case "option":
      return "Alt";
    case "control":
      return "Control";
    case "shift":
      return "Shift";
    default:
      return modifier;
  }
}

export function resolveChromeBinary() {
  const envPath = process.env.CHROME_APP_PATH;
  if (envPath) {
    const candidate = envPath.endsWith(".app")
      ? path.join(envPath, "Contents", "MacOS", "Google Chrome")
      : envPath;
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  if (fs.existsSync(DEFAULT_CHROME_BIN)) {
    return DEFAULT_CHROME_BIN;
  }

  throw new Error(
    `Could not find Google Chrome. Set CHROME_APP_PATH or install Chrome at ${DEFAULT_CHROME_APP}.`
  );
}

export function getChromeSettings() {
  return {
    executable: resolveChromeBinary(),
    profileDir: process.env.CHROME_PROFILE_DIR ?? DEFAULT_CHROME_PROFILE_DIR,
    port: Number(process.env.CHROME_CDP_PORT ?? DEFAULT_CHROME_CDP_PORT),
  };
}

async function fetchJson(url) {
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

async function isChromeReachable(port) {
  try {
    await fetchJson(`http://127.0.0.1:${port}/json/version`);
    return true;
  } catch {
    return false;
  }
}

function cleanupChromeLocks(profileDir) {
  for (const name of ["SingletonLock", "SingletonSocket", "SingletonCookie"]) {
    try {
      fs.rmSync(path.join(profileDir, name), { force: true, recursive: true });
    } catch {}
  }
}

function launchChrome(settings) {
  fs.mkdirSync(settings.profileDir, { recursive: true });
  cleanupChromeLocks(settings.profileDir);
  const child = spawn(
    settings.executable,
    [
      `--user-data-dir=${settings.profileDir}`,
      `--remote-debugging-port=${settings.port}`,
      "--no-first-run",
      "--no-default-browser-check",
    ],
    { detached: true, stdio: "ignore" }
  );
  child.unref();
  return child.pid;
}

export async function ensureChromeRunning() {
  const settings = getChromeSettings();
  let launched = false;
  if (!(await isChromeReachable(settings.port))) {
    launchChrome(settings);
    launched = true;
    const deadline = Date.now() + 15000;
    while (Date.now() < deadline) {
      if (await isChromeReachable(settings.port)) {
        break;
      }
      await sleep(300);
    }
  }

  if (!(await isChromeReachable(settings.port))) {
    throw new Error(`Chrome did not expose CDP on port ${settings.port}.`);
  }

  return {
    launched,
    backend: "cdp",
    domAutomation: true,
    cdpReachable: true,
    ...settings,
  };
}

async function withChromeBrowser(fn) {
  const settings = await ensureChromeRunning();
  const browser = await chromium.connectOverCDP(`http://127.0.0.1:${settings.port}`);
  try {
    return await fn(browser, settings);
  } finally {
    await browser.close();
  }
}

function getPages(browser) {
  return browser
    .contexts()
    .flatMap((context) => context.pages())
    .map((page, index) => ({ page, windowIndex: 1, tabIndex: index + 1 }));
}

async function getTabInfo(page, tabIndex) {
  return {
    windowIndex: 1,
    tabIndex,
    title: await page.title().catch(() => ""),
    url: page.url(),
  };
}

async function resolvePage(browser, tabIndex = 1) {
  const pages = getPages(browser);
  const entry = pages.find((item) => item.tabIndex === tabIndex);
  if (entry) {
    return entry;
  }
  const context = browser.contexts()[0] ?? (await browser.newContext());
  const page = await context.newPage();
  return { page, windowIndex: 1, tabIndex: getPages(browser).length };
}

export async function listChromeTabs() {
  return withChromeBrowser(async (browser) => {
    const pages = getPages(browser);
    return Promise.all(pages.map(({ page, tabIndex }) => getTabInfo(page, tabIndex)));
  });
}

export async function openChromeUrl(url, { newTab = true, tabIndex = 1 } = {}) {
  return withChromeBrowser(async (browser) => {
    let page;
    let resolvedTabIndex;
    if (newTab) {
      const context = browser.contexts()[0] ?? (await browser.newContext());
      page = await context.newPage();
      resolvedTabIndex = getPages(browser).length;
    } else {
      ({ page, tabIndex: resolvedTabIndex } = await resolvePage(browser, tabIndex));
    }
    await page.goto(url, { waitUntil: "domcontentloaded" });
    return getTabInfo(page, resolvedTabIndex);
  });
}

export async function clickChromeSelector(selector, { tabIndex = 1 } = {}) {
  return withChromeBrowser(async (browser) => {
    const { page } = await resolvePage(browser, tabIndex);
    await page.click(selector);
    return JSON.stringify({ ok: true });
  });
}

export async function fillChromeSelector(selector, value, { tabIndex = 1 } = {}) {
  return withChromeBrowser(async (browser) => {
    const { page } = await resolvePage(browser, tabIndex);
    await page.fill(selector, value);
    return JSON.stringify({ ok: true });
  });
}

export async function pressChromeKey(key, { tabIndex = 1, modifiers = [] } = {}) {
  return withChromeBrowser(async (browser) => {
    const { page } = await resolvePage(browser, tabIndex);
    const mappedModifiers = modifiers.map(toPlaywrightModifier);
    for (const modifier of mappedModifiers) {
      await page.keyboard.down(modifier);
    }
    await page.keyboard.press(key);
    for (const modifier of [...mappedModifiers].reverse()) {
      await page.keyboard.up(modifier);
    }
    return getTabInfo(page, tabIndex);
  });
}

export async function evaluateChrome(expression, { tabIndex = 1 } = {}) {
  return withChromeBrowser(async (browser) => {
    const { page } = await resolvePage(browser, tabIndex);
    return page.evaluate(expression);
  });
}

export async function snapshotChromePage({ tabIndex = 1 } = {}) {
  return withChromeBrowser(async (browser) => {
    const { page } = await resolvePage(browser, tabIndex);
    return {
      ...(await getTabInfo(page, tabIndex)),
      text: await page.locator("body").innerText().catch(() => ""),
      javascriptEnabled: true,
    };
  });
}

export async function screenshotChromePage(outputPath, { tabIndex = 1, fullPage = true } = {}) {
  return withChromeBrowser(async (browser) => {
    const { page } = await resolvePage(browser, tabIndex);
    await page.screenshot({ path: outputPath, fullPage });
    return { path: outputPath, windowIndex: 1, tabIndex, fullPage };
  });
}

export async function closeChromeTab({ tabIndex = 1 } = {}) {
  return withChromeBrowser(async (browser) => {
    const { page } = await resolvePage(browser, tabIndex);
    const summary = await getTabInfo(page, tabIndex);
    await page.close();
    return summary;
  });
}
