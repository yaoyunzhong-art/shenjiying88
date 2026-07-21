import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach } from 'vitest';

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

vi.mock('../_components/TriStateRenderer', () => ({
  TriStateRenderer: ({ loading, empty, error, onRetry, children }: any) => {
    if (loading) return <div data-testid="tri-state-loading">加载中…</div>;
    if (error) return <div data-testid="tri-state-error">{error}<button data-testid="tri-state-retry" onClick={onRetry}>重新加载</button></div>;
    if (empty) return <div data-testid="tri-state-empty">暂无数据</div>;
    return <>{typeof children === 'function' ? children() : children}</>;
  },
}));

// Note: useTriState uses the REAL implementation — no mock needed

// ---- Test Subject ----

import SettingsPage from './page';

describe('SettingsPage — 系统设置', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ====== 渲染测试 ======

  test('renders PageShell with correct title', async () => {
    render(<SettingsPage />);
    await waitFor(() => {
      expect(screen.getByTestId('page-shell')).toHaveAttribute('data-title', '系统设置');
    });
  });

  test('renders Tabs component', async () => {
    render(<SettingsPage />);
    await waitFor(() => {
      expect(screen.getByTestId('m5-tabs')).toBeInTheDocument();
    });
  });

  test('renders all four settings sections', async () => {
    render(<SettingsPage />);
    await waitFor(() => {
      expect(screen.getByText('通用设置')).toBeInTheDocument();
      expect(screen.getByText('通知设置')).toBeInTheDocument();
      expect(screen.getByText('安全设置')).toBeInTheDocument();
      expect(screen.getByText('账单设置')).toBeInTheDocument();
    });
  });

  test('renders general settings fields by default', async () => {
    render(<SettingsPage />);
    await waitFor(() => {
      expect(screen.getByText('门店名称')).toBeInTheDocument();
      expect(screen.getByText('Demo Store 旗舰店')).toBeInTheDocument();
    });
  });

  test('renders save settings button', async () => {
    render(<SettingsPage />);
    await waitFor(() => {
      expect(screen.getByText('保存设置')).toBeInTheDocument();
    });
  });

  // ====== 状态测试 ======

  test('shows loading then renders content', async () => {
    render(<SettingsPage />);
    // Starts loading, then data loads after setTimeout(300)
    await waitFor(() => {
      expect(screen.getByTestId('m5-tabs')).toBeInTheDocument();
    }, { timeout: 1000 });
  });

  test('shows section header for active tab', async () => {
    render(<SettingsPage />);
    await waitFor(() => {
      // Default "general" tab should show header
      expect(screen.getByText('通用设置')).toBeInTheDocument();
    });
  });

  test('changes header when switching tabs', async () => {
    render(<SettingsPage />);
    await waitFor(() => {
      const securityTab = screen.getByTestId('tab-security');
      fireEvent.click(securityTab);
    });
    await waitFor(() => {
      expect(screen.getByText('双因素认证')).toBeInTheDocument();
      expect(screen.getByText('已开启')).toBeInTheDocument();
    });
  });

  test('shows notification settings fields', async () => {
    render(<SettingsPage />);
    await waitFor(() => {
      fireEvent.click(screen.getByTestId('tab-notifications'));
    });
    await waitFor(() => {
      expect(screen.getByText('低库存预警')).toBeInTheDocument();
      expect(screen.getByText('订单通知')).toBeInTheDocument();
      expect(screen.getByText('员工排班变更')).toBeInTheDocument();
      expect(screen.getByText('系统更新通知')).toBeInTheDocument();
    });
  });

  test('shows billing settings fields', async () => {
    render(<SettingsPage />);
    await waitFor(() => {
      fireEvent.click(screen.getByTestId('tab-billing'));
    });
    await waitFor(() => {
      expect(screen.getByText('当前套餐')).toBeInTheDocument();
      expect(screen.getByText('专业版')).toBeInTheDocument();
    });
  });

  // ====== 交互测试 ======

  test('switches active tab on click', async () => {
    render(<SettingsPage />);
    await waitFor(() => {
      const tabs = screen.getAllByTestId(/^tab-/);
      expect(tabs.length).toBe(4);
    });
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
    await waitFor(() => {
      fireEvent.click(screen.getByText('保存设置'));
    });
    expect(mockAlert).toHaveBeenCalledWith('设置已保存（模拟）');
    window.alert = originalAlert;
  });

  test('show correct field count for general settings', async () => {
    render(<SettingsPage />);
    await waitFor(() => {
      expect(screen.getByText('门店名称')).toBeInTheDocument();
      expect(screen.getByText('门店地址')).toBeInTheDocument();
      expect(screen.getByText('联系电话')).toBeInTheDocument();
      expect(screen.getByText('营业时间')).toBeInTheDocument();
    });
  });

  test('security settings show select-type fields', async () => {
    render(<SettingsPage />);
    await waitFor(() => {
      fireEvent.click(screen.getByTestId('tab-security'));
    });
    await waitFor(() => {
      expect(screen.getByText('登录会话时长')).toBeInTheDocument();
      expect(screen.getByText('24小时')).toBeInTheDocument();
    });
  });

  // ====== 边界情况 ======

  test('renders correctly after data loads', async () => {
    render(<SettingsPage />);
    await waitFor(() => {
      expect(screen.queryByTestId('tri-state-loading')).not.toBeInTheDocument();
      expect(screen.getByText('通用设置')).toBeInTheDocument();
    }, { timeout: 1000 });
  });

  test('tabs have correct order', async () => {
    render(<SettingsPage />);
    await waitFor(() => {
      const tabElements = screen.getAllByTestId(/^tab-/);
      expect(tabElements[0]).toHaveTextContent('通用设置');
      expect(tabElements[1]).toHaveTextContent('通知设置');
      expect(tabElements[2]).toHaveTextContent('安全设置');
      expect(tabElements[3]).toHaveTextContent('账单设置');
    });
  });

  test('can switch between all four tabs sequentially', async () => {
    render(<SettingsPage />);
    const tabs = ['tab-general', 'tab-notifications', 'tab-security', 'tab-billing'];
    for (const tabId of tabs) {
      await waitFor(() => {
        const tab = screen.getByTestId(tabId);
        fireEvent.click(tab);
      });
    }
    // After clicking all tabs, verify last tab shows
    await waitFor(() => {
      expect(screen.getByText('当前套餐')).toBeInTheDocument();
    });
  });

  test('shows correct toggle values in notifications', async () => {
    render(<SettingsPage />);
    await waitFor(() => {
      fireEvent.click(screen.getByTestId('tab-notifications'));
    });
    await waitFor(() => {
      expect(screen.getByText('开启')).toBeInTheDocument();
      expect(screen.getByText('关闭')).toBeInTheDocument();
    });
  });
});
