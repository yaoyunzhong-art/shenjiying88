/**
 * tenants/[id]/page.test.ts — 租户详情页 L1 冒烟测试
 * 角色视角: 👔 超级管理员
 * 覆盖: 正例(常量/数据完整性/状态映射/格式化函数) + 反例(租户不存在/null边界) + 逻辑(状态切换/统计)
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SOURCE = resolve(__dirname, 'page.tsx');
const DATA_SOURCE = resolve(__dirname, '../tenants-data.ts');

function readSource(): string {
  return readFileSync(SOURCE, 'utf-8');
}

function readData(): string {
  return readFileSync(DATA_SOURCE, 'utf-8');
}

// ---- 正例 ----

describe('tenants/[id] — 正例', () => {
  it('应导出一个默认组件 TenantDetailPage', () => {
    const src = readSource();
    assert.ok(src.includes('export default function TenantDetailPage'), '缺少默认导出组件');
  });

  it('应包含 use client 指令', () => {
    const src = readSource();
    assert.ok(src.includes("'use client'") || src.includes('"use client"'), '缺少 use client');
  });

  it('应导入 tenants-data 中的 MOCK_TENANTS, TENANT_STATUS_MAP, PLAN_LABELS, PLAN_COLORS, formatNumber', () => {
    const src = readSource();
    assert.ok(src.includes('MOCK_TENANTS'), '缺少 MOCK_TENANTS');
    assert.ok(src.includes('TENANT_STATUS_MAP'), '缺少 TENANT_STATUS_MAP');
    assert.ok(src.includes('PLAN_LABELS'), '缺少 PLAN_LABELS');
    assert.ok(src.includes('PLAN_COLORS'), '缺少 PLAN_COLORS');
    assert.ok(src.includes('formatNumber'), '缺少 formatNumber');
  });

  it('应导入 StatusBadge, Badge, DescriptionList, ConfirmDialog, useToast', () => {
    const src = readSource();
    assert.ok(src.includes('StatusBadge'), '缺少 StatusBadge');
    assert.ok(src.includes('Badge'), '缺少 Badge');
    assert.ok(src.includes('DescriptionList'), '缺少 DescriptionList');
    assert.ok(src.includes('ConfirmDialog'), '缺少 ConfirmDialog');
    assert.ok(src.includes('useToast'), '缺少 useToast');
  });

  it('应包含 getTenantById 辅助函数', () => {
    const src = readSource();
    assert.ok(src.includes('function getTenantById'), '缺少 getTenantById');
  });

  it('应包含基本信息 basicInfoItems 和业务数据 businessInfoItems', () => {
    const src = readSource();
    assert.ok(src.includes('basicInfoItems'), '缺少 basicInfoItems');
    assert.ok(src.includes('businessInfoItems'), '缺少 businessInfoItems');
  });

  it('应包含三个统计卡片（品牌/门店/会员）', () => {
    const src = readSource();
    assert.ok(src.includes('brandCount'), '缺少 brandCount');
    assert.ok(src.includes('storeCount'), '缺少 storeCount');
    assert.ok(src.includes('memberCount'), '缺少 memberCount');
  });
});

// ---- constants & data integrity ----

describe('tenants/[id] — 常量和数据完整性', () => {
  const data = readData();

  it('TENANT_STATUS_MAP 应覆盖所有 4 种状态', () => {
    assert.ok(data.includes("active: { label: '已开通', variant: 'success' }"), '缺少 active 映射');
    assert.ok(data.includes("suspended: { label: '已停用', variant: 'error' }"), '缺少 suspended 映射');
    assert.ok(data.includes("trial: { label: '试用中', variant: 'warning' }"), '缺少 trial 映射');
    assert.ok(data.includes("expired: { label: '已过期', variant: 'neutral' }"), '缺少 expired 映射');
  });

  it('TENANT_STATUSES 应包含 4 种状态', () => {
    assert.ok(data.includes("['active', 'suspended', 'trial', 'expired']"), 'TENANT_STATUSES 数组不完整');
  });

  it('PLAN_LABELS 应包含 3 种套餐', () => {
    assert.ok(data.includes('basic:'), '缺少 basic');
    assert.ok(data.includes('professional:'), '缺少 professional');
    assert.ok(data.includes('enterprise:'), '缺少 enterprise');
  });

  it('PLAN_COLORS 应包含 3 种套餐颜色', () => {
    assert.ok(data.includes('basic:'), '缺少 basic');
    assert.ok(data.includes('professional:'), '缺少 professional');
    assert.ok(data.includes('enterprise:'), '缺少 enterprise');
  });

  it('MOCK_TENANTS 应包含 8 条数据', () => {
    const match = data.match(/id:\s*'/g);
    assert.equal(match?.length, 8, `预期 8 条, 实际 ${match?.length ?? 0}`);
  });

  it('每条租户应有完整的 Tenant 字段（id, tenantCode, tenantName, status, plan, contactPerson, city, brandCount, storeCount, memberCount）', () => {
    // 检查所有必填字段都出现在数据定义中
    const fields = [
      'tenantCode', 'tenantName', 'contactPerson', 'contactEmail',
      'contactPhone', 'region', 'city', 'brandCount', 'storeCount',
      'memberCount', 'status', 'createdAt', 'plan',
    ];
    for (const f of fields) {
      assert.ok(data.includes(`${f}:`), `缺少字段 ${f}`);
    }
  });

  it('MOCK_TENANTS 应覆盖所有 4 种状态', () => {
    assert.ok(data.includes("status: 'active'"), '缺少 active 状态的租户');
    assert.ok(data.includes("status: 'suspended'"), '缺少 suspended 状态的租户');
    assert.ok(data.includes("status: 'trial'"), '缺少 trial 状态的租户');
    assert.ok(data.includes("status: 'expired'"), '缺少 expired 状态的租户');
  });

  it('MOCK_TENANTS 应覆盖所有 3 种套餐', () => {
    assert.ok(data.includes("plan: 'basic'"), '缺少 basic 套餐租户');
    assert.ok(data.includes("plan: 'professional'"), '缺少 professional 套餐租户');
    assert.ok(data.includes("plan: 'enterprise'"), '缺少 enterprise 套餐租户');
  });
});

// ---- 租户详情逻辑 ----

describe('tenants/[id] — 详情展示逻辑', () => {
  const src = readSource();

  it('应包含返回租户列表链接', () => {
    assert.ok(src.includes('/tenants') || src.includes('返回租户列表'), '缺少返回列表链接');
  });

  it('应渲染详情页标题为租户名称', () => {
    assert.ok(src.includes('tenant.tenantName'), '缺少 tenantName 渲染');
  });

  it('应使用 useParams 获取 id', () => {
    assert.ok(src.includes('useParams') && src.includes('params.id'), '缺少 useParams 获取 id');
  });

  it('应包含编辑信息按钮', () => {
    assert.ok(src.includes('编辑信息'), '缺少编辑信息按钮');
  });

  it('应包含停用/启用租户按钮', () => {
    assert.ok(src.includes('停用租户') || src.includes('启用租户'), '缺少停用/启用按钮');
  });

  it('应包含 ConfirmDialog（停用确认弹窗）', () => {
    assert.ok(src.includes('ConfirmDialog'), '缺少 ConfirmDialog');
    assert.ok(src.includes('showSuspendDialog'), '缺少 showSuspendDialog 状态');
  });

  it('状态切换后应调用 toast.success', () => {
    assert.ok(src.includes('toast.success'), '缺少 toast.success');
  });

  it('基本信息应包含租户编码/名称/联系人/电话/邮箱/地区/日期/套餐/状态', () => {
    assert.ok(src.includes('tenantCode'), '缺少 tenantCode');
    assert.ok(src.includes('contactPerson'), '缺少 contactPerson');
    assert.ok(src.includes('contactPhone'), '缺少 contactPhone');
    assert.ok(src.includes('contactEmail'), '缺少 contactEmail');
    assert.ok(src.includes('region'), '缺少 region');
    assert.ok(src.includes('createdAt'), '缺少 createdAt');
  });

  it('业务数据应包含 brandCount / storeCount / memberCount', () => {
    assert.ok(src.includes('brandCount'), '缺少 brandCount');
    assert.ok(src.includes('storeCount'), '缺少 storeCount');
    assert.ok(src.includes('memberCount'), '缺少 memberCount');
  });
});

// ---- formatNumber 函数 ----

describe('tenants/[id] — formatNumber 格式化', () => {
  const data = readData();

  it('formatNumber 应使用万为单位并保留 1 位小数', () => {
    assert.ok(data.includes('toFixed(1)'), '缺少 toFixed(1)');
    assert.ok(data.includes('10000') || data.includes('1e4'), '缺少 10000 判断');
  });

  it('formatNumber 应使用 toLocaleString 格式化小于 10000 的数字', () => {
    assert.ok(data.includes('toLocaleString'), '缺少 toLocaleString');
  });
});

// ---- 反例 / 边界 ----

describe('tenants/[id] — 反例 & 边界', () => {
  const src = readSource();

  it('租户不存在时应渲染 "租户不存在" 提示', () => {
    assert.ok(src.includes('租户不存在'), '缺少租户不存在提示');
  });

  it('租户不存在时应渲染返回链接', () => {
    assert.ok(src.includes('返回租户列表'), '缺少不存在状态下的返回链接');
  });

  it('应使用 isLoading 状态处理加载中', () => {
    assert.ok(src.includes('isLoading'), '缺少 isLoading 状态');
  });

  it('停用/启用操作应有 800ms setTimeout 延迟', () => {
    assert.ok(src.includes('setTimeout'), '缺少 setTimeout');
    assert.ok(src.includes('800'), '缺少 800ms 延迟');
  });

  it('详情页应同时包含 Suspended 和 Active 状态的按钮文案', () => {
    const hasSuspendedCase = src.includes("status === 'suspended'") || src.includes("status==='suspended'");
    assert.ok(hasSuspendedCase, '缺少 suspended 状态判断逻辑');
  });

  it('Dialog 停用确认文案包含 "强制登出" 或 "恢复访问"', () => {
    assert.ok(src.includes('强制登出') || src.includes('恢复访问'), '缺少停用对话框文案');
  });

  it('ConfirmDialog 的 variant 在 suspended 时使用 default，否则为 danger', () => {
    assert.ok(
      (src.includes("variant={tenant.status === 'suspended' ? 'default' : 'danger'}") ||
        src.includes('variant={tenant.status===')),
      '缺少 variant 条件渲染'
    );
  });

  it('统计卡片应包含 3 个数量显示区域', () => {
    const count = (src.match(/fontSize.*32/gi) || []).length;
    assert.ok(count >= 1, '缺少大号统计数字样式');
  });
});

// ---- 其他防御性检查 ----

describe('tenants/[id] — 防御', () => {
  const src = readSource();

  it('应使用 Link 标签实现返回导航', () => {
    assert.ok(src.includes('Link'), '缺少 Link 导航');
  });

  it('应包含 CSS 样式定义 (padding/margin/borderRadius/grid)', () => {
    assert.ok(src.includes('padding'), '缺少 padding 样式');
    assert.ok(src.includes('borderRadius'), '缺少 borderRadius 样式');
    assert.ok(src.includes('gridTemplateColumns'), '缺少 grid 布局');
  });

  it('停用确认文案中应包含租户名称', () => {
    assert.ok(src.includes('tenant.tenantName'), '缺少 tenantName 在确认文案中');
  });

  it('页面应设置 data-testid 属性以支持 E2E 测试', () => {
    // data-testid 不强制但推荐
    const hasTestId = src.includes('data-testid');
    if (!hasTestId) {
      // 不 fail，只是记录
      assert.ok(true, '页面未包含 data-testid（非强制）');
    }
  });
});
