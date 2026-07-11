'use client';

/**
 * 帮助中心-联系方式页面 - Contact Page
 * 角色: 🛒 前台消费者视角
 * 功能: 客服联系信息展示、意见反馈表单
 */

import React, { useState, useCallback, useMemo } from 'react';

// ================================================================
// Types
// ================================================================

interface ContactMethod {
  id: string;
  type: 'phone' | 'online' | 'email' | 'address' | 'wechat';
  label: string;
  value: string;
  subValue?: string;
  icon: string;
  available: boolean;
  availableHours?: string;
}

interface StoreAddress {
  id: string;
  name: string;
  address: string;
  phone: string;
  businessHours: string;
  distance?: string;
  subway?: string;
}

interface FeedbackForm {
  type: string;
  title: string;
  content: string;
  contactInfo: string;
}

type FeedbackType = 'suggestion' | 'complaint' | 'bug' | 'praise' | 'other';

// ================================================================
// Mock Data
// ================================================================

const CONTACT_METHODS: ContactMethod[] = [
  {
    id: 'c1',
    type: 'phone',
    label: '客服电话',
    value: '400-888-0000',
    subValue: '24小时客服热线，节假日照常服务',
    icon: '📞',
    available: true,
    availableHours: '24小时',
  },
  {
    id: 'c2',
    type: 'online',
    label: '在线客服',
    value: '在线咨询',
    subValue: '点击即可开始对话，专业客服即时响应',
    icon: '💬',
    available: true,
    availableHours: '09:00 - 23:00',
  },
  {
    id: 'c3',
    type: 'email',
    label: '电子邮箱',
    value: 'service@shenjiying.com',
    subValue: '工作日24小时内回复',
    icon: '📧',
    available: true,
  },
  {
    id: 'c4',
    type: 'wechat',
    label: '微信公众号',
    value: 'Shenjiying 玩家俱乐部',
    subValue: '扫描二维码关注，获取最新活动资讯',
    icon: '💚',
    available: true,
  },
  {
    id: 'c5',
    type: 'address',
    label: '总部地址',
    value: '上海市浦东新区张江高科技园区',
    subValue: '碧波路888号 Shenjiying大厦 2F',
    icon: '📍',
    available: true,
  },
];

const STORE_ADDRESSES: StoreAddress[] = [
  {
    id: 's1',
    name: 'Shenjiying 旗舰店（正大广场）',
    address: '上海市浦东新区陆家嘴西路168号正大广场5F',
    phone: '021-5888-1234',
    businessHours: '10:00 - 23:00（周末至00:00）',
    distance: '2.3km',
    subway: '陆家嘴站 2号线 2号口',
  },
  {
    id: 's2',
    name: 'Shenjiying 社区店（张江店）',
    address: '上海市浦东新区张江路188号汇智国际商业中心B1',
    phone: '021-5080-5678',
    businessHours: '10:00 - 22:00',
    distance: '4.1km',
    subway: '金科路站 2号线 1号口',
  },
  {
    id: 's3',
    name: 'Shenjiying 电竞中心（五角场）',
    address: '上海市杨浦区淞沪路77号万达广场3F',
    phone: '021-6520-9012',
    businessHours: '10:00 - 02:00（次日凌晨）',
    distance: '8.5km',
    subway: '五角场站 10号线 5号口',
  },
  {
    id: 's4',
    name: 'Shenjiying 旗舰店（静安寺）',
    address: '上海市静安区南京西路1618号久光百货6F',
    phone: '021-6217-3456',
    businessHours: '10:00 - 23:00',
    distance: '5.7km',
    subway: '静安寺站 2/7/14号线 1号口',
  },
  {
    id: 's5',
    name: 'Shenjiying 体验店（徐家汇）',
    address: '上海市徐汇区虹桥路1号港汇恒隆广场B2',
    phone: '021-6426-7890',
    businessHours: '10:00 - 22:00',
    distance: '6.9km',
    subway: '徐家汇站 1/9/11号线 11号口',
  },
];

const FEEDBACK_TYPES: { id: FeedbackType; label: string; icon: string }[] = [
  { id: 'suggestion', label: '意见建议', icon: '💡' },
  { id: 'complaint', label: '投诉投诉', icon: '😤' },
  { id: 'bug', label: '功能异常', icon: '🐛' },
  { id: 'praise', label: '表扬感谢', icon: '👍' },
  { id: 'other', label: '其他问题', icon: '💬' },
];

// ================================================================
// Styles
// ================================================================

const styles = {
  container: {
    maxWidth: 960,
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
    display: 'flex' as const,
    alignItems: 'center' as const,
    gap: 10,
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
  // Contact methods grid
  contactGrid: {
    display: 'grid' as const,
    gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
    gap: 12,
  },
  contactCard: {
    borderRadius: 14,
    padding: '20px',
    background: 'rgba(15,23,42,0.3)',
    border: '1px solid rgba(148,163,184,0.08)',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  contactIcon: {
    fontSize: 28,
    marginBottom: 10,
  },
  contactLabel: {
    fontSize: 14,
    fontWeight: 600,
    color: '#e2e8f0',
    marginBottom: 4,
  },
  contactValue: {
    fontSize: 16,
    fontWeight: 700,
    color: '#f1f5f9',
    marginBottom: 4,
  },
  contactSub: {
    fontSize: 12,
    color: '#64748b',
    lineHeight: 1.4,
  },
  contactHours: {
    fontSize: 11,
    color: '#22c55e',
    fontWeight: 600,
    marginTop: 6,
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
  },
  contactHoursOff: {
    fontSize: 11,
    color: '#ef4444',
    fontWeight: 600,
    marginTop: 6,
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
  },
  // Feedback form
  feedbackSection: {
    borderRadius: 16,
    padding: 28,
    background: 'rgba(15,23,42,0.3)',
    border: '1px solid rgba(148,163,184,0.08)',
  },
  feedbackTitle: {
    fontSize: 16,
    fontWeight: 700,
    color: '#e2e8f0',
    marginBottom: 8,
  },
  feedbackSub: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 20,
  },
  typeGrid: {
    display: 'flex' as const,
    gap: 6,
    flexWrap: 'wrap' as const,
    marginBottom: 18,
  },
  typeChip: (active: boolean): React.CSSProperties => ({
    padding: '6px 14px',
    borderRadius: 18,
    fontSize: 13,
    fontWeight: 500,
    cursor: 'pointer',
    border: active ? '1.5px solid #3b82f6' : '1px solid rgba(148,163,184,0.1)',
    background: active ? 'rgba(59,130,246,0.1)' : 'rgba(15,23,42,0.25)',
    color: active ? '#60a5fa' : '#94a3b8',
    transition: 'all 0.15s',
    whiteSpace: 'nowrap' as const,
  }),
  formField: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 12,
    color: '#94a3b8',
    marginBottom: 4,
    display: 'block',
  },
  fieldRequired: {
    color: '#ef4444',
    marginLeft: 2,
  },
  input: {
    width: '100%',
    borderRadius: 10,
    padding: '12px 14px',
    border: '1px solid rgba(148,163,184,0.2)',
    background: 'rgba(15,23,42,0.4)',
    color: '#f1f5f9',
    fontSize: 14,
    outline: 'none',
    boxSizing: 'border-box' as const,
    transition: 'border-color 0.2s',
  },
  textarea: {
    width: '100%',
    borderRadius: 10,
    padding: '12px 14px',
    border: '1px solid rgba(148,163,184,0.2)',
    background: 'rgba(15,23,42,0.4)',
    color: '#f1f5f9',
    fontSize: 14,
    outline: 'none',
    boxSizing: 'border-box' as const,
    resize: 'vertical' as const,
    minHeight: 120,
    fontFamily: 'inherit',
  },
  charCount: (count: number, max: number): React.CSSProperties => ({
    textAlign: 'right' as const,
    fontSize: 11,
    color: count > max * 0.9 ? '#f87171' : '#64748b',
    marginTop: 2,
  }),
  submitRow: {
    display: 'flex' as const,
    justifyContent: 'flex-end' as const,
    gap: 10,
    alignItems: 'center' as const,
  },
  btnPrimary: {
    borderRadius: 10,
    padding: '12px 32px',
    background: '#2563eb',
    color: '#fff',
    border: 'none',
    cursor: 'pointer',
    fontSize: 14,
    fontWeight: 600,
    transition: 'opacity 0.15s',
  },
  btnPrimaryDisabled: {
    borderRadius: 10,
    padding: '12px 32px',
    background: '#1e40af',
    color: '#64748b',
    border: 'none',
    cursor: 'not-allowed',
    fontSize: 14,
    fontWeight: 600,
    opacity: 0.5,
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
  // Stores
  storeList: {
    display: 'grid' as const,
    gap: 12,
  },
  storeCard: (expanded: boolean): React.CSSProperties => ({
    borderRadius: 14,
    padding: '16px 20px',
    background: 'rgba(15,23,42,0.25)',
    border: expanded ? '1px solid rgba(59,130,246,0.2)' : '1px solid rgba(148,163,184,0.08)',
    cursor: 'pointer',
    transition: 'all 0.15s',
  }),
  storeName: {
    fontSize: 14,
    fontWeight: 600,
    color: '#e2e8f0',
    marginBottom: 6,
  },
  storeDetail: {
    fontSize: 12,
    color: '#94a3b8',
    lineHeight: 1.6,
  },
  storeDetailLabel: {
    color: '#64748b',
    display: 'inline-block',
    minWidth: 60,
  },
  storeExpanded: {
    marginTop: 10,
    padding: '12px',
    borderRadius: 10,
    background: 'rgba(15,23,42,0.3)',
    border: '1px solid rgba(148,163,184,0.06)',
  },
  storeExpandedRow: {
    display: 'flex' as const,
    gap: 6,
    padding: '4px 0',
    fontSize: 12,
    color: '#94a3b8',
  },
  storeExpandedLabel: {
    color: '#64748b',
    minWidth: 56,
  },
  storeExpandIcon: (expanded: boolean): React.CSSProperties => ({
    fontSize: 11,
    color: '#64748b',
    transition: 'transform 0.2s',
    transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
    marginLeft: 4,
  }),
  // Toast
  toast: (show: boolean, isError?: boolean): React.CSSProperties => ({
    position: 'fixed' as const,
    bottom: 40,
    left: '50%',
    transform: show ? 'translateX(-50%) translateY(0)' : 'translateX(-50%) translateY(80px)',
    background: isError ? '#dc2626' : '#22c55e',
    color: '#fff',
    padding: '12px 28px',
    borderRadius: 12,
    fontSize: 14,
    fontWeight: 600,
    zIndex: 2000,
    transition: 'transform 0.3s ease, opacity 0.3s ease',
    opacity: show ? 1 : 0,
    pointerEvents: show ? 'auto' : 'none',
    boxShadow: isError ? '0 4px 20px rgba(220,38,38,0.3)' : '0 4px 20px rgba(34,197,94,0.3)',
    whiteSpace: 'nowrap' as const,
  }),
  // Divider
  divider: {
    width: '100%',
    height: 1,
    background: 'rgba(148,163,184,0.08)',
    margin: '36px 0',
  },
  // Contact action row
  contactActionRow: {
    display: 'flex' as const,
    gap: 10,
    marginTop: 16,
  },
  contactActionBtn: (color: string): React.CSSProperties => ({
    padding: '10px 20px',
    borderRadius: 10,
    background: `${color}15`,
    color,
    border: `1px solid ${color}30`,
    cursor: 'pointer',
    fontSize: 13,
    fontWeight: 600,
    display: 'flex' as const,
    alignItems: 'center' as const,
    gap: 6,
    transition: 'all 0.15s',
  }),
};

// ================================================================
// Component
// ================================================================

export default function ContactPage() {
  const [activeTab, setActiveTab] = useState<'contact' | 'feedback' | 'stores'>('contact');
  const [feedbackType, setFeedbackType] = useState<FeedbackType>('suggestion');
  const [feedbackTitle, setFeedbackTitle] = useState('');
  const [feedbackContent, setFeedbackContent] = useState('');
  const [feedbackContact, setFeedbackContact] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [toastError, setToastError] = useState(false);
  const [expandedStore, setExpandedStore] = useState<string | null>(null);

  const showSuccess = useCallback((msg: string) => {
    setToastMsg(msg);
    setToastError(false);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  }, []);

  const showError = useCallback((msg: string) => {
    setToastMsg(msg);
    setToastError(true);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  }, []);

  const canSubmit = useMemo(
    () => feedbackTitle.trim().length > 0 && feedbackContent.trim().length >= 10,
    [feedbackTitle, feedbackContent],
  );

  const handleSubmit = useCallback(() => {
    if (!canSubmit) {
      showError('请填写标题和至少10字的详细描述');
      return;
    }
    setSubmitting(true);
    // Simulate API call
    setTimeout(() => {
      setSubmitting(false);
      setFeedbackTitle('');
      setFeedbackContent('');
      setFeedbackContact('');
      setFeedbackType('suggestion');
      showSuccess('✅ 反馈已提交！感谢你的宝贵意见，我们将在1-3个工作日内回复。');
    }, 1500);
  }, [canSubmit, showSuccess, showError]);

  const copyToClipboard = useCallback(async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      showSuccess(`✅ ${label}已复制到剪贴板`);
    } catch {
      showError('复制失败，请手动复制');
    }
  }, [showSuccess, showError]);

  const handleCall = useCallback((phone: string) => {
    window.location.href = `tel:${phone}`;
  }, []);

  const tabs = [
    { key: 'contact', label: '📞 联系方式', icon: '📞' },
    { key: 'feedback', label: '✍️ 意见反馈', icon: '✍️' },
    { key: 'stores', label: '🏪 门店地址', icon: '🏪' },
  ];

  return (
    <main style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <h1 style={styles.headerTitle}>
          📞 联系我们
          <span style={{ fontSize: 13, color: '#64748b', fontWeight: 400 }}>
            客服与帮助
          </span>
        </h1>
        <p style={styles.headerSub}>
          遇到任何问题，欢迎通过以下方式联系我们
        </p>
      </div>

      {/* Tab Navigation */}
      <div style={{
        display: 'flex',
        gap: 4,
        marginBottom: 24,
        padding: 4,
        borderRadius: 14,
        background: 'rgba(15,23,42,0.3)',
        border: '1px solid rgba(148,163,184,0.06)',
        overflow: 'hidden',
      }}>
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key as typeof activeTab)}
            style={{
              flex: 1,
              padding: '10px 16px',
              borderRadius: 12,
              border: 'none',
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: 600,
              background: activeTab === t.key ? 'rgba(59,130,246,0.15)' : 'transparent',
              color: activeTab === t.key ? '#60a5fa' : '#94a3b8',
              transition: 'all 0.15s',
              whiteSpace: 'nowrap',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab: Contact Methods */}
      {activeTab === 'contact' && (
        <div style={styles.section}>
          <div style={{ ...styles.sectionTitle, marginBottom: 12 }}>
            📋 客服渠道
          </div>
          <div style={styles.contactGrid}>
            {CONTACT_METHODS.map(method => (
              <div
                key={method.id}
                style={styles.contactCard}
                onClick={() => {
                  if (method.type === 'phone') handleCall(method.value);
                  else if (method.type === 'email') copyToClipboard(method.value, '邮箱');
                  else copyToClipboard(method.value, `${method.label}`);
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.borderColor = 'rgba(59,130,246,0.3)';
                  (e.currentTarget as HTMLElement).style.background = 'rgba(59,130,246,0.06)';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.borderColor = 'rgba(148,163,184,0.08)';
                  (e.currentTarget as HTMLElement).style.background = 'rgba(15,23,42,0.3)';
                }}
              >
                <div style={styles.contactIcon}>{method.icon}</div>
                <div style={styles.contactLabel}>{method.label}</div>
                <div style={styles.contactValue}>{method.value}</div>
                <div style={styles.contactSub}>{method.subValue}</div>
                {method.availableHours && (
                  <div style={styles.contactHours}>
                    🕐 {method.availableHours}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div style={styles.contactActionRow}>
            <button
              style={styles.contactActionBtn('#22c55e')}
              onClick={() => handleCall('400-888-0000')}
            >
              📞 立即拨打
            </button>
            <button
              style={styles.contactActionBtn('#3b82f6')}
              onClick={() => copyToClipboard('service@shenjiying.com', '邮箱')}
            >
              📧 复制邮箱
            </button>
            <button
              style={styles.contactActionBtn('#8b5cf6')}
              onClick={() => copyToClipboard('Shenjiying 玩家俱乐部', '公众号')}
            >
              💚 复制公众号
            </button>
          </div>
        </div>
      )}

      {/* Tab: Feedback Form */}
      {activeTab === 'feedback' && (
        <div style={styles.feedbackSection}>
          <div style={styles.feedbackTitle}>✍️ 意见反馈</div>
          <div style={styles.feedbackSub}>
            你的每一条反馈都是我们进步的动力。请详细描述你的问题或建议。
          </div>

          <div style={styles.formField}>
            <label style={styles.fieldLabel}>
              反馈类型<span style={styles.fieldRequired}>*</span>
            </label>
            <div style={styles.typeGrid}>
              {FEEDBACK_TYPES.map(t => (
                <div
                  key={t.id}
                  style={styles.typeChip(feedbackType === t.id)}
                  onClick={() => setFeedbackType(t.id)}
                >
                  {t.icon} {t.label}
                </div>
              ))}
            </div>
          </div>

          <div style={styles.formField}>
            <label style={styles.fieldLabel}>
              标题<span style={styles.fieldRequired}>*</span>
            </label>
            <input
              style={styles.input}
              placeholder="用一句话概括你的问题或建议"
              value={feedbackTitle}
              onChange={e => setFeedbackTitle(e.target.value)}
              maxLength={100}
            />
            <div style={styles.charCount(feedbackTitle.length, 100)}>
              {feedbackTitle.length}/100
            </div>
          </div>

          <div style={styles.formField}>
            <label style={styles.fieldLabel}>
              详细描述<span style={styles.fieldRequired}>*</span>
            </label>
            <textarea
              style={styles.textarea}
              placeholder="请详细描述你的问题或建议，包括发生时间、具体现象、期待解决方案等..."
              value={feedbackContent}
              onChange={e => setFeedbackContent(e.target.value)}
              maxLength={2000}
            />
            <div style={styles.charCount(feedbackContent.length, 2000)}>
              {feedbackContent.length}/2000
            </div>
          </div>

          <div style={styles.formField}>
            <label style={styles.fieldLabel}>
              联系方式（选填）
              <span style={{ ...styles.fieldLabel, fontSize: 10, color: '#64748b', marginLeft: 4 }}>
                手机号、邮箱或微信号，便于我们与你联系
              </span>
            </label>
            <input
              style={styles.input}
              placeholder="留下联系方式，便于我们进一步沟通"
              value={feedbackContact}
              onChange={e => setFeedbackContact(e.target.value)}
              maxLength={50}
            />
          </div>

          <div style={styles.submitRow}>
            <span style={{ fontSize: 12, color: '#64748b' }}>
              {feedbackContent.length < 10 && feedbackContent.trim() !== ''
                ? '详细描述建议至少10个字'
                : ''}
            </span>
            <button
              style={canSubmit && !submitting ? styles.btnPrimary : styles.btnPrimaryDisabled}
              onClick={handleSubmit}
              disabled={!canSubmit || submitting}
            >
              {submitting ? '⏳ 提交中...' : '📤 提交反馈'}
            </button>
          </div>

          <div style={{
            marginTop: 20,
            padding: '12px 16px',
            borderRadius: 10,
            background: 'rgba(245,158,11,0.06)',
            border: '1px solid rgba(245,158,11,0.12)',
            fontSize: 12,
            color: '#94a3b8',
            lineHeight: 1.6,
          }}>
            <strong style={{ color: '#f59e0b' }}>💡 提示：</strong>
            紧急问题建议直接拨打客服电话 <strong style={{ color: '#f59e0b' }}>400-888-0000</strong>，
            或使用在线客服（09:00-23:00）以获得即时响应。
          </div>
        </div>
      )}

      {/* Tab: Store Addresses */}
      {activeTab === 'stores' && (
        <div style={styles.section}>
          <div style={{ ...styles.sectionTitle, marginBottom: 12 }}>
            🏪 门店地址
            <span style={{ fontSize: 12, color: '#64748b', fontWeight: 400 }}>
              共 {STORE_ADDRESSES.length} 家门店
            </span>
          </div>
          <div style={styles.storeList}>
            {STORE_ADDRESSES.map(store => (
              <div
                key={store.id}
                style={styles.storeCard(expandedStore === store.id)}
                onClick={() => setExpandedStore(prev => prev === store.id ? null : store.id)}
              >
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                }}>
                  <div style={{ flex: 1 }}>
                    <div style={styles.storeName}>🏪 {store.name}</div>
                    <div style={styles.storeDetail}>
                      📍 {store.address}
                    </div>
                    {expandedStore !== store.id && (
                      <div style={{ ...styles.storeDetail, marginTop: 4 }}>
                        🕐 {store.businessHours}
                      </div>
                    )}
                  </div>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    color: '#64748b',
                    fontSize: 13,
                    flexShrink: 0,
                  }}>
                    {store.distance && (
                      <span style={{ fontSize: 12, background: 'rgba(59,130,246,0.08)', padding: '2px 8px', borderRadius: 4, color: '#93c5fd' }}>
                        {store.distance}
                      </span>
                    )}
                    <span style={styles.storeExpandIcon(expandedStore === store.id)}>▼</span>
                  </div>
                </div>
                {expandedStore === store.id && (
                  <div style={styles.storeExpanded}>
                    <div style={styles.storeExpandedRow}>
                      <span style={styles.storeExpandedLabel}>📍 地址</span>
                      <span>{store.address}</span>
                    </div>
                    <div style={styles.storeExpandedRow}>
                      <span style={styles.storeExpandedLabel}>📞 电话</span>
                      <span
                        style={{ color: '#60a5fa', cursor: 'pointer' }}
                        onClick={e => {
                          e.stopPropagation();
                          handleCall(store.phone);
                        }}
                      >
                        {store.phone}
                      </span>
                    </div>
                    <div style={styles.storeExpandedRow}>
                      <span style={styles.storeExpandedLabel}>🕐 营业</span>
                      <span>{store.businessHours}</span>
                    </div>
                    <div style={styles.storeExpandedRow}>
                      <span style={styles.storeExpandedLabel}>🚇 地铁</span>
                      <span>{store.subway}</span>
                    </div>
                    <div style={styles.storeExpandedRow}>
                      <span style={styles.storeExpandedLabel}>📏 距离</span>
                      <span>{store.distance}</span>
                    </div>
                    <div style={{
                      display: 'flex',
                      gap: 8,
                      marginTop: 10,
                    }}>
                      <button
                        style={styles.contactActionBtn('#3b82f6')}
                        onClick={e => {
                          e.stopPropagation();
                          handleCall(store.phone);
                        }}
                      >
                        📞 致电门店
                      </button>
                      <button
                        style={styles.contactActionBtn('#22c55e')}
                        onClick={e => {
                          e.stopPropagation();
                          const encoded = encodeURIComponent(store.address);
                          window.open(`https://uri.amap.com/marker?position=&name=${encoded}`, '_blank');
                        }}
                      >
                        🗺️ 导航前往
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Toast */}
      <div style={styles.toast(showToast, toastError)}>{toastMsg}</div>
    </main>
  );
}
