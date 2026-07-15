import { describe, it } from 'node:test';
import assert from 'node:assert';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const PAGE_PATH = resolve(process.cwd(), 'apps/admin-web/app/stores/[id]/inspection/page.tsx');
const src = readFileSync(PAGE_PATH, 'utf-8');

describe('inspection page', () => {
  it('应包含真接口调用 /api/logistics/inspections', () => {
    assert.ok(src.includes('/api/logistics/inspections'), '缺少代理接口路径');
  });

  it('应使用 React hooks 管理状态', () => {
    assert.ok(src.includes('useState'), '缺少 useState');
    assert.ok(src.includes('useEffect'), '缺少 useEffect');
    assert.ok(src.includes('useMemo'), '缺少 useMemo');
  });

  it('应包含完整闭环操作：新建/提醒/记录结果', () => {
    assert.ok(src.includes('handleCreate') || src.includes('新建'), '缺少新建巡检');
    assert.ok(src.includes('handleRemind') || src.includes('提醒'), '缺少发送提醒');
    assert.ok(src.includes('handleRecordResult') || src.includes('记录结果'), '缺少记录结果');
  });

  it('应包含租户隔离头 x-tenant-id', () => {
    assert.ok(src.includes('x-tenant-id'), '缺少租户隔离头');
  });

  it('应使用 @m5/ui 组件库', () => {
    assert.ok(src.includes("from '@m5/ui'"), '缺少 @m5/ui 导入');
  });
});
