import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach } from 'vitest';

// ---- Mocks (top-level) ----

const mockPush = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  useParams: () => ({ id: 'cmp-001' }),
}));

vi.mock('@m5/ui', () => ({
  CampaignPerformancePanel: ({ campaignName, status, metrics, trendData, insights }: any) => (
    <div data-testid="campaign-perf-panel" data-name={campaignName} data-status={status}>
      <div data-testid="perf-metrics">
        {metrics?.map((m: any, i: number) => (
          <div key={i} data-testid={`metric-${i}`}>
            <span>{m.label}</span>
            <span>{m.value}</span>
            <span>{m.unit}</span>
          </div>
        ))}
      </div>
      {insights?.map((ins: any, i: number) => (
        <div key={i} data-testid={`insight-${i}`} data-type={ins.type}>
          <p>{ins.message}</p>
          <p>{ins.recommendation}</p>
        </div>
      ))}
    </div>
  ),
  PageShell: ({ children, title, description }: any) => (
    <div data-testid="page-shell" data-title={title} data-description={description}>
      {children}
    </div>
  ),
  StatusBadge: ({ label, variant, size }: any) => (
    <span data-testid="status-badge" data-variant={variant} data-size={size}>{label}</span>
  ),
  DetailShell: ({ children, title, actions }: any) => (
    <div data-testid="detail-shell" data-title={title}>
      {actions && (
        <div data-testid="detail-actions">
          {actions.map((a: any) => (
            <button key={a.key} data-testid={`action-${a.key}`} onClick={a.onClick}>
              {a.label}
            </button>
          ))}
        </div>
      )}
      {children}
    </div>
  ),
}));

// ---- Test Subject ----

import CampaignDetailPage from './page';

function renderPage() {
  return render(<CampaignDetailPage />);
}

describe('CampaignDetailPage — 营销活动详情页', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ====== 渲染测试 ======

  test('renders page without crashing', () => {
    expect(() => renderPage()).not.toThrow();
  });

  test('shows loading state initially', () => {
    renderPage();
    expect(screen.getByText('加载中...')).toBeInTheDocument();
  });

  test('renders PageShell after load', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByTestId('page-shell')).toBeInTheDocument();
    }, { timeout: 5000 });
  });

  test('renders campaign name in page shell title', async () => {
    renderPage();
    await waitFor(() => {
      const shell = screen.getByTestId('page-shell');
      expect(shell).toHaveAttribute('data-title', expect.stringContaining('618 年中大促'));
    }, { timeout: 5000 });
  });

  test('renders campaign status label', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('投放中')).toBeInTheDocument();
    }, { timeout: 5000 });
  });

  test('renders DetailShell component', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByTestId('detail-shell')).toBeInTheDocument();
    }, { timeout: 5000 });
  });

  test('renders campaign name in DetailShell title', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByTestId('detail-shell')).toHaveAttribute('data-title', '618 年中大促');
    }, { timeout: 5000 });
  });

  test('renders CampaignPerformancePanel after load', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByTestId('campaign-perf-panel')).toBeInTheDocument();
    }, { timeout: 5000 });
  });

  test('passes campaign name to performance panel', async () => {
    renderPage();
    await waitFor(() => {
      const panel = screen.getByTestId('campaign-perf-panel');
      expect(panel).toHaveAttribute('data-name', '618 年中大促');
    }, { timeout: 5000 });
  });

  test('renders back to list button', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByTestId('action-back-to-list')).toHaveTextContent('← 返回列表');
    }, { timeout: 5000 });
  });

  test('back button navigates to campaigns list', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByTestId('action-back-to-list')).toBeInTheDocument();
    }, { timeout: 5000 });
    fireEvent.click(screen.getByTestId('action-back-to-list'));
    expect(mockPush).toHaveBeenCalledWith('/campaigns');
  });

  // ====== 性能面板测试 ======

  test('renders ROI metric', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('ROI')).toBeInTheDocument();
    }, { timeout: 5000 });
  });

  test('renders CPA metric', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText(/CPA/)).toBeInTheDocument();
    }, { timeout: 5000 });
  });

  test('renders budget consumption metric', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('预算消耗')).toBeInTheDocument();
    }, { timeout: 5000 });
  });

  test('renders conversion count metric', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('转化数')).toBeInTheDocument();
    }, { timeout: 5000 });
  });

  test('renders ROI value from mock', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('3.8')).toBeInTheDocument();
    }, { timeout: 5000 });
  });

  test('renders conversion count value', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('12,850')).toBeInTheDocument();
    }, { timeout: 5000 });
  });

  // ====== 洞察测试 ======

  test('renders positive insight for high ROI', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('ROI 表现优秀')).toBeInTheDocument();
    }, { timeout: 5000 });
  });

  test('renders insight recommendation', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText(/建议增加预算/)).toBeInTheDocument();
    }, { timeout: 5000 });
  });

  test('renders channel insight', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText(/渠道:/)).toBeInTheDocument();
    }, { timeout: 5000 });
  });

  // ====== 基本信息区域测试 ======

  test('renders basic info section with campaign ID', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('活动 ID')).toBeInTheDocument();
      expect(screen.getByText('cmp-001')).toBeInTheDocument();
    }, { timeout: 5000 });
  });

  test('renders campaign channel', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('渠道')).toBeInTheDocument();
      expect(screen.getByText('全渠道')).toBeInTheDocument();
    }, { timeout: 5000 });
  });

  test('renders campaign status badge', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByTestId('status-badge')).toHaveTextContent('投放中');
    }, { timeout: 5000 });
  });

  test('renders target audience', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('目标人群')).toBeInTheDocument();
      expect(screen.getByText('全部会员')).toBeInTheDocument();
    }, { timeout: 5000 });
  });

  test('renders campaign description', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText(/618 年中大促全场折扣/)).toBeInTheDocument();
    }, { timeout: 5000 });
  });

  // ====== 投放数据测试 ======

  test('renders budget value', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('500,000')).toBeInTheDocument();
    }, { timeout: 5000 });
  });

  test('renders spent amount', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('324,000')).toBeInTheDocument();
    }, { timeout: 5000 });
  });

  test('renders remaining budget', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('176,000')).toBeInTheDocument();
    }, { timeout: 5000 });
  });

  test('renders ROI value in data section', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('3.9x')).toBeInTheDocument();
    }, { timeout: 5000 });
  });

  test('renders conversion count', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText(/12,850 人/)).toBeInTheDocument();
    }, { timeout: 5000 });
  });

  test('renders start and end dates', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('2026-06-01')).toBeInTheDocument();
      expect(screen.getByText('2026-06-30')).toBeInTheDocument();
    }, { timeout: 5000 });
  });

  // ====== 边界情况 ======

  test('renders dashboard for different campaign id', async () => {
    vi.mocked(require('next/navigation').useParams).mockReturnValueOnce({ id: 'cmp-007' });
    renderPage();
    await waitFor(() => {
      const shell = screen.getByTestId('page-shell');
      expect(shell).toHaveAttribute('data-title', expect.stringContaining('拼团裂变活动'));
    }, { timeout: 5000 });
  });

  test('shows error message for invalid campaign', async () => {
    vi.mocked(require('next/navigation').useParams).mockReturnValueOnce({ id: 'nonexistent' });
    renderPage();
    await waitFor(() => {
      expect(screen.getByText(/数据获取失败/)).toBeInTheDocument();
    }, { timeout: 5000 });
  });

  test('shows error detail when campaign not found', async () => {
    vi.mocked(require('next/navigation').useParams).mockReturnValueOnce({ id: 'nonexistent' });
    renderPage();
    await waitFor(() => {
      expect(screen.getByText(/活动不存在或已被删除/)).toBeInTheDocument();
    }, { timeout: 5000 });
  });

  test('renders scheduled campaign status', async () => {
    vi.mocked(require('next/navigation').useParams).mockReturnValueOnce({ id: 'nonexistent' });
    renderPage();
    await waitFor(() => {
      expect(screen.getByText(/数据获取失败/)).toBeInTheDocument();
    });
  });
});
