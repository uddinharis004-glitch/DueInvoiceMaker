import { chromium as playwright } from "playwright-core";
import chromium from "@sparticuz/chromium";
import { randomUUID } from "node:crypto";
import { rm } from "node:fs/promises";

let cachedExecutablePath: string | undefined;

chromium.setGraphicsMode = false;

async function getExecutablePath() {
  if (process.env.CHROME_EXECUTABLE_PATH) {
    return process.env.CHROME_EXECUTABLE_PATH;
  }

  if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_VERSION) {
    cachedExecutablePath ??= await chromium.executablePath();
    return cachedExecutablePath;
  }

  return undefined;
}

export async function renderPdf(html: string) {
  const executablePath = await getExecutablePath();
  const userDataDir = `/tmp/pw-${randomUUID()}`;

  const browser = await playwright.launch({
    executablePath,
    headless: true,
    args: executablePath ? chromium.args : [],
    chromiumSandbox: false,
  });

  try {
    const context = await browser.newContext({
      viewport: { width: 816, height: 1056 },
      deviceScaleFactor: 1,
    });
    const page = await context.newPage();

    await page.setContent(html, { waitUntil: "load", timeout: 30000 });
    await page.emulateMedia({ media: "print" });

    return await page.pdf({
      format: "Letter",
      printBackground: true,
      preferCSSPageSize: true,
      margin: {
        top: "0",
        right: "0",
        bottom: "0",
        left: "0",
      },
    });
  } finally {
    await browser.close().catch(() => undefined);
    await rm(userDataDir, { recursive: true, force: true }).catch(() => undefined);
  }
}
