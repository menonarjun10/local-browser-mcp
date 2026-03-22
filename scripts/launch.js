import { getBrowserStatus } from "../src/browser-service.js";

try {
  const status = await getBrowserStatus();
  console.log(JSON.stringify(status, null, 2));
} catch (error) {
  console.error(error instanceof Error ? error.stack || error.message : String(error));
  process.exitCode = 1;
}
