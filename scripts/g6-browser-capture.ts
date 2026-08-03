import { mkdirSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { chromium } from '@playwright/test';

const htmlPath = resolve(
  '/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/docs/knowledge/acceptance/2026-07-19-g6-miniapp-browser-evidence.html',
);

const outputFiles = {
  index: resolve(
    '/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/docs/knowledge/acceptance/assets/g6-miniapp-browser-index.png',
  ),
  member: resolve(
    '/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/docs/knowledge/acceptance/assets/g6-miniapp-browser-member.png',
  ),
  roles: resolve(
    '/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/docs/knowledge/acceptance/assets/g6-miniapp-browser-roles.png',
  ),
} as const;

function log(message: string) {
  console.log(`[g6-browser-capture] ${message}`);
}

async function captureSection(
  page: Awaited<ReturnType<ReturnType<typeof chromium.launch>['newPage']>>,
  selector: string,
  outputPath: string,
) {
  const locator = page.locator(selector);
  const count = await locator.count();
  log(`selector ready: ${selector} (count=${count})`);
  await locator.screenshot({ path: outputPath });
  log(`screenshot written: ${outputPath}`);
}

async function main() {
  for (const filePath of Object.values(outputFiles)) {
    mkdirSync(dirname(filePath), { recursive: true });
  }

  const html = readFileSync(htmlPath, 'utf8');
  log(`loaded html: ${htmlPath}`);

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    viewport: { width: 1440, height: 2200 },
    deviceScaleFactor: 1.5,
  });

  await page.setContent(html, { waitUntil: 'load' });
  log('rendered html into isolated page');

  await captureSection(page, '#index-linkage-evidence', outputFiles.index);
  await captureSection(page, '#member-linkage-evidence', outputFiles.member);
  await captureSection(page, '#role-workbench-evidence', outputFiles.roles);

  await browser.close();
  log('browser closed');

  for (const [key, filePath] of Object.entries(outputFiles)) {
    console.log(`${key}: ${filePath}`);
  }
}

void main();
