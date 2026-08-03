import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

describe('CustomerServicePage structure (客服工作台角色页)', () => {
  // 正例：页面文件存在
  it('should have the page file', async () => {
    const fs = await import('fs');
    const exists = fs.existsSync(
      new URL('./page.tsx', import.meta.url).pathname,
    );
    assert.equal(exists, true);
  });

  // 正例：默认导出函数组件
  it('should export default function component', async () => {
    const mod = await import('./page.tsx');
    assert.equal(typeof mod.default, 'function');
  });

  // 正例：使用 @m5/ui 组件
  it('should reference PageShell and StatusBadge from @m5/ui', async () => {
    const fs = await import('fs');
    const content = fs.readFileSync(
      new URL('./page.tsx', import.meta.url).pathname,
      'utf-8',
    );
    assert.ok(content.includes('PageShell') || content.includes('StatusBadge'), 'should reference @m5/ui components');
    assert.ok(content.includes('@m5/ui'));
  });

  // 正例：包含 Mock 数据定义
  it('should have mock data for tickets and metrics', async () => {
    const fs = await import('fs');
    const content = fs.readFileSync(
      new URL('./page.tsx', import.meta.url).pathname,
      'utf-8',
    );
    assert.ok(content.includes('MOCK_TICKETS'));
    assert.ok(content.includes('MOCK_METRICS'));
    assert.ok(content.includes('MOCK_AGENT_STATUS'));
  });

  // 正例：包含工单处理回调函数
  it('should define ticket handling callbacks', async () => {
    const fs = await import('fs');
    const content = fs.readFileSync(
      new URL('./page.tsx', import.meta.url).pathname,
      'utf-8',
    );
    assert.ok(content.includes('handleAssign'));
    assert.ok(content.includes('handleResolve'));
    assert.ok(content.includes('handleClose'));
  });

  // 正例：导出类型匹配规范
  it('should have proper default export for Next.js page', async () => {
    const mod = await import('./page.tsx');
    const Component = mod.default;
    // 如果是 React 函数组件，typeof 为 'function'
    assert.equal(typeof Component, 'function');
  });

  // 反例：不应导入不存在的依赖
  it('should only depend on @m5/ui which exists', async () => {
    const fs = await import('fs');
    const content = fs.readFileSync(
      new URL('./page.tsx', import.meta.url).pathname,
      'utf-8',
    );
    // 只从 @m5/ui 导入
    const imports = content.match(/from\s+['"]([^'"]+)['"]/g) || [];
    const uiImports = imports.filter((i: string) => i.includes('@m5/ui'));
    assert.ok(uiImports.length >= 1);
    // react, next 和 @m5/ui 都是合法依赖
    const deps = imports.map((i: string) => i.replace(/from\s+['"]/, '').replace(/['"]$/, ''));
    const validDeps = ['@m5/ui', 'react', 'next/navigation', '../_components/useTriState', '../_components/TriStateRenderer'];
    for (const dep of deps) {
      assert.ok(
        validDeps.some((v) => dep === v),
        `Unexpected dependency: ${dep}`,
      );
    }
  });

  // 边界：Mock 数据至少包含一个工单
  it('should have at least one mock ticket', async () => {
    const fs = await import('fs');
    const content = fs.readFileSync(
      new URL('./page.tsx', import.meta.url).pathname,
      'utf-8',
    );
    const ticketCount = (content.match(/id:\s*['"]TK-/g) || []).length;
    assert.ok(ticketCount >= 1, `Expected >=1 tickets, got ${ticketCount}`);
  });

  // 边界：包含多种工单优先级覆盖
  it('should cover multiple ticket priorities', async () => {
    const fs = await import('fs');
    const content = fs.readFileSync(
      new URL('./page.tsx', import.meta.url).pathname,
      'utf-8',
    );
    assert.ok(content.includes("priority: 'high'"));
    assert.ok(content.includes("priority: 'medium'"));
    assert.ok(content.includes("priority: 'low'"));
  });

  // 边界：包含多种工单状态覆盖
  it('should cover multiple ticket statuses', async () => {
    const fs = await import('fs');
    const content = fs.readFileSync(
      new URL('./page.tsx', import.meta.url).pathname,
      'utf-8',
    );
    assert.ok(content.includes("status: 'open'"));
    assert.ok(content.includes("status: 'in_progress'"));
    assert.ok(content.includes("status: 'resolved'"));
    assert.ok(content.includes("status: 'closed'"));
  });
});
