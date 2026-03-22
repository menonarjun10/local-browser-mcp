import { getBrowserTargetInfo } from "./browser-target.js";
import {
  checkAssistiveAccess,
  checkJavaScriptFromAppleEvents,
  clickAtlasSelector,
  closeAtlasTab,
  ensureAtlasRunning,
  evaluateAtlasJavaScript,
  fillAtlasSelector,
  listAtlasTabs,
  openAtlasUrl,
  pressAtlasKey,
  screenshotAtlasWindow,
  snapshotAtlasPage,
} from "./backends/atlas.js";
import {
  clickChromeSelector,
  closeChromeTab,
  ensureChromeRunning,
  evaluateChrome,
  fillChromeSelector,
  listChromeTabs,
  openChromeUrl,
  pressChromeKey,
  screenshotChromePage,
  snapshotChromePage,
} from "./backends/chrome.js";

const BACKENDS = {
  atlas: {
    ensureRunning: ensureAtlasRunning,
    listTabs: listAtlasTabs,
    openUrl: openAtlasUrl,
    click: clickAtlasSelector,
    fill: fillAtlasSelector,
    pressKey: pressAtlasKey,
    evaluate: evaluateAtlasJavaScript,
    snapshot: snapshotAtlasPage,
    screenshot: screenshotAtlasWindow,
    closeTab: closeAtlasTab,
    async getCapabilities() {
      const [assistiveAccess, javascriptFromAppleEvents] = await Promise.all([
        checkAssistiveAccess(),
        checkJavaScriptFromAppleEvents(),
      ]);

      return {
        assistiveAccess,
        javascriptFromAppleEvents,
        domAutomation: javascriptFromAppleEvents,
      };
    },
  },
  chrome: {
    ensureRunning: ensureChromeRunning,
    listTabs: listChromeTabs,
    openUrl: openChromeUrl,
    click: clickChromeSelector,
    fill: fillChromeSelector,
    pressKey: pressChromeKey,
    evaluate: evaluateChrome,
    snapshot: snapshotChromePage,
    screenshot: screenshotChromePage,
    closeTab: closeChromeTab,
    async getCapabilities() {
      return {
        assistiveAccess: false,
        javascriptFromAppleEvents: true,
        domAutomation: true,
      };
    },
  },
};

function getActiveBackend() {
  const targetInfo = getBrowserTargetInfo();
  const backend = BACKENDS[targetInfo.target] ?? BACKENDS.atlas;
  return { targetInfo, backend };
}

export async function getBrowserStatus(overrides = {}) {
  const { targetInfo, backend } = getActiveBackend();
  const runtimeStatus = await backend.ensureRunning(overrides);
  const capabilities = await backend.getCapabilities();

  return {
    requestedTarget: targetInfo.requestedTarget,
    target: targetInfo.target,
    defaultBrowserBundleId: targetInfo.defaultBrowserBundleId,
    ...capabilities,
    ...runtimeStatus,
  };
}

export async function listTabs() {
  return getActiveBackend().backend.listTabs();
}

export async function openUrl(url, options) {
  return getActiveBackend().backend.openUrl(url, options);
}

export async function clickSelector(selector, options) {
  return getActiveBackend().backend.click(selector, options);
}

export async function fillSelector(selector, value, options) {
  return getActiveBackend().backend.fill(selector, value, options);
}

export async function pressKey(key, options) {
  return getActiveBackend().backend.pressKey(key, options);
}

export async function evaluate(expression, options) {
  return getActiveBackend().backend.evaluate(expression, options);
}

export async function snapshotPage(options) {
  return getActiveBackend().backend.snapshot(options);
}

export async function screenshotPage(outputPath, options) {
  return getActiveBackend().backend.screenshot(outputPath, options);
}

export async function closeTab(options) {
  return getActiveBackend().backend.closeTab(options);
}
