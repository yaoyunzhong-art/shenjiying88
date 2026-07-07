import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

describe('SalesGuidePage structure', () => {
  // Page file exists
  it('should have the page file', async () => {
    const fs = await import('fs');
    const exists = fs.existsSync(
      new URL('./page.tsx', import.meta.url).pathname,
    );
    assert.equal(exists, true);
  });

  // Page exports a default function
  it('should export default function component', async () => {
    const mod = await import('./page.tsx');
    assert.equal(typeof mod.default, 'function');
  });

  // Verify imports from @m5/ui
  it('should import from @m5/ui', async () => {
    const fs = await import('fs');
    const source = fs.readFileSync(
      new URL('./page.tsx', import.meta.url).pathname,
      'utf-8',
    );
    assert.ok(source.includes('@m5/ui'), 'Missing @m5/ui import');
    assert.ok(source.includes('SalesClerkTool'), 'Missing SalesClerkTool import');
    assert.ok(source.includes('PageShell'), 'Missing PageShell import');
  });

  // Verify mock stats data
  it('should have complete DailyReceptionStats mock', async () => {
    const fs = await import('fs');
    const source = fs.readFileSync(
      new URL('./page.tsx', import.meta.url).pathname,
      'utf-8',
    );
    assert.ok(source.includes('totalReceptions'), 'Missing totalReceptions');
    assert.ok(source.includes('newLeads'), 'Missing newLeads');
    assert.ok(source.includes('conversions'), 'Missing conversions');
    assert.ok(source.includes('conversionRate'), 'Missing conversionRate');
    assert.ok(source.includes('avgResponseMin'), 'Missing avgResponseMin');
  });

  // Verify all stats values
  it('should have correct stats values', async () => {
    const fs = await import('fs');
    const source = fs.readFileSync(
      new URL('./page.tsx', import.meta.url).pathname,
      'utf-8',
    );
    assert.ok(source.includes('totalReceptions: 28'), 'Expected 28 receptions');
    assert.ok(source.includes('newLeads: 12'), 'Expected 12 leads');
    assert.ok(source.includes('conversions: 8'), 'Expected 8 conversions');
    assert.ok(source.includes('conversionRate: 66.7'), 'Expected 66.7% rate');
    assert.ok(source.includes('avgResponseMin: 2.3'), 'Expected 2.3 min response');
  });

  // Verify follow-up client mock data
  it('should have 5 follow-up clients', async () => {
    const fs = await import('fs');
    const source = fs.readFileSync(
      new URL('./page.tsx', import.meta.url).pathname,
      'utf-8',
    );
    const clientNames = ['王芳', '李明', '赵雪', '陈伟', '刘洋'];
    for (const name of clientNames) {
      assert.ok(source.includes(name), `Missing client: ${name}`);
    }
  });

  // Verify all clients have complete fields
  it('should have complete FollowUpClient fields', async () => {
    const fs = await import('fs');
    const source = fs.readFileSync(
      new URL('./page.tsx', import.meta.url).pathname,
      'utf-8',
    );
    assert.ok(source.includes('tier'), 'Missing tier field');
    assert.ok(source.includes('lastVisit'), 'Missing lastVisit field');
    assert.ok(source.includes('reason'), 'Missing reason field');
    assert.ok(source.includes('priority'), 'Missing priority field');
  });

  // Verify all priority levels covered
  it('should include all priority levels', async () => {
    const fs = await import('fs');
    const source = fs.readFileSync(
      new URL('./page.tsx', import.meta.url).pathname,
      'utf-8',
    );
    assert.ok(source.includes("priority: 'high'"), 'Missing high');
    assert.ok(source.includes("priority: 'medium'"), 'Missing medium');
    assert.ok(source.includes("priority: 'low'"), 'Missing low');
  });

  // Verify all membership tiers covered
  it('should include all membership tiers', async () => {
    const fs = await import('fs');
    const source = fs.readFileSync(
      new URL('./page.tsx', import.meta.url).pathname,
      'utf-8',
    );
    assert.ok(source.includes("tier: 'VIP'"), 'Missing VIP');
    assert.ok(source.includes("tier: 'GOLD'"), 'Missing GOLD');
    assert.ok(source.includes("tier: 'SILVER'"), 'Missing SILVER');
    assert.ok(source.includes("tier: 'REGULAR'"), 'Missing REGULAR');
  });

  // Verify sales scripts
  it('should have 5 sales scripts', async () => {
    const fs = await import('fs');
    const source = fs.readFileSync(
      new URL('./page.tsx', import.meta.url).pathname,
      'utf-8',
    );
    const scenarios = ['新客欢迎', '会员推荐', '客诉安抚', '离店回访', '活动邀约'];
    for (const s of scenarios) {
      assert.ok(source.includes(s), `Missing scenario: ${s}`);
    }
  });

  // Verify callback handlers
  it('should implement all callback handlers', async () => {
    const fs = await import('fs');
    const source = fs.readFileSync(
      new URL('./page.tsx', import.meta.url).pathname,
      'utf-8',
    );
    assert.ok(source.includes('handleMemberSearch'), 'Missing handleMemberSearch');
    assert.ok(source.includes('handleFollowUp'), 'Missing handleFollowUp');
    assert.ok(source.includes('handleScriptCopy'), 'Missing handleScriptCopy');
  });

  // Verify page metadata
  it('should include PageShell with title and description', async () => {
    const fs = await import('fs');
    const source = fs.readFileSync(
      new URL('./page.tsx', import.meta.url).pathname,
      'utf-8',
    );
    assert.ok(source.includes('导购员工具'), 'Missing title');
    assert.ok(source.includes('导购员专属工作台'), 'Missing description');
  });

  // Verify member mock database
  it('should have mock member data for lookup', async () => {
    const fs = await import('fs');
    const source = fs.readFileSync(
      new URL('./page.tsx', import.meta.url).pathname,
      'utf-8',
    );
    assert.ok(source.includes('MOCK_MEMBERS'), 'Missing MOCK_MEMBERS');
    assert.ok(source.includes('高消费'), 'Missing member tag');
    assert.ok(source.includes('红酒爱好者'), 'Missing member interest tag');
  });

  // Verify toast notification logic
  it('should include toast notification state', async () => {
    const fs = await import('fs');
    const source = fs.readFileSync(
      new URL('./page.tsx', import.meta.url).pathname,
      'utf-8',
    );
    assert.ok(source.includes('toastMessage'), 'Missing toastMessage state');
    assert.ok(source.includes('setToastMessage'), 'Missing setToastMessage');
  });
});
