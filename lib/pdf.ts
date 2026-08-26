import { chromium as playwright } from "playwright-core";
import chromium from "@sparticuz/chromium";
import { randomUUID } from "node:crypto";
import { rm } from "node:fs/promises";

let cachedExecutablePath: string | undefined;

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
  });

  try {
    const page = await browser.newPage({
      viewport: { width: 816, height: 1056 },
      deviceScaleFactor: 1,
    });

    await page.setContent(html, { waitUntil: "networkidle" });

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
