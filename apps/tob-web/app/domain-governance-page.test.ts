import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const TENANT_PAGE_SRC = readFileSync(resolve(__dirname, '[marketCode]', '[tenantCode]', 'page.tsx'), 'utf8');
const BRAND_PAGE_SRC = readFileSync(resolve(__dirname, '[marketCode]', '[tenantCode]', '[brandCode]', 'page.tsx'), 'utf8');
const BOOTSTRAP_SRC = readFileSync(resolve(__dirname, 'bootstrap.ts'), 'utf8');

test('tob domain governance: bootstrap exposes summary and workspace href', () => {
  assert.ok(BOOTSTRAP_SRC.includes('domainGovernance'), 'bootstrap 应包含 domainGovernance');
  assert.ok(BOOTSTRAP_SRC.includes('domainGovernanceWorkspaceHref'), 'bootstrap 应包含 domainGovernanceWorkspaceHref');
  assert.ok(BOOTSTRAP_SRC.includes('getPortalDomainGovernanceSummary'), 'bootstrap 应调用 portal domain governance API');
});

test('tob domain governance: tenant portal page renders governance workspace entry', () => {
  assert.ok(TENANT_PAGE_SRC.includes('域名治理工作台'), 'tenant 页面应展示域名治理工作台');
  assert.ok(TENANT_PAGE_SRC.includes('formatDomainGovernanceSourceSummary'), 'tenant 页面应使用共享域名来源摘要 formatter');
  assert.ok(TENANT_PAGE_SRC.includes('formatDomainGovernanceCountsSummary'), 'tenant 页面应使用共享域名治理计数 formatter');
  assert.ok(TENANT_PAGE_SRC.includes('domainGovernanceWorkspaceHref'), 'tenant 页面应展示统一治理入口链接');
  assert.ok(TENANT_PAGE_SRC.includes('打开域名治理工作台'), 'tenant 页面应提供治理 CTA');
});

test('tob domain governance: brand portal page renders governance workspace entry', () => {
  assert.ok(BRAND_PAGE_SRC.includes('域名治理工作台'), 'brand 页面应展示域名治理工作台');
  assert.ok(BRAND_PAGE_SRC.includes('formatDomainGovernanceSourceSummary'), 'brand 页面应使用共享域名来源摘要 formatter');
  assert.ok(BRAND_PAGE_SRC.includes('formatDomainGovernanceCountsSummary'), 'brand 页面应使用共享域名治理计数 formatter');
  assert.ok(BRAND_PAGE_SRC.includes('domainGovernanceWorkspaceHref'), 'brand 页面应展示统一治理入口链接');
  assert.ok(BRAND_PAGE_SRC.includes('打开域名治理工作台'), 'brand 页面应提供治理 CTA');
});
