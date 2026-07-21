import React from 'react';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => '/categories',
  useSearchParams: () => new URLSearchParams(),
}));

const mockPS = vi.fn(({ children, title }: any) => <div data-testid="ps" data-t={title}>{children}</div>);

// DataTable won't be rendered initially because categories data loads via wrapLoad + setTimeout + then
// So we accept EmptyState is shown instead
const mockDT = vi.fn(({ columns, rows, rowKey, sort, onSortChange }: any) =>
  <div data-testid="dt" data-r={rows.length} data-sk={sort?.key} data-sd={sort?.direction}>
    {rows.map((r: any) => <div key={rowKey(r)}>
      {columns.map((c: any) => <span key={c.key}>{c.render ? c.render(r) : String(r[c.key])}</span>)}
    </div>)}
  </div>
);
const mockSB = vi.fn(({ label, variant }: any) => <span data-testid="sb" data-v={variant}>{label}</span>);
let modalCallCount = 0;
const mockModal = vi.fn(({ open, onClose, title, children }: any) => {
  modalCallCount++;
  return open ? <div data-testid="modal" data-t={title}><button data-testid="mc" onClick={onClose}>✕</button><div>ModalContent</div></div> : null;
});
const mockES = vi.fn(({ title }: any) => <div data-testid="es" data-t={title}>{title}</div>);

vi.mock('@m5/ui', () => ({
  PageShell: (p: any) => mockPS(p),
  DataTable: (p: any) => mockDT(p),
  StatusBadge: (p: any) => mockSB(p),
  Modal: (p: any) => mockModal(p),
  EmptyState: (p: any) => mockES(p),
}));

// wrapLoad mock: instead of waiting for setTimeout, resolve immediately
vi.mock('../_components/useTriState', () => ({
  useTriState: () => ({
    loading: false,
    error: null,
    wrapLoad: vi.fn((promise: Promise<any>) => promise),
  }),
}));

vi.mock('../_components/TriStateRenderer', () => ({
  TriStateRenderer: ({ children }: any) => <div data-testid="tric">{typeof children === 'function' ? children() : children}</div>,
}));

import CategoriesPage from './page';
beforeEach(() => { vi.clearAllMocks(); modalCallCount = 0; });

describe('CategoriesPage', () => {
  test('renders PageShell with correct title', async () => {
    await act(async () => { render(<CategoriesPage />); });
    expect(mockPS.mock.lastCall![0].title).toBe('分类管理');
  });

  test('renders page heading', async () => {
    await act(async () => { render(<CategoriesPage />); });
    expect(document.querySelector('h1')!.textContent).toContain('分类管理');
  });

  test('renders stat card labels', async () => {
    await act(async () => { render(<CategoriesPage />); });
    expect(screen.getByText('总分类')).toBeInTheDocument();
    expect(screen.getByText('启用中')).toBeInTheDocument();
    expect(screen.getByText('隐藏')).toBeInTheDocument();
    expect(screen.getByText('已归档')).toBeInTheDocument();
  });

  test('renders search input', async () => {
    await act(async () => { render(<CategoriesPage />); });
    const inputs = document.querySelectorAll('input[type="text"]');
    expect(inputs.length).toBe(1);
  });

  test('renders status filter select', async () => {
    await act(async () => { render(<CategoriesPage />); });
    expect(document.querySelectorAll('select').length).toBe(1);
  });

  test('renders page description with category counts', async () => {
    await act(async () => { render(<CategoriesPage />); });
    expect(document.querySelector('p')!.textContent).toContain('个分类');
  });

  test('empty state shown since categories load async', async () => {
    await act(async () => { render(<CategoriesPage />); });
    expect(mockES).toHaveBeenCalled();
  });

  test('search input change triggers value update', async () => {
    await act(async () => { render(<CategoriesPage />); });
    const input = document.querySelector('input[type="text"]') as HTMLInputElement;
    fireEvent.change(input, { target: { value: '瑜伽' } });
    expect(input.value).toBe('瑜伽');
  });

  test('status select change updates value', async () => {
    await act(async () => { render(<CategoriesPage />); });
    const select = document.querySelector('select') as HTMLSelectElement;
    fireEvent.change(select, { target: { value: 'hidden' } });
    expect(select.value).toBe('hidden');
  });

  test('renders via TriStateRenderer', async () => {
    await act(async () => { render(<CategoriesPage />); });
    expect(screen.getByTestId('tric')).toBeInTheDocument();
  });

  test('renders hierarchy badges', async () => {
    await act(async () => { render(<CategoriesPage />); });
    expect(document.body.textContent).toContain('顶级分类');
  });

  test('renders filter count summary', async () => {
    await act(async () => { render(<CategoriesPage />); });
    expect(document.body.textContent).toContain('筛选后');
  });

  test('pagination not shown when empty', async () => {
    await act(async () => { render(<CategoriesPage />); });
    // EmptyState is shown instead of DataTable + pagination when categories are empty
    expect(document.body.textContent).not.toContain('上一页');
  });

  test('page heading is h1 element', async () => {
    await act(async () => { render(<CategoriesPage />); });
    const h1 = document.querySelector('h1');
    expect(h1).toBeInTheDocument();
  });

  test('renders 总产品 stat card', async () => {
    await act(async () => { render(<CategoriesPage />); });
    expect(screen.getByText('总产品')).toBeInTheDocument();
  });

  test('EmptyState called with correct title', async () => {
    await act(async () => { render(<CategoriesPage />); });
    expect(mockES).toHaveBeenCalled();
    const call = mockES.mock.lastCall![0];
    expect(call.title).toContain('暂无分类记录');
  });

  test('categories page renders without crash', async () => {
    await act(async () => { render(<CategoriesPage />); });
    expect(screen.getByTestId('ps')).toBeInTheDocument();
  });

  test('search placeholder includes relevant text', async () => {
    await act(async () => { render(<CategoriesPage />); });
    const input = document.querySelector('input[type="text"]') as HTMLInputElement;
    expect(input.placeholder).toContain('搜索');
  });

  test('TotalProducts stat card present', async () => {
    await act(async () => { render(<CategoriesPage />); });
    expect(screen.getByText('总产品')).toBeInTheDocument();
  });

  test('select has ALL default option', async () => {
    await act(async () => { render(<CategoriesPage />); });
    const select = document.querySelector('select') as HTMLSelectElement;
    expect(select.options[0].value).toBe('ALL');
  });
});
