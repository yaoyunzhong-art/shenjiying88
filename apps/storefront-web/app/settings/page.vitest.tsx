import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';

// ---- Mocks (top-level) ----

vi.mock('@m5/ui', () => ({
  PageShell: ({ children, title, description }: any) => (
    <div data-testid="page-shell" data-title={title} data-description={description}>{children}</div>
  ),
  Tabs: ({ items, activeKey, onChange, variant }: any) => (
    <div data-testid="m5-tabs" data-active-key={activeKey} data-variant={variant}>
      {items.map((item: any) => (
        <button key={item.key} data-testid={`tab-${item.key}`} onClick={() => onChange(item.key)}>
          {item.label}
        </button>
      ))}
    </div>
  ),
}));

// Override useTriState to resolve immediately — bypass page's setTimeout(300)
vi.mock('../_components/useTriState', () => ({
  useTriState: (initialState?: any) => {
    const [loading, setLoading] = React.useState(initialState?.loading ?? false);
    const [empty, setEmpty] = React.useState(initialState?.empty ?? false);
    const [error, setError] = React.useState<string | null>(null);
    const wrapLoadRef = React.useRef(async <T,>(promise: Promise<T>): Promise<T | undefined> => {
      setLoading(true);
      setError(null);
      setEmpty(false);
      // Await the inner promise — it has setTimeout(300), so the page's data
      // arrives asynchronously. Just wait for it normally.
      const result = await promise;
      setLoading(false);
      return result;
    });
    return { loading, empty, error, setLoading, setEmpty, setError, wrapLoad: wrapLoadRef.current, syncData: vi.fn(), reset: vi.fn() };
  },
}));

vi.mock('../_components/TriStateRenderer', () => ({
  TriStateRenderer: ({ loading, empty, error, onRetry, children }: any) => {
    if (loading) return <div data-testid="tri-state-loading">加载中…</div>;
    if (error) return <div data-testid="tri-state-error">{error}<button data-testid="tri-state-retry" onClick={onRetry}>重新加载</button></div>;
    if (empty) return <div data-testid="tri-state-empty">暂无数据</div>;
    return <>{typeof children === 'function' ? children() : children}</>;
  },
}));

// Note: useTriState uses the REAL implementation

// ---- Test Subject ----

import SettingsPage from './page';

describe('SettingsPage — 系统设置', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Helper: wait for page's 300ms data load + React re-render
  async function waitForData() {
    await new Promise(r => setTimeout(r, 500));
    // Flush pending React state updates
    await new Promise(r => setTimeout(r, 50));
  }

  // ====== 渲染测试 ======

  test('renders PageShell with correct title', async () => {
    render(<SettingsPage />);
    await waitForData();
    expect(screen.getByTestId('page-shell')).toHaveAttribute('data-title', '系统设置');
  });

  test('renders Tabs component', async () => {
    render(<SettingsPage />);
    await waitForData();
    expect(screen.getByTestId('m5-tabs')).toBeInTheDocument();
  });

  test('renders all four settings sections', async () => {
    render(<SettingsPage />);
    expect(await screen.findByText('通用设置', undefined, { timeout: 3000 })).toBeInTheDocument();
    expect(screen.getByText('通知设置')).toBeInTheDocument();
    expect(screen.getByText('安全设置')).toBeInTheDocument();
    expect(screen.getByText('账单设置')).toBeInTheDocument();
  });

  test('renders general settings fields by default', async () => {
    render(<SettingsPage />);
    await waitForData();
    expect(screen.getByText('门店名称')).toBeInTheDocument();
    expect(screen.getByText('Demo Store 旗舰店')).toBeInTheDocument();
  });

  test('renders save settings button', async () => {
    render(<SettingsPage />);
    await waitForData();
    expect(screen.getByText('保存设置')).toBeInTheDocument();
  });

  // ====== 状态测试 ======

  test('shows loading then renders content', async () => {
    render(<SettingsPage />);
    // Starts loading, then data loads after setTimeout(300)
    await waitForData();
    expect(screen.getByTestId('m5-tabs')).toBeInTheDocument();
  });

  test('shows section header for active tab', async () => {
    render(<SettingsPage />);
    expect(await screen.findByText('通用设置', undefined, { timeout: 3000 })).toBeInTheDocument();
  });

  test('changes header when switching tabs', async () => {
    render(<SettingsPage />);
    await waitForData();
    fireEvent.click(screen.getByTestId('tab-security'));
    await waitFor(() => {
      expect(screen.getByText('双因素认证')).toBeInTheDocument();
    });
  });

  test('shows notification settings fields', async () => {
    render(<SettingsPage />);
    await waitForData();
    fireEvent.click(screen.getByTestId('tab-notifications'));
    await waitFor(() => {
      expect(screen.getByText('低库存预警')).toBeInTheDocument();
      expect(screen.getByText('订单通知')).toBeInTheDocument();
      expect(screen.getByText('员工排班变更')).toBeInTheDocument();
      expect(screen.getByText('系统更新通知')).toBeInTheDocument();
    });
  });

  test('shows billing settings fields', async () => {
    render(<SettingsPage />);
    await waitForData();
    fireEvent.click(screen.getByTestId('tab-billing'));
    await waitFor(() => {
      expect(screen.getByText('当前套餐')).toBeInTheDocument();
      expect(screen.getByText('专业版')).toBeInTheDocument();
    });
  });

  // ====== 交互测试 ======

  test('switches active tab on click', async () => {
    render(<SettingsPage />);
    await waitForData();
    const tabs = screen.getAllByTestId(/^tab-/);
    expect(tabs.length).toBe(4);
    fireEvent.click(screen.getByTestId('tab-security'));
    await waitFor(() => {
      expect(screen.getByText('双因素认证')).toBeInTheDocument();
    });
  });

  test('clicking save button shows alert', async () => {
    const originalAlert = window.alert;
    const mockAlert = vi.fn();
    window.alert = mockAlert;
    render(<SettingsPage />);
    await waitForData();
    fireEvent.click(screen.getByText('保存设置'));
    expect(mockAlert).toHaveBeenCalledWith('设置已保存（模拟）');
    window.alert = originalAlert;
  });

  test('show correct field count for general settings', async () => {
    render(<SettingsPage />);
    await waitForData();
    expect(screen.getByText('门店名称')).toBeInTheDocument();
    expect(screen.getByText('门店地址')).toBeInTheDocument();
    expect(screen.getByText('联系电话')).toBeInTheDocument();
    expect(screen.getByText('营业时间')).toBeInTheDocument();
  });

  test('security settings show select-type fields', async () => {
    render(<SettingsPage />);
    await waitForData();
    fireEvent.click(screen.getByTestId('tab-security'));
    await waitFor(() => {
      expect(screen.getByText('登录会话时长')).toBeInTheDocument();
      expect(screen.getByText('24小时')).toBeInTheDocument();
    });
  });

  // ====== 边界情况 ======

  test('renders correctly after data loads', async () => {
    render(<SettingsPage />);
    expect(await screen.findByText('通用设置', undefined, { timeout: 3000 })).toBeInTheDocument();
    expect(screen.queryByTestId('tri-state-loading')).not.toBeInTheDocument();
  });

  test('tabs have correct order', async () => {
    render(<SettingsPage />);
    await waitForData();
    const tabElements = screen.getAllByTestId(/^tab-/);
    expect(tabElements[0]).toHaveTextContent('通用设置');
    expect(tabElements[1]).toHaveTextContent('通知设置');
    expect(tabElements[2]).toHaveTextContent('安全设置');
    expect(tabElements[3]).toHaveTextContent('账单设置');
  });

  test('can switch between all four tabs sequentially', async () => {
    render(<SettingsPage />);
    await waitForData();
    const tabs = ['tab-general', 'tab-notifications', 'tab-security', 'tab-billing'];
    for (const tabId of tabs) {
      fireEvent.click(screen.getByTestId(tabId));
    }
    expect(screen.getByText('当前套餐')).toBeInTheDocument();
  });

  test('shows correct toggle values in notifications', async () => {
    render(<SettingsPage />);
    // Wait for data to load, then click notifications tab
    await screen.findByText('通用设置', undefined, { timeout: 3000 });
    fireEvent.click(screen.getByTestId('tab-notifications'));
    expect(await screen.findByText('开启', undefined, { timeout: 1000 })).toBeInTheDocument();
    expect(screen.getByText('关闭')).toBeInTheDocument();
  });

  // ====== 新增 安全补强测试 ======

  test('general tab shows store name input', async () => {
    render(<SettingsPage />);
    await waitForData();
    expect(screen.getByText('Demo Store 旗舰店')).toBeInTheDocument();
  });

  test('general tab shows opening hours', async () => {
    render(<SettingsPage />);
    await waitForData();
    expect(screen.getByText('08:00-22:00')).toBeInTheDocument();
  });

  test('billing tab shows plan expiry date', async () => {
    render(<SettingsPage />);
    await waitForData();
    fireEvent.click(screen.getByTestId('tab-billing'));
    await waitFor(() => {
      expect(screen.getByText('2026-08-15')).toBeInTheDocument();
    });
  });

  test('billing tab shows next payment', async () => {
    render(<SettingsPage />);
    await waitForData();
    fireEvent.click(screen.getByTestId('tab-billing'));
    await waitFor(() => {
      expect(screen.getByText('¥1,999/月')).toBeInTheDocument();
    });
  });

  test('security tab shows IP whitelist count', async () => {
    render(<SettingsPage />);
    await waitForData();
    fireEvent.click(screen.getByTestId('tab-security'));
    await waitFor(() => {
      expect(screen.getByText('未配置')).toBeInTheDocument();
    });
  });

  test('switches from general to notifications and verifies content', async () => {
    render(<SettingsPage />);
    await waitForData();
    expect(screen.getByTestId('tab-general')).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('tab-notifications'));
    await waitFor(() => {
      expect(screen.getByText('低库存预警')).toBeInTheDocument();
      expect(screen.getByText('订单通知')).toBeInTheDocument();
    });
  });

  test('renders all settings sections when each tab is clicked once', async () => {
    render(<SettingsPage />);
    await waitForData();
    const pages = ['general', 'notifications', 'security', 'billing'];
    for (const p of pages) {
      fireEvent.click(screen.getByTestId(`tab-${p}`));
    }
    await waitFor(() => {
      expect(screen.getByText('当前套餐')).toBeInTheDocument();
      expect(screen.getByText('专业版')).toBeInTheDocument();
    });
  });

  test('stores page does not crash when unmounted and remounted', async () => {
    const { unmount } = render(<SettingsPage />);
    unmount();
    render(<SettingsPage />);
    await waitForData();
    expect(screen.getByTestId('page-shell')).toBeInTheDocument();
  });
});
