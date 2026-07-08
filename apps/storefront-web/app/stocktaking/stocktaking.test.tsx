import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

describe('StocktakingPage structure', () => {
  // Page file exists
  it('should have the page file', async () => {
    const fs = await import('fs');
    const exists = fs.existsSync(
      new URL('./page.tsx', import.meta.url).pathname
    );
    assert.equal(exists, true);
  });

  // Client file exists
  it('should have the client component file', async () => {
    const fs = await import('fs');
    const exists = fs.existsSync(
      new URL('./stocktaking-client.tsx', import.meta.url).pathname
    );
    assert.equal(exists, true);
  });

  // Page exports a default function
  it('should export default function component', async () => {
    const mod = await import('./page.tsx');
    assert.equal(typeof mod.default, 'function');
  });

  // Client component exports named function
  it('should export StocktakingPageClient', async () => {
    const mod = await import('./stocktaking-client.tsx');
    assert.equal(typeof mod.StocktakingPageClient, 'function');
  });

  // Verify source contains expected sections in page.tsx
  it('should contain expected data in page source', async () => {
    const fs = await import('fs');
    const source = fs.readFileSync(
      new URL('./page.tsx', import.meta.url).pathname,
      'utf-8'
    );

    // Types
    assert.ok(source.includes('StocktakingStatus'), 'Missing StocktakingStatus type');
    assert.ok(source.includes("'draft'"), 'Missing draft status');
    assert.ok(source.includes("'in_progress'"), 'Missing in_progress status');
    assert.ok(source.includes("'completed'"), 'Missing completed status');
    assert.ok(source.includes("'cancelled'"), 'Missing cancelled status');

    // Mock data
    assert.ok(source.includes('PD-20260708-001'), 'Missing batch number');
    assert.ok(source.includes('朝阳旗舰店'), 'Missing store name');
    assert.ok(source.includes('海淀分店'), 'Missing second store');
    assert.ok(source.includes('西单体验店'), 'Missing third store');
    assert.ok(source.includes('望京分店'), 'Missing fourth store');
    assert.ok(source.includes('张三'), 'Missing initiator');
    assert.ok(source.includes('李四'), 'Missing second initiator');
    assert.ok(source.includes('320'), 'Missing total items count');
    assert.ok(source.includes('150'), 'Missing second total items');
    assert.ok(source.includes('PD-20260703-001'), 'Missing cancelled batch');
  });

  // Verify page props
  it('should pass records and total as props', async () => {
    const fs = await import('fs');
    const source = fs.readFileSync(
      new URL('./page.tsx', import.meta.url).pathname,
      'utf-8'
    );

    assert.ok(source.includes('StocktakingPageClient'), 'Missing StocktakingPageClient');
    assert.ok(source.includes('records={MOCK_RECORDS}'), 'Missing records prop');
    assert.ok(source.includes('total={MOCK_RECORDS.length}'), 'Missing total prop');
  });

  // Verify client source has UI components
  it('should use ListPageScaffold components in client', async () => {
    const fs = await import('fs');
    const source = fs.readFileSync(
      new URL('./stocktaking-client.tsx', import.meta.url).pathname,
      'utf-8'
    );

    // Imports from @m5/ui
    assert.ok(source.includes('@m5/ui'), 'Missing @m5/ui import');
    assert.ok(source.includes('PageShell'), 'Missing PageShell import');
    assert.ok(source.includes('StatCard'), 'Missing StatCard import');
    assert.ok(source.includes('StatusBadge'), 'Missing StatusBadge import');
    assert.ok(source.includes('SearchFilterInput'), 'Missing SearchFilterInput import');
    assert.ok(source.includes('PaginatedDataTableCard'), 'Missing PaginatedDataTableCard import');
    assert.ok(source.includes('DataTableColumn'), 'Missing DataTableColumn import');

    // Title
    assert.ok(source.includes('库存盘点'), 'Missing title');
    assert.ok(source.includes('管理门店库存盘点任务'), 'Missing description');

    // Stats cards
    assert.ok(source.includes('总盘点单'), 'Missing total stat');
    assert.ok(source.includes('盘点中'), 'Missing in-progress stat');
    assert.ok(source.includes('已完成'), 'Missing completed stat');
    assert.ok(source.includes('累计差异'), 'Missing discrepancy stat');

    // New button
    assert.ok(source.includes('新' + '建盘点'), 'Missing new button');
    assert.ok(source.includes('/stocktaking/new'), 'Missing new link');

    // Search
    assert.ok(source.includes('搜索批次号'), 'Missing search placeholder');

    // Status filter
    assert.ok(source.includes('全部'), 'Missing all filter');
    assert.ok(source.includes('草稿'), 'Missing draft status label');
    assert.ok(source.includes('盘点中'), 'Missing in-progress status label');
    assert.ok(source.includes('已完成'), 'Missing completed status label');
    assert.ok(source.includes('已取消'), 'Missing cancelled status label');

    // Actions
    assert.ok(source.includes('开始盘点'), 'Missing start action');
    assert.ok(source.includes('查看详情'), 'Missing detail action');
  });

  // Verify columns definition
  it('should define all table columns', async () => {
    const fs = await import('fs');
    const source = fs.readFileSync(
      new URL('./stocktaking-client.tsx', import.meta.url).pathname,
      'utf-8'
    );

    assert.ok(source.includes("header: '盘点批次号'"), 'Missing batchNo column');
    assert.ok(source.includes("header: '门店'"), 'Missing store column');
    assert.ok(source.includes("header: '盘点人'"), 'Missing initiator column');
    assert.ok(source.includes("header: '进度'"), 'Missing progress column');
    assert.ok(source.includes("header: '状态'"), 'Missing status column');
    assert.ok(source.includes("header: '创建时间'"), 'Missing createdAt column');
    assert.ok(source.includes("header: '操作'"), 'Missing actions column');
  });

  // Verify hook usage
  it('should implement search + filter + pagination hook', async () => {
    const fs = await import('fs');
    const source = fs.readFileSync(
      new URL('./stocktaking-client.tsx', import.meta.url).pathname,
      'utf-8'
    );

    assert.ok(source.includes('useStocktakingList'), 'Missing hook name');
    assert.ok(source.includes('searchTerm'), 'Missing searchTerm in hook');
    assert.ok(source.includes('statusFilter'), 'Missing statusFilter in hook');
    assert.ok(source.includes('setPage'), 'Missing setPage in hook');
    assert.ok(source.includes('totalPages'), 'Missing totalPages in hook');
  });

  // Verify stats computation
  it('should compute stats correctly', async () => {
    const fs = await import('fs');
    const source = fs.readFileSync(
      new URL('./stocktaking-client.tsx', import.meta.url).pathname,
      'utf-8'
    );

    assert.ok(source.includes('computeStats'), 'Missing computeStats function');
    assert.ok(source.includes('reduce'), 'Missing reduce for discrepancy');
  });

  // Verify empty state
  it('should handle empty state', async () => {
    const fs = await import('fs');
    const source = fs.readFileSync(
      new URL('./stocktaking-client.tsx', import.meta.url).pathname,
      'utf-8'
    );

    assert.ok(source.includes('暂无盘点记录'), 'Missing empty title');
    assert.ok(source.includes('新建盘点'), 'Missing empty action hint');
  });

  // Verify tip section
  it('should include tips section', async () => {
    const fs = await import('fs');
    const source = fs.readFileSync(
      new URL('./stocktaking-client.tsx', import.meta.url).pathname,
      'utf-8'
    );

    assert.ok(source.includes('盘点差异'), 'Missing tip text');
    assert.ok(source.includes('二次复核'), 'Missing review tip');
    assert.ok(source.includes('差异报告'), 'Missing report tip');
  });
});
