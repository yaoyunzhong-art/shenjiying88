/**
 * store-manager/page.vitest.tsx — 门店管理页 L2 组件测试 (vitest + @testing-library/react)
 * 覆盖: 渲染 · 数据展示 · 表单字段 · 营业状态 · 统计卡片 · JSON-LD · 安全提示 · 边界
 * 角色: 👔店长
 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach } from 'vitest';

// Mock @m5/ui components
vi.mock('@m5/ui', () => ({
  LoadingSkeleton: ({ variant, rows, label }: any) => (
    <div data-testid="loading-skeleton" data-variant={variant} data-rows={rows}>
      {label && <span>{label}</span>}
    </div>
  ),
  EmptyState: ({ title, description, actionLabel, actionHref }: any) => (
    <div data-testid="empty-state">
      <h3>{title}</h3>
      <p>{description}</p>
      {actionLabel && <a href={actionHref}>{actionLabel}</a>}
    </div>
  ),
  ErrorBoundary: ({ children, fallback }: any) => <>{children}</>,
}));

import StoreManagerPage from './page';

describe('StoreManagerPage — 门店管理', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ====== 正例: 渲染 ======

  test('renders without crashing', () => {
    expect(() => render(<StoreManagerPage />)).not.toThrow();
  });

  test('renders page title 门店管理', () => {
    render(<StoreManagerPage />);
    expect(screen.getByText('门店管理')).toBeInTheDocument();
  });

  test('renders page subtitle', () => {
    render(<StoreManagerPage />);
    expect(screen.getByText('管理门店基本信息、营业状态与营业时间')).toBeInTheDocument();
  });

  test('renders store name 神机营电竞乐园', () => {
    render(<StoreManagerPage />);
    expect(screen.getByText('神机营电竞乐园 · 旗舰店')).toBeInTheDocument();
  });

  test('renders 营业中 status badge', () => {
    render(<StoreManagerPage />);
    const statusOptions = screen.getAllByText('营业中');
    expect(statusOptions.length).toBeGreaterThanOrEqual(2);
  });

  test('renders store address input with correct value', () => {
    render(<StoreManagerPage />);
    const addressInput = screen.getByDisplayValue('北京市朝阳区建国路88号');
    expect(addressInput).toBeInTheDocument();
    expect(addressInput).toBeDisabled();
  });

  test('renders store phone input', () => {
    render(<StoreManagerPage />);
    const phoneInput = screen.getByDisplayValue('010-88886666');
    expect(phoneInput).toBeInTheDocument();
  });

  test('renders business hours input', () => {
    render(<StoreManagerPage />);
    const hoursInput = screen.getByDisplayValue('10:00-22:00');
    expect(hoursInput).toBeInTheDocument();
    expect(hoursInput).toBeDisabled();
  });

  test('renders emergency contact input', () => {
    render(<StoreManagerPage />);
    const contactInput = screen.getByDisplayValue('张经理 138-0000-0000');
    expect(contactInput).toBeInTheDocument();
  });

  test('renders 保存修改 button', () => {
    render(<StoreManagerPage />);
    expect(screen.getByText('保存修改')).toBeInTheDocument();
  });

  // ====== 正例: 统计卡片 ======

  test('renders 门店编号 stat', () => {
    render(<StoreManagerPage />);
    expect(screen.getByText('BJ-CBD-001')).toBeInTheDocument();
    expect(screen.getByText('门店编号')).toBeInTheDocument();
  });

  test('renders 开业日期 stat', () => {
    render(<StoreManagerPage />);
    expect(screen.getByText('2025-06-01')).toBeInTheDocument();
    expect(screen.getByText('开业日期')).toBeInTheDocument();
  });

  test('renders 营业面积 stat', () => {
    render(<StoreManagerPage />);
    expect(screen.getByText('580㎡')).toBeInTheDocument();
    expect(screen.getByText('营业面积')).toBeInTheDocument();
  });

  test('renders 今日已营业 stat', () => {
    render(<StoreManagerPage />);
    expect(screen.getByText(/h$/)).toBeInTheDocument();
    expect(screen.getByText('今日已营业')).toBeInTheDocument();
  });

  // ====== 营业状态切换 ======

  test('renders 3 status options', () => {
    render(<StoreManagerPage />);
    // Status options render both in the badge and in the selector — verify existence of each
    const activeOptions = screen.getAllByText('营业中');
    const maintenanceOptions = screen.getAllByText('维护中');
    const closedOptions = screen.getAllByText('已关闭');
    expect(activeOptions.length).toBeGreaterThanOrEqual(1);
    expect(maintenanceOptions.length).toBeGreaterThanOrEqual(1);
    expect(closedOptions.length).toBeGreaterThanOrEqual(1);
  });

  test('status options have clickable style (cursor pointer)', () => {
    render(<StoreManagerPage />);
    const statusItems = screen.getAllByText(/营业中|维护中|已关闭/);
    const clickableItems = statusItems.filter(el => el.style.cursor === 'pointer');
    expect(clickableItems.length).toBe(3);
  });

  // ====== JSON-LD ======

  test('includes JSON-LD structured data', () => {
    render(<StoreManagerPage />);
    const scripts = document.querySelectorAll('script[type="application/ld+json"]');
    expect(scripts.length).toBeGreaterThanOrEqual(1);
    const jsonld = JSON.parse(scripts[0]!.innerHTML);
    expect(jsonld['@context']).toBe('https://schema.org');
    expect(jsonld['@type']).toBe('Store');
  });

  test('JSON-LD contains store name', () => {
    render(<StoreManagerPage />);
    const script = document.querySelector('script[type="application/ld+json"]');
    const jsonld = JSON.parse(script!.innerHTML);
    expect(jsonld.name).toContain('神机营电竞乐园');
  });

  test('JSON-LD contains address', () => {
    render(<StoreManagerPage />);
    const script = document.querySelector('script[type="application/ld+json"]');
    const jsonld = JSON.parse(script!.innerHTML);
    expect(jsonld.address['@type']).toBe('PostalAddress');
    expect(jsonld.address.streetAddress).toContain('建国路88号');
  });

  test('JSON-LD contains telephone', () => {
    render(<StoreManagerPage />);
    const script = document.querySelector('script[type="application/ld+json"]');
    const jsonld = JSON.parse(script!.innerHTML);
    expect(jsonld.telephone).toBe('010-88886666');
  });

  test('JSON-LD contains openingHours', () => {
    render(<StoreManagerPage />);
    const script = document.querySelector('script[type="application/ld+json"]');
    const jsonld = JSON.parse(script!.innerHTML);
    expect(jsonld.openingHours).toContain('10:00-22:00');
  });

  // ====== 安全提示 ======

  test('renders safety notice', () => {
    render(<StoreManagerPage />);
    expect(screen.getByText('安全提示')).toBeInTheDocument();
  });

  test('safety notice mentions 维护中 and 暂停营业', () => {
    render(<StoreManagerPage />);
    // Find text inside the safety notice section
    const safetySection = screen.getByText('安全提示').closest('div');
    expect(safetySection!.textContent).toMatch(/维护中/);
    expect(safetySection!.textContent).toMatch(/暂停营业/);
  });

  // ====== 表单交互 ======

  test('store name input is editable', () => {
    render(<StoreManagerPage />);
    const nameInput = screen.getByDisplayValue('神机营电竞乐园 · 旗舰店');
    fireEvent.change(nameInput, { target: { value: '测试门店' } });
    expect(nameInput).toHaveValue('测试门店');
  });

  test('phone input is editable', () => {
    render(<StoreManagerPage />);
    const phoneInput = screen.getByDisplayValue('010-88886666');
    fireEvent.change(phoneInput, { target: { value: '010-99990000' } });
    expect(phoneInput).toHaveValue('010-99990000');
  });

  test('emergency contact input is editable', () => {
    render(<StoreManagerPage />);
    const contactInput = screen.getByDisplayValue('张经理 138-0000-0000');
    fireEvent.change(contactInput, { target: { value: '李经理 139-0000-0000' } });
    expect(contactInput).toHaveValue('李经理 139-0000-0000');
  });

  test('address input is disabled (readonly)', () => {
    render(<StoreManagerPage />);
    const addressInput = screen.getByDisplayValue('北京市朝阳区建国路88号');
    expect(addressInput).toBeDisabled();
  });

  test('hours input is disabled (readonly)', () => {
    render(<StoreManagerPage />);
    const hoursInput = screen.getByDisplayValue('10:00-22:00');
    expect(hoursInput).toBeDisabled();
  });

  // ====== 边界 ======

  test('form labels exist for all fields', () => {
    render(<StoreManagerPage />);
    expect(screen.getByText('门店名称')).toBeInTheDocument();
    expect(screen.getByText('地址')).toBeInTheDocument();
    expect(screen.getByText('联系电话')).toBeInTheDocument();
    expect(screen.getByText('营业时间')).toBeInTheDocument();
    expect(screen.getByText('紧急联系人')).toBeInTheDocument();
    expect(screen.getByText('营业状态')).toBeInTheDocument();
  });

  test('dark theme background applied', () => {
    render(<StoreManagerPage />);
    // The main card container has background with rgba
    const cardElements = document.querySelectorAll('[style*="background: rgba(15, 23, 42, 0.8)"]');
    expect(cardElements.length).toBeGreaterThanOrEqual(1);
  });

  test('save button has gradient background', () => {
    render(<StoreManagerPage />);
    const saveBtn = screen.getByText('保存修改');
    expect(saveBtn).toHaveStyle('background: linear-gradient(135deg, #f59e0b, #d97706)');
  });
});
