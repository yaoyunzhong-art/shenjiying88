'use client';

import React, { useMemo } from 'react';
import { useParams } from 'next/navigation';

import {
  DetailShell,
  InfoRow,
  StatusBadge,
  useToast,
  type DetailShellAction,
} from '@m5/ui';

// ---- 类型 ----

type TransactionChannel = 'online' | 'offline';

interface SalesTransaction {
  id: string;
  date: string;
  customer: string;
  amount: number;
  items: number;
  store: string;
  channel: TransactionChannel;
  paymentMethod: string;
  category: string;
  salesClerk: string;
}

interface SalesMember {
  id: string;
  name: string;
  level: string;
  joinedAt: string;
  totalSpent: number;
  lastVisit: string;
}

// ---- Mock 数据 ----

const MOCK_TRANSACTIONS: Record<string, SalesTransaction> = {
  'T001': { id: 'T001', date: '2026-06-24 18:32', customer: '张三', amount: 568, items: 3, store: '旗舰店', channel: 'offline', paymentMethod: '微信支付', category: '饮品', salesClerk: '小王' },
  'T002': { id: 'T002', date: '2026-06-24 17:15', customer: '李四', amount: 1299, items: 5, store: '旗舰店', channel: 'offline', paymentMethod: '支付宝', category: '套餐', salesClerk: '小李' },
  'T003': { id: 'T003', date: '2026-06-24 16:40', customer: '王五', amount: 89, items: 1, store: '旗舰店', channel: 'online', paymentMethod: '微信支付', category: '饮品', salesClerk: '-' },
  'T004': { id: 'T004', date: '2026-06-24 15:00', customer: '赵六', amount: 450, items: 2, store: '社区店', channel: 'offline', paymentMethod: '现金', category: '烘焙', salesClerk: '小张' },
  'T005': { id: 'T005', date: '2026-06-24 14:22', customer: '陈七', amount: 780, items: 4, store: '旗舰店', channel: 'online', paymentMethod: '支付宝', category: '套餐', salesClerk: '-' },
  'T006': { id: 'T006', date: '2026-06-24 12:08', customer: '刘八', amount: 220, items: 1, store: '社区店', channel: 'offline', paymentMethod: '微信支付', category: '饮品', salesClerk: '小张' },
  'T007': { id: 'T007', date: '2026-06-24 10:45', customer: '孙九', amount: 1340, items: 6, store: '旗舰店', channel: 'offline', paymentMethod: '会员卡', category: '套餐', salesClerk: '小王' },
  'T008': { id: 'T008', date: '2026-06-24 09:30', customer: '周十', amount: 320, items: 2, store: '社区店', channel: 'offline', paymentMethod: '微信支付', category: '烘焙', salesClerk: '小张' },
};

const MOCK_MEMBERS: SalesMember[] = [
  { id: 'M001', name: '张三', level: '黄金', joinedAt: '2025-03-15', totalSpent: 12680, lastVisit: '2026-06-24' },
  { id: 'M002', name: '李四', level: '钻石', joinedAt: '2024-09-01', totalSpent: 45200, lastVisit: '2026-06-24' },
  { id: 'M003', name: '王五', level: '白银', joinedAt: '2026-01-10', totalSpent: 3890, lastVisit: '2026-06-24' },
  { id: 'M004', name: '赵六', level: '黄金', joinedAt: '2025-06-20', totalSpent: 8740, lastVisit: '2026-06-24' },
  { id: 'M005', name: '陈七', level: '白银', joinedAt: '2026-02-14', totalSpent: 2190, lastVisit: '2026-06-24' },
  { id: 'M006', name: '刘八', level: '黄金', joinedAt: '2025-08-05', totalSpent: 5630, lastVisit: '2026-06-24' },
  { id: 'M007', name: '孙九', level: '钻石', joinedAt: '2024-05-01', totalSpent: 62100, lastVisit: '2026-06-24' },
  { id: 'M008', name: '周十', level: '白银', joinedAt: '2026-04-18', totalSpent: 1450, lastVisit: '2026-06-24' },
];

// ---- Helper ----

function formatCurrency(amount: number): string {
  return `¥${amount.toLocaleString('zh-CN')}`;
}

// ---- 内联表格组件 ----

function SimpleTable({
  columns,
  rows,
  emptyText = '暂无数据',
}: {
  columns: { key: string; header: string }[];
  rows: Record<string, string | number>[];
  emptyText?: string;
}) {
  if (rows.length === 0) {
    return (
      <div style={{ padding: 24, textAlign: 'center', color: '#64748b', fontSize: 14 }}>
        {emptyText}
      </div>
    );
  }

  return (
    <div style={{ overflowX: 'auto', borderRadius: 10, border: '1px solid rgba(148,163,184,0.1)', background: 'rgba(15,23,42,0.2)' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr style={{ borderBottom: '1px solid rgba(148,163,184,0.1)', background: 'rgba(30,41,59,0.4)' }}>
            {columns.map((col) => (
              <th key={col.key} style={{ padding: '8px 12px', textAlign: 'left', color: '#64748b', fontWeight: 600, whiteSpace: 'nowrap' }}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => (
            <tr key={idx} style={{ borderBottom: '1px solid rgba(148,163,184,0.05)' }}>
              {columns.map((col) => (
                <td key={col.key} style={{ padding: '8px 12px', color: '#cbd5e1' }}>
                  {row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ---- 销售业绩详情页 ----

export default function SalesPerformanceDetailPage() {
  const params = useParams<{ id: string }>();
  const toast = useToast();

  const transaction = MOCK_TRANSACTIONS[params.id];
  const member = MOCK_MEMBERS.find((m) => m.name === transaction?.customer);

  const detailActions: DetailShellAction[] = useMemo(() => {
    if (!transaction) return [];
    return [
      {
        key: 'edit',
        label: '编辑交易',
        variant: 'secondary',
        onClick: () => {
          toast.info('编辑功能即将上线', { durationMs: 1500 });
        },
      },
      {
        key: 'void',
        label: '作废交易',
        variant: 'danger',
        onClick: () => {
          toast.error('作废操作需门店管理员权限', { durationMs: 2000 });
        },
      },
    ];
  }, [transaction, toast]);

  const infoSections = useMemo(() => {
    if (!transaction) return [];
    return [
      {
        title: '交易信息',
        content: (
          <div style={infoGroupStyle}>
            <InfoRow label="交易单号" value={transaction.id} />
            <InfoRow label="交易时间" value={transaction.date} />
            <InfoRow label="顾客姓名" value={transaction.customer} />
            <InfoRow label="所属门店" value={transaction.store} />
            <InfoRow label="交易渠道" value={transaction.channel === 'online' ? '线上' : '线下'} />
            <InfoRow label="支付方式" value={transaction.paymentMethod} />
            <InfoRow label="商品品类" value={transaction.category} />
            <InfoRow label="导购员" value={transaction.salesClerk} />
          </div>
        ),
      },
      {
        title: '交易金额',
        content: (
          <div style={infoGroupStyle}>
            <InfoRow label="商品件数" value={`${transaction.items} 件`} />
            <InfoRow
              label="交易金额"
              value={
                <span style={{ fontSize: 18, fontWeight: 700, color: '#4ade80' }}>
                  {formatCurrency(transaction.amount)}
                </span>
              }
            />
            <InfoRow label="平均单价" value={formatCurrency(Math.round(transaction.amount / transaction.items))} />
          </div>
        ),
      },
      ...(member
        ? [
            {
              title: '会员信息',
              content: (
                <div style={infoGroupStyle}>
                  <InfoRow label="会员编号" value={member.id} />
                  <InfoRow
                    label="会员等级"
                    value={
                      <StatusBadge
                        label={member.level}
                        variant={
                          member.level === '钻石'
                            ? 'success'
                            : member.level === '黄金'
                              ? 'warning'
                              : 'default'
                        }
                        size="sm"
                      />
                    }
                  />
                  <InfoRow label="注册日期" value={member.joinedAt} />
                  <InfoRow label="累计消费" value={formatCurrency(member.totalSpent)} />
                  <InfoRow label="最近到店" value={member.lastVisit} />
                </div>
              ),
            },
          ]
        : []),
    ];
  }, [transaction, member]);

  // ---- 404 ----

  if (!transaction) {
    return (
      <DetailShell
        title="交易详情"
        backLabel="返回销售业绩"
        backHref="/sales-performance"
        loading={false}
      >
        <div style={notFoundStyle}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
          <p style={{ margin: 0, fontSize: 15, color: '#94a3b8', lineHeight: 1.6 }}>
            未找到交易记录（ID: {params.id}）
          </p>
          <p style={{ margin: '8px 0 0', fontSize: 13, color: '#475569' }}>
            该交易可能已被删除，或单号不正确
          </p>
        </div>
      </DetailShell>
    );
  }

  const storeTransactions = Object.values(MOCK_TRANSACTIONS).filter(
    (t) => t.store === transaction.store && t.id !== transaction.id,
  );

  const txTableColumns = [
    { key: 'id', header: '单号' },
    { key: 'date', header: '时间' },
    { key: 'customer', header: '顾客' },
    { key: 'amount', header: '金额' },
    { key: 'items', header: '件数' },
    { key: 'channel', header: '渠道' },
    { key: 'paymentMethod', header: '支付方式' },
  ];
  const txTableRows = storeTransactions.map((t) => ({
    id: t.id,
    date: t.date,
    customer: t.customer,
    amount: `¥${t.amount}`,
    items: String(t.items),
    channel: t.channel === 'online' ? '线上' : '线下',
    paymentMethod: t.paymentMethod,
  }));

  const memberTableColumns = [
    { key: 'id', header: '编号' },
    { key: 'name', header: '姓名' },
    { key: 'level', header: '等级' },
    { key: 'joinedAt', header: '注册日期' },
    { key: 'totalSpent', header: '累计消费' },
    { key: 'lastVisit', header: '最近到店' },
  ];
  const memberTableRows = member
    ? MOCK_MEMBERS.filter((m) => m.id === member.id).map((m) => ({
        id: m.id,
        name: m.name,
        level: m.level,
        joinedAt: m.joinedAt,
        totalSpent: `¥${m.totalSpent.toLocaleString('zh-CN')}`,
        lastVisit: m.lastVisit,
      }))
    : [];

  return (
    <DetailShell
      title={`交易详情 · ${transaction.id}`}
      subtitle={`${transaction.store} · ${transaction.date} · ${transaction.customer}`}
      backLabel="返回销售业绩"
      backHref="/sales-performance"
      actions={detailActions}
      sections={infoSections}
      breadcrumbs={[
        { label: '首页', href: '/' },
        { label: '销售业绩', href: '/sales-performance' },
        { label: `交易 ${transaction.id}` },
      ]}
      loading={false}
    >
      {/* 统计行 */}
      <div style={statRowStyle}>
        <div style={statCardStyle}>
          <div style={{ fontSize: 12, color: '#64748b' }}>交易金额</div>
          <div style={{ fontSize: 26, fontWeight: 700, marginTop: 6, color: '#4ade80', fontVariantNumeric: 'tabular-nums' }}>
            {formatCurrency(transaction.amount)}
          </div>
        </div>
        <div style={statCardStyle}>
          <div style={{ fontSize: 12, color: '#64748b' }}>商品件数</div>
          <div style={{ fontSize: 26, fontWeight: 700, marginTop: 6, color: '#60a5fa', fontVariantNumeric: 'tabular-nums' }}>
            {transaction.items}
          </div>
        </div>
        <div style={statCardStyle}>
          <div style={{ fontSize: 12, color: '#64748b' }}>平均单价</div>
          <div style={{ fontSize: 26, fontWeight: 700, marginTop: 6, color: '#facc15', fontVariantNumeric: 'tabular-nums' }}>
            {formatCurrency(Math.round(transaction.amount / transaction.items))}
          </div>
        </div>
        <div style={statCardStyle}>
          <div style={{ fontSize: 12, color: '#64748b' }}>渠道</div>
          <div style={{ fontSize: 26, fontWeight: 700, marginTop: 6, color: transaction.channel === 'online' ? '#60a5fa' : '#4ade80', fontVariantNumeric: 'tabular-nums' }}>
            {transaction.channel === 'online' ? '线上' : '线下'}
          </div>
        </div>
      </div>

      {/* 该门店近期交易 */}
      <h3 style={{ fontSize: 15, fontWeight: 600, color: '#e2e8f0', margin: '28px 0 12px' }}>
        📋 {transaction.store} 近期交易
      </h3>
      <SimpleTable columns={txTableColumns} rows={txTableRows} emptyText={`${transaction.store} 暂无其他交易`} />

      {/* 会员信息表 */}
      {member && (
        <>
          <h3 style={{ fontSize: 15, fontWeight: 600, color: '#e2e8f0', margin: '28px 0 12px' }}>
            👤 {member.name} 会员信息
          </h3>
          <SimpleTable columns={memberTableColumns} rows={memberTableRows} emptyText="暂无会员信息" />
        </>
      )}

      <div style={footerStyle}>
        <p>💡 交易数据实时同步 · 修改需门店管理员权限</p>
      </div>
    </DetailShell>
  );
}

// ---- 样式 ----

const infoGroupStyle: React.CSSProperties = {
  padding: 16,
  borderRadius: 10,
  background: 'rgba(15, 23, 42, 0.25)',
  border: '1px solid rgba(148, 163, 184, 0.1)',
};

const notFoundStyle: React.CSSProperties = {
  textAlign: 'center',
  padding: 64,
};

const statRowStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
  gap: 12,
  marginBottom: 24,
};

const statCardStyle: React.CSSProperties = {
  borderRadius: 12,
  padding: '14px 16px',
  background: 'rgba(15, 23, 42, 0.35)',
  border: '1px solid rgba(148, 163, 184, 0.08)',
};

const footerStyle: React.CSSProperties = {
  textAlign: 'center',
  fontSize: 13,
  color: '#475569',
  padding: '32px 0 16px',
};
