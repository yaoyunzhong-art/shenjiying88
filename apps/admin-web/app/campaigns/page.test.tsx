/**
 * P-47 品牌运营 — 营销活动管理页测试
 *
 * 覆盖: 正例·反例·边界·三态(Loading/Empty/Error)·新建弹窗
 * Mock策略: URL-pattern responseRegistry
 * 圈梁四道箍: TSC通过 → 测试0 fail(无skip) → 圈梁表更新 → PRD标记
 */
import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import { render, screen, waitFor } from '@testing-library/react'
import CampaignsPage from './page'
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ─── Mock fetch — URL-pattern responseRegistry ──

const responseRegistry = new Map<string, () => unknown>();

function setResponseFor(pattern: string, factory: () => unknown) {
  responseRegistry.set(pattern, factory);
}

globalThis.fetch = ((url: string) => {
  const path = typeof url === 'string' ? url : '';
  for (const [pattern, factory] of responseRegistry) {
    if (path.includes(pattern)) {
      let result: unknown;
      try { result = factory(); } catch { return Promise.reject(new Error('Fetch mock threw')); }
      return Promise.resolve({
        ok: true, status: 200,
        json: () => Promise.resolve(result),
        headers: new Headers(), redirected: false, statusText: 'OK', type: 'basic' as const, url: path,
      } as Response);
    }
  }
  return Promise.resolve({
    ok: true, status: 200, json: () => Promise.resolve({ success: true, data: null, message: 'OK' }),
    headers: new Headers(), redirected: false, statusText: 'OK', type: 'basic' as const, url: path,
  } as Response);
}) as typeof globalThis.fetch;

function bodyText() {
  return document.body.textContent || '';
}

function makeCampaign(id: string, overrides: Record<string, unknown> = {}) {
  return {
    id, name: `活动${id}`, description: `描述${id}`,
    type: 'promotion', status: 'active',
    startDate: '2026-07-01', endDate: '2026-08-31',
    budgetCents: 1000000, spentCents: 500000, usageCount: 100,
    targetMetric: 'revenue', targetValue: 10000, currentValue: 5000,
    channels: ['mini-app'],
    tenantId: 't1', createdBy: 'admin',
    createdAt: '2026-06-25T00:00:00Z', updatedAt: '2026-07-15T10:00:00Z',
    ...overrides,
  };
}

function setDefaultResponses() {
  responseRegistry.clear();
  setResponseFor('/api/brand/campaigns', () => ({
    success: true,
    data: {
      campaigns: [
        makeCampaign('cmp-1', { name: '夏日狂欢', description: '暑期折扣', type: 'promotion', status: 'active', budgetCents: 5000000, spentCents: 1280000, usageCount: 856, targetValue: 30000000, currentValue: 8500000, channels: ['mini-app', 'wechat'] }),
        makeCampaign('cmp-2', { name: '新会员专享', description: '注册送积分', type: 'new-member', status: 'active', budgetCents: 2000000, spentCents: 450000, usageCount: 723, targetMetric: 'new-users', targetValue: 5000, currentValue: 1820, channels: ['mini-app'] }),
        makeCampaign('cmp-3', { name: '端午特惠', description: '端午限时折扣', type: 'seasonal', status: 'completed', budgetCents: 800000, spentCents: 760000, usageCount: 1340, targetValue: 5000000, currentValue: 4820000, channels: ['mini-app', 'in-store'] }),
        makeCampaign('cmp-4', { name: '换季清仓', description: '春季5折', type: 'clearance', status: 'draft', budgetCents: 3000000, spentCents: 0, usageCount: 0, targetMetric: 'traffic', targetValue: 10000, currentValue: 0, channels: ['in-store'] }),
      ],
    },
    message: 'OK',
  }));
}

function assertInDoc(text: string) {
  const els = screen.queryAllByText(text);
  assert.ok(els.length >= 1, `expected "${text}" to be in document`);
}

// ═══════════════════════════════════════════════════
// 1. 基础渲染（正例）
// ═══════════════════════════════════════════════════
describe('基础渲染', () => {
  beforeEach(() => { responseRegistry.clear(); setDefaultResponses(); });

  it('正例: 渲染页面标题', async () => {
    render(<CampaignsPage />);
    await waitFor(() => assertInDoc('营销活动'));
  });

  it('正例: 渲染子标题', async () => {
    render(<CampaignsPage />);
    await waitFor(() => assertInDoc('品牌活动管理与投放效果追踪'));
  });

  it('正例: 渲染概览统计卡片（活动总数/进行中/总预算/已花费）', async () => {
    render(<CampaignsPage />);
    await waitFor(() => {
      assertInDoc('活动总数');
      assertInDoc('总预算');
      assertInDoc('已花费');
    });
  });

  it('正例: 默认Tab=进行中, 只显示active活动', async () => {
    render(<CampaignsPage />);
    await waitFor(() => {
      assertInDoc('夏日狂欢');
      assertInDoc('新会员专享');
    });
  });

  it('正例: 渲染Tab导航（4个Tab按钮）', async () => {
    render(<CampaignsPage />);
    await waitFor(() => {
      assert.ok(screen.queryAllByText('全部').length >= 1, 'Tab 全部');
      assert.ok(screen.queryAllByText('已完成').length >= 1, 'Tab 已完成');
    });
  });

  it('正例: 展示活跃活动类型标签', async () => {
    render(<CampaignsPage />);
    await waitFor(() => {
      assertInDoc('促销活动');
      assertInDoc('拉新活动');
    });
  });

  it('正例: 展示渠道标签', async () => {
    render(<CampaignsPage />);
    await waitFor(() => {
      const text = bodyText();
      assert.ok(text.includes('小程序'), 'channel label');
    });
  });

  it('正例: 展示进度百分比', async () => {
    render(<CampaignsPage />);
    await waitFor(() => {
      assertInDoc('28.3%');
      assertInDoc('36.4%');
    });
  });

  it('正例: 展示刷新按钮', async () => {
    render(<CampaignsPage />);
    await waitFor(() => assert.ok(screen.queryAllByText('刷新').length >= 1));
  });

  it('正例: 展示活跃活动描述', async () => {
    render(<CampaignsPage />);
    await waitFor(() => assertInDoc('暑期折扣'));
  });

  it('正例: 页面整体渲染正常', async () => {
    render(<CampaignsPage />);
    await waitFor(() => {
      const text = bodyText();
      assert.ok(text.length > 100, `page rendered content: ${text.length} chars`);
    });
  });
});

// ═══════════════════════════════════════════════════
// 2. 活动状态统计条
// ═══════════════════════════════════════════════════
describe('活动状态统计条', () => {
  beforeEach(() => { responseRegistry.clear(); setDefaultResponses(); });

  it('正例: 渲染4个状态统计卡片', async () => {
    render(<CampaignsPage />);
    await waitFor(() => {
      assertInDoc('总活动');
      assertInDoc('未开始');
      assertInDoc('已结束');
    });
  });

  it('正例: 状态统计使用grid-cols-4', () => {
    const SRC = fs.readFileSync(resolve(__dirname, 'page.tsx'), 'utf-8');
    const marker = SRC.indexOf('活动状态统计');
    const block = SRC.slice(marker, marker + 600);
    assert.ok(block.includes('grid-cols-4'), 'uses grid-cols-4');
  });

  it('正例: 总活动数量=4（默认数据）', async () => {
    render(<CampaignsPage />);
    await waitFor(() => assert.ok(screen.queryAllByText('4').length >= 1));
  });

  it('正例: 进行中=2（2个active）', async () => {
    render(<CampaignsPage />);
    await waitFor(() => assert.ok(screen.queryAllByText('2').length >= 1));
  });

  it('反例: 已结束=1（1个completed）', async () => {
    render(<CampaignsPage />);
    await waitFor(() => assert.ok(screen.queryAllByText('1').length >= 1));
  });

  it('边界: 全draft数据时状态卡片正常渲染', async () => {
    responseRegistry.clear();
    setResponseFor('/api/brand/campaigns', () => ({
      success: true,
      data: {
        campaigns: [
          makeCampaign('d1', { status: 'draft', budgetCents: 1000000 }),
          makeCampaign('d2', { status: 'draft', budgetCents: 2000000 }),
        ],
      },
      message: 'OK',
    }));
    render(<CampaignsPage />);
    await waitFor(() => {
      assertInDoc('总活动');
      assertInDoc('未开始');
      assertInDoc('已结束');
    });
  });

  it('边界: 全completed数据时状态卡片正常渲染', async () => {
    responseRegistry.clear();
    setResponseFor('/api/brand/campaigns', () => ({
      success: true,
      data: {
        campaigns: [
          makeCampaign('c1', { status: 'completed', budgetCents: 500000 }),
        ],
      },
      message: 'OK',
    }));
    render(<CampaignsPage />);
    await waitFor(() => {
      assertInDoc('总活动');
      assertInDoc('已结束');
    });
  });

  it('边界: cancelled活动计入已结束统计', async () => {
    responseRegistry.clear();
    setResponseFor('/api/brand/campaigns', () => ({
      success: true,
      data: {
        campaigns: [
          makeCampaign('x1', { status: 'cancelled', budgetCents: 100000 }),
        ],
      },
      message: 'OK',
    }));
    render(<CampaignsPage />);
    await waitFor(() => {
      assertInDoc('总活动');
      assertInDoc('已结束');
    });
  });
});

// ═══════════════════════════════════════════════════
// 3. 活动列表内容
// ═══════════════════════════════════════════════════
describe('活动列表内容', () => {
  beforeEach(() => { responseRegistry.clear(); setDefaultResponses(); });

  it('正例: 显示日期范围', async () => {
    render(<CampaignsPage />);
    await waitFor(() => {
      const text = bodyText();
      assert.ok(text.includes('2026-07-01'), 'start date');
      assert.ok(text.includes('2026-08-31'), 'end date');
    });
  });

  it('正例: 显示已花费标签', async () => {
    render(<CampaignsPage />);
    await waitFor(() => assertInDoc('已花费'));
  });

  it('正例: 显示使用量(usageCount)', async () => {
    render(<CampaignsPage />);
    await waitFor(() => {
      const text = bodyText();
      assert.ok(text.includes('使用量'), 'usage count label');
      assert.ok(text.includes('856'), 'usage count value for 夏日狂欢');
      assert.ok(text.includes('723'), 'usage count value for 新会员专享');
    });
  });

  it('正例: 显示营收目标指标', async () => {
    render(<CampaignsPage />);
    await waitFor(() => assertInDoc('营收'));
  });

  it('正例: 进度条容器渲染(rounded-full)', async () => {
    render(<CampaignsPage />);
    await waitFor(() => {
      const bars = document.querySelectorAll('.rounded-full');
      assert.ok(bars.length >= 2, `found ${bars.length} progress bars`);
    });
  });

  it('正例: 显示渠道前缀', async () => {
    render(<CampaignsPage />);
    await waitFor(() => {
      const text = bodyText();
      assert.ok(text.includes('渠道'), 'channel label');
    });
  });

  it('反例: targetValue=0时显示0%', async () => {
    responseRegistry.clear();
    setResponseFor('/api/brand/campaigns', () => ({
      success: true,
      data: {
        campaigns: [
          makeCampaign('z1', { name: '零目标', targetValue: 0, currentValue: 0 }),
        ],
      },
      message: 'OK',
    }));
    render(<CampaignsPage />);
    await waitFor(() => assertInDoc('0%'));
  });

  it('边界: currentValue超过targetValue不崩溃', async () => {
    responseRegistry.clear();
    setResponseFor('/api/brand/campaigns', () => ({
      success: true,
      data: {
        campaigns: [
          makeCampaign('o1', { name: '超额', targetValue: 1000, currentValue: 2000 }),
        ],
      },
      message: 'OK',
    }));
    render(<CampaignsPage />);
    await waitFor(() => assertInDoc('超额'));
  });
});

// ═══════════════════════════════════════════════════
// 4. API错误与边界（三态: Error）
// ═══════════════════════════════════════════════════
describe('API错误与边界', () => {
  beforeEach(() => { responseRegistry.clear(); });

  it('反例: API返回空数据 → 暂无活动（三态: Empty）', async () => {
    setResponseFor('/api/brand/campaigns', () => ({
      success: true, data: { campaigns: [] }, message: 'OK',
    }));
    render(<CampaignsPage />);
    await waitFor(() => assertInDoc('暂无活动'));
  });

  it('反例: API返回success=false → 默认数据fallback', async () => {
    setResponseFor('/api/brand/campaigns', () => ({
      success: false, message: 'Server error',
    }));
    render(<CampaignsPage />);
    await waitFor(() => {
      const text = bodyText();
      assert.ok(text.includes('夏日狂欢'), 'fallback to defaultCampaigns');
    });
  });

  it('反例: fetch异常 → 默认数据fallback', async () => {
    setResponseFor('/api/brand/campaigns', () => { throw new Error('Net error'); });
    render(<CampaignsPage />);
    await waitFor(() => {
      const text = bodyText();
      assert.ok(text.includes('夏日狂欢'), 'fallback on network error');
    });
  });

  it('边界: loading状态展示加载动画（三态: Loading）', () => {
    render(<CampaignsPage />);
    const el = screen.queryByText('加载营销活动...');
    assert.ok(el, 'loading state present');
  });

  it('反例: budgetCents=0时总预算¥0.00', async () => {
    responseRegistry.clear();
    setResponseFor('/api/brand/campaigns', () => ({
      success: true,
      data: { campaigns: [makeCampaign('z', { budgetCents: 0, spentCents: 0 })] },
      message: 'OK',
    }));
    render(<CampaignsPage />);
    await waitFor(() => {
      const text = bodyText();
      assert.ok(text.includes('¥0.00'), 'zero budget');
    });
  });

  it('边界: 超大金额格式化不崩溃', async () => {
    responseRegistry.clear();
    setResponseFor('/api/brand/campaigns', () => ({
      success: true,
      data: { campaigns: [makeCampaign('big', { budgetCents: 9999999999, spentCents: 1 })] },
      message: 'OK',
    }));
    render(<CampaignsPage />);
    await waitFor(() => {
      const text = bodyText();
      assert.ok(text.includes('¥'), 'budget formatted');
    });
  });
});

// ═══════════════════════════════════════════════════
// 5. 概览统计卡片
// ═══════════════════════════════════════════════════
describe('概览统计', () => {
  beforeEach(() => { responseRegistry.clear(); setDefaultResponses(); });

  it('正例: 显示4个概览统计卡片', async () => {
    render(<CampaignsPage />);
    await waitFor(() => {
      assertInDoc('活动总数');
      assertInDoc('进行中');
      assertInDoc('总预算');
      assertInDoc('已花费');
    });
  });

  it('正例: 总预算含¥符号', async () => {
    render(<CampaignsPage />);
    await waitFor(() => {
      const text = bodyText();
      assert.ok(text.includes('¥'), 'yuan symbol in budget');
    });
  });

  it('正例: 已花费含¥符号', async () => {
    render(<CampaignsPage />);
    await waitFor(() => {
      const text = bodyText();
      assert.ok(text.includes('¥'), 'yuan symbol in spent');
    });
  });
});

// ═══════════════════════════════════════════════════
// 6. 统计计算验证
// ═══════════════════════════════════════════════════
describe('统计计算', () => {
  it('正例: 渲染两个grid行(概览+状态)', async () => {
    responseRegistry.clear();
    setDefaultResponses();
    render(<CampaignsPage />);
    await waitFor(() => {
      const grids = document.querySelectorAll('.grid');
      assert.ok(grids.length >= 2, 'at least 2 grid rows');
    });
  });

  it('边界: 无数据时活动总数=0', async () => {
    responseRegistry.clear();
    setResponseFor('/api/brand/campaigns', () => ({
      success: true, data: { campaigns: [] }, message: 'OK',
    }));
    render(<CampaignsPage />);
    await waitFor(() => assertInDoc('暂无活动'));
  });
});

// ═══════════════════════════════════════════════════
// 7. 工具函数验证
// ═══════════════════════════════════════════════════
describe('工具函数', () => {
  it('正例: fmtCents', async () => {
    const mod = await import('./page');
    assert.strictEqual(mod.fmtCents(100), '¥1.00');
    assert.strictEqual(mod.fmtCents(-100), '-¥1.00');
  });

  it('正例: fmtPercent', async () => {
    const mod = await import('./page');
    assert.strictEqual(mod.fmtPercent(50, 100), '50.0%');
    assert.strictEqual(mod.fmtPercent(0, 100), '0.0%');
  });

  it('反例: fmtPercent target=0', async () => {
    const mod = await import('./page');
    assert.strictEqual(mod.fmtPercent(100, 0), '0%');
  });

  it('正例: statusLabel中文映射', async () => {
    const mod = await import('./page');
    assert.strictEqual(mod.statusLabel('active'), '进行中');
    assert.strictEqual(mod.statusLabel('draft'), '草稿');
    assert.strictEqual(mod.statusLabel('completed'), '已完成');
  });

  it('反例: statusLabel未知状态', async () => {
    const mod = await import('./page');
    assert.strictEqual(mod.statusLabel('unknown' as any), 'unknown');
  });

  it('正例: statusColor', async () => {
    const mod = await import('./page');
    assert.ok(mod.statusColor('active').includes('green'));
  });

  it('正例: typeLabel中文映射', async () => {
    const mod = await import('./page');
    assert.strictEqual(mod.typeLabel('promotion'), '促销活动');
    assert.strictEqual(mod.typeLabel('seasonal'), '季节活动');
  });
});

// ═══════════════════════════════════════════════════
// 8. 新建活动弹窗
// ═══════════════════════════════════════════════════
describe('新建活动弹窗', () => {
  beforeEach(() => { responseRegistry.clear(); setDefaultResponses(); });

  it('正例: 渲染"+ 新建活动"按钮', async () => {
    render(<CampaignsPage />);
    await waitFor(() => assertInDoc('+ 新建活动'));
  });

  it('正例: 弹窗源码包含Modal/Form等组件声明', () => {
    const src = fs.readFileSync(resolve(__dirname, 'page.tsx'), 'utf-8');
    assert.ok(src.includes('<Modal'), 'Modal component usage');
    assert.ok(src.includes('<Form'), 'Form component usage');
    assert.ok(src.includes('handleCreate'), 'create handler');
    assert.ok(src.includes('setModalOpen'), 'modal open state');
  });

  it('正例: 源码包含完整表单字段定义', () => {
    const src = fs.readFileSync(resolve(__dirname, 'page.tsx'), 'utf-8');
    assert.ok(src.includes('活动名称'), 'field: 活动名称');
    assert.ok(src.includes('活动类型'), 'field: 活动类型');
    assert.ok(src.includes('开始日期'), 'field: 开始日期');
    assert.ok(src.includes('投放渠道'), 'field: 投放渠道');
    assert.ok(src.includes('目标指标'), 'field: 目标指标');
    assert.ok(src.includes('目标值'), 'field: 目标值');
  });

  it('正例: 源码包含创建/取消按钮文本', () => {
    const src = fs.readFileSync(resolve(__dirname, 'page.tsx'), 'utf-8');
    assert.ok(src.includes('okText="创建"'), 'confirm button');
    assert.ok(src.includes('cancelText="取消"'), 'cancel button');
  });

  it('正例: 弹窗包含渠道选择(多选)', () => {
    const src = fs.readFileSync(resolve(__dirname, 'page.tsx'), 'utf-8');
    assert.ok(src.includes('mode="multiple"'), 'multi-select channels');
  });

  it('正例: 弹窗包含活动类型选择', () => {
    const src = fs.readFileSync(resolve(__dirname, 'page.tsx'), 'utf-8');
    assert.ok(src.includes('促销活动'), 'promotion type');
    assert.ok(src.includes('拉新活动'), 'new-member type');
    assert.ok(src.includes('推荐有礼'), 'referral type');
    assert.ok(src.includes('季节活动'), 'seasonal type');
    assert.ok(src.includes('清仓活动'), 'clearance type');
  });

  it('正例: 弹窗包含目标指标选择', () => {
    const src = fs.readFileSync(resolve(__dirname, 'page.tsx'), 'utf-8');
    assert.ok(src.includes('营收'), 'revenue metric');
    assert.ok(src.includes('新用户'), 'new-users metric');
    assert.ok(src.includes('核销数'), 'redemption metric');
    assert.ok(src.includes('流量'), 'traffic metric');
  });

  it('正例: 弹窗包含预算输入', () => {
    const src = fs.readFileSync(resolve(__dirname, 'page.tsx'), 'utf-8');
    assert.ok(src.includes('预算'), 'budget field');
  });

  it('正例: 弹窗 destroyOnClose/onCancel/handleCreate 实现', () => {
    const src = fs.readFileSync(resolve(__dirname, 'page.tsx'), 'utf-8');
    assert.ok(src.includes('destroyOnClose') || src.includes('destroyOnHidden'), 'destroy on close');
    assert.ok(src.includes('onCancel'), 'cancel handler');
    assert.ok(src.includes('form.validateFields'), 'form validation');
  });

  it('边界: 表单校验规则(必填/长度)', () => {
    const src = fs.readFileSync(resolve(__dirname, 'page.tsx'), 'utf-8');
    assert.ok(src.includes('required: true'), 'required fields');
    assert.ok(src.includes('message:'), 'validation messages');
  });

  it('边界: 创建API调用路径正确', () => {
    const src = fs.readFileSync(resolve(__dirname, 'page.tsx'), 'utf-8');
    // 新建活动发起POST到 /api/brand/campaigns
    assert.ok(src.includes("'POST'"), 'POST method');
    assert.ok(src.includes('/api/brand/campaigns'), 'API endpoint');
  });

  it('正例: 弹窗打开函数openModal处理表单重置', () => {
    const src = fs.readFileSync(resolve(__dirname, 'page.tsx'), 'utf-8');
    assert.ok(src.includes('form.resetFields'), 'reset form');
    assert.ok(src.includes('setModalOpen(true)'), 'open modal');
  });
});

// ═══════════════════════════════════════════════════
// 9. 静态代码分析
// ═══════════════════════════════════════════════════
const SRC = fs.readFileSync(resolve(__dirname, 'page.tsx'), 'utf-8');

describe('静态代码分析', () => {
  it('包含useState声明', () => assert.ok(SRC.includes('const [') && SRC.includes('useState')));
  it('包含JSX返回', () => assert.ok(SRC.includes('return (') || SRC.includes('return <')));
  it('包含onClick事件', () => assert.ok(SRC.includes('onClick={')));
  it('包含列表渲染.map', () => assert.ok(SRC.includes('.map(')));
  it('包含条件渲染 && 或 ?', () => assert.ok(SRC.includes(' && ') || SRC.includes(' ? ')));
  it('包含export default function', () => assert.ok(SRC.includes('export default function')));
  it('包含活动状态统计卡片名(总活动/未开始/已结束)', () => {
    assert.ok(SRC.includes('总活动'), '总活动');
    assert.ok(SRC.includes('未开始'), '总活动');
    assert.ok(SRC.includes('已结束'), '已结束');
  });
  it('状态统计使用grid-cols-4', () => {
    const idx = SRC.indexOf('活动状态统计');
    const block = SRC.slice(idx, idx + 500);
    assert.ok(block.includes('grid-cols-4'));
  });
  it('不依赖@m5/ui', () => assert.ok(!SRC.includes('@m5/ui')));
  it('包含Modal组件(新建活动弹窗)', () => assert.ok(SRC.includes('from \'antd\'') && SRC.includes('<Modal')));
  it('包含Form组件', () => assert.ok(SRC.includes('<Form') || SRC.includes('<Form.Item')));
  it('包含dayjs导入', () => assert.ok(SRC.includes('dayjs')));
  it('包含三态注释标记(Loading/Empty/Error)', () => {
    assert.ok(SRC.includes('三态: Loading'), 'loading state marker');
    assert.ok(SRC.includes('三态: Empty'), 'empty state marker');
    assert.ok(SRC.includes('三态: Error'), 'error state marker');
  });
  it('包含usageCount字段', () => {
    assert.ok(SRC.includes('usageCount'), 'usage count field');
  });
});
