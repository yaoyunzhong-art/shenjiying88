import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { chromium } from '@playwright/test';

const htmlPath = resolve(
  '/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/docs/knowledge/acceptance/2026-07-19-g7-miniapp-browser-evidence.html',
);

const outputFiles = {
  entry: resolve(
    '/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/docs/knowledge/acceptance/assets/g7-miniapp-browser-entry.png',
  ),
  purchase: resolve(
    '/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/docs/knowledge/acceptance/assets/g7-miniapp-browser-purchase.png',
  ),
  return: resolve(
    '/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/docs/knowledge/acceptance/assets/g7-miniapp-browser-return.png',
  ),
} as const;

async function main() {
  for (const filePath of Object.values(outputFiles)) {
    mkdirSync(dirname(filePath), { recursive: true });
  }

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    viewport: { width: 1440, height: 2200 },
    deviceScaleFactor: 1.5,
  });

  await page.goto(`file://${htmlPath}`);
  await page.waitForLoadState('load');

  await page.locator('#entry-evidence').screenshot({
    path: outputFiles.entry,
  });
  await page.locator('#purchase-evidence').screenshot({
    path: outputFiles.purchase,
  });
  await page.locator('#return-evidence').screenshot({
    path: outputFiles.return,
  });

  await browser.close();

  for (const [key, filePath] of Object.entries(outputFiles)) {
    console.log(`${key}: ${filePath}`);
  }
}

void main();
