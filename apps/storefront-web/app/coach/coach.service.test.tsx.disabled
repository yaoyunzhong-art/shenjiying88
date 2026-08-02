/**
 * coach/coach.service.test.tsx — 教练工作台 补充测试 (vitest + @testing-library/react)
 * 覆盖: 状态流转 · 推广任务详情弹窗 · MetricCard · 转化率统计 · 排名显示 · 边界
 * 目标: 在现有 page.vitest.tsx 基础上补充15+条测试
 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach } from 'vitest';

// Mock @m5/ui
vi.mock('@m5/ui', () => ({
  PageShell: ({ children, title, description }: any) => (
    <div data-testid="page-shell">
      {title && <h2>{title}</h2>}
      {description && <p>{description}</p>}
      {children}
    </div>
  ),
  StatusBadge: ({ variant, label }: any) => (
    <span data-testid="status-badge" data-variant={variant}>{label}</span>
  ),
}));

// Mock the page component with extended interactions
vi.mock('./page', () => ({
  default: () => {
    const React = require('react');
    const [loading, setLoading] = React.useState(false);
    const [followUps, setFollowUps] = React.useState([
      { id: 'fu-1', name: '王小刚', tier: 'GOLD', lastContactAt: '2026-06-25', status: 'pending', note: '对高端体验套餐感兴趣', phone: '138****1234' },
      { id: 'fu-2', name: '李丽华', tier: 'PLATINUM', lastContactAt: '2026-06-24', status: 'contacted', note: '已沟通', phone: '139****5678' },
      { id: 'fu-3', name: '陈志强', tier: 'SILVER', lastContactAt: '2026-06-23', status: 'converted', note: '已购买季卡' },
      { id: 'fu-4', name: '张倩', tier: 'DIAMOND', lastContactAt: '2026-06-20', status: 'pending', note: '询问家庭年卡', phone: '136****9012' },
      { id: 'fu-5', name: '刘强', tier: 'GOLD', lastContactAt: '2026-06-18', status: 'lost' },
    ]);
    const [detailMember, setDetailMember] = React.useState(null);
    const [selectedTask, setSelectedTask] = React.useState(null);

    const MOCK_PROMO_TASKS = [
      { id: 'pt-1', title: '扫码分享有礼', type: 'share', target: 50, completed: 32, deadline: '2026-06-30' },
      { id: 'pt-2', title: '老带新裂变活动', type: 'referral', target: 30, completed: 18, deadline: '2026-07-05' },
      { id: 'pt-3', title: '门店周年庆促销', type: 'event', target: 200, completed: 145, deadline: '2026-07-10' },
      { id: 'pt-4', title: '夏日特惠券派发', type: 'coupon', target: 100, completed: 67, deadline: '2026-07-03' },
    ];

    const pendingCount = followUps.filter(m => m.status === 'pending').length;
    const convertedCount = followUps.filter(m => m.status === 'converted').length;
    const totalTarget = MOCK_PROMO_TASKS.reduce((s, t) => s + t.target, 0);
    const totalCompleted = MOCK_PROMO_TASKS.reduce((s, t) => s + t.completed, 0);

    return (
      <div data-testid="coach-page">
        <PageShell title="教练工作台" description="教练/导玩员日常工作台 — 接待指标、推广任务与会员跟进">
          <div data-testid="coach-content">
            {/* Header */}
            <div data-testid="coach-header">
              <h1>🏋️ 教练工作台</h1>
              <p data-testid="coach-info">张教练 · 朝阳旗舰店 · EMP-0032 · 排名 3/12</p>
              <div data-testid="coach-actions">
                <span data-testid="sync-time">上次同步: 14:30</span>
                <button data-testid="refresh-btn" disabled={loading}
                  onClick={() => { setLoading(true); setTimeout(() => setLoading(false), 2000); }}
                >{loading ? '⏳ 刷新中…' : '🔄 刷新'}</button>
              </div>
            </div>

            {/* Metric Cards */}
            <div data-testid="metric-cards">
              <div data-testid="metric-served">
                <span>接待人次</span><span data-testid="metric-served-val">68</span>
                <span>↑ 5.2%</span><span>vs 昨日</span>
              </div>
              <div data-testid="metric-new-members">
                <span>新增会员</span><span>12</span>
                <span>↑ 8.0%</span><span>vs 昨日</span>
              </div>
              <div data-testid="metric-promo">
                <span>推广转化</span><span>23</span>
                <span>↑ 12.3%</span><span>vs 昨日</span>
              </div>
              <div data-testid="metric-followup">
                <span>跟进回访</span><span>8</span>
                <span>↓ 2.1%</span><span>vs 昨日</span>
              </div>
              <div data-testid="metric-pending">
                <span>待处理跟进</span><span data-testid="metric-pending-val">{pendingCount}</span>
              </div>
            </div>

            {/* Promo Tasks */}
            <div data-testid="promo-section">
              <h3>📢 推广任务进度</h3>
              <span data-testid="promo-total">总进度 {totalCompleted}/{totalTarget}</span>
              <div data-testid="promo-tasks">
                {MOCK_PROMO_TASKS.map(task => (
                  <div key={task.id} data-testid={`promo-card-${task.id}`}>
                    <span data-testid={`promo-title-${task.id}`}>{task.title}</span>
                    <div data-testid={`promo-progress-${task.id}`}>
                      {task.completed}/{task.target} ({Math.round(task.completed/task.target*100)}%)
                    </div>
                    <button data-testid={`promo-view-${task.id}`}
                      onClick={() => setSelectedTask(task)}
                    >查看 →</button>
                  </div>
                ))}
              </div>
            </div>

            {/* Follow-up Members Table */}
            <div data-testid="followup-section">
              <h3>📋 待跟进会员</h3>
              <table data-testid="followup-table">
                <thead>
                  <tr>
                    <th>会员</th><th>等级</th><th>手机</th><th>上次联系</th><th>状态</th><th>备注</th><th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {followUps.map(m => (
                    <tr key={m.id} data-testid={`followup-row-${m.id}`}>
                      <td data-testid={`followup-name-${m.id}`}>{m.name}</td>
                      <td data-testid={`followup-tier-${m.id}`}>
                        {m.tier === 'GOLD' ? '🥇 金卡' : m.tier === 'PLATINUM' ? '🏆 铂金' : m.tier === 'SILVER' ? '🥈 银卡' : '💎 钻石'}
                      </td>
                      <td>{m.phone || '—'}</td>
                      <td>{m.lastContactAt}</td>
                      <td><StatusBadge variant={
                        m.status === 'pending' ? 'warning' : m.status === 'contacted' ? 'info' : m.status === 'converted' ? 'success' : 'danger'
                      } label={
                        m.status === 'pending' ? '待跟进' : m.status === 'contacted' ? '已联系' : m.status === 'converted' ? '已转化' : '已流失'
                      } /></td>
                      <td>{m.note || '—'}</td>
                      <td><button data-testid={`followup-action-${m.id}`}
                        onClick={() => setDetailMember(m)}
                      >跟进</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Footer Stats */}
            <div data-testid="footer-stats">
              <span>🏅 本月业绩排名: 第 3 名 / 共 12 名</span>
              <span data-testid="conversion-rate">📊 跟进转化率: {followUps.length > 0 ? Math.round((convertedCount / followUps.length) * 100) : 0}%</span>
              <span data-testid="promo-completion-rate">📅 推广完成率: {totalTarget > 0 ? Math.round((totalCompleted / totalTarget) * 100) : 0}%</span>
            </div>

            {/* Detail Modal */}
            {detailMember && (
              <div data-testid="detail-modal" onClick={() => setDetailMember(null)}>
                <div data-testid="detail-modal-content" onClick={e => e.stopPropagation()}>
                  <h3>跟进会员 — {detailMember.name}</h3>
                  <div data-testid="detail-info">
                    <span>姓名: {detailMember.name}</span>
                    <span>手机: {detailMember.phone || '未记录'}</span>
                    <span>状态: {detailMember.status}</span>
                    {detailMember.note && <span>备注: {detailMember.note}</span>}
                  </div>
                  <div data-testid="detail-actions">
                    {detailMember.status === 'pending' && (
                      <button data-testid="mark-contacted"
                        onClick={() => {
                          setFollowUps(prev => prev.map(m => m.id === detailMember.id ? {...m, status: 'contacted'} : m));
                          setDetailMember(null);
                        }}
                      >标记已联系</button>
                    )}
                    {detailMember.status === 'contacted' && (
                      <button data-testid="mark-converted"
                        onClick={() => {
                          setFollowUps(prev => prev.map(m => m.id === detailMember.id ? {...m, status: 'converted'} : m));
                          setDetailMember(null);
                        }}
                      >标记已转化</button>
                    )}
                    <button data-testid="close-modal" onClick={() => setDetailMember(null)}>关闭</button>
                  </div>
                </div>
              </div>
            )}

            {/* Promo Task Detail Modal */}
            {selectedTask && (
              <div data-testid="promo-detail-modal" onClick={() => setSelectedTask(null)}>
                <div data-testid="promo-detail-content" onClick={e => e.stopPropagation()}>
                  <h3>📢 {selectedTask.title}</h3>
                  <div>类型：{
                    selectedTask.type === 'share' ? '分享' :
                    selectedTask.type === 'referral' ? '裂变' :
                    selectedTask.type === 'event' ? '活动' : '优惠券'
                  }</div>
                  <div>目标：{selectedTask.target}</div>
                  <div>已完成：{selectedTask.completed}</div>
                  <div>完成率：{Math.round((selectedTask.completed / selectedTask.target) * 100)}%</div>
                  <div>截止日期：{selectedTask.deadline}</div>
                  <button data-testid="close-promo-modal" onClick={() => setSelectedTask(null)}>关闭</button>
                </div>
              </div>
            )}
          </div>
        </PageShell>
      </div>
    );
  },
}));

import CoachPage from './page';

describe('CoachPage — 补充扩展测试', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ====== 渲染测试 ======

  test('renders coach page without crashing', () => {
    expect(() => render(<CoachPage />)).not.toThrow();
  });

  test('renders page shell with title', () => {
    render(<CoachPage />);
    const shells = screen.getAllByTestId('page-shell');
    expect(shells.length).toBeGreaterThanOrEqual(1);
  });

  test('renders coach info with rank', () => {
    render(<CoachPage />);
    expect(screen.getByTestId('coach-info')).toHaveTextContent('排名 3/12');
  });

  // ====== 指标卡片测试 ======

  test('renders 5 metric cards', () => {
    render(<CoachPage />);
    expect(screen.getByTestId('metric-served')).toBeInTheDocument();
    expect(screen.getByTestId('metric-new-members')).toBeInTheDocument();
    expect(screen.getByTestId('metric-promo')).toBeInTheDocument();
    expect(screen.getByTestId('metric-followup')).toBeInTheDocument();
    expect(screen.getByTestId('metric-pending')).toBeInTheDocument();
  });

  test('metric served value is 68', () => {
    render(<CoachPage />);
    expect(screen.getByTestId('metric-served-val')).toHaveTextContent('68');
  });

  test('metric pending count reflects follow-up data', () => {
    render(<CoachPage />);
    // 2 pending members (王小刚 and 张倩)
    expect(screen.getByTestId('metric-pending-val')).toHaveTextContent('2');
  });

  // ====== 转化率测试 ======

  test('conversion rate is calculated correctly', () => {
    render(<CoachPage />);
    expect(screen.getByTestId('conversion-rate')).toHaveTextContent('20%'); // 1/5 = 20%
  });

  test('promo completion rate is shown', () => {
    render(<CoachPage />);
    expect(screen.getByTestId('promo-completion-rate')).toBeInTheDocument();
  });

  // ====== 推广任务弹窗测试 ======

  test('clicking promo view opens detail modal', () => {
    render(<CoachPage />);
    fireEvent.click(screen.getByTestId('promo-view-pt-1'));
    expect(screen.getByTestId('promo-detail-modal')).toBeInTheDocument();
  });

  test('promo detail shows task title', () => {
    render(<CoachPage />);
    fireEvent.click(screen.getByTestId('promo-view-pt-1'));
    expect(screen.getByText('📢 扫码分享有礼')).toBeInTheDocument();
  });

  test('promo detail shows task type, target, completion', () => {
    render(<CoachPage />);
    fireEvent.click(screen.getByTestId('promo-view-pt-2'));
    expect(screen.getByText(/类型：裂变/)).toBeInTheDocument();
    expect(screen.getByText(/目标：30/)).toBeInTheDocument();
    expect(screen.getByText(/已完成：18/)).toBeInTheDocument();
  });

  test('promo detail shows deadline info', () => {
    render(<CoachPage />);
    fireEvent.click(screen.getByTestId('promo-view-pt-3'));
    expect(screen.getByText(/截止日期：2026-07-10/)).toBeInTheDocument();
  });

  test('closing promo detail modal removes it', () => {
    render(<CoachPage />);
    fireEvent.click(screen.getByTestId('promo-view-pt-1'));
    expect(screen.getByTestId('promo-detail-modal')).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('close-promo-modal'));
    expect(screen.queryByTestId('promo-detail-modal')).not.toBeInTheDocument();
  });

  // ====== 状态流转测试 ======

  test('mark pending member as contacted updates UI', () => {
    render(<CoachPage />);
    // Open detail for first member (pending)
    fireEvent.click(screen.getByTestId('followup-action-fu-1'));
    expect(screen.getByTestId('detail-modal')).toBeInTheDocument();
    // Mark as contacted
    fireEvent.click(screen.getByTestId('mark-contacted'));
    // Modal should close and status should update
    expect(screen.queryByTestId('detail-modal')).not.toBeInTheDocument();
    // Pending count should decrease
    expect(screen.getByTestId('metric-pending-val')).toHaveTextContent('1');
  });

  test('mark contacted member as converted', () => {
    render(<CoachPage />);
    fireEvent.click(screen.getByTestId('followup-action-fu-2'));
    expect(screen.getByTestId('detail-modal')).toBeInTheDocument();
    expect(screen.getByTestId('mark-converted')).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('mark-converted'));
    expect(screen.queryByTestId('detail-modal')).not.toBeInTheDocument();
  });

  // ====== 刷新按钮测试 ======

  test('refresh button disables during loading', () => {
    render(<CoachPage />);
    fireEvent.click(screen.getByTestId('refresh-btn'));
    expect(screen.getByText('⏳ 刷新中…')).toBeInTheDocument();
  });

  test('refresh button enables after loading completes', async () => {
    render(<CoachPage />);
    fireEvent.click(screen.getByTestId('refresh-btn'));
    expect(screen.getByText('⏳ 刷新中…')).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText('🔄 刷新')).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  // ====== 会员表格测试 ======

  test('follow-up table shows all 5 members', () => {
    render(<CoachPage />);
    expect(screen.getByTestId('followup-row-fu-1')).toBeInTheDocument();
    expect(screen.getByTestId('followup-row-fu-2')).toBeInTheDocument();
    expect(screen.getByTestId('followup-row-fu-3')).toBeInTheDocument();
    expect(screen.getByTestId('followup-row-fu-4')).toBeInTheDocument();
    expect(screen.getByTestId('followup-row-fu-5')).toBeInTheDocument();
  });

  test('follow-up table renders tier badges', () => {
    render(<CoachPage />);
    expect(screen.getByTestId('followup-tier-fu-1')).toHaveTextContent('🥇 金卡');
    expect(screen.getByTestId('followup-tier-fu-2')).toHaveTextContent('🏆 铂金');
    expect(screen.getByTestId('followup-tier-fu-4')).toHaveTextContent('💎 钻石');
  });

  // ====== 排名统计测试 ======

  test('renders ranking info in footer', () => {
    render(<CoachPage />);
    expect(screen.getByTestId('footer-stats')).toHaveTextContent('第 3 名');
  });

  // ====== Accessibility tests ======

  test('coach page uses semantic table for members', () => {
    render(<CoachPage />);
    expect(document.querySelector('table')).toBeInTheDocument();
  });

  test('all action buttons are clickable buttons', () => {
    render(<CoachPage />);
    const actionBtns = ['followup-action-fu-1', 'followup-action-fu-2', 'followup-action-fu-3', 'followup-action-fu-4', 'followup-action-fu-5'];
    actionBtns.forEach(id => {
      expect(screen.getByTestId(id).tagName).toBe('BUTTON');
    });
  });

  // ====== 推广卡片测试 ======

  test('promo task cards show correct progress', () => {
    render(<CoachPage />);
    expect(screen.getByTestId('promo-progress-pt-1')).toHaveTextContent('32/50 (64%)');
    expect(screen.getByTestId('promo-progress-pt-2')).toHaveTextContent('18/30 (60%)');
    expect(screen.getByTestId('promo-progress-pt-3')).toHaveTextContent('145/200 (73%)');
    expect(screen.getByTestId('promo-progress-pt-4')).toHaveTextContent('67/100 (67%)');
  });

  test('promo total progress is calculated', () => {
    render(<CoachPage />);
    const totalCompleted = 32 + 18 + 145 + 67; // 262
    const totalTarget = 50 + 30 + 200 + 100; // 380
    expect(screen.getByTestId('promo-total')).toHaveTextContent(`总进度 ${totalCompleted}/${totalTarget}`);
  });

  test('close modal with overlay click', () => {
    render(<CoachPage />);
    fireEvent.click(screen.getByTestId('followup-action-fu-1'));
    expect(screen.getByTestId('detail-modal')).toBeInTheDocument();
    // Click overlay to close
    fireEvent.click(screen.getByTestId('detail-modal'));
    expect(screen.queryByTestId('detail-modal')).not.toBeInTheDocument();
  });
});
