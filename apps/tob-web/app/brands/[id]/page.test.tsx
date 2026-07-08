/**
 * brands/[id]/page.test.tsx — 品牌详情页单元测试
 */
import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock next/navigation
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useParams: () => ({ id: 'br-001' }),
  useRouter: () => ({ push: mockPush }),
}));

// Mock @m5/ui components that might use next/link
jest.mock('@m5/ui', () => {
  const actual = jest.requireActual('@m5/ui');
  return {
    ...actual,
    DetailClosureBar: ({ links }: { links: { key: string; title: string; subtitle?: string; href: string }[] }) => (
      <div data-testid="detail-closure-bar">
        {links.map((l) => (
          <a key={l.key} href={l.href} data-testid={`closure-link-${l.key}`}>
            {l.title}
          </a>
        ))}
      </div>
    ),
  };
});

describe('BrandDetailPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders brand info for a valid brand ID', async () => {
    const Page = (await import('./page')).default;
    render(<Page />);

    // Title should contain brand name
    expect(screen.getByText(/品牌详情/)).toBeInTheDocument();

    // Key info fields should render
    expect(screen.getByText('健康烘焙坊')).toBeInTheDocument();
    expect(screen.getByText('demo-tenant')).toBeInTheDocument();
    expect(screen.getByText('已开通')).toBeInTheDocument();
    expect(screen.getByText('餐饮')).toBeInTheDocument();
    expect(screen.getByText('2025-01-15')).toBeInTheDocument();
    expect(screen.getByText('12 家')).toBeInTheDocument();
    expect(screen.getByText('¥850.0万')).toBeInTheDocument();
  });

  it('shows empty state when brand ID does not exist', async () => {
    jest.spyOn(require('next/navigation'), 'useParams').mockReturnValue({ id: 'non-existent' });

    const Page = (await import('./page')).default;
    render(<Page />);

    expect(screen.getByText('未找到品牌')).toBeInTheDocument();
  });

  it('displays all action buttons', async () => {
    const Page = (await import('./page')).default;
    render(<Page />);

    // Active brand '健康烘焙坊' should have edit + suspend + archive + delete buttons
    expect(screen.getByText('✏️ 编辑')).toBeInTheDocument();
    expect(screen.getByText(/暂停.*已暂停/)).toBeInTheDocument();
    expect(screen.getByText(/归档.*已归档/)).toBeInTheDocument();
    expect(screen.getByText('🗑️ 删除')).toBeInTheDocument();
  });

  it('can transition status from active to suspended', async () => {
    const Page = (await import('./page')).default;
    render(<Page />);

    const suspendBtn = screen.getByText(/暂停.*已暂停/);
    fireEvent.click(suspendBtn);

    await waitFor(() => {
      // Toast should appear
      expect(screen.getByText(/品牌状态已变更为/)).toBeInTheDocument();
    });

    // Status badge should now show '已暂停'
    await waitFor(() => {
      expect(screen.getByText('已暂停')).toBeInTheDocument();
    });
  });

  it('can transition status from active to archived', async () => {
    const Page = (await import('./page')).default;
    render(<Page />);

    const archiveBtn = screen.getByText(/归档.*已归档/);
    fireEvent.click(archiveBtn);

    await waitFor(() => {
      expect(screen.getByText(/品牌状态已变更为/)).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByText('已归档')).toBeInTheDocument();
    });
  });

  it('shows delete confirmation dialog', async () => {
    const Page = (await import('./page')).default;
    render(<Page />);

    const deleteBtn = screen.getByText('🗑️ 删除');
    fireEvent.click(deleteBtn);

    // Confirm dialog should appear
    expect(screen.getByText('确认删除')).toBeInTheDocument();
    expect(screen.getByText(/确定要删除品牌/)).toBeInTheDocument();
  });

  it('can delete a brand', async () => {
    const Page = (await import('./page')).default;
    render(<Page />);

    // Click delete button
    const deleteBtn = screen.getByText('🗑️ 删除');
    fireEvent.click(deleteBtn);

    // Confirm deletion
    const confirmBtn = screen.getByText('确认删除');
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(screen.getByText('已删除')).toBeInTheDocument();
    });

    // Should navigate back to brands list after timeout
    act(() => {
      jest.advanceTimersByTime(2000);
    });

    expect(mockPush).toHaveBeenCalledWith('/brands');
  });

  it('renders closure bar with back link', async () => {
    const Page = (await import('./page')).default;
    render(<Page />);

    expect(screen.getByTestId('closure-link-back-to-brands')).toHaveAttribute('href', '/brands');
  });

  it('shows toast on edit action', async () => {
    const Page = (await import('./page')).default;
    render(<Page />);

    const editBtn = screen.getByText('✏️ 编辑');
    fireEvent.click(editBtn);

    expect(screen.getByText(/编辑入口已触发/)).toBeInTheDocument();
  });
});
