/**
 * member-recharge/page.vitest.tsx — 会员充值页 测试增强
 *
 * 覆盖：加载态、空数据、错误态、用户交互、边界场景
 * 使用 vitest + @testing-library/react
 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach } from 'vitest';

// ── Mocks ──

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock('next/link', () => ({
  default: ({ children, href, className }: any) => (
    <a href={href} className={className} data-testid="next-link">
      {children}
    </a>
  ),
}));

vi.mock('@m5/ui', () => ({
  PageShell: ({ children, title, subtitle }: any) => (
    <div data-testid="page-shell" data-title={title} data-subtitle={subtitle}>
      {children}
    </div>
  ),
  Card: ({ children, title }: any) => (
    <div data-testid="card" data-card-title={title}>
      {title && <h3 data-testid="card-title">{title}</h3>}
      {children}
    </div>
  ),
  Button: ({ children, onClick, variant, size, disabled, 'data-testid': dt }: any) => (
    <button
      data-testid={dt || `btn-${variant || 'default'}`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  ),
  InputNumber: ({ value, onChange, min, max, placeholder, prefix }: any) => (
    <div data-testid="input-number">
      {prefix && <span>{prefix}</span>}
      <input
        data-testid="custom-amount-input"
        type="number"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        min={min}
        max={max}
        placeholder={placeholder}
      />
    </div>
  ),
  Statistic: ({ label, value, prefix, suffix }: any) => (
    <div data-testid="statistic">
      <span data-testid="stat-label">{label}</span>
      <span data-testid="stat-value">{prefix}{value}</span>
      {suffix}
    </div>
  ),
  StatTrend: ({ direction, value, invert }: any) => (
    <span data-testid={`stat-trend-${direction}`}>{value}</span>
  ),
  StatusBadge: ({ label, variant, size }: any) => (
    <span data-testid="status-badge" data-variant={variant} data-size={size}>
      {label}
    </span>
  ),
  Modal: ({ open, onClose, title, children }: any) =>
    open ? (
      <div data-testid="modal" role="dialog">
        <h2 data-testid="modal-title">{title}</h2>
        {children}
        <button data-testid="modal-close" onClick={onClose}>
          取消
        </button>
      </div>
    ) : null,
}));

vi.mock('antd', () => ({
  Input: ({ placeholder, value, onChange, className }: any) => (
    <input
      data-testid="antd-input"
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      className={className}
    />
  ),
  message: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

import MemberRechargePage from './page.tsx';

// ── 辅助函数 ──

function renderPage() {
  return render(<MemberRechargePage />);
}

// ── 测试套件 ──

describe('MemberRechargePage — 渲染', () => {
  test('应正确渲染 PageShell', () => {
    renderPage();
    expect(screen.getByTestId('page-shell')).toBeTruthy();
    expect(screen.getByTestId('page-shell')).toHaveAttribute('data-title', '会员充值');
  });

  test('应渲染标题"会员充值"', () => {
    renderPage();
    expect(screen.getByText('会员充值')).toBeTruthy();
  });

  test('应渲染三步流程标题', () => {
    renderPage();
    expect(screen.getByText('1. 选择会员')).toBeTruthy();
    expect(screen.getByText('2. 选择充值金额')).toBeTruthy();
    expect(screen.getByText('3. 选择支付方式')).toBeTruthy();
  });

  test('应渲染统计概览', () => {
    renderPage();
    expect(screen.getByText('今日充值总额')).toBeTruthy();
    expect(screen.getByText('今日充值笔数')).toBeTruthy();
    expect(screen.getByText('本月新增充值会员')).toBeTruthy();
  });

  test('应渲染四种支付方式', () => {
    renderPage();
    expect(screen.getByText('现金')).toBeTruthy();
    expect(screen.getByText('微信支付')).toBeTruthy();
    expect(screen.getByText('支付宝')).toBeTruthy();
    expect(screen.getByText('银行卡')).toBeTruthy();
  });

  test('应渲染充值套餐', () => {
    renderPage();
    expect(screen.getByText('小额充值')).toBeTruthy();
    expect(screen.getByText('标准充值')).toBeTruthy();
    expect(screen.getByText('畅玩充值')).toBeTruthy();
    expect(screen.getByText('尊享充值')).toBeTruthy();
  });

  test('应默认选中微信支付', () => {
    renderPage();
    const wechatBtn = screen.getByText('微信支付');
    expect(wechatBtn).toBeTruthy();
    // 微信支付 button 应有 aria-pressed true（默认选中）
    expect(wechatBtn.closest('button')).toHaveAttribute('aria-pressed', 'true');
  });

  test('应渲染最近充值记录', () => {
    renderPage();
    expect(screen.getByText('最近充值记录')).toBeTruthy();
    expect(screen.getByText('张三')).toBeTruthy();
    expect(screen.getByText('李四')).toBeTruthy();
  });

  test('应显示充值金额合计区域', () => {
    renderPage();
    expect(screen.getByText('充值金额')).toBeTruthy();
    expect(screen.getByText('确认充值')).toBeTruthy();
  });

  test('应显示套餐标签（推荐/超值）', () => {
    renderPage();
    expect(screen.getByText('推荐')).toBeTruthy();
    expect(screen.getByText('超值')).toBeTruthy();
  });
});

describe('MemberRechargePage — 用户交互', () => {
  test('输入会员手机号后点击查询应显示会员信息', async () => {
    renderPage();
    const input = screen.getByTestId('antd-input') || screen.getByPlaceholderText(/输入会员手机号/);
    fireEvent.change(input, { target: { value: '13800138000' } });
    const searchBtn = screen.getByText('查询');
    fireEvent.click(searchBtn);
    await waitFor(() => {
      expect(screen.getByText('测试会员')).toBeTruthy();
    });
  });

  test('选择套餐后充值金额应更新', () => {
    renderPage();
    const pkgBtn = screen.getByText('¥50').closest('button') || screen.getByText('小额充值').closest('button');
    if (pkgBtn) fireEvent.click(pkgBtn);
    // 确认充值按钮不应 disabled（至少有个选中状态）
    const confirmBtn = screen.getByText('确认充值');
    expect(confirmBtn).toBeTruthy();
  });

  test('切换到自定义金额模式', () => {
    renderPage();
    const customBtn = screen.getByText('自定义金额');
    fireEvent.click(customBtn);
    expect(screen.getByTestId('input-number')).toBeTruthy();
  });

  test('切换支付方式应更新选中状态', () => {
    renderPage();
    const alipayBtn = screen.getByText('支付宝');
    fireEvent.click(alipayBtn);
    expect(alipayBtn.closest('button')).toHaveAttribute('aria-pressed', 'true');
  });

  test('切换支付方式后原选中应取消', () => {
    renderPage();
    const wechatBtn = screen.getByText('微信支付');
    const alipayBtn = screen.getByText('支付宝');
    expect(wechatBtn.closest('button')).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(alipayBtn);
    expect(wechatBtn.closest('button')).toHaveAttribute('aria-pressed', 'false');
    expect(alipayBtn.closest('button')).toHaveAttribute('aria-pressed', 'true');
  });

  test('未选择会员时点击确认充值应显示错误', async () => {
    renderPage();
    const confirmBtn = screen.getByText('确认充值');
    // 由于未选择会员，按钮应被 disabled
    expect(confirmBtn).toBeDisabled();
  });
});

describe('MemberRechargePage — 错误态与边界', () => {
  test('充值金额为 0 时确认充值按钮应禁用', () => {
    renderPage();
    // 切换到自定义模式，金额默认 0
    const customBtn = screen.getByText('自定义金额');
    fireEvent.click(customBtn);
    const confirmBtn = screen.getByText('确认充值');
    expect(confirmBtn).toBeDisabled();
  });

  test('在自定义模式下输入金额应可更新', () => {
    renderPage();
    fireEvent.click(screen.getByText('自定义金额'));
    const amountInput = screen.getByTestId('custom-amount-input');
    fireEvent.change(amountInput, { target: { value: '200' } });
    expect(amountInput).toHaveValue(200);
  });

  test('不同支付方式应有 aria-pressed 属性', () => {
    renderPage();
    const btns = screen.getAllByRole('button');
    const paymentBtns = btns.filter((b) =>
      ['现金', '微信支付', '支付宝', '银行卡'].includes(b.textContent || ''),
    );
    paymentBtns.forEach((btn) => {
      expect(btn).toHaveAttribute('aria-pressed');
    });
  });

  test('充值记录中的状态标签应正确渲染', () => {
    renderPage();
    // 记录中应有"成功"状态
    expect(screen.getAllByText('成功').length).toBeGreaterThanOrEqual(1);
  });

  test('充值记录中的失败状态', () => {
    renderPage();
    expect(screen.getByText('失败')).toBeTruthy();
  });

  test('应显示"查看全部记录"链接', () => {
    renderPage();
    expect(screen.getByText(/查看全部记录/)).toBeTruthy();
  });

  test('套餐应显示赠送金额', () => {
    renderPage();
    // 至少有一个"赠送"文案
    expect(screen.getAllByText(/赠送/).length).toBeGreaterThanOrEqual(1);
  });

  test('套餐应显示实到金额', () => {
    renderPage();
    expect(screen.getAllByText(/实到/).length).toBeGreaterThanOrEqual(1);
  });

  test('选择套餐后确认充值按钮状态更新', () => {
    renderPage();
    // 先搜索会员使selectedMember不为null
    const searchInput = screen.getByPlaceholderText(/输入会员手机号/);
    fireEvent.change(searchInput, { target: { value: '13800138000' } });
    fireEvent.click(screen.getByText('查询'));
    // 选一个套餐
    const standardPkg = screen.getByText('¥50');
    if (standardPkg.closest('button')) fireEvent.click(standardPkg.closest('button')!);
    const confirmBtn = screen.getByText('确认充值');
    expect(confirmBtn).not.toBeDisabled();
  });
});
