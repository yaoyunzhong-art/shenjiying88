'use client';

/**
 * 会员中心-支付设置页面 - Member Payment Page
 * 角色: 🛒 前台消费者视角
 * 功能: 已绑定支付方式展示、添加新支付方式、交易记录
 */

import React, { useState, useMemo, useCallback } from 'react';

// ================================================================
// Types
// ================================================================

type PaymentMethodType = 'wechat' | 'alipay' | 'bankcard';

interface BoundPayment {
  id: string;
  type: PaymentMethodType;
  label: string;
  accountName: string;
  accountNumber: string;    // masked
  icon: string;
  isDefault: boolean;
  boundAt: string;
}

interface TransactionRecord {
  id: string;
  type: 'recharge' | 'payment' | 'refund' | 'withdraw';
  amount: number;
  method: PaymentMethodType;
  methodLabel: string;
  description: string;
  status: 'success' | 'pending' | 'failed' | 'refunded';
  createdAt: string;
  orderNo: string;
}

// ================================================================
// Mock Data
// ================================================================

const MOCK_PAYMENTS: BoundPayment[] = [
  {
    id: 'pmt1',
    type: 'wechat',
    label: '微信支付',
    accountName: '张伟',
    accountNumber: 'wx****1234',
    icon: '💚',
    isDefault: true,
    boundAt: '2025-03-15',
  },
  {
    id: 'pmt2',
    type: 'alipay',
    label: '支付宝',
    accountName: '张伟',
    accountNumber: 'alipay****5678',
    icon: '💙',
    isDefault: false,
    boundAt: '2025-04-20',
  },
  {
    id: 'pmt3',
    type: 'bankcard',
    label: '招商银行',
    accountName: '张伟',
    accountNumber: '**** **** **** 8888',
    icon: '🏦',
    isDefault: false,
    boundAt: '2025-06-01',
  },
];

const METHOD_LABELS: Record<PaymentMethodType, string> = {
  wechat: '微信支付',
  alipay: '支付宝',
  bankcard: '银行卡',
};

const TRANSACTION_TYPES: Record<TransactionRecord['type'], { label: string; color: string }> = {
  recharge: { label: '充值', color: '#22c55e' },
  payment: { label: '消费', color: '#ef4444' },
  refund: { label: '退款', color: '#f59e0b' },
  withdraw: { label: '提现', color: '#8b5cf6' },
};

const TRANSACTION_STATUS: Record<TransactionRecord['status'], { label: string; color: string }> = {
  success: { label: '成功', color: '#22c55e' },
  pending: { label: '处理中', color: '#f59e0b' },
  failed: { label: '失败', color: '#ef4444' },
  refunded: { label: '已退款', color: '#64748b' },
};

function generateMockTransactions(): TransactionRecord[] {
  const records: TransactionRecord[] = [];
  const descriptions = [
    '会员充值 - 300元档',
    '场地预约 - 电竞区2小时',
    '会员充值 - 1000元档',
    '购买套餐 - 双人畅玩券',
    '退款 - 预约取消',
    '会员充值 - 500元档',
    '场地预约 - VR体验45分钟',
    '提现 - 余额转出',
    '会员充值 - 200元档',
    '消费 - 射击区1小时',
    '退款 - 设备故障',
    '会员充值 - 800元档',
  ];
  const typesList: TransactionRecord['type'][] = ['recharge', 'payment', 'refund', 'withdraw'];

  for (let i = 0; i < 12; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const type = typesList[i % 4];
    records.push({
      id: `txn-${1000 + i}`,
      type,
      amount: type === 'refund' || type === 'payment' ? -(Math.floor(Math.random() * 500) + 30) : Math.floor(Math.random() * 1000) + 100,
      method: ['wechat', 'alipay', 'bankcard', 'wechat', 'alipay', 'wechat'][i % 6] as PaymentMethodType,
      methodLabel: ['微信支付', '支付宝', '招商银行', '微信支付', '支付宝', '微信支付'][i % 6],
      description: descriptions[i],
      status: i === 3 ? 'pending' : i === 7 ? 'failed' : i === 9 ? 'refunded' : 'success',
      createdAt: d.toISOString().split('T')[0] + ' ' + String(10 + i).padStart(2, '0') + ':' + String(30 + i).padStart(2, '0'),
      orderNo: `ORD${20260601000 + i}`,
    });
  }
  return records;
}

const MOCK_TRANSACTIONS = generateMockTransactions();

// ================================================================
// Styles
// ================================================================

const styles = {
  container: {
    maxWidth: 900,
    margin: '0 auto' as const,
    padding: '32px 20px',
    color: '#e2e8f0',
  },
  header: {
    marginBottom: 32,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 700,
    color: '#f1f5f9',
    margin: 0,
  },
  headerSub: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 4,
  },
  section: {
    marginBottom: 36,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 700,
    color: '#e2e8f0',
    marginBottom: 16,
    display: 'flex' as const,
    alignItems: 'center' as const,
    gap: 8,
  },
  sectionBadge: (count: number): React.CSSProperties => ({
    fontSize: 11,
    padding: '1px 8px',
    borderRadius: 10,
    background: 'rgba(148,163,184,0.12)',
    color: '#94a3b8',
    fontWeight: 600,
  }),
  paymentGrid: {
    display: 'grid' as const,
    gap: 12,
  },
  paymentCard: {
    borderRadius: 14,
    padding: '18px 20px',
    background: 'rgba(15,23,42,0.35)',
    border: '1px solid rgba(148,163,184,0.1)',
    display: 'flex' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    transition: 'border-color 0.2s',
  },
  paymentLeft: {
    display: 'flex' as const,
    alignItems: 'center' as const,
    gap: 14,
  },
  paymentIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    display: 'flex' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    fontSize: 22,
    background: 'rgba(148,163,184,0.08)',
  },
  paymentName: {
    fontSize: 15,
    fontWeight: 600,
    color: '#f1f5f9',
  },
  paymentDetail: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  paymentRight: {
    display: 'flex' as const,
    alignItems: 'center' as const,
    gap: 12,
  },
  defaultBadge: {
    fontSize: 11,
    padding: '2px 10px',
    borderRadius: 8,
    background: 'rgba(59,130,246,0.12)',
    color: '#60a5fa',
    fontWeight: 600,
    whiteSpace: 'nowrap' as const,
  },
  actionBtn: {
    padding: '6px 12px',
    borderRadius: 8,
    background: 'rgba(148,163,184,0.08)',
    border: 'none',
    color: '#94a3b8',
    cursor: 'pointer',
    fontSize: 12,
    fontWeight: 500,
  },
  actionBtnDanger: {
    padding: '6px 12px',
    borderRadius: 8,
    background: 'rgba(239,68,68,0.08)',
    border: 'none',
    color: '#f87171',
    cursor: 'pointer',
    fontSize: 12,
    fontWeight: 500,
  },
  addPaymentBtn: {
    width: '100%' as const,
    padding: '16px',
    borderRadius: 14,
    border: '1.5px dashed rgba(148,163,184,0.2)',
    background: 'rgba(15,23,42,0.2)',
    color: '#94a3b8',
    cursor: 'pointer',
    fontSize: 14,
    fontWeight: 500,
    display: 'flex' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 8,
    marginTop: 12,
    transition: 'all 0.2s',
  },
  txnTable: {
    width: '100%',
    borderCollapse: 'collapse' as const,
    fontSize: 13,
  },
  txnTh: {
    textAlign: 'left' as const,
    padding: '10px 12px',
    color: '#64748b',
    fontWeight: 600,
    borderBottom: '1px solid rgba(148,163,184,0.08)',
    fontSize: 12,
    whiteSpace: 'nowrap' as const,
  },
  txnTd: {
    padding: '12px 12px',
    borderBottom: '1px solid rgba(148,163,184,0.06)',
    verticalAlign: 'middle' as const,
  },
  txnRowHover: {
    cursor: 'pointer',
    transition: 'background 0.15s',
  },
  txnType: (type: TransactionRecord['type']): React.CSSProperties => ({
    fontSize: 12,
    fontWeight: 600,
    color: TRANSACTION_TYPES[type].color,
  }),
  txnAmount: (amount: number): React.CSSProperties => ({
    fontWeight: 700,
    fontSize: 14,
    color: amount >= 0 ? '#22c55e' : '#f87171',
  }),
  txnStatus: (status: TransactionRecord['status']): React.CSSProperties => ({
    fontSize: 11,
    padding: '2px 8px',
    borderRadius: 6,
    background: `${TRANSACTION_STATUS[status].color}15`,
    color: TRANSACTION_STATUS[status].color,
    fontWeight: 600,
    display: 'inline-block',
  }),
  txnDesc: {
    color: '#e2e8f0',
    fontWeight: 500,
  },
  txnMeta: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  modalOverlay: {
    position: 'fixed' as const,
    inset: 0,
    background: 'rgba(0,0,0,0.55)',
    display: 'flex' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    zIndex: 1000,
    padding: 20,
  },
  modal: {
    width: '100%',
    maxWidth: 440,
    borderRadius: 16,
    background: '#1e293b',
    border: '1px solid rgba(148,163,184,0.15)',
    padding: 28,
    boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 700,
    color: '#f1f5f9',
    marginBottom: 24,
  },
  modalMethodGrid: {
    display: 'grid' as const,
    gridTemplateColumns: '1fr 1fr 1fr',
    gap: 12,
    marginBottom: 24,
  },
  modalMethodCard: (selected: boolean): React.CSSProperties => ({
    padding: '16px 8px',
    borderRadius: 12,
    textAlign: 'center' as const,
    cursor: 'pointer',
    border: selected ? '1.5px solid #3b82f6' : '1px solid rgba(148,163,184,0.12)',
    background: selected ? 'rgba(59,130,246,0.1)' : 'rgba(15,23,42,0.3)',
    transition: 'all 0.15s',
  }),
  modalMethodIcon: (selected: boolean): React.CSSProperties => ({
    fontSize: 28,
    marginBottom: 6,
    opacity: selected ? 1 : 0.6,
  }),
  modalMethodLabel: (selected: boolean): React.CSSProperties => ({
    fontSize: 12,
    fontWeight: 600,
    color: selected ? '#60a5fa' : '#94a3b8',
  }),
  modalInput: {
    width: '100%',
    borderRadius: 10,
    padding: '12px 14px',
    border: '1px solid rgba(148,163,184,0.2)',
    background: 'rgba(15,23,42,0.4)',
    color: '#f1f5f9',
    fontSize: 14,
    outline: 'none',
    boxSizing: 'border-box' as const,
    marginBottom: 14,
  },
  modalLabel: {
    fontSize: 12,
    color: '#94a3b8',
    marginBottom: 4,
    display: 'block',
  },
  modalActions: {
    display: 'flex' as const,
    gap: 10,
    marginTop: 8,
    justifyContent: 'flex-end' as const,
  },
  btnPrimary: {
    borderRadius: 10,
    padding: '10px 24px',
    background: '#2563eb',
    color: '#fff',
    border: 'none',
    cursor: 'pointer',
    fontSize: 14,
    fontWeight: 600,
  },
  btnSecondary: {
    borderRadius: 10,
    padding: '10px 24px',
    background: 'rgba(148,163,184,0.1)',
    color: '#94a3b8',
    border: 'none',
    cursor: 'pointer',
    fontSize: 14,
    fontWeight: 500,
  },
  txnDetailRow: {
    display: 'flex' as const,
    justifyContent: 'space-between' as const,
    padding: '8px 0',
    fontSize: 13,
    borderBottom: '1px solid rgba(148,163,184,0.06)',
  },
  txnDetailLabel: {
    color: '#64748b',
  },
  txnDetailValue: {
    color: '#e2e8f0',
    fontWeight: 500,
  },
  toast: (show: boolean): React.CSSProperties => ({
    position: 'fixed' as const,
    bottom: 40,
    left: '50%',
    transform: show ? 'translateX(-50%) translateY(0)' : 'translateX(-50%) translateY(80px)',
    background: '#22c55e',
    color: '#fff',
    padding: '12px 28px',
    borderRadius: 12,
    fontSize: 14,
    fontWeight: 600,
    zIndex: 2000,
    transition: 'transform 0.3s ease, opacity 0.3s ease',
    opacity: show ? 1 : 0,
    pointerEvents: show ? 'auto' : 'none',
    boxShadow: '0 4px 20px rgba(34,197,94,0.3)',
    whiteSpace: 'nowrap' as const,
  }),
  filterRow: {
    display: 'flex' as const,
    gap: 6,
    flexWrap: 'wrap' as const,
    marginBottom: 16,
  },
  filterChip: (active: boolean): React.CSSProperties => ({
    padding: '5px 12px',
    borderRadius: 16,
    fontSize: 12,
    fontWeight: 500,
    cursor: 'pointer',
    border: active ? '1.5px solid #3b82f6' : '1px solid rgba(148,163,184,0.1)',
    background: active ? 'rgba(59,130,246,0.1)' : 'transparent',
    color: active ? '#60a5fa' : '#94a3b8',
    transition: 'all 0.15s',
    whiteSpace: 'nowrap' as const,
  }),
  emptyTxn: {
    textAlign: 'center' as const,
    padding: '48px 20px',
    color: '#64748b',
    fontSize: 14,
  },
};

const NEW_METHODS = [
  { type: 'wechat' as PaymentMethodType, label: '微信支付', icon: '💚' },
  { type: 'alipay' as PaymentMethodType, label: '支付宝', icon: '💙' },
  { type: 'bankcard' as PaymentMethodType, label: '银行卡', icon: '🏦' },
];

// ================================================================
// Component
// ================================================================

export default function PaymentSettingsPage() {
  const [payments, setPayments] = useState<BoundPayment[]>(MOCK_PAYMENTS);
  const [showAddPayment, setShowAddPayment] = useState(false);
  const [newMethodType, setNewMethodType] = useState<PaymentMethodType>('wechat');
  const [newAccountName, setNewAccountName] = useState('');
  const [newAccountNumber, setNewAccountNumber] = useState('');
  const [txnFilter, setTxnFilter] = useState<'all' | TransactionRecord['type']>('all');
  const [selectedTxn, setSelectedTxn] = useState<TransactionRecord | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  const transactions = useMemo(() => MOCK_TRANSACTIONS, []);

  const filteredTxns = useMemo(() => {
    if (txnFilter === 'all') return transactions;
    return transactions.filter(t => t.type === txnFilter);
  }, [transactions, txnFilter]);

  const showSuccess = useCallback((msg: string) => {
    setToastMsg(msg);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  }, []);

  const setDefaultPayment = useCallback((id: string) => {
    setPayments(prev =>
      prev.map(p => ({ ...p, isDefault: p.id === id })),
    );
    showSuccess('✅ 已设为默认支付方式');
  }, [showSuccess]);

  const removePayment = useCallback((id: string) => {
    setPayments(prev => prev.filter(p => p.id !== id));
    showSuccess('✅ 已解绑支付方式');
  }, [showSuccess]);

  const handleAddPayment = useCallback(() => {
    if (!newAccountName.trim() || !newAccountNumber.trim()) {
      setToastMsg('⚠️ 请填写完整信息');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
      return;
    }
    const newPmt: BoundPayment = {
      id: `pmt-${Date.now()}`,
      type: newMethodType,
      label: METHOD_LABELS[newMethodType],
      accountName: newAccountName,
      accountNumber: newAccountNumber.replace(/\d(?=\d{4})/g, '*').slice(-12).padStart(12, '') || '****',
      icon: NEW_METHODS.find(m => m.type === newMethodType)?.icon || '💳',
      isDefault: payments.length === 0,
      boundAt: new Date().toISOString().split('T')[0],
    };
    setPayments(prev => [...prev, newPmt]);
    setShowAddPayment(false);
    setNewAccountName('');
    setNewAccountNumber('');
    showSuccess('✅ 支付方式添加成功');
  }, [newMethodType, newAccountName, newAccountNumber, payments.length, showSuccess]);

  return (
    <main style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <h1 style={styles.headerTitle}>💳 支付设置</h1>
        <p style={styles.headerSub}>管理你的支付方式，查看交易记录</p>
      </div>

      {/* Payment Methods */}
      <div style={styles.section}>
        <div style={styles.sectionTitle}>
          💰 已绑定的支付方式
          <span style={styles.sectionBadge(payments.length)}>{payments.length} 个</span>
        </div>
        <div style={styles.paymentGrid}>
          {payments.map(pmt => (
            <div key={pmt.id} style={styles.paymentCard}>
              <div style={styles.paymentLeft}>
                <div style={styles.paymentIcon}>{pmt.icon}</div>
                <div>
                  <div style={styles.paymentName}>{pmt.label}</div>
                  <div style={styles.paymentDetail}>
                    {pmt.accountName} · {pmt.accountNumber}
                  </div>
                  <div style={{ fontSize: 11, color: '#475569', marginTop: 1 }}>
                    绑定于 {pmt.boundAt}
                  </div>
                </div>
              </div>
              <div style={styles.paymentRight}>
                {pmt.isDefault && <span style={styles.defaultBadge}>默认</span>}
                {!pmt.isDefault && (
                  <button
                    style={styles.actionBtn}
                    onClick={() => setDefaultPayment(pmt.id)}
                  >
                    设默认
                  </button>
                )}
                <button
                  style={styles.actionBtnDanger}
                  onClick={() => removePayment(pmt.id)}
                >
                  解绑
                </button>
              </div>
            </div>
          ))}
        </div>

        <button
          style={styles.addPaymentBtn}
          onClick={() => setShowAddPayment(true)}
        >
          ➕ 添加新支付方式
        </button>
      </div>

      {/* Transaction Records */}
      <div style={styles.section}>
        <div style={styles.sectionTitle}>
          📋 交易记录
          <span style={styles.sectionBadge(transactions.length)}>最近 {transactions.length} 条</span>
        </div>
        <div style={styles.filterRow}>
          {([
            { key: 'all', label: '全部' },
            { key: 'recharge', label: '充值' },
            { key: 'payment', label: '消费' },
            { key: 'refund', label: '退款' },
            { key: 'withdraw', label: '提现' },
          ] as { key: typeof txnFilter; label: string }[]).map(f => (
            <div
              key={f.key}
              style={styles.filterChip(txnFilter === f.key)}
              onClick={() => setTxnFilter(f.key)}
            >
              {f.label}
            </div>
          ))}
        </div>

        <div style={{
          borderRadius: 14,
          overflow: 'hidden',
          border: '1px solid rgba(148,163,184,0.08)',
          background: 'rgba(15,23,42,0.25)',
        }}>
          {filteredTxns.length === 0 ? (
            <div style={styles.emptyTxn}>暂无交易记录</div>
          ) : (
            <table style={{ ...styles.txnTable, minWidth: 650 }}>
              <thead>
                <tr>
                  <th style={styles.txnTh}>类型</th>
                  <th style={styles.txnTh}>描述</th>
                  <th style={styles.txnTh}>金额</th>
                  <th style={styles.txnTh}>支付方式</th>
                  <th style={styles.txnTh}>状态</th>
                  <th style={styles.txnTh}>时间</th>
                </tr>
              </thead>
              <tbody>
                {filteredTxns.map(txn => (
                  <tr
                    key={txn.id}
                    style={styles.txnRowHover}
                    onClick={() => setSelectedTxn(txn)}
                  >
                    <td style={styles.txnTd}>
                      <span style={styles.txnType(txn.type)}>
                        {TRANSACTION_TYPES[txn.type].label}
                      </span>
                    </td>
                    <td style={styles.txnTd}>
                      <div style={styles.txnDesc}>{txn.description}</div>
                      <div style={styles.txnMeta}>{txn.orderNo}</div>
                    </td>
                    <td style={styles.txnTd}>
                      <span style={styles.txnAmount(txn.amount)}>
                        {txn.amount >= 0 ? '+' : ''}¥{txn.amount.toLocaleString()}
                      </span>
                    </td>
                    <td style={{ ...styles.txnTd, color: '#94a3b8', fontSize: 12 }}>
                      {txn.methodLabel}
                    </td>
                    <td style={styles.txnTd}>
                      <span style={styles.txnStatus(txn.status)}>
                        {TRANSACTION_STATUS[txn.status].label}
                      </span>
                    </td>
                    <td style={{ ...styles.txnTd, color: '#64748b', fontSize: 11, whiteSpace: 'nowrap' }}>
                      {txn.createdAt}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Add Payment Modal */}
      {showAddPayment && (
        <div style={styles.modalOverlay} onClick={() => setShowAddPayment(false)}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <div style={styles.modalTitle}>➕ 添加支付方式</div>
            <div style={{ marginBottom: 16 }}>
              <div style={{ ...styles.modalLabel, marginBottom: 8 }}>选择支付方式</div>
              <div style={styles.modalMethodGrid}>
                {NEW_METHODS.map(m => (
                  <div
                    key={m.type}
                    style={styles.modalMethodCard(newMethodType === m.type)}
                    onClick={() => setNewMethodType(m.type)}
                  >
                    <div style={styles.modalMethodIcon(newMethodType === m.type)}>{m.icon}</div>
                    <div style={styles.modalMethodLabel(newMethodType === m.type)}>{m.label}</div>
                  </div>
                ))}
              </div>
            </div>
            <label style={styles.modalLabel}>账户名称</label>
            <input
              style={styles.modalInput}
              placeholder="输入账户名"
              value={newAccountName}
              onChange={e => setNewAccountName(e.target.value)}
            />
            <label style={styles.modalLabel}>
              {newMethodType === 'bankcard' ? '卡号' : '账号'}
            </label>
            <input
              style={styles.modalInput}
              placeholder={newMethodType === 'bankcard' ? '输入银行卡号' : '输入账号'}
              value={newAccountNumber}
              onChange={e => setNewAccountNumber(e.target.value)}
            />
            <div style={styles.modalActions}>
              <button style={styles.btnSecondary} onClick={() => setShowAddPayment(false)}>
                取消
              </button>
              <button style={styles.btnPrimary} onClick={handleAddPayment}>
                ✅ 确认添加
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Transaction Detail Modal */}
      {selectedTxn && (
        <div style={styles.modalOverlay} onClick={() => setSelectedTxn(null)}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <div style={styles.modalTitle}>📄 交易详情</div>
            <div>
              <div style={styles.txnDetailRow}>
                <span style={styles.txnDetailLabel}>交易单号</span>
                <span style={styles.txnDetailValue}>{selectedTxn.orderNo}</span>
              </div>
              <div style={styles.txnDetailRow}>
                <span style={styles.txnDetailLabel}>类型</span>
                <span style={{ ...styles.txnDetailValue, color: TRANSACTION_TYPES[selectedTxn.type].color }}>
                  {TRANSACTION_TYPES[selectedTxn.type].label}
                </span>
              </div>
              <div style={styles.txnDetailRow}>
                <span style={styles.txnDetailLabel}>金额</span>
                <span style={{ ...styles.txnAmount(selectedTxn.amount), fontSize: 16 }}>
                  {selectedTxn.amount >= 0 ? '+' : ''}¥{selectedTxn.amount.toLocaleString()}
                </span>
              </div>
              <div style={styles.txnDetailRow}>
                <span style={styles.txnDetailLabel}>描述</span>
                <span style={styles.txnDetailValue}>{selectedTxn.description}</span>
              </div>
              <div style={styles.txnDetailRow}>
                <span style={styles.txnDetailLabel}>支付方式</span>
                <span style={styles.txnDetailValue}>{selectedTxn.methodLabel}</span>
              </div>
              <div style={styles.txnDetailRow}>
                <span style={styles.txnDetailLabel}>状态</span>
                <span style={{ ...styles.txnDetailValue, color: TRANSACTION_STATUS[selectedTxn.status].color }}>
                  {TRANSACTION_STATUS[selectedTxn.status].label}
                </span>
              </div>
              <div style={styles.txnDetailRow}>
                <span style={styles.txnDetailLabel}>时间</span>
                <span style={styles.txnDetailValue}>{selectedTxn.createdAt}</span>
              </div>
            </div>
            <div style={styles.modalActions}>
              <button style={styles.btnSecondary} onClick={() => setSelectedTxn(null)}>
                关闭
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      <div style={styles.toast(showToast)}>{toastMsg}</div>
    </main>
  );
}
