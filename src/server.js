import { fileURLToPath } from "node:url";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import {
  clickSelector,
  closeTab,
  evaluate,
  fillSelector,
  getBrowserStatus,
  listTabs,
  openUrl,
  pressKey,
  screenshotPage,
  snapshotPage,
} from "./browser-service.js";

function buildServer() {
  const server = new McpServer({
    name: "local-browser-mcp",
    version: "0.1.0",
  });

  server.registerTool(
    "status",
    {
      title: "Local Browser Status",
      description: "Check which browser backend is active and whether its automation surface is reachable.",
      inputSchema: {
        port: z.number().int().positive().optional(),
      },
      annotations: {
        readOnlyHint: true,
        idempotentHint: true,
      },
    },
    async ({ port }) => {
      const status = await getBrowserStatus({ port });
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(status, null, 2),
          },
        ],
        structuredContent: status,
      };
    }
  );

  server.registerTool(
    "list_tabs",
    {
      title: "List Browser Tabs",
      description: "List tabs available in the active local browser backend.",
      inputSchema: {},
      annotations: {
        readOnlyHint: true,
        idempotentHint: true,
      },
    },
    async () => {
      const tabs = await listTabs();
      return {
        content: [{ type: "text", text: JSON.stringify(tabs, null, 2) }],
        structuredContent: { tabs },
      };
    }
  );

  server.registerTool(
    "open_url",
    {
      title: "Open URL In Browser",
      description: "Open a URL in the active local browser backend, either in a new tab or an existing tab.",
      inputSchema: {
        url: z.string().url(),
        newTab: z.boolean().default(true).optional(),
        tabIndex: z.number().int().min(1).optional(),
        windowIndex: z.number().int().min(1).optional(),
      },
    },
    async ({ url, newTab = true, tabIndex = 1, windowIndex = 1 }) => {
      const data = await openUrl(url, { newTab, tabIndex, windowIndex });
      return {
        content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
        structuredContent: data,
      };
    }
  );

  server.registerTool(
    "click",
    {
      title: "Click Element In Browser",
      description: "Click an element using a CSS selector in a given browser tab when the active backend supports DOM automation.",
      inputSchema: {
        selector: z.string().min(1),
        tabIndex: z.number().int().min(1).optional(),
        windowIndex: z.number().int().min(1).optional(),
      },
    },
    async ({ selector, tabIndex = 1, windowIndex = 1 }) => {
      const result = await clickSelector(selector, { tabIndex, windowIndex });
      const data = { windowIndex, tabIndex, selector, result };
      return {
        content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
        structuredContent: data,
      };
    }
  );

  server.registerTool(
    "fill",
    {
      title: "Fill Element In Browser",
      description: "Fill an input using a CSS selector in a given browser tab when the active backend supports DOM automation.",
      inputSchema: {
        selector: z.string().min(1),
        value: z.string(),
        tabIndex: z.number().int().min(1).optional(),
        windowIndex: z.number().int().min(1).optional(),
      },
    },
    async ({ selector, value, tabIndex = 1, windowIndex = 1 }) => {
      const result = await fillSelector(selector, value, { tabIndex, windowIndex });
      const data = { windowIndex, tabIndex, selector, valueLength: value.length, result };
      return {
        content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
        structuredContent: data,
      };
    }
  );

  server.registerTool(
    "press_key",
    {
      title: "Press Key In Browser",
      description: "Press a key in the active browser page.",
      inputSchema: {
        key: z.string().min(1),
        tabIndex: z.number().int().min(1).optional(),
        windowIndex: z.number().int().min(1).optional(),
        modifiers: z.array(z.enum(["command", "option", "control", "shift"])).optional(),
      },
    },
    async ({ key, tabIndex = 1, windowIndex = 1, modifiers = [] }) => {
      const data = await pressKey(key, { tabIndex, windowIndex, modifiers });
      data.key = key;
      data.modifiers = modifiers;
      return {
        content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
        structuredContent: data,
      };
    }
  );

  server.registerTool(
    "snapshot",
    {
      title: "Snapshot Browser Page",
      description: "Return page title, URL, and visible text for the selected browser tab.",
      inputSchema: {
        tabIndex: z.number().int().min(1).optional(),
        windowIndex: z.number().int().min(1).optional(),
      },
      annotations: {
        readOnlyHint: true,
      },
    },
    async ({ tabIndex = 1, windowIndex = 1 }) => {
      const data = await snapshotPage({ tabIndex, windowIndex });
      return {
        content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
        structuredContent: data,
      };
    }
  );

  server.registerTool(
    "evaluate",
    {
      title: "Evaluate Script In Browser",
      description: "Run a JavaScript expression in the selected browser tab and return the result when the active backend supports DOM automation.",
      inputSchema: {
        expression: z.string().min(1),
        tabIndex: z.number().int().min(1).optional(),
        windowIndex: z.number().int().min(1).optional(),
      },
    },
    async ({ expression, tabIndex = 1, windowIndex = 1 }) => {
      const result = await evaluate(expression, { tabIndex, windowIndex });
      const data = { windowIndex, tabIndex, result };
      return {
        content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
        structuredContent: data,
      };
    }
  );

  server.registerTool(
    "screenshot",
    {
      title: "Screenshot Browser Page",
      description: "Save a screenshot from the selected browser tab or window.",
      inputSchema: {
        path: z.string().min(1),
        fullPage: z.boolean().default(true).optional(),
        tabIndex: z.number().int().min(1).optional(),
        windowIndex: z.number().int().min(1).optional(),
      },
    },
    async ({ path: outputPath, fullPage = true, tabIndex = 1, windowIndex = 1 }) => {
      const data = await screenshotPage(outputPath, { windowIndex, tabIndex, fullPage });
      return {
        content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
        structuredContent: data,
      };
    }
  );

  server.registerTool(
    "close_tab",
    {
      title: "Close Browser Tab",
      description: "Close a tab in the active local browser backend.",
      inputSchema: {
        tabIndex: z.number().int().min(1),
        windowIndex: z.number().int().min(1).optional(),
      },
    },
    async ({ tabIndex, windowIndex = 1 }) => {
      const summary = await closeTab({ tabIndex, windowIndex });
      return {
        content: [{ type: "text", text: JSON.stringify(summary, null, 2) }],
        structuredContent: summary,
      };
    }
  );

  return server;
}

export async function startServer() {
  const server = buildServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  startServer().catch((error) => {
    console.error(error instanceof Error ? error.stack || error.message : String(error));
    process.exitCode = 1;
  });
}
