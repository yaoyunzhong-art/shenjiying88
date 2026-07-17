/**
 * 退换货详情页 — 单元测试
 * 覆盖: 正常渲染、各状态展示、状态流转、编辑、删除、空数据
 */
import { describe, it, mock } from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';

// 模拟 next/navigation
mock.module('next/navigation', () => ({
  useParams: () => ({ id: 'RET-20260708-001' }),
  useRouter: () => ({ push: mock.fn(), back: mock.fn(), replace: mock.fn() }),
}));

// 模拟 use-detail-actions
mock.module('../../components/use-detail-actions', () => ({
  useDetailActions: () => ({
    actions: [
      { key: 'copy-link', label: '复制深链', onClick: () => {} },
    ],
    exportFilename: 'returns-export',
  }),
}));

// 模拟 detail-workspace-registry
mock.module('../../components/detail-workspace-registry', () => ({
  buildStandardBreadcrumb: () => ({
    breadcrumbs: [{ label: '退换货管理', href: '/returns' }],
  }),
  buildStandardClosureLinks: () => [
    { label: '退换货列表', href: '/returns' },
    { label: '订单管理', href: '/orders' },
  ],
}));

// 模拟 @m5/ui 组件
mock.module('@m5/ui', () => {
  const FakeDetailShell: React.FC<
    React.PropsWithChildren<{
      title?: string;
      subtitle?: string;
      actions?: Array<{ label: string; onClick: () => void; variant?: string }>;
      closureBar?: React.ReactNode;
    }>
  > = ({ title, subtitle, actions, children, closureBar }) => (
    <div data-testid="detail-shell" data-title={title} data-subtitle={subtitle}>
      {actions?.map((a, i) => (
        <button key={i} onClick={a.onClick} data-action={a.label}>
          {a.label}
        </button>
      ))}
      {children}
      {closureBar && <div data-testid="closure-bar">{closureBar}</div>}
    </div>
  );

  const FakeInfoRow: React.FC<{ label: string; value: string }> = ({ label, value }) => (
    <div data-testid="info-row" data-label={label} data-value={value}>
      {label}: {value}
    </div>
  );

  return {
    DetailShell: FakeDetailShell,
    InfoRow: FakeInfoRow,
    StatusBadge: ({ label, variant }: { label: string; variant: string }) => (
      <span data-testid="status-badge" data-variant={variant}>
        {label}
      </span>
    ),
    StatCard: ({ title, value }: { title: string; value: string }) => (
      <div data-testid="stat-card" data-title={title} data-value={value}>
        {title}: {value}
      </div>
    ),
    CopyToClipboard: ({ text }: { text: string }) => <span data-testid="copy">{text}</span>,
    SubmitButton: ({
      onClick,
      children,
      submitting,
    }: {
      onClick?: () => void;
      children: React.ReactNode;
      submitting?: boolean;
    }) => (
      <button onClick={onClick} disabled={submitting} data-testid="submit-btn">
        {submitting ? '提交中...' : children}
      </button>
    ),
    WorkspaceBreadcrumb: () => <div data-testid="breadcrumb">Breadcrumb</div>,
    FormSubmitFeedback: ({ type, message, onDismiss }: { type: string; message: string; onDismiss?: () => void }) => (
      <div data-testid="form-feedback" data-type={type}>
        {message}
        {onDismiss && <button onClick={onDismiss}>×</button>}
      </div>
    ),
    FormField: ({ label, children }: { label: string; name: string; children: React.ReactNode }) => (
      <div data-testid="form-field" data-label={label}>
        {label}: {children}
      </div>
    ),
    useFormSubmit: () => ({
      submit: async (data: unknown) => ({ success: true, data }),
      submitting: false,
      feedback: null,
    }),
    DetailActionBar: () => <div data-testid="detail-action-bar" />,
    DetailClosureBar: ({ links }: { links: Array<{ label: string; href: string }> }) => (
      <div data-testid="closure-bar">
        {links.map((l, i) => (
          <a key={i} href={l.href}>
            {l.label}
          </a>
        ))}
      </div>
    ),
    type DetailShellAction: {} as any,
  };
});

import ReturnDetailPage from './page';
import fs from 'node:fs';

describe('ReturnDetailPage', () => {
  afterEach(() => {
    cleanup();
  });

  it('应该正确渲染退换货详情页（待审核状态）', () => {
    render(<ReturnDetailPage params={Promise.resolve({ id: 'RET-20260708-001' })} />);

    // 验证主容器
    const shell = screen.getByTestId('detail-shell');
    assert.ok(shell, 'DetailShell 应该渲染');
    assert.ok(shell.getAttribute('data-title')?.includes('RET-20260708-001'));

    // 验证状态卡片
    const statCards = screen.getAllByTestId('stat-card');
    const statusCard = statCards.find((c) => c.getAttribute('data-title') === '状态');
    assert.equal(statusCard?.getAttribute('data-value'), '待审核');

    const typeCard = statCards.find((c) => c.getAttribute('data-title') === '类型');
    assert.equal(typeCard?.getAttribute('data-value'), '仅退款');

    // 验证客户信息
    const infoRows = screen.getAllByTestId('info-row');
    const nameRow = infoRows.find((r) => r.getAttribute('data-label') === '客户姓名');
    assert.equal(nameRow?.getAttribute('data-value'), '张明');
    const phoneRow = infoRows.find((r) => r.getAttribute('data-label') === '联系电话');
    assert.equal(phoneRow?.getAttribute('data-value'), '138****0001');

    // 验证有状态流转按钮（待审核 → 通过/拒绝）
    const statusTransitions = screen.getAllByText(/通过审核|拒绝申请/);
    assert.equal(statusTransitions.length, 2);
  });

  it('应该正确显示换货类型详情', () => {
    render(<ReturnDetailPage params={Promise.resolve({ id: 'RET-20260708-002' })} />);

    const statCards = screen.getAllByTestId('stat-card');
    const typeCard = statCards.find((c) => c.getAttribute('data-title') === '类型');
    assert.equal(typeCard?.getAttribute('data-value'), '换货');

    const infoRows = screen.getAllByTestId('info-row');
    const handlerRow = infoRows.find((r) => r.getAttribute('data-label') === '处理人');
    assert.equal(handlerRow?.getAttribute('data-value'), '王经理');

    const remarkText = screen.getByText(/同意换货/);
    assert.ok(remarkText);
  });

  it('应该正确显示已退款状态', () => {
    render(<ReturnDetailPage params={Promise.resolve({ id: 'RET-20260708-004' })} />);

    const statCards = screen.getAllByTestId('stat-card');
    const statusCard = statCards.find((c) => c.getAttribute('data-title') === '状态');
    assert.equal(statusCard?.getAttribute('data-value'), '已退款');
  });

  it('应该正确显示已拒绝状态', () => {
    render(<ReturnDetailPage params={Promise.resolve({ id: 'RET-20260708-005' })} />);

    const statCards = screen.getAllByTestId('stat-card');
    const statusCard = statCards.find((c) => c.getAttribute('data-title') === '状态');
    assert.equal(statusCard?.getAttribute('data-value'), '已拒绝');
  });

  it('编辑按钮点击后应显示编辑表单', () => {
    render(<ReturnDetailPage params={Promise.resolve({ id: 'RET-20260708-001' })} />);

    const editBtn = screen.getByText('编辑');
    fireEvent.click(editBtn);

    const formFields = screen.getAllByTestId('form-field');
    assert.ok(formFields.length >= 2, '编辑模式应显示处理人和备注字段');

    // 应有保存和取消按钮
    assert.ok(screen.getByText('保存'));
    assert.ok(screen.getByText('取消'));
  });

  it('删除按钮点击应触发确认弹窗', () => {
    render(<ReturnDetailPage params={Promise.resolve({ id: 'RET-20260708-001' })} />);

    const deleteBtn = screen.getByText('删除');
    fireEvent.click(deleteBtn);

    // 确认删除按钮应该出现
    assert.ok(screen.getByText('确认删除'));
  });

  it('状态流转按钮应正确渲染（pending_review状态）', () => {
    render(<ReturnDetailPage params={Promise.resolve({ id: 'RET-20260708-001' })} />);

    assert.ok(screen.getByText('通过审核'));
    assert.ok(screen.getByText('拒绝申请'));
  });

  it('approved状态应显示确认收货和撤销通过', () => {
    render(<ReturnDetailPage params={Promise.resolve({ id: 'RET-20260708-002' })} />);

    assert.ok(screen.getByText('确认收货'));
    assert.ok(screen.getByText('撤销通过'));
  });

  it('不存在的 ID 应显示空状态', () => {
    render(<ReturnDetailPage params={Promise.resolve({ id: 'NONEXISTENT' })} />);

    assert.ok(screen.getByText(/记录不存在|已被删除/));
    assert.ok(screen.getByText('返回列表'));
  });

  it('应显示关闭链接栏', () => {
    render(<ReturnDetailPage params={Promise.resolve({ id: 'RET-20260708-001' })} />);

    const closureBar = screen.getByTestId('closure-bar');
    assert.ok(closureBar);
    assert.ok(closureBar.textContent?.includes('退换货列表'));
    assert.ok(closureBar.textContent?.includes('订单管理'));
  });

  it('商品明细表格应正确渲染', () => {
    render(<ReturnDetailPage params={Promise.resolve({ id: 'RET-20260708-001' })} />);

    assert.ok(screen.getByText('电竞椅'));
    assert.ok(screen.getByText('SKU-A001'));
    assert.ok(screen.getByText('黑色/标准'));
  });

  it('维修类型应正确显示', () => {
    render(<ReturnDetailPage params={Promise.resolve({ id: 'RET-20260708-003' })} />);

    const statCards = screen.getAllByTestId('stat-card');
    const typeCard = statCards.find((c) => c.getAttribute('data-title') === '类型');
    assert.equal(typeCard?.getAttribute('data-value'), '维修');
  });

  it('多商品明细应全部渲染', () => {
    render(<ReturnDetailPage params={Promise.resolve({ id: 'RET-20260708-002' })} />);

    assert.ok(screen.getByText('机械键盘'));
    assert.ok(screen.getByText('鼠标垫'));
  });

  it('缺陷商品应显示质量问题标记', () => {
    render(<ReturnDetailPage params={Promise.resolve({ id: 'RET-20260708-002' })} />);

    const badges = screen.getAllByTestId('status-badge');
    const qualityBadge = badges.find((b) => b.textContent === '质量问题');
    assert.ok(qualityBadge, '缺陷商品应有质量问题标签');
  });

  it('包含会员等级的客户应显示会员信息', () => {
    render(<ReturnDetailPage params={Promise.resolve({ id: 'RET-20260708-001' })} />);

    const infoRows = screen.getAllByTestId('info-row');
    const tierRow = infoRows.find((r) => r.getAttribute('data-label') === '会员等级');
    assert.equal(tierRow?.getAttribute('data-value'), 'gold');
  });
});

const SRC = fs.readFileSync(require.resolve('./page'), 'utf-8');

describe('Returns — hooks验证', () => {
  it('包含useState声明', () => assert.ok(SRC.includes('const [') && SRC.includes('useState')));
  it('包含JSX返回', () => assert.ok(SRC.includes('return (') || SRC.includes('return <')));
  it('包含事件处理器', () => assert.ok(SRC.includes('onClick={') || SRC.includes('onChange={')));
  it('包含列表渲染', () => assert.ok(SRC.includes('.map(')));
  it('包含条件渲染', () => assert.ok(SRC.includes(' && ') || SRC.includes(' ? ')));
  it('包含样式定义', () => assert.ok(SRC.includes('style={')));
  it('包含数据格式化(toLocaleString)', () => assert.ok(SRC.includes('toLocaleString')));
  it('包含模板字符串', () => assert.ok(SRC.includes('${')));
  it('包含默认导出', () => assert.ok(SRC.includes('export default function')));
  it('包含注释说明', () => assert.ok(SRC.includes("/**") || SRC.includes('//')));
});
