/**
 * member-churn/page.vitest.tsx — 会员流失预测页面 L2 组件测试 (vitest + @testing-library/react)
 * 覆盖: 渲染 · Tab切换 · 概览表格 · 风险筛选 · 诊断 · 趋势 · 加载态 · 空状态 · 边界
 * 角色: 🏪 店长 / 运营
 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach } from 'vitest';

// ====== Mock @m5/ui ======
vi.mock('@m5/ui', () => ({
  PageShell: ({ children, title, subtitle }: { children: React.ReactNode; title: string; subtitle: string }) => (
    <div data-testid="page-shell">
      <h2>{title}</h2>
      <p>{subtitle}</p>
      {children}
    </div>
  ),
  StatusBadge: ({ label, variant }: { label: string; variant: string }) => (
    <span data-testid={`status-badge-${label}`} data-variant={variant}>{label}</span>
  ),
  QuickStats: ({ items }: { items: { label: string; value: string }[] }) => (
    <div data-testid="quick-stats">
      {items.map((item) => (
        <div key={item.label} data-testid="quick-stat-item">
          <span>{item.value}</span>
          <span>{item.label}</span>
        </div>
      ))}
    </div>
  ),
  AIMemberChurnPredictionPanel: ({ prediction }: { prediction: Record<string, unknown> }) => (
    <div data-testid="ai-prediction-panel" data-member-id={prediction.memberId as string}>
      {prediction.memberName as string} - {(prediction.churnProbability as number)}%
    </div>
  ),
  AnomalyDiagnosisReport: ({ title, findings, onHandleFinding, onDismissFinding }: {
    title: string; findings: Record<string, unknown>[]; loading: boolean;
    onHandleFinding: (id: string) => void; onDismissFinding: (id: string) => void;
  }) => (
    <div data-testid="diagnosis-report">
      <h3>{title}</h3>
      {findings.map((f: Record<string, unknown>) => (
        <div key={f.id as string} data-testid="finding-item">
          <span>{f.title as string}</span>
          <button data-testid={`handle-finding-${f.id}`} onClick={() => onHandleFinding(f.id as string)}>处理</button>
          <button data-testid={`dismiss-finding-${f.id}`} onClick={() => onDismissFinding(f.id as string)}>忽略</button>
        </div>
      ))}
    </div>
  ),
  PredictionAnalysisPanel: ({ title, predictions, summary }: {
    title: string; predictions: unknown[]; summary: Record<string, unknown>;
  }) => (
    <div data-testid="prediction-analysis-panel">
      <h3>{title}</h3>
      <span>{summary.bestPrediction as string}</span>
    </div>
  ),
}));

vi.mock('@m5/sdk', () => ({
  getDefaultApiBaseUrl: () => 'https://api.example.com',
}));

// ====== Mock localStorage ======
const localStorageStore: Record<string, string | null> = {};
vi.stubGlobal('localStorage', {
  getItem: vi.fn((key: string) => localStorageStore[key] ?? null),
  setItem: vi.fn((key: string, value: string) => { localStorageStore[key] = value; }),
  removeItem: vi.fn((key: string) => { delete localStorageStore[key]; }),
  clear: vi.fn(() => { Object.keys(localStorageStore).forEach(k => { delete localStorageStore[k]; }); }),
});

// ====== Mock fetch ======
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

// ====== Test Subject ======
import MemberChurnPage from './page';

const MOCK_PREDICTIONS = [
  { memberId: 'm1', memberName: '张三', memberTier: 'gold', riskLevel: 'high', churnProbability: 85, predictedWindowDays: 14, activityTrend: 'declining', recommendedActions: [{ code: 'coupon_20', label: '发放满减券', channel: 'coupon', expectedRecoveryRate: 35 }] },
  { memberId: 'm2', memberName: '李四', memberTier: 'silver', riskLevel: 'medium', churnProbability: 55, predictedWindowDays: 30, activityTrend: 'declining', recommendedActions: [{ code: 'wechat_msg', label: '微信关怀消息', channel: 'wechat', expectedRecoveryRate: 25 }] },
  { memberId: 'm3', memberName: '王五', memberTier: 'diamond', riskLevel: 'low', churnProbability: 20, predictedWindowDays: 60, activityTrend: 'stable', recommendedActions: [] },
  { memberId: 'm4', memberName: '赵六', memberTier: 'bronze', riskLevel: 'critical', churnProbability: 95, predictedWindowDays: 7, activityTrend: 'declining', recommendedActions: [{ code: 'phone_call', label: '电话回访', channel: 'phone', expectedRecoveryRate: 15 }] },
];

const MOCK_FINDINGS = [
  { id: 'f1', title: '30天未到店消费', detail: '张三连续30天无到店记录', severity: 'high', type: 'inactive', time: '2026-07-27', resolved: false },
  { id: 'f2', title: '消费频次下降50%', detail: '王五本周消费频次较上月下降50%', severity: 'medium', type: 'frequency', time: '2026-07-26', resolved: false },
];

describe('MemberChurnPage — 会员流失预测', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.keys(localStorageStore).forEach(k => { delete localStorageStore[k]; });
    localStorageStore['member_info'] = JSON.stringify({ memberId: 'mem-001', memberName: '测试会员', mobile: '13800138000' });
    mockFetch.mockImplementation((url: string) => {
      if (url.includes('/churn/predictions')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(MOCK_PREDICTIONS) });
      }
      if (url.includes('/churn/diagnosis')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(MOCK_FINDINGS) });
      }
      return Promise.resolve({ ok: false });
    });
  });

  // ====== 正例: 渲染 ======

  test('renders without crashing', () => {
    expect(() => render(<MemberChurnPage />)).not.toThrow();
  });

  test('renders PageShell title', async () => {
    render(<MemberChurnPage />);
    await waitFor(() => {
      expect(screen.getByText('会员流失预测')).toBeInTheDocument();
    });
  });

  test('renders PageShell subtitle', async () => {
    render(<MemberChurnPage />);
    await waitFor(() => {
      expect(screen.getByText(/AI 驱动的会员流失分析与挽回决策/)).toBeInTheDocument();
    });
  });

  test('renders summary text with prediction stats', async () => {
    render(<MemberChurnPage />);
    await waitFor(() => {
      expect(screen.getByText(/共 4 位会员进行分析/)).toBeInTheDocument();
    });
  });

  test('renders QuickStats component after loading', async () => {
    render(<MemberChurnPage />);
    await waitFor(() => {
      expect(screen.getByTestId('quick-stats')).toBeInTheDocument();
    });
  });

  test('renders risk distribution badges', async () => {
    render(<MemberChurnPage />);
    await waitFor(() => {
      expect(screen.getByTestId('status-badge-低风险')).toBeInTheDocument();
      expect(screen.getByTestId('status-badge-中风险')).toBeInTheDocument();
      expect(screen.getByTestId('status-badge-高风险')).toBeInTheDocument();
      expect(screen.getByTestId('status-badge-极高风险')).toBeInTheDocument();
    });
  });

  // ====== Tab 切换 ======

  test('renders all tab buttons', async () => {
    render(<MemberChurnPage />);
    await waitFor(() => {
      expect(screen.getByText('AI 流失预测')).toBeInTheDocument();
      expect(screen.getByText('异常诊断报告')).toBeInTheDocument();
      expect(screen.getByText('趋势分析')).toBeInTheDocument();
      expect(screen.getByText('概览仪表盘')).toBeInTheDocument();
    });
  });

  test('概览仪表盘 tab is active by default', async () => {
    render(<MemberChurnPage />);
    await waitFor(() => {
      // Overview should show member names in the table
      expect(screen.getByText('张三')).toBeInTheDocument();
      expect(screen.getByText('李四')).toBeInTheDocument();
    });
  });

  test('switching to AI流失预测 tab shows panels', async () => {
    render(<MemberChurnPage />);
    await waitFor(() => {
      expect(screen.getByText('张三')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('AI 流失预测'));
    await waitFor(() => {
      expect(screen.getAllByTestId('ai-prediction-panel').length).toBeGreaterThan(0);
    });
  });

  test('switching to 异常诊断报告 tab shows findings', async () => {
    render(<MemberChurnPage />);
    await waitFor(() => {
      expect(screen.getByText('张三')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('异常诊断报告'));
    await waitFor(() => {
      expect(screen.getByTestId('diagnosis-report')).toBeInTheDocument();
    });
  });

  test('switching to 趋势分析 tab shows analysis panel', async () => {
    render(<MemberChurnPage />);
    await waitFor(() => {
      expect(screen.getByText('张三')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('趋势分析'));
    await waitFor(() => {
      expect(screen.getByTestId('prediction-analysis-panel')).toBeInTheDocument();
    });
  });

  test('tab switch highlights active tab', async () => {
    render(<MemberChurnPage />);
    await waitFor(() => {
      expect(screen.getByText('张三')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('AI 流失预测'));
    await waitFor(() => {
      const activeTab = screen.getByText('AI 流失预测');
      expect(activeTab).toHaveStyle({ fontWeight: '700' });
    });
  });

  // ====== 概览表格 ======

  test('renders overview table with member names', async () => {
    render(<MemberChurnPage />);
    await waitFor(() => {
      expect(screen.getByText('张三')).toBeInTheDocument();
      expect(screen.getByText('王五')).toBeInTheDocument();
    });
  });

  test('renders churn probability in overview', async () => {
    render(<MemberChurnPage />);
    await waitFor(() => {
      expect(screen.getByText('85%')).toBeInTheDocument();
      expect(screen.getByText('95%')).toBeInTheDocument();
    });
  });

  test('renders predicted window in days', async () => {
    render(<MemberChurnPage />);
    await waitFor(() => {
      const daysElements = screen.getAllByText(/天/);
      expect(daysElements.length).toBeGreaterThan(0);
    });
  });

  test('renders activity trend indicators', async () => {
    render(<MemberChurnPage />);
    await waitFor(() => {
      expect(screen.getByText(/↓ 下降/)).toBeInTheDocument();
      expect(screen.getByText(/→ 稳定/)).toBeInTheDocument();
    });
  });

  // ====== 风险筛选 ======

  test('renders risk level filter in AI预测 tab', async () => {
    render(<MemberChurnPage />);
    await waitFor(() => {
      expect(screen.getByText('张三')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('AI 流失预测'));
    await waitFor(() => {
      const select = document.querySelector('select');
      expect(select).toBeInTheDocument();
      expect(screen.getByText('全部风险等级')).toBeInTheDocument();
    });
  });

  test('risk filter shows prediction count', async () => {
    render(<MemberChurnPage />);
    await waitFor(() => {
      expect(screen.getByText('张三')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('AI 流失预测'));
    await waitFor(() => {
      expect(screen.getByText(/共 4 条预测/)).toBeInTheDocument();
    });
  });

  // ====== 诊断交互 ======

  test('handle finding button works', async () => {
    render(<MemberChurnPage />);
    await waitFor(() => {
      expect(screen.getByText('张三')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('异常诊断报告'));
    await waitFor(() => {
      expect(screen.getByTestId('handle-finding-f1')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByTestId('handle-finding-f1'));
  });

  test('dismiss finding button works', async () => {
    render(<MemberChurnPage />);
    await waitFor(() => {
      expect(screen.getByText('张三')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('异常诊断报告'));
    await waitFor(() => {
      expect(screen.getByTestId('dismiss-finding-f2')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByTestId('dismiss-finding-f2'));
  });

  // ====== 加载态 ======

  test('shows loading indicator initially', () => {
    mockFetch.mockReturnValue(new Promise(() => {}));
    render(<MemberChurnPage />);
    expect(screen.getByText('加载中...')).toBeInTheDocument();
  });

  // ====== 空状态 & 边界 ======

  test('shows empty state when no predictions nor findings', async () => {
    mockFetch.mockResolvedValue({ ok: true, json: () => Promise.resolve([]) });
    render(<MemberChurnPage />);
    await waitFor(() => {
      expect(screen.getByText(/当前暂无流失预测数据/)).toBeInTheDocument();
    });
  });

  test('shows empty state when no member_info in localStorage', async () => {
    delete localStorageStore['member_info'];
    render(<MemberChurnPage />);
    await waitFor(() => {
      expect(screen.getByText(/当前暂无流失预测数据/)).toBeInTheDocument();
    });
  });

  test('handles fetch error gracefully', async () => {
    mockFetch.mockRejectedValue(new Error('Network error'));
    render(<MemberChurnPage />);
    await waitFor(() => {
      expect(screen.getByText(/共 0 条预测/)).toBeInTheDocument();
    });
  });

  test('handles malformed member_info JSON gracefully', async () => {
    localStorageStore['member_info'] = 'not-valid-json';
    render(<MemberChurnPage />);
    await waitFor(() => {
      expect(screen.getByText(/当前暂无流失预测数据/)).toBeInTheDocument();
    });
  });

  test('shows recommended actions in overview', async () => {
    render(<MemberChurnPage />);
    await waitFor(() => {
      expect(screen.getByText(/发放满减券/)).toBeInTheDocument();
      expect(screen.getByText(/电话回访/)).toBeInTheDocument();
    });
  });

  test('renders footer analysis info', async () => {
    render(<MemberChurnPage />);
    await waitFor(() => {
      expect(screen.getByText(/AI 预测基于历史数据模型/)).toBeInTheDocument();
      expect(screen.getByText(/诊断报告每 24 小时自动更新/)).toBeInTheDocument();
    });
  });

  test('renders 挽回率 percentage in actions', async () => {
    render(<MemberChurnPage />);
    await waitFor(() => {
      const recoveryTexts = screen.getAllByText(/%/);
      expect(recoveryTexts.length).toBeGreaterThan(0);
    });
  });
});
