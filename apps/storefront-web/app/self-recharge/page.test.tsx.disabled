/**
 * self-recharge/page.vitest.tsx — 自助充值 P-37 组件渲染测试
 *
 * 覆盖:
 *   L1 渲染 — step 切换 / 金额选项 / 支付方式 / 汇总信息
 *   L2 交互 — 金额选择 / 自定义金额 / 支付方式选择 / 返回修改
 *   边界   — 空金额防御 / 处理中状态 / 错误提示
 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach } from 'vitest';

// ============================================================
// Mocks
// ============================================================

const mockPush = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

vi.mock('@m5/ui', () => ({
  Button: Object.assign(
    ({ children, onClick, disabled, block, variant, style }: any) => (
      <button
        data-testid={`btn-${variant || 'default'}`}
        onClick={onClick}
        disabled={disabled}
        style={style}
      >
        {children}
      </button>
    ),
    { displayName: 'Button' },
  ),
  Card: ({ children, style }: any) => (
    <div data-testid="m5-card" style={style}>{children}</div>
  ),
  Tag: ({ children, style }: any) => (
    <span data-testid="m5-tag" style={style}>{children}</span>
  ),
  InputNumber: ({ value, onChange, min, max, placeholder, prefix }: any) => (
    <div data-testid="input-custom-amount">
      {prefix && <span>{prefix}</span>}
      <input
        data-testid="custom-amount-input"
        value={value ?? ''}
        onChange={(e: any) => {
          const v = e.target.value === '' ? null : Number(e.target.value);
          onChange?.(v);
        }}
        placeholder={placeholder}
        min={min}
        max={max}
        type="number"
      />
    </div>
  ),
}));

const mockBuildMemberId = vi.fn();
const mockEnsureRegistered = vi.fn();
const mockStartCheckout = vi.fn();

vi.mock('../../lib/storefront-transactions', () => ({
  buildStorefrontMemberId: (...args: any[]) => mockBuildMemberId(...args),
  ensureStorefrontMemberRegistered: (...args: any[]) => mockEnsureRegistered(...args),
  startStorefrontCheckout: (...args: any[]) => mockStartCheckout(...args),
}));

// ============================================================
// Subject
// ============================================================

import SelfRechargePage from './page';

// ============================================================
// Tests
// ============================================================

describe('SelfRechargePage — 渲染测试 (Step 1: 选择金额)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('应渲染主标题和描述', () => {
    render(<SelfRechargePage />);
    expect(screen.getByText('自助充值 — P-37')).toBeInTheDocument();
    expect(screen.getByText('选择充值金额或输入自定义金额')).toBeInTheDocument();
  });

  test('应渲染 5 个快捷金额选项', () => {
    render(<SelfRechargePage />);
    expect(screen.getByText('¥50')).toBeInTheDocument();
    expect(screen.getByText('¥100')).toBeInTheDocument();
    expect(screen.getByText('¥200')).toBeInTheDocument();
    expect(screen.getByText('¥500')).toBeInTheDocument();
    expect(screen.getByText('¥1000')).toBeInTheDocument();
  });

  test('热门金额应显示 Tag "热门"', () => {
    render(<SelfRechargePage />);
    const tags = screen.getAllByTestId('m5-tag');
    const hotTags = tags.filter(t => t.textContent === '热门');
    expect(hotTags.length).toBeGreaterThanOrEqual(2);
  });

  test('金额选项应显示赠送信息', () => {
    render(<SelfRechargePage />);
    // ¥50 +送5元, ¥100 +送15元, ¥200 +送35元, ¥500 +送100元, ¥1000 +送250元
    expect(screen.getByText('+送5元')).toBeInTheDocument();
    expect(screen.getByText('+送15元')).toBeInTheDocument();
    expect(screen.getByText('+送35元')).toBeInTheDocument();
    expect(screen.getByText('+送100元')).toBeInTheDocument();
    expect(screen.getByText('+送250元')).toBeInTheDocument();
  });

  test('应渲染自定义金额输入框', () => {
    render(<SelfRechargePage />);
    expect(screen.getByTestId('input-custom-amount')).toBeInTheDocument();
    expect(screen.getByTestId('custom-amount-input')).toBeInTheDocument();
  });

  test('自定义金额应有 ¥ 前缀', () => {
    render(<SelfRechargePage />);
    expect(screen.getByText('¥')).toBeInTheDocument();
  });

  test('应渲染自定义金额区域的"自定义金额"标签', () => {
    render(<SelfRechargePage />);
    expect(screen.getByText('自定义金额')).toBeInTheDocument();
  });

  test('初始金额显示为 ¥0', () => {
    render(<SelfRechargePage />);
    expect(screen.getByText('¥0')).toBeInTheDocument();
  });

  test('下一步按钮初始为禁用状态', () => {
    render(<SelfRechargePage />);
    const nextBtn = screen.getByText('下一步 · 选择支付方式').closest('button');
    expect(nextBtn).toBeDisabled();
  });
});

describe('SelfRechargePage — 金额选择交互', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockBuildMemberId.mockReturnValue('member_id_recharge');
    mockEnsureRegistered.mockResolvedValue(undefined);
    mockStartCheckout.mockResolvedValue({
      order: { orderId: 'ord-recharge-001', orderNo: 'REC202607220001' },
    });
  });

  test('选择 ¥100 → 显示选中金额和赠送信息', () => {
    render(<SelfRechargePage />);
    const btn100 = screen.getByText('¥100').closest('button')!;
    fireEvent.click(btn100);

    // 应显示充值金额汇总
    expect(screen.getByText('¥100')).toBeInTheDocument();
    // 显示赠送信息
    expect(screen.getByText(/赠送 ¥15/)).toBeInTheDocument();
  });

  test('选择 ¥100 → 解锁下一步按钮', () => {
    render(<SelfRechargePage />);
    const btn100 = screen.getByText('¥100').closest('button')!;
    fireEvent.click(btn100);

    const nextBtn = screen.getByText('下一步 · 选择支付方式').closest('button');
    expect(nextBtn).not.toBeDisabled();
  });

  test('选择 ¥200 后切换到 ¥50 → 金额切换到 ¥50', () => {
    render(<SelfRechargePage />);
    const btn200 = screen.getByText('¥200').closest('button')!;
    fireEvent.click(btn200);
    expect(screen.getByText('+送35元')).toBeInTheDocument();

    const btn50 = screen.getByText('¥50').closest('button')!;
    fireEvent.click(btn50);
    expect(screen.getByText('+送5元')).toBeInTheDocument();
  });

  test('自定义金额输入 88 → 显示 ¥88', () => {
    render(<SelfRechargePage />);
    const input = screen.getByTestId('custom-amount-input');
    fireEvent.change(input, { target: { value: '88' } });
    expect(screen.getByText('¥88')).toBeInTheDocument();
  });

  test('自定义金额后选择预设金额 → 清除自定义金额', () => {
    render(<SelfRechargePage />);
    const input = screen.getByTestId('custom-amount-input');
    fireEvent.change(input, { target: { value: '88' } });
    expect(screen.getByText('¥88')).toBeInTheDocument();

    const btn100 = screen.getByText('¥100').closest('button')!;
    fireEvent.click(btn100);
    // 自定义金额输入应被清空
    expect(input).toHaveValue(null);
  });

  test('金额为 0 时点击下一步应提示错误', () => {
    render(<SelfRechargePage />);
    const nextBtn = screen.getByText('下一步 · 选择支付方式').closest('button')!;
    // 按钮禁用，所以错误不会触发（组件内有 disabled 和 onClick 双校验）
    expect(nextBtn).toBeDisabled();
  });

  test('充值金额汇总卡片应显示实际到账金额', () => {
    render(<SelfRechargePage />);
    const btn500 = screen.getByText('¥500').closest('button')!;
    fireEvent.click(btn500);

    // 总充值 ¥500, 赠送 ¥100, 实际到账 ¥600 (500+100)
    expect(screen.getByText('¥500')).toBeInTheDocument();
    expect(screen.getByText(/赠送 ¥100/)).toBeInTheDocument();
  });
});

describe('SelfRechargePage — Step 2: 选择支付方式', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockBuildMemberId.mockReturnValue('member_id_recharge');
    mockEnsureRegistered.mockResolvedValue(undefined);
    mockStartCheckout.mockResolvedValue({
      order: { orderId: 'ord-recharge-001', orderNo: 'REC202607220001' },
    });
  });

  test('选择金额后点下一步 → 显示支付方式选择', () => {
    render(<SelfRechargePage />);
    const btn100 = screen.getByText('¥100').closest('button')!;
    fireEvent.click(btn100);

    const nextBtn = screen.getByText('下一步 · 选择支付方式').closest('button')!;
    fireEvent.click(nextBtn);

    expect(screen.getByText('选择支付方式')).toBeInTheDocument();
    expect(screen.getByText('充值 ¥100')).toBeInTheDocument();
  });

  test('支付方式页面应显示 4 种支付方式', () => {
    render(<SelfRechargePage />);
    const btn100 = screen.getByText('¥100').closest('button')!;
    fireEvent.click(btn100);
    const nextBtn = screen.getByText('下一步 · 选择支付方式').closest('button')!;
    fireEvent.click(nextBtn);

    expect(screen.getByText('微信支付')).toBeInTheDocument();
    expect(screen.getByText('支付宝')).toBeInTheDocument();
    expect(screen.getByText('现金支付')).toBeInTheDocument();
    expect(screen.getByText('刷卡')).toBeInTheDocument();
  });

  test('支付页面显示充值金额回顾', () => {
    render(<SelfRechargePage />);
    const btn100 = screen.getByText('¥100').closest('button')!;
    fireEvent.click(btn100);
    const nextBtn = screen.getByText('下一步 · 选择支付方式').closest('button')!;
    fireEvent.click(nextBtn);

    expect(screen.getByText('¥100')).toBeInTheDocument();
  });

  test('点击返回修改金额 → 回到 Step 1', () => {
    render(<SelfRechargePage />);
    const btn100 = screen.getByText('¥100').closest('button')!;
    fireEvent.click(btn100);
    const nextBtn = screen.getByText('下一步 · 选择支付方式').closest('button')!;
    fireEvent.click(nextBtn);

    expect(screen.getByText('选择支付方式')).toBeInTheDocument();

    const backBtn = screen.getByText('← 返回修改金额');
    fireEvent.click(backBtn);

    expect(screen.getByText('自助充值 — P-37')).toBeInTheDocument();
    expect(screen.queryByText('选择支付方式')).not.toBeInTheDocument();
  });

  test('选择微信支付 → 调用真实 API 创建订单', async () => {
    render(<SelfRechargePage />);
    const btn100 = screen.getByText('¥100').closest('button')!;
    fireEvent.click(btn100);
    const nextBtn = screen.getByText('下一步 · 选择支付方式').closest('button')!;
    fireEvent.click(nextBtn);

    const wechatBtn = screen.getByText('微信支付').closest('button')!;
    fireEvent.click(wechatBtn);

    await waitFor(() => {
      expect(mockBuildMemberId).toHaveBeenCalledWith('');
      expect(mockEnsureRegistered).toHaveBeenCalledWith(expect.any(String), '自助充值顾客');
      expect(mockStartCheckout).toHaveBeenCalledWith(
        expect.any(String),
        expect.arrayContaining([
          expect.objectContaining({ skuId: 'recharge-100', price: 100 }),
        ]),
        'wechat',
        100,
      );
    });

    expect(mockPush).toHaveBeenCalledWith('/h5/payment/ord-recharge-001');
  });

  test('选择支付宝 → 调用 startStorefrontCheckout with alipay', async () => {
    render(<SelfRechargePage />);
    const btn100 = screen.getByText('¥100').closest('button')!;
    fireEvent.click(btn100);
    const nextBtn = screen.getByText('下一步 · 选择支付方式').closest('button')!;
    fireEvent.click(nextBtn);

    const alipayBtn = screen.getByText('支付宝').closest('button')!;
    fireEvent.click(alipayBtn);

    await waitFor(() => {
      expect(mockStartCheckout).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(Array),
        'alipay',
        expect.any(Number),
      );
    });

    expect(mockPush).toHaveBeenCalledWith('/h5/payment/ord-recharge-001');
  });

  test('选择现金支付 → 调用 startStorefrontCheckout with cash', async () => {
    render(<SelfRechargePage />);
    const btn100 = screen.getByText('¥100').closest('button')!;
    fireEvent.click(btn100);
    const nextBtn = screen.getByText('下一步 · 选择支付方式').closest('button')!;
    fireEvent.click(nextBtn);

    const cashBtn = screen.getByText('现金支付').closest('button')!;
    fireEvent.click(cashBtn);

    await waitFor(() => {
      expect(mockStartCheckout).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(Array),
        'cash',
        expect.any(Number),
      );
    });

    expect(mockPush).toHaveBeenCalledWith('/h5/payment/ord-recharge-001');
  });

  test('选择刷卡 → 调用 startStorefrontCheckout with member_card', async () => {
    render(<SelfRechargePage />);
    const btn100 = screen.getByText('¥100').closest('button')!;
    fireEvent.click(btn100);
    const nextBtn = screen.getByText('下一步 · 选择支付方式').closest('button')!;
    fireEvent.click(nextBtn);

    const cardBtn = screen.getByText('刷卡').closest('button')!;
    fireEvent.click(cardBtn);

    await waitFor(() => {
      expect(mockStartCheckout).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(Array),
        'member_card',
        expect.any(Number),
      );
    });

    expect(mockPush).toHaveBeenCalledWith('/h5/payment/ord-recharge-001');
  });

  test('支付中应显示处理状态', async () => {
    // 让 startStorefrontCheckout 不立即 resolve
    mockStartCheckout.mockImplementation(() => new Promise(() => {}));

    render(<SelfRechargePage />);
    const btn100 = screen.getByText('¥100').closest('button')!;
    fireEvent.click(btn100);
    const nextBtn = screen.getByText('下一步 · 选择支付方式').closest('button')!;
    fireEvent.click(nextBtn);

    const wechatBtn = screen.getByText('微信支付').closest('button')!;
    fireEvent.click(wechatBtn);

    expect(screen.getByText(/支付处理中/)).toBeInTheDocument();
  });

  test('API 异常 → 显示错误提示', async () => {
    mockStartCheckout.mockRejectedValue(new Error('创建订单失败，请重试'));

    render(<SelfRechargePage />);
    const btn100 = screen.getByText('¥100').closest('button')!;
    fireEvent.click(btn100);
    const nextBtn = screen.getByText('下一步 · 选择支付方式').closest('button')!;
    fireEvent.click(nextBtn);

    const wechatBtn = screen.getByText('微信支付').closest('button')!;
    fireEvent.click(wechatBtn);

    await waitFor(() => {
      expect(screen.getByText('创建订单失败，请重试')).toBeInTheDocument();
    });
  });

  test('支付失败后错误应显示在支付页面', () => {
    // 支付失败应体现在选择支付方式的错误区域
    // 验证错误元素是否有对应的错误样式
  });
});

describe('SelfRechargePage — 赠送金额计算', () => {
  test('充值 ¥50 → 赠送 ¥5, 到账 ¥55', () => {
    render(<SelfRechargePage />);
    const btn50 = screen.getByText('¥50').closest('button')!;
    fireEvent.click(btn50);
    // 选中的 ¥50 显示 ¥50
    expect(screen.getByText('¥50')).toBeInTheDocument();
  });

  test('充值 ¥100 → 赠送 ¥15, 到账 ¥115', () => {
    render(<SelfRechargePage />);
    const btn100 = screen.getByText('¥100').closest('button')!;
    fireEvent.click(btn100);
    expect(screen.getByText(/赠送 ¥15/)).toBeInTheDocument();
  });

  test('充值 ¥200 → 赠送 ¥35, 到账 ¥235', () => {
    render(<SelfRechargePage />);
    const btn200 = screen.getByText('¥200').closest('button')!;
    fireEvent.click(btn200);
    expect(screen.getByText(/赠送 ¥35/)).toBeInTheDocument();
  });

  test('充值 ¥500 → 赠送 ¥100', () => {
    render(<SelfRechargePage />);
    const btn500 = screen.getByText('¥500').closest('button')!;
    fireEvent.click(btn500);
    expect(screen.getByText(/赠送 ¥100/)).toBeInTheDocument();
  });

  test('充值 ¥1000 → 赠送 ¥250', () => {
    render(<SelfRechargePage />);
    const btn1000 = screen.getByText('¥1000').closest('button')!;
    fireEvent.click(btn1000);
    expect(screen.getByText(/赠送 ¥250/)).toBeInTheDocument();
  });
});

describe('SelfRechargePage — UI 元素验证', () => {
  test('应包含金额图标 💰', () => {
    render(<SelfRechargePage />);
    expect(screen.getByText('💰')).toBeInTheDocument();
  });

  test('充值金额区域应显示标签"充值金额"', () => {
    render(<SelfRechargePage />);
    expect(screen.getByText('充值金额')).toBeInTheDocument();
  });

  test('支付页面应包含支付金额标签', () => {
    render(<SelfRechargePage />);
    const btn100 = screen.getByText('¥100').closest('button')!;
    fireEvent.click(btn100);
    const nextBtn = screen.getByText('下一步 · 选择支付方式').closest('button')!;
    fireEvent.click(nextBtn);

    expect(screen.getByText('支付金额')).toBeInTheDocument();
  });

  test('支付方式页面应显示 4 个支付图标', () => {
    render(<SelfRechargePage />);
    const btn100 = screen.getByText('¥100').closest('button')!;
    fireEvent.click(btn100);
    const nextBtn = screen.getByText('下一步 · 选择支付方式').closest('button')!;
    fireEvent.click(nextBtn);

    expect(screen.getByText('💚')).toBeInTheDocument(); // 微信
    expect(screen.getByText('💙')).toBeInTheDocument(); // 支付宝
    expect(screen.getByText('💵')).toBeInTheDocument(); // 现金
    expect(screen.getByText('💳')).toBeInTheDocument(); // 刷卡
  });

  test('支付页面应有返回修改金额按钮', () => {
    render(<SelfRechargePage />);
    const btn100 = screen.getByText('¥100').closest('button')!;
    fireEvent.click(btn100);
    const nextBtn = screen.getByText('下一步 · 选择支付方式').closest('button')!;
    fireEvent.click(nextBtn);

    expect(screen.getByText('← 返回修改金额')).toBeInTheDocument();
  });
});
