import { mkdirSync, readFileSync } from 'node:fs';
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

const selectorMap = {
  entry: '#entry-evidence',
  purchase: '#purchase-evidence',
  return: '#return-evidence',
} as const;

async function main() {
  for (const filePath of Object.values(outputFiles)) {
    mkdirSync(dirname(filePath), { recursive: true });
  }

  const html = readFileSync(htmlPath, 'utf8');
  console.log(`[g7-browser-capture] loaded html: ${htmlPath}`);

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    viewport: { width: 1440, height: 2200 },
    deviceScaleFactor: 1.5,
  });

  try {
    await page.setContent(html, { waitUntil: 'load' });
    console.log('[g7-browser-capture] rendered html into isolated page');

    for (const [key, selector] of Object.entries(selectorMap)) {
      const locator = page.locator(selector);
      await locator.waitFor({ state: 'visible', timeout: 10_000 });
      const count = await locator.count();
      console.log(`[g7-browser-capture] selector ready: ${selector} (count=${count})`);

      await locator.screenshot({
        path: outputFiles[key as keyof typeof outputFiles],
      });
      console.log(
        `[g7-browser-capture] screenshot written: ${outputFiles[key as keyof typeof outputFiles]}`,
      );
    }
  } finally {
    await browser.close();
    console.log('[g7-browser-capture] browser closed');
  }

  for (const [key, filePath] of Object.entries(outputFiles)) {
    console.log(`${key}: ${filePath}`);
  }
}

void main().catch((error: unknown) => {
  console.error('[g7-browser-capture] failed');
  console.error(error);
  process.exitCode = 1;
});
