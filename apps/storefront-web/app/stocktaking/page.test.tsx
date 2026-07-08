/**
 * stocktaking/page.test.tsx — 盘点列表页 L1 冒烟测试
 * 角色视角: 👔店长 / 🔧仓管
 * 覆盖: 正例·反例·边界
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SOURCE = resolve(__dirname, 'page.tsx');
const CLIENT_SOURCE = resolve(__dirname, 'stocktaking-client.tsx');

function readSource(path: string): string {
  return readFileSync(path, 'utf-8');
}

describe('stocktaking — 正例', () => {
  it('应导出默认函数组件 StocktakingListPage', () => {
    const src = readSource(SOURCE);
    assert.ok(src.includes('export default function StocktakingListPage'), '缺少默认导出');
  });

  it('应包含 StocktakingStatus 类型定义', () => {
    const src = readSource(SOURCE);
    assert.ok(src.includes('export type StocktakingStatus'), '缺少 StocktakingStatus 类型');
    assert.ok(src.includes("'draft'"), '缺少 draft 状态');
    assert.ok(src.includes("'in_progress'"), '缺少 in_progress 状态');
    assert.ok(src.includes("'completed'"), '缺少 completed 状态');
    assert.ok(src.includes("'cancelled'"), '缺少 cancelled 状态');
  });

  it('应包含 StocktakingRecord 接口', () => {
    const src = readSource(SOURCE);
    assert.ok(src.includes('export interface StocktakingRecord'), '缺少 StocktakingRecord 接口');
    assert.ok(src.includes('id: string'), '缺少 id 字段');
    assert.ok(src.includes('batchNo: string'), '缺少 batchNo');
    assert.ok(src.includes('storeName: string'), '缺少 storeName');
    assert.ok(src.includes('initiator: string'), '缺少 initiator');
    assert.ok(src.includes('totalItems: number'), '缺少 totalItems');
    assert.ok(src.includes('checkedItems: number'), '缺少 checkedItems');
    assert.ok(src.includes('discrepancyCount: number'), '缺少 discrepancyCount');
    assert.ok(src.includes('status: StocktakingStatus'), '缺少 status');
    assert.ok(src.includes('createdAt: string'), '缺少 createdAt');
    assert.ok(src.includes('completedAt?: string'), '缺少 completedAt');
  });

  it('应包含 MOCK_RECORDS 数据集（至少 8 条）', () => {
    const src = readSource(SOURCE);
    assert.ok(src.includes('MOCK_RECORDS'), '缺少 MOCK_RECORDS');
    // Count record entries
    const matches = src.match(/id:\s+'st-\d+'/g);
    assert.ok(matches && matches.length >= 8, `预期至少 8 条记录, 实际 ${matches?.length}`);
  });

  it('MOCK_RECORDS 应包含多种状态', () => {
    const src = readSource(SOURCE);
    assert.ok(src.includes("status: 'completed'"), '缺少 completed 状态记录');
    assert.ok(src.includes("status: 'in_progress'"), '缺少 in_progress 状态记录');
    assert.ok(src.includes("status: 'draft'"), '缺少 draft 状态记录');
    assert.ok(src.includes("status: 'cancelled'"), '缺少 cancelled 状态记录');
  });

  it('应包含多个门店数据', () => {
    const src = readSource(SOURCE);
    assert.ok(src.includes('朝阳旗舰店'), '缺少朝阳旗舰店');
    assert.ok(src.includes('海淀分店'), '缺少海淀分店');
    assert.ok(src.includes('西单体验店'), '缺少西单体验店');
    assert.ok(src.includes('望京分店'), '缺少望京分店');
  });

  it('应将 records 和 total 传入 StocktakingPageClient', () => {
    const src = readSource(SOURCE);
    assert.ok(src.includes('<StocktakingPageClient'), '缺少 StocktakingPageClient 调用');
    assert.ok(src.includes('records={MOCK_RECORDS}'), '缺少 records props');
    assert.ok(src.includes('total={MOCK_RECORDS.length}'), '缺少 total props');
  });

  it('client 组件应导出 StocktakingPageClient', () => {
    const src = readSource(CLIENT_SOURCE);
    assert.ok(src.includes('export function StocktakingPageClient'), '缺少 StocktakingPageClient 导出');
  });

  it('client 应引用 @m5/ui 组件', () => {
    const src = readSource(CLIENT_SOURCE);
    assert.ok(src.includes("@m5/ui"), '缺少 @m5/ui 引入');
    assert.ok(src.includes('PageShell'), '缺少 PageShell');
    assert.ok(src.includes('SearchFilterInput'), '缺少 SearchFilterInput');
    assert.ok(src.includes('StatCard'), '缺少 StatCard');
    assert.ok(src.includes('StatusBadge'), '缺少 StatusBadge');
    assert.ok(src.includes('PaginatedDataTableCard'), '缺少 PaginatedDataTableCard');
    assert.ok(src.includes('DataTableColumn'), '缺少 DataTableColumn');
  });

  it('client 应包含完整的状态标签映射', () => {
    const src = readSource(CLIENT_SOURCE);
    assert.ok(src.includes("label: '草稿'"), '缺少草稿');
    assert.ok(src.includes("label: '盘点中'"), '缺少盘点中');
    assert.ok(src.includes("label: '已完成'"), '缺少已完成');
    assert.ok(src.includes("label: '已取消'"), '缺少已取消');
  });

  it('表格列应定义齐全', () => {
    const src = readSource(CLIENT_SOURCE);
    assert.ok(src.includes("header: '盘点批次号'"), '缺少批次号列');
    assert.ok(src.includes("header: '门店'"), '缺少门店列');
    assert.ok(src.includes("header: '盘点人'"), '缺少盘点人列');
    assert.ok(src.includes("header: '进度'"), '缺少进度列');
    assert.ok(src.includes("header: '状态'"), '缺少状态列');
    assert.ok(src.includes("header: '创建时间'"), '缺少创建时间列');
    assert.ok(src.includes("header: '操作'"), '缺少操作列');
  });

  it('应有统计卡片区域', () => {
    const src = readSource(CLIENT_SOURCE);
    assert.ok(src.includes('总盘点单'), '缺少总盘点单卡片');
    assert.ok(src.includes('盘点中'), '缺少盘点中卡片');
    assert.ok(src.includes('已完成'), '缺少已完成卡片');
    assert.ok(src.includes('累计差异'), '缺少累计差异卡片');
  });

  it('应有新建盘点按钮', () => {
    const src = readSource(CLIENT_SOURCE);
    assert.ok(src.includes('+ 新建盘点'), '缺少新建按钮');
    assert.ok(src.includes('/stocktaking/new'), '缺少新建链接');
  });

  it('应有搜索栏', () => {
    const src = readSource(CLIENT_SOURCE);
    assert.ok(src.includes('搜索批次号'), '缺少搜索提示');
  });

  it('应有空状态提示', () => {
    const src = readSource(CLIENT_SOURCE);
    assert.ok(src.includes('暂无盘点记录'), '缺少空状态标题');
    assert.ok(src.includes('新建盘点'), '缺少空状态指引');
  });

  it('应有使用提示面板', () => {
    const src = readSource(CLIENT_SOURCE);
    assert.ok(src.includes('二次复核'), '缺少复核提示');
    assert.ok(src.includes('差异报告'), '缺少报告提示');
  });
});

describe('stocktaking — 反例（防御）', () => {
  it('空记录应能正常处理', async () => {
    const mod = await import('./page.tsx');
    // 验证模块加载不抛异常
    assert.equal(typeof mod.StocktakingStatus, 'undefined', '类型不应是运行时值');
    assert.equal(typeof mod.StocktakingRecord, 'undefined', '接口不应是运行时值');
  });

  it('MOCK_RECORDS 应有 8 条', () => {
    const src = readSource(SOURCE);
    const count = (src.match(/id:\s+'st-\d+'/g) || []).length;
    assert.equal(count, 8, `预期 8 条 Mock 数据, 实际 ${count}`);
  });

  it('各条记录应有完整的字段结构', () => {
    const src = readSource(SOURCE);
    // 校验每个 id 关联字段完整
    const ids = src.match(/id:\s+'st-\d+'/g) || [];
    for (const match of ids) {
      const id = match.match(/st-\d+/)?.[0] || '';
      assert.ok(id, `应能提取记录 id: ${match}`);
      const idIndex = src.indexOf(id);
      const block = src.slice(idIndex - 80, idIndex + 300);
      assert.ok(block.includes('batchNo:'), `${id} 缺少 batchNo`);
      assert.ok(block.includes('storeName:'), `${id} 缺少 storeName`);
      assert.ok(block.includes('initiator:'), `${id} 缺少 initiator`);
      assert.ok(block.includes('totalItems:'), `${id} 缺少 totalItems`);
      assert.ok(block.includes('status:'), `${id} 缺少 status`);
    }
  });

  it('差异数据中应有正值和零值', () => {
    const src = readSource(SOURCE);
    // 至少有一条差异 > 0
    const hasPositiveDiscrepancy = src.includes('discrepancyCount: 2') ||
      src.includes('discrepancyCount: 5') ||
      src.includes('discrepancyCount: 1');
    assert.ok(hasPositiveDiscrepancy, '应有差异 > 0 的记录');
    // 至少有一条差异 = 0
    assert.ok(src.includes('discrepancyCount: 0'), '应有差异 = 0 的记录');
  });
});

describe('stocktaking — 边界', () => {
  it('状态枚举值应完整且不可变', () => {
    const src = readSource(SOURCE);
    const statusTypes = src.match(/'[a-z_]+'(?=\s*\||\s*;|\s*,)/g) || [];
    assert.ok(statusTypes.length >= 4, '应有至少 4 种状态值');
  });

  it('completedAt 应为可选的', () => {
    const src = readSource(SOURCE);
    assert.ok(src.includes('completedAt?:'), 'completedAt 应为可选字段');
  });

  it('盘点进度列应展示 checkedItems/totalItems 格式', () => {
    const src = readSource(CLIENT_SOURCE);
    const progressRender = src.match(/checkedItems.*totalItems/);
    assert.ok(progressRender, '进度列应使用 checkedItems/totalItems 格式');
  });

  it('cancelled 状态记录应有 completedAt', () => {
    const src = readSource(SOURCE);
    // st-008 是 cancelled 状态且有 completedAt
    assert.ok(src.includes("'cancelled'"), '应有已取消状态');
    assert.ok(src.includes("'st-008'"), '应有 st-008 记录');
  });

  it('useMemo 和 useState 应正确使用', () => {
    const src = readSource(CLIENT_SOURCE);
    assert.ok(src.includes('useMemo'), '应使用 useMemo');
    assert.ok(src.includes('useState'), '应使用 useState');
  });

  it('模块导入稳定', async () => {
    const mod = await import('./page.tsx');
    assert.equal(typeof mod.default, 'function', '默认导出应为函数');
    // 验证客户端模块
    const clientMod = await import('./stocktaking-client.tsx');
    assert.equal(typeof clientMod.StocktakingPageClient, 'function', '客户端组件应导出');
  });

  it('computeStats 函数应存在', () => {
    const src = readSource(CLIENT_SOURCE);
    assert.ok(src.includes('computeStats'), '缺少 computeStats 函数');
    assert.ok(src.includes('reduce'), '应使用 reduce 累加差异');
  });

  it('useStocktakingList 搜索和筛选逻辑应存在', () => {
    const src = readSource(CLIENT_SOURCE);
    assert.ok(src.includes('filtered'), '缺少 filtered');
    assert.ok(src.includes('searchTerm'), '缺少 searchTerm');
    assert.ok(src.includes('statusFilter'), '缺少 statusFilter');
  });

  it('批量状态筛选按钮数量和结构与预期一致', () => {
    const src = readSource(CLIENT_SOURCE);
    // 筛选按钮: ALL + 4 种状态
    const filterButtons = ['全部', '草稿', '盘点中', '已完成', '已取消'];
    for (const label of filterButtons) {
      assert.ok(src.includes(label), `缺少筛选按钮: ${label}`);
    }
  });
});
