/**
 * member-recharge/page.vitest.tsx — 会员充值页 测试增强
 *
 * 覆盖：渲染、用户交互、错误态、边界场景
 * 使用 vitest + @testing-library/react
 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, test, expect, vi } from 'vitest';

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
  Button: ({ children, onClick, variant, size, disabled }: any) => (
    <button data-testid={`btn-${variant || 'default'}`} onClick={onClick} disabled={disabled}>
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
        <button data-testid="modal-close" onClick={onClose}>取消</button>
      </div>
    ) : null,
}));

import MemberRechargePage from './page';

const renderPage = () => render(<MemberRechargePage />);

// ── 测试套件 ──

describe('MemberRechargePage — 渲染', () => {
  test('应正确渲染 PageShell', () => {
    renderPage();
    expect(screen.getByTestId('page-shell')).toHaveAttribute('data-title', '会员充值');
  });

  test('应渲染三步流程卡片', () => {
    renderPage();
    const titles = screen.getAllByTestId('card-title');
    expect(titles.some(t => t.textContent === '1. 选择会员')).toBe(true);
    expect(titles.some(t => t.textContent === '2. 选择充值金额')).toBe(true);
    expect(titles.some(t => t.textContent === '3. 选择支付方式')).toBe(true);
  });

  test('应渲染统计概览 3 项指标', () => {
    renderPage();
    const labels = screen.getAllByTestId('stat-label');
    expect(labels.length).toBe(3);
    expect(screen.getByText('今日充值总额')).toBeTruthy();
    expect(screen.getByText('今日充值笔数')).toBeTruthy();
    expect(screen.getByText('本月新增充值会员')).toBeTruthy();
  });

  test('应渲染四种支付方式按钮', () => {
    renderPage();
    expect(screen.getByText('现金')).toBeTruthy();
    expect(screen.getByText('微信支付')).toBeTruthy();
    expect(screen.getByText('支付宝')).toBeTruthy();
    expect(screen.getByText('银行卡')).toBeTruthy();
  });

  test('应默认选中微信支付', () => {
    renderPage();
    expect(screen.getByText('微信支付').closest('button')).toHaveAttribute('aria-pressed', 'true');
  });

  test('应渲染最近充值记录卡片', () => {
    renderPage();
    const titles = screen.getAllByTestId('card-title');
    expect(titles.some(t => t.textContent === '最近充值记录')).toBe(true);
  });

  test('最近充值记录显示 5 条会员数据', () => {
    renderPage();
    expect(screen.getByText('张三')).toBeTruthy();
    expect(screen.getByText('李四')).toBeTruthy();
    expect(screen.getByText('王五')).toBeTruthy();
    expect(screen.getByText('赵六')).toBeTruthy();
    expect(screen.getByText('孙七')).toBeTruthy();
  });

  test('应显示充值金额合计区域', () => {
    renderPage();
    expect(screen.getByText('充值金额')).toBeTruthy();
    expect(screen.getByText('确认充值')).toBeTruthy();
  });

  test('充值套餐中应显示推荐和超值标签', () => {
    renderPage();
    expect(screen.getByText('推荐')).toBeTruthy();
    expect(screen.getByText('超值')).toBeTruthy();
  });

  test('应显示"查看全部记录"链接', () => {
    renderPage();
    expect(screen.getByText(/查看全部记录/)).toBeTruthy();
  });

  test('应包含会员搜索输入框和查询按钮', () => {
    renderPage();
    expect(screen.getByPlaceholderText(/输入会员手机号/)).toBeTruthy();
    expect(screen.getByText('查询')).toBeTruthy();
  });

  test('充值套餐模式切换按钮充值套餐/自定义金额', () => {
    renderPage();
    expect(screen.getByText('充值套餐')).toBeTruthy();
    expect(screen.getByText('自定义金额')).toBeTruthy();
  });
});

describe('MemberRechargePage — 用户交互', () => {
  test('搜索会员后应显示会员卡片', async () => {
    renderPage();
    const input = screen.getByPlaceholderText(/输入会员手机号/);
    fireEvent.change(input, { target: { value: '13800138000' } });
    fireEvent.click(screen.getByText('查询'));
    await waitFor(() => {
      expect(screen.getByText('测试会员')).toBeTruthy();
    });
  });

  test('选择套餐按钮应触发视觉高亮', () => {
    renderPage();
    // 点击选择第一个套餐（¥50）
    const pkgBtns = screen.getAllByText(/¥50/);
    if (pkgBtns.length > 0) {
      const btn = pkgBtns[0].closest('button');
      if (btn) {
        fireEvent.click(btn);
        expect(btn.className).toContain('border-blue');
      }
    }
  });

  test('切换到自定义金额模式', () => {
    renderPage();
    fireEvent.click(screen.getByText('自定义金额'));
    expect(screen.getByTestId('input-number')).toBeTruthy();
  });

  test('自定义金额输入应可更新', () => {
    renderPage();
    fireEvent.click(screen.getByText('自定义金额'));
    const amountInput = screen.getByTestId('custom-amount-input');
    fireEvent.change(amountInput, { target: { value: '200' } });
    expect(amountInput).toHaveValue(200);
  });

  test('切换支付方式应更新 aria-pressed', () => {
    renderPage();
    const alipayBtn = screen.getByText('支付宝');
    fireEvent.click(alipayBtn);
    expect(alipayBtn.closest('button')).toHaveAttribute('aria-pressed', 'true');
  });

  test('切换支付方式后原选中应取消', () => {
    renderPage();
    const wechatBtn = screen.getByText('微信支付');
    const alipayBtn = screen.getByText('支付宝');
    fireEvent.click(alipayBtn);
    expect(wechatBtn.closest('button')).toHaveAttribute('aria-pressed', 'false');
  });

  test('未选择会员时确认充值按钮应被禁用', () => {
    renderPage();
    expect(screen.getByText('确认充值')).toBeDisabled();
  });

  test('选择会员后确认充值按钮应可用', async () => {
    renderPage();
    const input = screen.getByPlaceholderText(/输入会员手机号/);
    fireEvent.change(input, { target: { value: '13800138000' } });
    fireEvent.click(screen.getByText('查询'));
    await waitFor(() => {
      expect(screen.getByText('测试会员')).toBeTruthy();
    });
    // 选择一个套餐
    const pkgBtns = screen.getAllByText(/¥50/);
    if (pkgBtns.length > 0) {
      const btn = pkgBtns[0].closest('button');
      if (btn) fireEvent.click(btn);
    }
    expect(screen.getByText('确认充值')).not.toBeDisabled();
  });
});

describe('MemberRechargePage — 错误态与边界', () => {
  test('充值金额为 0 时确认充值按钮应禁用', () => {
    renderPage();
    expect(screen.getByText('确认充值')).toBeDisabled();
  });

  test('所有支付方式都有 aria-pressed 属性', () => {
    renderPage();
    ['现金', '微信支付', '支付宝', '银行卡'].forEach(method => {
      const btn = screen.getByText(method).closest('button');
      expect(btn).toHaveAttribute('aria-pressed');
    });
  });

  test('充值记录中应有成功/失败/处理中状态', () => {
    renderPage();
    expect(screen.getAllByText('成功').length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText('失败')).toBeTruthy();
    expect(screen.getByText('处理中')).toBeTruthy();
  });

  test('套餐显示赠送金额', () => {
    renderPage();
    expect(screen.getAllByText(/赠送/).length).toBe(4);
  });

  test('套餐显示实到金额', () => {
    renderPage();
    expect(screen.getAllByText(/实到/).length).toBe(4);
  });
});
