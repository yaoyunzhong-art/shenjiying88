/**
 * 导购员跟进详情页 — Follow-up Client Detail (Next.js App Router Page)
 * 角色: 导购员视角，查看单个待跟进客户的完整信息和操作
 * 类型: B-详情页 (含编辑/状态流转)
 */
'use client';

import React, { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { PageShell, Button, Badge, Tag } from '@m5/ui';

// ============================================================
// 类型定义
// ============================================================

export interface FollowUpDetail {
  id: string;
  name: string;
  phone: string;
  tier: 'VIP' | 'GOLD' | 'SILVER' | 'REGULAR';
  lastVisit: string;
  reason: string;
  priority: 'high' | 'medium' | 'low';
  status: 'pending' | 'contacted' | 'converted' | 'lost';
  notes: string;
  totalSpent: number;
  visitCount: number;
  tags: string[];
  createdAt: string;
}

// ============================================================
// Mock 数据
// ============================================================

const MOCK_DETAILS: Record<string, FollowUpDetail> = {
  'fu-1': {
    id: 'fu-1',
    name: '王芳',
    phone: '138****5678',
    tier: 'VIP',
    lastVisit: '2026-06-26',
    reason: '有意向办理年度会员套餐，需跟进报价',
    priority: 'high',
    status: 'pending',
    notes: '客户对尊享套餐感兴趣，重点关注积分兑换和生日权益。已预约周六下午到店详谈。',
    totalSpent: 28500,
    visitCount: 68,
    tags: ['高消费', '常客', '会员升级潜力'],
    createdAt: '2026-06-26T10:30:00Z',
  },
  'fu-2': {
    id: 'fu-2',
    name: '李明',
    phone: '159****2341',
    tier: 'GOLD',
    lastVisit: '2026-06-25',
    reason: '对进口红酒感兴趣，待发送产品目录',
    priority: 'medium',
    status: 'contacted',
    notes: '已通过微信发送红酒目录PDF，客户表示需要和家人商量后再决定。',
    totalSpent: 15600,
    visitCount: 34,
    tags: ['红酒爱好者', '客单高'],
    createdAt: '2026-06-25T14:20:00Z',
  },
  'fu-3': {
    id: 'fu-3',
    name: '赵雪',
    phone: '176****9087',
    tier: 'SILVER',
    lastVisit: '2026-06-20',
    reason: '上次购物积分未到账，需跟进解决',
    priority: 'high',
    status: 'pending',
    notes: '系统显示积分已发放但未入账，技术部门排查中。已安抚客户，承诺48小时内解决。',
    totalSpent: 5800,
    visitCount: 18,
    tags: ['生鲜常购'],
    createdAt: '2026-06-20T09:15:00Z',
  },
};

// ============================================================
// 工具函数
// ============================================================

function getTierLabel(tier: string): string {
  const map: Record<string, string> = { VIP: 'VIP会员', GOLD: '金卡会员', SILVER: '银卡会员', REGULAR: '普通会员' };
  return map[tier] ?? tier;
}

function getTierColor(tier: string): string {
  const map: Record<string, string> = { VIP: '#f59e0b', GOLD: '#a78bfa', SILVER: '#94a3b8', REGULAR: '#6b7280' };
  return map[tier] ?? '#6b7280';
}

function getPriorityLabel(p: string): string {
  const map: Record<string, string> = { high: '高优先级', medium: '中优先级', low: '低优先级' };
  return map[p] ?? p;
}

function getStatusLabel(s: string): string {
  const map: Record<string, string> = { pending: '待跟进', contacted: '已联系', converted: '已转化', lost: '已流失' };
  return map[s] ?? s;
}

// ============================================================
// 样式
// ============================================================

const styles: Record<string, React.CSSProperties> = {
  container: {
    maxWidth: 800,
    margin: '0 auto',
    padding: '32px 24px',
  },
  backBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: '8px 16px',
    borderRadius: 8,
    background: 'rgba(15,23,42,0.4)',
    border: '1px solid rgba(148,163,184,0.12)',
    color: '#94a3b8',
    cursor: 'pointer',
    fontSize: 13,
    marginBottom: 24,
    transition: 'all 0.15s',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 28,
  },
  nameRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  name: {
    fontSize: 24,
    fontWeight: 700,
    color: '#f1f5f9',
    margin: 0,
  },
  section: {
    background: 'rgba(15,23,42,0.3)',
    border: '1px solid rgba(148,163,184,0.1)',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 600,
    color: '#94a3b8',
    marginBottom: 12,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  row: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '8px 0',
    borderBottom: '1px solid rgba(148,163,184,0.06)',
  },
  rowLabel: {
    color: '#64748b',
    fontSize: 13,
  },
  rowValue: {
    color: '#e2e8f0',
    fontSize: 13,
    fontWeight: 500,
  },
  actionRow: {
    display: 'flex',
    gap: 12,
    marginTop: 16,
    flexWrap: 'wrap' as const,
  },
  notesText: {
    color: '#cbd5e1',
    fontSize: 14,
    lineHeight: 1.7,
    whiteSpace: 'pre-wrap' as const,
  },
  tagRow: {
    display: 'flex',
    gap: 8,
    flexWrap: 'wrap' as const,
    marginTop: 8,
  },
  emptyText: {
    color: '#475569',
    fontSize: 14,
    textAlign: 'center' as const,
    padding: '40px 0',
  },
};

// ============================================================
// 导购员跟进详情页组件
// ============================================================

export default function FollowUpDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);
  const router = useRouter();
  const [detail, setDetail] = useState<FollowUpDetail | null>(() => MOCK_DETAILS[id] ?? null);
  const [toast, setToast] = useState<string | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }, []);

  const handleStatusChange = useCallback((newStatus: FollowUpDetail['status']) => {
    if (!detail) return;
    setIsTransitioning(true);
    setTimeout(() => {
      setDetail(prev => prev ? { ...prev, status: newStatus } : null);
      setIsTransitioning(false);
      const label = getStatusLabel(newStatus);
      showToast(`状态已更新: ${label}`);
    }, 400);
  }, [detail, showToast]);

  if (!detail) {
    return (
      <PageShell title="跟进详情" description="客户跟进详细信息">
        <div style={styles.container}>
          <div style={styles.emptyText}>未找到该客户跟进记录</div>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell title={`跟进详情 - ${detail.name}`} description={`导购跟进: ${detail.name}`}>
      <div style={styles.container}>
        {/* Toast */}
        {toast && (
          <div style={{
            position: 'fixed',
            top: 24,
            right: 24,
            zIndex: 9999,
            padding: '10px 20px',
            borderRadius: 10,
            background: '#22c55e',
            color: '#fff',
            fontWeight: 600,
            fontSize: 13,
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          }}>
            {toast}
          </div>
        )}

        {/* 返回按钮 */}
        <button
          style={styles.backBtn}
          onClick={() => router.push('/sales-guide')}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(30,41,59,0.5)'; e.currentTarget.style.color = '#e2e8f0'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(15,23,42,0.4)'; e.currentTarget.style.color = '#94a3b8'; }}
        >
          ← 返回导购工作台
        </button>

        {/* 头部信息 */}
        <div style={styles.header}>
          <div>
            <div style={styles.nameRow}>
              <h1 style={styles.name}>{detail.name}</h1>
              <Badge variant={detail.priority === 'high' ? 'error' : detail.priority === 'medium' ? 'warning' : 'info'}>
                {getPriorityLabel(detail.priority)}
              </Badge>
              <Badge variant={detail.status === 'pending' ? 'info' : detail.status === 'contacted' ? 'warning' : detail.status === 'converted' ? 'success' : 'default'}>
                {getStatusLabel(detail.status)}
              </Badge>
            </div>
          </div>
        </div>

        {/* 客户基本信息 */}
        <div style={styles.section}>
          <div style={styles.sectionTitle}>客户信息</div>
          <div style={styles.row}>
            <span style={styles.rowLabel}>会员等级</span>
            <span style={{ ...styles.rowValue, color: getTierColor(detail.tier) }}>{getTierLabel(detail.tier)}</span>
          </div>
          <div style={styles.row}>
            <span style={styles.rowLabel}>手机号</span>
            <span style={styles.rowValue}>{detail.phone}</span>
          </div>
          <div style={styles.row}>
            <span style={styles.rowLabel}>累计消费</span>
            <span style={styles.rowValue}>¥{detail.totalSpent.toLocaleString()}</span>
          </div>
          <div style={styles.row}>
            <span style={styles.rowLabel}>到店次数</span>
            <span style={styles.rowValue}>{detail.visitCount} 次</span>
          </div>
          <div style={styles.row}>
            <span style={styles.rowLabel}>最近到店</span>
            <span style={styles.rowValue}>{detail.lastVisit}</span>
          </div>
          <div style={styles.row}>
            <span style={styles.rowLabel}>创建时间</span>
            <span style={styles.rowValue}>{new Date(detail.createdAt).toLocaleString('zh-CN')}</span>
          </div>
          {detail.tags.length > 0 && (
            <div style={{ ...styles.tagRow, marginTop: 12 }}>
              {detail.tags.map(tag => (
                <Tag key={tag}>{tag}</Tag>
              ))}
            </div>
          )}
        </div>

        {/* 跟进原因 */}
        <div style={styles.section}>
          <div style={styles.sectionTitle}>跟进原因</div>
          <div style={styles.notesText}>{detail.reason}</div>
        </div>

        {/* 跟进备注 */}
        <div style={styles.section}>
          <div style={styles.sectionTitle}>跟进备注</div>
          <div style={styles.notesText}>{detail.notes}</div>
        </div>

        {/* 状态流转操作 */}
        <div style={{ ...styles.section, background: 'rgba(15,23,42,0.35)' }}>
          <div style={styles.sectionTitle}>操作</div>

          {isTransitioning && (
            <div style={{ color: '#64748b', fontSize: 13, marginBottom: 12 }}>正在更新状态...</div>
          )}

          <div style={styles.actionRow}>
            {detail.status === 'pending' && (
              <Button onClick={() => handleStatusChange('contacted')}>
                标记已联系
              </Button>
            )}
            {detail.status === 'contacted' && (
              <>
                <Button onClick={() => handleStatusChange('converted')}>
                  标记已转化
                </Button>
                <Button onClick={() => handleStatusChange('lost')} variant="secondary">
                  标记已流失
                </Button>
              </>
            )}
            {detail.status === 'pending' && (
              <Button onClick={() => handleStatusChange('lost')} variant="secondary">
                标记已流失
              </Button>
            )}
            {(detail.status === 'converted' || detail.status === 'lost') && (
              <Button onClick={() => handleStatusChange('pending')}>
                重新跟进
              </Button>
            )}
          </div>
        </div>
      </div>
    </PageShell>
  );
}
