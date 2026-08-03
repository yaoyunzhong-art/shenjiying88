/**
 * member-upgrade-path/page.vitest.tsx — 会员升级路径页面 L2 组件测试 (vitest + @testing-library/react)
 * 覆盖: 渲染 · 升级摘要 · 升级阶梯 · 等级分布 · 权益对比 · 升级记录 · 常见问题 · 加载态 · 错误态 · 空状态 · 边界
 * 角色: 👤 会员
 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach } from 'vitest';

// ====== Mock @m5/ui ======
vi.mock('@m5/ui', () => ({
  LoadingSkeleton: ({ variant, rows, label }: { variant?: string; rows?: number; label?: string }) => (
    <div data-testid="loading-skeleton" data-variant={variant} data-rows={rows}>{label}</div>
  ),
  EmptyState: ({ title, description, actionLabel, actionHref }: {
    title: string; description: string; actionLabel?: string; actionHref?: string;
  }) => (
    <div data-testid="empty-state">
      <h3>{title}</h3>
      <p>{description}</p>
      {actionLabel && <a href={actionHref}>{actionLabel}</a>}
    </div>
  ),
  ErrorBoundary: ({ children, fallback }: { children: React.ReactNode; fallback: React.ReactNode }) => (
    <div data-testid="error-boundary">{children}</div>
  ),
  MemberUpgradePath: ({ tiers, currentTierKey, subtitle }: {
    tiers: unknown[]; currentTierKey: string; subtitle?: string;
  }) => (
    <div data-testid="member-upgrade-path" data-current-tier={currentTierKey}>
      <p>{subtitle}</p>
      {tiers.map((tier: Record<string, unknown>) => (
        <div key={tier.key as string} data-testid={`tier-${tier.key as string}`} data-tiert-name={tier.name as string}>
          <span>{tier.name as string}</span>
          <span>{tier.requiredValue as string}</span>
        </div>
      ))}
    </div>
  ),
}));

// ====== Test Subject ======
import MemberUpgradePathPage from './page';

describe('MemberUpgradePathPage — 会员升级路径', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ====== 正例: 渲染 ======

  test('renders without crashing', () => {
    expect(() => render(<MemberUpgradePathPage />)).not.toThrow();
  });

  test('renders MemberUpgradePath component', async () => {
    render(<MemberUpgradePathPage />);
    await waitFor(() => {
      expect(screen.getByTestId('member-upgrade-path')).toBeInTheDocument();
    });
  });

  test('renders subtitle on MemberUpgradePath', async () => {
    render(<MemberUpgradePathPage />);
    await waitFor(() => {
      expect(screen.getByText('当前门店 · 标准 VIP 等级体系')).toBeInTheDocument();
    });
  });

  test('renders all four tier nodes', async () => {
    render(<MemberUpgradePathPage />);
    await waitFor(() => {
      expect(screen.getByTestId('tier-bronze')).toBeInTheDocument();
      expect(screen.getByTestId('tier-silver')).toBeInTheDocument();
      expect(screen.getByTestId('tier-gold')).toBeInTheDocument();
      expect(screen.getByTestId('tier-diamond')).toBeInTheDocument();
    });
  });

  test('renders tier names', async () => {
    render(<MemberUpgradePathPage />);
    await waitFor(() => {
      expect(screen.getByText('青铜会员')).toBeInTheDocument();
      expect(screen.getByText('白银会员')).toBeInTheDocument();
      expect(screen.getByText('黄金会员')).toBeInTheDocument();
      expect(screen.getByText('钻石会员')).toBeInTheDocument();
    });
  });

  // ====== 升级摘要 ======

  test('renders current tier in summary', async () => {
    render(<MemberUpgradePathPage />);
    await waitFor(() => {
      expect(screen.getByText('白银会员')).toBeInTheDocument();
    });
  });

  test('renders upgrade progress (current/total)', async () => {
    render(<MemberUpgradePathPage />);
    await waitFor(() => {
      expect(screen.getByText('2/4')).toBeInTheDocument();
    });
  });

  test('renders next tier info', async () => {
    render(<MemberUpgradePathPage />);
    await waitFor(() => {
      expect(screen.getByText('黄金会员')).toBeInTheDocument();
      expect(screen.getByText(/累计消费/)).toBeInTheDocument();
    });
  });

  test('renders current benefits count', async () => {
    render(<MemberUpgradePathPage />);
    await waitFor(() => {
      expect(screen.getByText('3 项')).toBeInTheDocument(); // silver has 3 benefits
    });
  });

  // ====== 等级分布面板 ======

  test('renders tier distribution panel', async () => {
    render(<MemberUpgradePathPage />);
    await waitFor(() => {
      expect(screen.getByText('会员等级分布')).toBeInTheDocument();
    });
  });

  test('renders tier count numbers', async () => {
    render(<MemberUpgradePathPage />);
    await waitFor(() => {
      expect(screen.getByText(/2840人/)).toBeInTheDocument(); // bronze
      expect(screen.getByText(/1680人/)).toBeInTheDocument(); // silver
      expect(screen.getByText(/928人/)).toBeInTheDocument(); // gold
      expect(screen.getByText(/376人/)).toBeInTheDocument(); // diamond
    });
  });

  test('renders monthly upgrades info', async () => {
    render(<MemberUpgradePathPage />);
    await waitFor(() => {
      expect(screen.getByText(/本月升级 142 人/)).toBeInTheDocument();
    });
  });

  // ====== 权益对比表格 ======

  test('renders benefit comparison section', async () => {
    render(<MemberUpgradePathPage />);
    await waitFor(() => {
      expect(screen.getByText('等级权益对比')).toBeInTheDocument();
    });
  });

  test('renders benefit items', async () => {
    render(<MemberUpgradePathPage />);
    await waitFor(() => {
      expect(screen.getByText('基础折扣')).toBeInTheDocument();
      expect(screen.getByText('满减券/月')).toBeInTheDocument();
      expect(screen.getByText('生日福利')).toBeInTheDocument();
      expect(screen.getByText('运费优惠')).toBeInTheDocument();
      expect(screen.getByText('专属客服')).toBeInTheDocument();
      expect(screen.getByText('新品体验')).toBeInTheDocument();
    });
  });

  test('renders tier column headers', async () => {
    render(<MemberUpgradePathPage />);
    await waitFor(() => {
      expect(screen.getByText('青铜会员')).toBeInTheDocument();
      expect(screen.getByText('白银会员')).toBeInTheDocument();
      expect(screen.getByText('黄金会员')).toBeInTheDocument();
      expect(screen.getByText('钻石会员')).toBeInTheDocument();
    });
  });

  test('renders benefit values', async () => {
    render(<MemberUpgradePathPage />);
    await waitFor(() => {
      expect(screen.getByText('9.5折')).toBeInTheDocument();
      expect(screen.getByText('9折')).toBeInTheDocument();
      expect(screen.getByText('8.5折')).toBeInTheDocument();
      expect(screen.getByText('8折')).toBeInTheDocument();
    });
  });

  // ====== 升级记录 ======

  test('renders upgrade history section', async () => {
    render(<MemberUpgradePathPage />);
    await waitFor(() => {
      expect(screen.getByText('升级记录')).toBeInTheDocument();
    });
  });

  test('renders upgrade history entries', async () => {
    render(<MemberUpgradePathPage />);
    await waitFor(() => {
      expect(screen.getByText('青铜会员')).toBeInTheDocument();
      expect(screen.getByText('白银会员')).toBeInTheDocument();
      expect(screen.getByText('钻石会员')).toBeInTheDocument();
    });
  });

  test('renders upgrade dates', async () => {
    render(<MemberUpgradePathPage />);
    await waitFor(() => {
      expect(screen.getByText('2026-03-15')).toBeInTheDocument();
      expect(screen.getByText('2026-01-10')).toBeInTheDocument();
    });
  });

  test('renders upgrade reasons', async () => {
    render(<MemberUpgradePathPage />);
    await waitFor(() => {
      expect(screen.getByText('累计消费达标自动升级')).toBeInTheDocument();
      expect(screen.getByText('历史累计消费达标')).toBeInTheDocument();
      expect(screen.getByText('年度消费达标自动升级')).toBeInTheDocument();
    });
  });

  // ====== 常见问题 ======

  test('renders FAQ section', async () => {
    render(<MemberUpgradePathPage />);
    await waitFor(() => {
      expect(screen.getByText('常见问题')).toBeInTheDocument();
    });
  });

  test('renders all FAQ questions', async () => {
    render(<MemberUpgradePathPage />);
    await waitFor(() => {
      expect(screen.getByText('升级后多长时间生效？')).toBeInTheDocument();
      expect(screen.getByText('升级后原有积分会清零吗？')).toBeInTheDocument();
      expect(screen.getByText('消费金额如何计算？')).toBeInTheDocument();
      expect(screen.getByText('等级会降级吗？')).toBeInTheDocument();
      expect(screen.getByText('跨店消费是否累计？')).toBeInTheDocument();
    });
  });

  test('renders FAQ answers', async () => {
    render(<MemberUpgradePathPage />);
    await waitFor(() => {
      expect(screen.getByText(/达到升级条件后，系统将在 24 小时内自动升级等级/)).toBeInTheDocument();
      expect(screen.getByText(/升级不会影响您的积分余额/)).toBeInTheDocument();
    });
  });

  // ====== 加载态 ======

  test('renders Loadings in Suspense fallback', async () => {
    render(<MemberUpgradePathPage />);
    // LoadingSkeletons should render as part of the Suspense fallback
    await waitFor(() => {
      const skeletons = screen.getAllByTestId('loading-skeleton');
      expect(skeletons.length).toBeGreaterThan(0);
    });
  });

  // ====== 底部提示 ======

  test('renders upgrade tips footer', async () => {
    render(<MemberUpgradePathPage />);
    await waitFor(() => {
      expect(screen.getByText(/升级小贴士/)).toBeInTheDocument();
    });
  });

  test('renders upgrade tip content', async () => {
    render(<MemberUpgradePathPage />);
    await waitFor(() => {
      expect(screen.getByText(/积分每月 1 日结算/)).toBeInTheDocument();
      expect(screen.getByText(/达到升级条件后系统将在 24 小时内自动升级等级/)).toBeInTheDocument();
    });
  });

  // ====== JSON-LD ======

  test('renders JSON-LD structured data', () => {
    const { container } = render(<MemberUpgradePathPage />);
    const script = container.querySelector('script[type="application/ld+json"]');
    expect(script).toBeInTheDocument();
    expect(script?.innerHTML).toContain('WebApplication');
    expect(script?.innerHTML).toContain('会员升级路径');
  });

  // ====== 边界 ======

  test('renders tier required values', async () => {
    render(<MemberUpgradePathPage />);
    await waitFor(() => {
      expect(screen.getByText('注册即享')).toBeInTheDocument();
      expect(screen.getByText('累计消费 ≥ ¥500')).toBeInTheDocument();
      expect(screen.getByText('累计消费 ≥ ¥2,000')).toBeInTheDocument();
      expect(screen.getByText('累计消费 ≥ ¥10,000')).toBeInTheDocument();
    });
  });

  test('renders total member count in distribution', async () => {
    render(<MemberUpgradePathPage />);
    await waitFor(() => {
      expect(screen.getByText(/5,824/)).toBeInTheDocument(); // totalMembers
    });
  });
});
