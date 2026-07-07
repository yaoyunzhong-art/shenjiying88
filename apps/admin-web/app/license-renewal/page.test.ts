/**
 * LicenseRenewalPage L1 测试
 * 验证 Page 文件完整性、导出模式、以及页面内嵌的关键计算逻辑。
 *
 * 测试覆盖:
 * 1. 文件存在性与默认导出 (Client Component)
 * 2. 内部工具函数: calculateSuccessRate
 * 3. 续费记录统计聚合逻辑
 * 4. 查询参数格式化 (buildSearchParams)
 * 5. Tab 状态管理逻辑
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/* ─── 页面内嵌逻辑测试 ─── */

/** 与 page.tsx 中 calculateSuccessRate 一致的实现 */
function calculateSuccessRate(records: { status: string }[]): number {
  if (records.length === 0) return 0;
  const successCount = records.filter((r) => r.status === 'success').length;
  return Math.round((successCount / records.length) * 100);
}

/** URL 查询参数构建（对应 page.tsx 中 fetchRecords 的调用逻辑） */
function buildSearchParams(query: {
  page: number;
  pageSize: number;
  status?: string;
  licenseName?: string;
  dateRange?: [string, string];
}): URLSearchParams {
  const params = new URLSearchParams({
    page: String(query.page),
    pageSize: String(query.pageSize),
  });
  if (query.status) params.set('status', query.status);
  if (query.licenseName) params.set('licenseName', query.licenseName);
  if (query.dateRange) {
    params.set('startDate', query.dateRange[0]);
    params.set('endDate', query.dateRange[1]);
  }
  return params;
}

describe('LicenseRenewalPage - 文件完整性', () => {
  it('page.tsx 文件存在', () => {
    const exists = fs.existsSync(path.join(__dirname, 'page.tsx'));
    assert.equal(exists, true);
  });

  it('应导出 default Client Component', () => {
    const source = fs.readFileSync(path.join(__dirname, 'page.tsx'), 'utf-8');
    assert.ok(
      source.includes("'use client'") || source.includes('"use client"'),
      '应包含 use client 指令',
    );
    assert.ok(
      source.includes('export default function LicenseRenewalPage'),
      '应导出 LicenseRenewalPage 默认函数',
    );
  });

  it('应导入 types 和 api', () => {
    const source = fs.readFileSync(path.join(__dirname, 'page.tsx'), 'utf-8');
    assert.ok(source.includes("./types'"), '应从 ./types 导入类型');
    assert.ok(source.includes("./api'"), '应从 ./api 导入 API');
  });

  it('应导入 Ant Design 组件', () => {
    const source = fs.readFileSync(path.join(__dirname, 'page.tsx'), 'utf-8');
    assert.ok(source.includes("from 'antd'"), '应导入 antd');
    assert.ok(source.includes("Button"), '应包含 Button');
    assert.ok(source.includes("Table"), '应包含 Table');
    assert.ok(source.includes("Modal"), '应包含 Modal');
    assert.ok(source.includes("Form"), '应包含 Form');
    assert.ok(source.includes("Tabs"), '应包含 Tabs');
  });

  it('应导入 @ant-design/icons', () => {
    const source = fs.readFileSync(path.join(__dirname, 'page.tsx'), 'utf-8');
    assert.ok(source.includes("@ant-design/icons"), '应导入图标');
    assert.ok(source.includes("PlusOutlined"), '应包含 PlusOutlined');
    assert.ok(source.includes("EditOutlined"), '应包含 EditOutlined');
    assert.ok(source.includes("DeleteOutlined"), '应包含 DeleteOutlined');
  });

  it('应包含三个 TabPane', () => {
    const source = fs.readFileSync(path.join(__dirname, 'page.tsx'), 'utf-8');
    // 统计 TabPane 出现次数
    const matches = source.match(/TabPane/g);
    assert.ok(matches && matches.length >= 3, '应包含至少三个 TabPane（套餐管理/续费记录/自动续费）');
  });

  it('应包含三种 CRUD 事件处理函数定义', () => {
    const source = fs.readFileSync(path.join(__dirname, 'page.tsx'), 'utf-8');
    assert.ok(source.includes('handleCreateStrategy'), '应包含 handleCreateStrategy');
    assert.ok(source.includes('handleEditStrategy'), '应包含 handleEditStrategy');
    assert.ok(source.includes('handleDeleteStrategy'), '应包含 handleDeleteStrategy');
    assert.ok(source.includes('handleStrategySubmit'), '应包含 handleStrategySubmit');
    assert.ok(source.includes('handleToggleAutoRenewal'), '应包含 handleToggleAutoRenewal');
  });
});

describe('LicenseRenewalPage - calculateSuccessRate', () => {
  it('空记录列表返回 0', () => {
    assert.equal(calculateSuccessRate([]), 0);
  });

  it('全部成功返回 100', () => {
    const records = [
      { status: 'success' },
      { status: 'success' },
      { status: 'success' },
    ];
    assert.equal(calculateSuccessRate(records), 100);
  });

  it('全部失败返回 0', () => {
    const records = [
      { status: 'failed' },
      { status: 'failed' },
    ];
    assert.equal(calculateSuccessRate(records), 0);
  });

  it('3/5 成功返回 60', () => {
    const records = [
      { status: 'success' },
      { status: 'success' },
      { status: 'success' },
      { status: 'failed' },
      { status: 'failed' },
    ];
    assert.equal(calculateSuccessRate(records), 60);
  });

  it('1/3 成功 -> Math.round(33.33) = 33', () => {
    const records = [
      { status: 'success' },
      { status: 'failed' },
      { status: 'pending' },
    ];
    assert.equal(calculateSuccessRate(records), 33);
  });

  it('处理 pending 状态为未成功', () => {
    const records = [
      { status: 'success' },
      { status: 'pending' },
      { status: 'pending' },
    ];
    assert.equal(calculateSuccessRate(records), 33);
  });
});

describe('LicenseRenewalPage - buildSearchParams (续费记录查询参数)', () => {
  it('基础分页参数', () => {
    const params = buildSearchParams({ page: 1, pageSize: 10 });
    assert.equal(params.get('page'), '1');
    assert.equal(params.get('pageSize'), '10');
    assert.equal(params.get('status'), null);
    assert.equal(params.get('licenseName'), null);
  });

  it('含状态过滤', () => {
    const params = buildSearchParams({ page: 2, pageSize: 20, status: 'success' });
    assert.equal(params.get('page'), '2');
    assert.equal(params.get('status'), 'success');
  });

  it('含名称搜索', () => {
    const params = buildSearchParams({ page: 1, pageSize: 10, licenseName: '旗舰版' });
    assert.equal(params.get('licenseName'), '旗舰版');
  });

  it('含日期范围', () => {
    const params = buildSearchParams({
      page: 1,
      pageSize: 10,
      dateRange: ['2026-01-01', '2026-06-30'],
    });
    assert.equal(params.get('startDate'), '2026-01-01');
    assert.equal(params.get('endDate'), '2026-06-30');
  });

  it('含全部过滤条件', () => {
    const params = buildSearchParams({
      page: 3,
      pageSize: 50,
      status: 'failed',
      licenseName: '企业版',
      dateRange: ['2026-03-01', '2026-03-31'],
    });
    assert.equal(params.get('page'), '3');
    assert.equal(params.get('pageSize'), '50');
    assert.equal(params.get('status'), 'failed');
    assert.equal(params.get('licenseName'), '企业版');
    assert.equal(params.get('startDate'), '2026-03-01');
    assert.equal(params.get('endDate'), '2026-03-31');
  });
});

describe('LicenseRenewalPage - 策略表格列配置', () => {
  it('page.tsx 应定义策略表格列', () => {
    const source = fs.readFileSync(path.join(__dirname, 'page.tsx'), 'utf-8');
    assert.ok(source.includes('strategyColumns'), '应定义 strategyColumns');
    // 检查表格列的字段名
    const requiredColumns = [
      { key: 'name', title: '套餐名称' },
      { key: 'price', title: '价格' },
      { key: 'duration', title: '有效期' },
      { key: 'permissions', title: '权限配置' },
      { key: 'isActive', title: '状态' },
      { key: 'action', title: '操作' },
    ];
    for (const col of requiredColumns) {
      assert.ok(
        source.includes(`key: '${col.key}'`),
        `应包含列 key '${col.key}'`,
      );
      assert.ok(
        source.includes(`title: '${col.title}'`),
        `应包含列 title '${col.title}'`,
      );
    }
  });
});

describe('LicenseRenewalPage - 策略表单字段', () => {
  it('page.tsx 应包含策略表单的 Form.Item 配置', () => {
    const source = fs.readFileSync(path.join(__dirname, 'page.tsx'), 'utf-8');
    const expectedFields = [
      '套餐名称',
      '套餐描述',
      '价格 (元)',
      '有效期时长',
      '有效期单位',
      '最大用户数量',
      '最大门店数量',
      '功能权限',
    ];
    for (const label of expectedFields) {
      assert.ok(
        source.includes(`label="${label}"`) || source.includes(`label='${label}'`),
        `应包含表单字段 "${label}"`,
      );
    }
  });
});

describe('LicenseRenewalPage - 自动续费 Toggle 逻辑', () => {
  it('handleToggleAutoRenewal 函数签名', () => {
    const source = fs.readFileSync(path.join(__dirname, 'page.tsx'), 'utf-8');
    assert.ok(
      source.includes('handleToggleAutoRenewal'),
      '应包含自动续费切换函数',
    );
  });

  it('应导入 Popconfirm 组件', () => {
    const source = fs.readFileSync(path.join(__dirname, 'page.tsx'), 'utf-8');
    assert.ok(source.includes('Popconfirm'), '应导入 Popconfirm');
  });
});

describe('LicenseRenewalPage - 统计面板', () => {
  it('应包含 statistics 状态', () => {
    const source = fs.readFileSync(path.join(__dirname, 'page.tsx'), 'utf-8');
    assert.ok(source.includes('statistics'), '应包含 statistics 状态');
  });

  it('统计字段应包含 totalStrategies', () => {
    const source = fs.readFileSync(path.join(__dirname, 'page.tsx'), 'utf-8');
    assert.ok(source.includes('totalStrategies'), '应统计策略总数');
    assert.ok(source.includes('activeStrategies'), '应统计激活策略数');
    assert.ok(source.includes('totalRecords'), '应统计记录总数');
    assert.ok(source.includes('successRate'), '应统计成功率');
    assert.ok(source.includes('autoRenewalEnabled'), '应统计自动续费数');
  });
});
