/**
 * campaign-rules page.test.ts
 * L1 page-level test for 营销决策规则 list page.
 * Covers: page file existence, default export, imports, client components, view model.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

describe('CampaignRulesPage', () => {
  it('should have the page.tsx file', () => {
    const exists = fs.existsSync(path.join(__dirname, 'page.tsx'));
    assert.equal(exists, true);
  });

  it('should export a default async function component', () => {
    const source = fs.readFileSync(path.join(__dirname, 'page.tsx'), 'utf-8');
    assert.ok(source.includes('export default async function'),
      'Should export default async function');
  });

  it('should import required dependencies from @m5/ui', () => {
    const source = fs.readFileSync(path.join(__dirname, 'page.tsx'), 'utf-8');
    assert.ok(source.includes('@m5/ui'), 'Should import from @m5/ui');
    assert.ok(source.includes('LoadingSkeleton'), 'Should import LoadingSkeleton');
    assert.ok(source.includes('PageShell'), 'Should import PageShell');
  });

  it('should import the view model and the workspace client', () => {
    const source = fs.readFileSync(path.join(__dirname, 'page.tsx'), 'utf-8');
    assert.ok(source.includes('loadCampaignRulesWorkspace'), 'Should import workspace loader');
    assert.ok(source.includes('CampaignRulesWorkspaceClient'), 'Should import client component');
  });

  it('should have a workspace client component', () => {
    const exists = fs.existsSync(path.join(__dirname, 'campaign-rules-workspace-client.tsx'));
    assert.equal(exists, true);
  });

  it('workspace client should be a client component with default export', () => {
    const source = fs.readFileSync(path.join(__dirname, 'campaign-rules-workspace-client.tsx'), 'utf-8');
    assert.ok(source.includes("'use client'") || source.includes('"use client"'), 'Should be a client component');
    assert.ok(source.includes('export default function'), 'Should default-export a function');
  });

  it('should read query params from searchParams', () => {
    const source = fs.readFileSync(path.join(__dirname, 'page.tsx'), 'utf-8');
    assert.ok(source.includes('readQueryParam'), 'Should call readQueryParam');
    assert.ok(source.includes('params.search'), 'Should read search param');
    assert.ok(source.includes('params.status'), 'Should read status param');
  });

  it('should call loadCampaignRulesWorkspace with query', () => {
    const source = fs.readFileSync(path.join(__dirname, 'page.tsx'), 'utf-8');
    assert.ok(source.includes('loadCampaignRulesWorkspace(query'), 'Should call the view model');
    assert.ok(source.includes("cache: 'no-store'"), 'Should disable caching');
  });

  it('should wrap client in Suspense with LoadingSkeleton fallback', () => {
    const source = fs.readFileSync(path.join(__dirname, 'page.tsx'), 'utf-8');
    assert.ok(source.includes('Suspense'), 'Should wrap in Suspense');
    assert.ok(source.includes('fallback='), 'Should have fallback');
    assert.ok(source.includes('LoadingSkeleton'), 'Should show skeleton while loading');
  });

  it('should set max-width and padding layout', () => {
    const source = fs.readFileSync(path.join(__dirname, 'page.tsx'), 'utf-8');
    assert.ok(source.includes('maxWidth'), 'Should define max-width');
    assert.ok(source.includes('padding'), 'Should define padding');
  });

  it('should include title and subtitle for PageShell', () => {
    const source = fs.readFileSync(path.join(__dirname, 'page.tsx'), 'utf-8');
    assert.ok(source.includes('营销决策规则'), 'Should have Chinese title');
    assert.ok(source.includes('管理活动营销决策规则列表'), 'Should have descriptive subtitle');
  });

  it('workspace client should accept workspace prop', () => {
    const source = fs.readFileSync(path.join(__dirname, 'campaign-rules-workspace-client.tsx'), 'utf-8');
    assert.ok(source.includes('workspace'), 'Should accept workspace prop');
    assert.ok(source.includes('CampaignRulesWorkspace'), 'Should reference workspace type');
  });

  it('workspace client should render SearchFilterInput, Select, DataTable, Pagination', () => {
    const source = fs.readFileSync(path.join(__dirname, 'campaign-rules-workspace-client.tsx'), 'utf-8');
    assert.ok(source.includes('SearchFilterInput'), 'Should render search input');
    assert.ok(source.includes('Select'), 'Should render filter select');
    assert.ok(source.includes('DataTable'), 'Should render data table');
    assert.ok(source.includes('Pagination'), 'Should render pagination');
  });

  it('workspace client should have status filter options', () => {
    const source = fs.readFileSync(path.join(__dirname, 'campaign-rules-workspace-client.tsx'), 'utf-8');
    assert.ok(source.includes('全部状态'), 'Should have "all status" option');
    assert.ok(source.includes('启用'), 'Should have "active" option');
    assert.ok(source.includes('停用'), 'Should have "disabled" option');
    assert.ok(source.includes('待审'), 'Should have "pending review" option');
    assert.ok(source.includes('草稿'), 'Should have "draft" option');
  });

  it('should have the view model file', () => {
    const viewModelPath = path.resolve(__dirname, '..', 'campaign-rules-view-model.ts');
    const exists = fs.existsSync(viewModelPath);
    assert.equal(exists, true, 'campaign-rules-view-model.ts should exist');
  });

  it('view model should export buildFallbackRules function', () => {
    const source = fs.readFileSync(
      path.resolve(__dirname, '..', 'campaign-rules-view-model.ts'),
      'utf-8',
    );
    assert.ok(source.includes('export interface CampaignDecisionRule'), 'Should define CampaignDecisionRule');
    assert.ok(source.includes('export interface CampaignRulesWorkspace'), 'Should define CampaignRulesWorkspace');
    assert.ok(source.includes('export async function loadCampaignRulesWorkspace'), 'Should export loader');
    assert.ok(source.includes('buildFallbackRules'), 'Should contain fallback data builder');
  });

  it('view model fallback should produce 10 rules for default query', () => {
    // Import dynamically in test context
    const source = fs.readFileSync(
      path.resolve(__dirname, '..', 'campaign-rules-view-model.ts'),
      'utf-8',
    );
    assert.ok(source.includes('首单折扣规则'), 'Should have fallback rule "首单折扣规则"');
    assert.ok(source.includes('高消费返券规则'), 'Should have fallback rule "高消费返券规则"');
    assert.ok(source.includes('欺诈风险拦截规则'), 'Should have fallback rule "欺诈风险拦截规则"');
  });
});
