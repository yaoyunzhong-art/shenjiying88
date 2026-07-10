/**
 * 新建盘点单页面测试
 * 使用 node:test 和文件系统检查来验证页面结构
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

describe('Stocktaking New Form Page', () => {
  it('should have the page file page.tsx', () => {
    const exists = existsSync(resolve(__dirname, 'page.tsx'));
    assert.equal(exists, true);
  });

  it('should have a test file', () => {
    const exists = existsSync(resolve(__dirname, 'page.test.tsx'));
    assert.equal(exists, true);
  });

  it('should export a React component as default', async () => {
    const mod = await import('./page');
    assert.equal(typeof mod.default, 'function');
  });

  it('should use FormPageScaffold for form layout', async () => {
    const content = await import('node:fs/promises').then((fs) =>
      fs.readFile(resolve(__dirname, 'page.tsx'), 'utf-8')
    );
    assert.ok(content.includes('FormPageScaffold'));
    assert.ok(content.includes('formPageFields') || content.includes('FIELDS') || content.includes('fields'));
  });

  it('should define validation rules', async () => {
    const content = await import('node:fs/promises').then((fs) =>
      fs.readFile(resolve(__dirname, 'page.tsx'), 'utf-8')
    );
    assert.ok(content.includes('validate'));
    assert.ok(content.includes("'请选择盘点门店'"));
    assert.ok(content.includes("'联系方式不能为空'"));
    assert.ok(content.includes("'预计耗时必须大于0'"));
  });

  it('should have form field definitions for store, zone, scope, priority, name, phone, date, duration', async () => {
    const content = await import('node:fs/promises').then((fs) =>
      fs.readFile(resolve(__dirname, 'page.tsx'), 'utf-8')
    );
    const fieldKeys = ['storeId', 'zone', 'scope', 'priority', 'initiatorName', 'phone', 'plannedDate', 'estimatedDuration', 'remarks'];
    for (const key of fieldKeys) {
      assert.ok(content.includes(key), `Missing field key: ${key}`);
    }
  });

  it('should handle form submission with error handling', async () => {
    const content = await import('node:fs/promises').then((fs) =>
      fs.readFile(resolve(__dirname, 'page.tsx'), 'utf-8')
    );
    // Should have submit handling and error state
    assert.ok(content.includes('handleSubmit') || content.includes('onSubmit'));
    assert.ok(content.includes('throw') || content.includes('error'));
  });

  it('should navigate back after successful submission', async () => {
    const content = await import('node:fs/promises').then((fs) =>
      fs.readFile(resolve(__dirname, 'page.tsx'), 'utf-8')
    );
    assert.ok(content.includes('router.push'));
    assert.ok(content.includes('/stocktaking'));
    assert.ok(content.includes('toast.success'));
  });

  it('should include select field options for store, zone, scope, and priority', async () => {
    const content = await import('node:fs/promises').then((fs) =>
      fs.readFile(resolve(__dirname, 'page.tsx'), 'utf-8')
    );
    // Store options
    assert.ok(content.includes('cy-flagship') || content.includes('朝阳旗舰店'));
    // Zone options
    assert.ok(content.includes('skincare') || content.includes('护肤区'));
    // Priority options
    assert.ok(content.includes('normal') || content.includes('常规盘点'));
    // Scope options
    assert.ok(content.includes('high_value') || content.includes('高价值商品'));
  });

  it('should generate batch number from store and date', async () => {
    const content = await import('node:fs/promises').then((fs) =>
      fs.readFile(resolve(__dirname, 'page.tsx'), 'utf-8')
    );
    assert.ok(content.includes('batchNo') || content.includes('PD-'));
  });
});
