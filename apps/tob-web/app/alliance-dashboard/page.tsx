'use client';

import React, { useState, useEffect } from 'react';
import { PageShell } from '@m5/ui';
import {
  MOCK_PARTNERS,
  MOCK_SETTLEMENTS,
  MOCK_ANOMALY_ALERTS,
  MOCK_CHANNEL_STATS,
  MOCK_SEND_RECORDS,
  PARTNER_GRADE_LABELS,
  PARTNER_GRADE_COLORS,
  SETTLEMENT_STATUS_LABELS,
  SETTLEMENT_STATUS_COLORS,
  ANOMALY_SEVERITY_LABELS,
  ANOMALY_SEVERITY_COLORS,
  CHANNEL_LABELS,
  formatCurrency,
  formatPercent,
  formatDate,
  getGradeLabel,
  getHealthColor,
  getHealthLabel,
  type AlliancePartner,
  type PartnerGrade,
  type SettlementRecord,
  type AnomalyAlert,
  type ChannelReachStats,
  type ChannelType,
  type SendRecord,
} from './alliance-data';
import {
  getPartners,
  getSettlementHistory,
  getAnomalyAlerts,
  getChannelReachStats,
  approveSettlement,
  rejectSettlement,
  acknowledgeAlert,
  resolveAlert,
  sendMessage,
  type PartnerFilter,
} from './alliance-service';

type Tab = 'partner-management' | 'settlement-management' | 'anomaly-center' | 'channel-reach';

export default function AllianceDashboardPage() {
  const [activeTab, setActiveTab] = useState<Tab>('partner-management');
  const [partners, setPartners] = useState<AlliancePartner[]>(MOCK_PARTNERS);
  const [settlements, setSettlements] = useState<SettlementRecord[]>(MOCK_SETTLEMENTS);
  const [anomalyAlerts, setAnomalyAlerts] = useState<AnomalyAlert[]>(MOCK_ANOMALY_ALERTS);
  const [channelStats, setChannelStats] = useState<ChannelReachStats[]>(MOCK_CHANNEL_STATS);
  const [sendRecords, setSendRecords] = useState<SendRecord[]>(MOCK_SEND_RECORDS);
  const [loading, setLoading] = useState(false);
  const [gradeFilter, setGradeFilter] = useState<PartnerGrade | ''>('');
  const [messageContent, setMessageContent] = useState('');
  const [selectedChannel, setSelectedChannel] = useState<ChannelType>('SMS');

  useEffect(() => {
    loadData();
  }, [gradeFilter]);

  async function loadData() {
    setLoading(true);
    try {
      const [partnersData, settlementsData, alertsData, statsData] = await Promise.all([
        getPartners(gradeFilter ? { grade: gradeFilter as PartnerGrade } : undefined),
        getSettlementHistory(),
        getAnomalyAlerts(),
        getChannelReachStats(),
      ]);
      setPartners(partnersData);
      setSettlements(settlementsData);
      setAnomalyAlerts(alertsData);
      setChannelStats(statsData);
    } finally {
      setLoading(false);
    }
  }

  async function handleApprove(settlementId: string) {
    await approveSettlement(settlementId);
    setSettlements(prev => prev.map(s =>
      s.settlementId === settlementId ? { ...s, status: 'approved' } : s
    ));
  }

  async function handleReject(settlementId: string) {
    await rejectSettlement(settlementId);
    setSettlements(prev => prev.map(s =>
      s.settlementId === settlementId ? { ...s, status: 'rejected' } : s
    ));
  }

  async function handleAcknowledge(alertId: string) {
    await acknowledgeAlert(alertId);
    setAnomalyAlerts(prev => prev.map(a =>
      a.alertId === alertId ? { ...a, status: 'acknowledged' } : a
    ));
  }

  async function handleResolve(alertId: string) {
    await resolveAlert(alertId);
    setAnomalyAlerts(prev => prev.map(a =>
      a.alertId === alertId ? { ...a, status: 'resolved' } : a
    ));
  }

  async function handleSendMessage() {
    if (!messageContent.trim()) return;
    await sendMessage({ channel: selectedChannel, content: messageContent });
    const newRecord: SendRecord = {
      recordId: `SR${Date.now()}`,
      channel: selectedChannel,
      content: messageContent,
      sentAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
      recipientCount: partners.length * 100,
      deliveredCount: Math.floor(partners.length * 100 * 0.95),
    };
    setSendRecords(prev => [newRecord, ...prev]);
    setMessageContent('');
  }

  return (
    <PageShell title="异业联盟" description="异业联盟合作伙伴管理、分账、预警、触达">
      {/* Tab Navigation */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24, borderBottom: '1px solid rgba(148,163,184,0.2)', paddingBottom: 12 }}>
        {(['partner-management', 'settlement-management', 'anomaly-center', 'channel-reach'] as Tab[]).map(tab => {
          const labels: Record<Tab, string> = {
            'partner-management': '伙伴管理',
            'settlement-management': '分账管理',
            'anomaly-center': '预警中心',
            'channel-reach': '全渠道触达',
          };
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '8px 20px',
                fontSize: 14,
                fontWeight: 600,
                borderRadius: 6,
                border: 'none',
                cursor: 'pointer',
                background: activeTab === tab ? 'linear-gradient(135deg, #3b82f6, #60a5fa)' : 'rgba(148,163,184,0.1)',
                color: activeTab === tab ? '#ffffff' : '#94a3b8',
                transition: 'all 0.2s ease',
              }}
            >
              {labels[tab]}
            </button>
          );
        })}
      </div>

      {/* ===================== 伙伴管理 ===================== */}
      {activeTab === 'partner-management' && (
        <div>
          {/* Grade Filter */}
          <div style={{ marginBottom: 20 }}>
            <select
              value={gradeFilter}
              onChange={e => setGradeFilter(e.target.value as PartnerGrade | '')}
              style={{
                padding: '10px 16px',
                fontSize: 14,
                borderRadius: 8,
                border: '1px solid rgba(148,163,184,0.2)',
                background: 'rgba(30,41,59,0.9)',
                color: '#e2e8f0',
                minWidth: 180,
              }}
            >
              <option value="">全部等级</option>
              <option value="S">S级合作伙伴</option>
              <option value="A">A级合作伙伴</option>
              <option value="B">B级合作伙伴</option>
              <option value="C">C级合作伙伴</option>
            </select>
          </div>

          {/* Partner Cards Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
            {partners.map(partner => (
              <div key={partner.partnerId} style={{
                padding: 20,
                background: 'rgba(30,41,59,0.9)',
                border: '1px solid rgba(148,163,184,0.12)',
                borderRadius: 12,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <div>
                    <h3 style={{ fontSize: 15, fontWeight: 600, color: '#f8fafc', margin: '0 0 4px' }}>{partner.partnerName}</h3>
                    <p style={{ fontSize: 12, color: '#94a3b8', margin: 0 }}>{partner.industry}</p>
                  </div>
                  <span style={{
                    fontSize: 12,
                    fontWeight: 600,
                    padding: '4px 10px',
                    borderRadius: 4,
                    background: PARTNER_GRADE_COLORS[partner.grade],
                    color: '#ffffff',
                  }}>
                    {partner.grade}级
                  </span>
                </div>

                {/* Health Score Bar */}
                <div style={{ marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 11, color: '#94a3b8' }}>健康度</span>
                    <span style={{ fontSize: 11, color: getHealthColor(partner.healthScore), fontWeight: 600 }}>
                      {partner.healthScore}分 · {getHealthLabel(partner.healthScore)}
                    </span>
                  </div>
                  <div style={{ width: '100%', height: 6, background: 'rgba(148,163,184,0.2)', borderRadius: 3 }}>
                    <div style={{
                      width: `${partner.healthScore}%`,
                      height: '100%',
                      background: getHealthColor(partner.healthScore),
                      borderRadius: 3,
                      transition: 'width 0.3s ease',
                    }} />
                  </div>
                </div>

                {/* Stats */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <div style={{ background: 'rgba(15,23,42,0.6)', padding: 8, borderRadius: 6 }}>
                    <p style={{ fontSize: 10, color: '#64748b', margin: '0 0 2px' }}>交易笔数</p>
                    <p style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0', margin: 0 }}>{partner.totalTransactions.toLocaleString()}</p>
                  </div>
                  <div style={{ background: 'rgba(15,23,42,0.6)', padding: 8, borderRadius: 6 }}>
                    <p style={{ fontSize: 10, color: '#64748b', margin: '0 0 2px' }}>累计营收</p>
                    <p style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0', margin: 0 }}>{formatCurrency(partner.totalRevenue)}</p>
                  </div>
                  <div style={{ background: 'rgba(15,23,42,0.6)', padding: 8, borderRadius: 6 }}>
                    <p style={{ fontSize: 10, color: '#64748b', margin: '0 0 2px' }}>评分</p>
                    <p style={{ fontSize: 13, fontWeight: 600, color: '#f59e0b', margin: 0 }}>★ {partner.rating.toFixed(1)}</p>
                  </div>
                  <div style={{ background: 'rgba(15,23,42,0.6)', padding: 8, borderRadius: 6 }}>
                    <p style={{ fontSize: 10, color: '#64748b', margin: '0 0 2px' }}>状态</p>
                    <p style={{ fontSize: 13, fontWeight: 600, color: partner.status === 'active' ? '#22c55e' : partner.status === 'pending' ? '#f59e0b' : '#ef4444', margin: 0 }}>
                      {partner.status === 'active' ? '合作中' : partner.status === 'pending' ? '待激活' : '已停用'}
                    </p>
                  </div>
                </div>

                <p style={{ fontSize: 11, color: '#64748b', margin: '12px 0 0' }}>
                  联系人: {partner.contactPerson} · {partner.contactPhone}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ===================== 分账管理 ===================== */}
      {activeTab === 'settlement-management' && (
        <div>
          {/* Settlement Records */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {settlements.map(settlement => (
              <div key={settlement.settlementId} style={{
                padding: 20,
                background: 'rgba(30,41,59,0.9)',
                border: '1px solid rgba(148,163,184,0.12)',
                borderRadius: 10,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 600, color: '#f8fafc', margin: '0 0 4px' }}>
                      {settlement.partnerName}
                    </p>
                    <p style={{ fontSize: 12, color: '#94a3b8', margin: 0 }}>
                      {settlement.settlementId} · {formatDate(settlement.settlementDate)}
                    </p>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                    <span style={{
                      fontSize: 12,
                      fontWeight: 600,
                      padding: '4px 10px',
                      borderRadius: 4,
                      background: SETTLEMENT_STATUS_COLORS[settlement.status],
                      color: settlement.status === 'pending' || settlement.status === 'rejected' ? '#ffffff' : '#0f172a',
                    }}>
                      {SETTLEMENT_STATUS_LABELS[settlement.status]}
                    </span>
                    <span style={{ fontSize: 18, fontWeight: 700, color: '#f8fafc' }}>
                      {formatCurrency(settlement.amount)}
                    </span>
                    <span style={{ fontSize: 11, color: '#64748b' }}>
                      分账比例 {formatPercent(settlement.ratio)}
                    </span>
                  </div>
                </div>
                <p style={{ fontSize: 12, color: '#94a3b8', margin: '10px 0 0' }}>{settlement.remarks}</p>
                {settlement.status === 'pending' && (
                  <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                    <button
                      onClick={() => handleApprove(settlement.settlementId)}
                      style={{
                        padding: '6px 16px',
                        fontSize: 12,
                        fontWeight: 600,
                        borderRadius: 4,
                        border: 'none',
                        cursor: 'pointer',
                        background: '#22c55e',
                        color: '#ffffff',
                      }}
                    >
                      批准分账
                    </button>
                    <button
                      onClick={() => handleReject(settlement.settlementId)}
                      style={{
                        padding: '6px 16px',
                        fontSize: 12,
                        fontWeight: 600,
                        borderRadius: 4,
                        border: 'none',
                        cursor: 'pointer',
                        background: '#ef4444',
                        color: '#ffffff',
                      }}
                    >
                      拒绝分账
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ===================== 预警中心 ===================== */}
      {activeTab === 'anomaly-center' && (
        <div>
          {/* Anomaly Alerts */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {anomalyAlerts.map(alert => (
              <div key={alert.alertId} style={{
                padding: 20,
                background: 'rgba(30,41,59,0.9)',
                border: '1px solid rgba(148,163,184,0.12)',
                borderLeft: `4px solid ${ANOMALY_SEVERITY_COLORS[alert.severity]}`,
                borderRadius: 10,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                      <span style={{
                        fontSize: 12,
                        fontWeight: 600,
                        padding: '2px 8px',
                        borderRadius: 4,
                        background: ANOMALY_SEVERITY_COLORS[alert.severity],
                        color: '#ffffff',
                      }}>
                        {ANOMALY_SEVERITY_LABELS[alert.severity]}
                      </span>
                      <span style={{ fontSize: 14, fontWeight: 600, color: '#f8fafc' }}>{alert.anomalyType}</span>
                    </div>
                    <p style={{ fontSize: 12, color: '#94a3b8', margin: '0 0 4px' }}>
                      {alert.partnerName} · {alert.alertId}
                    </p>
                    <p style={{ fontSize: 13, color: '#e2e8f0', margin: 0 }}>{alert.description}</p>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                    <span style={{
                      fontSize: 11,
                      padding: '2px 8px',
                      borderRadius: 4,
                      background: alert.status === 'open' ? 'rgba(239,68,68,0.2)' : alert.status === 'acknowledged' ? 'rgba(245,158,11,0.2)' : 'rgba(34,197,94,0.2)',
                      color: alert.status === 'open' ? '#ef4444' : alert.status === 'acknowledged' ? '#f59e0b' : '#22c55e',
                    }}>
                      {alert.status === 'open' ? '待处理' : alert.status === 'acknowledged' ? '已确认' : '已解决'}
                    </span>
                    <span style={{ fontSize: 11, color: '#64748b' }}>{formatDate(alert.detectedAt)}</span>
                  </div>
                </div>
                {alert.status !== 'resolved' && (
                  <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                    {alert.status === 'open' && (
                      <button
                        onClick={() => handleAcknowledge(alert.alertId)}
                        style={{
                          padding: '6px 16px',
                          fontSize: 12,
                          fontWeight: 600,
                          borderRadius: 4,
                          border: 'none',
                          cursor: 'pointer',
                          background: '#f59e0b',
                          color: '#ffffff',
                        }}
                      >
                        确认预警
                      </button>
                    )}
                    <button
                      onClick={() => handleResolve(alert.alertId)}
                      style={{
                        padding: '6px 16px',
                        fontSize: 12,
                        fontWeight: 600,
                        borderRadius: 4,
                        border: 'none',
                        cursor: 'pointer',
                        background: '#22c55e',
                        color: '#ffffff',
                      }}
                    >
                      标记已处理
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ===================== 全渠道触达 ===================== */}
      {activeTab === 'channel-reach' && (
        <div>
          {/* Channel Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12, marginBottom: 24 }}>
            {channelStats.map(stat => (
              <div key={stat.channel} style={{
                padding: 16,
                background: 'rgba(30,41,59,0.9)',
                border: '1px solid rgba(148,163,184,0.12)',
                borderRadius: 10,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: '#f8fafc' }}>{CHANNEL_LABELS[stat.channel]}</span>
                  <span style={{ fontSize: 20, fontWeight: 700, color: '#3b82f6' }}>{stat.totalSent.toLocaleString()}</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                  <div>
                    <p style={{ fontSize: 10, color: '#64748b', margin: '0 0 2px' }}>送达率</p>
                    <p style={{ fontSize: 12, fontWeight: 600, color: '#22c55e' }}>{formatPercent(stat.deliveryRate)}</p>
                  </div>
                  <div>
                    <p style={{ fontSize: 10, color: '#64748b', margin: '0 0 2px' }}>打开率</p>
                    <p style={{ fontSize: 12, fontWeight: 600, color: '#8b5cf6' }}>{formatPercent(stat.openRate)}</p>
                  </div>
                  <div>
                    <p style={{ fontSize: 10, color: '#64748b', margin: '0 0 2px' }}>点击率</p>
                    <p style={{ fontSize: 12, fontWeight: 600, color: '#f59e0b' }}>{formatPercent(stat.clickRate)}</p>
                  </div>
                  <div>
                    <p style={{ fontSize: 10, color: '#64748b', margin: '0 0 2px' }}>送达数</p>
                    <p style={{ fontSize: 12, fontWeight: 600, color: '#e2e8f0' }}>{stat.totalDelivered.toLocaleString()}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Message Composer */}
          <div style={{
            padding: 24,
            background: 'rgba(30,41,59,0.9)',
            border: '1px solid rgba(148,163,184,0.12)',
            borderRadius: 12,
            marginBottom: 24,
          }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, color: '#f8fafc', margin: '0 0 16px' }}>发送消息</h3>
            <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
              {(['SMS', 'Email', 'Push', 'APP'] as ChannelType[]).map(ch => (
                <button
                  key={ch}
                  onClick={() => setSelectedChannel(ch)}
                  style={{
                    padding: '8px 16px',
                    fontSize: 12,
                    fontWeight: 600,
                    borderRadius: 4,
                    border: 'none',
                    cursor: 'pointer',
                    background: selectedChannel === ch ? '#3b82f6' : 'rgba(148,163,184,0.1)',
                    color: selectedChannel === ch ? '#ffffff' : '#94a3b8',
                  }}
                >
                  {CHANNEL_LABELS[ch]}
                </button>
              ))}
            </div>
            <textarea
              value={messageContent}
              onChange={e => setMessageContent(e.target.value)}
              placeholder="输入消息内容..."
              style={{
                width: '100%',
                minHeight: 80,
                padding: 12,
                fontSize: 13,
                borderRadius: 8,
                border: '1px solid rgba(148,163,184,0.2)',
                background: 'rgba(15,23,42,0.8)',
                color: '#e2e8f0',
                resize: 'vertical',
                marginBottom: 12,
              }}
            />
            <button
              onClick={handleSendMessage}
              disabled={!messageContent.trim()}
              style={{
                padding: '10px 24px',
                fontSize: 13,
                fontWeight: 600,
                borderRadius: 6,
                border: 'none',
                cursor: messageContent.trim() ? 'pointer' : 'not-allowed',
                background: messageContent.trim() ? '#3b82f6' : 'rgba(148,163,184,0.2)',
                color: messageContent.trim() ? '#ffffff' : '#64748b',
              }}
            >
              发送消息
            </button>
          </div>

          {/* Send History */}
          <div>
            <h3 style={{ fontSize: 15, fontWeight: 600, color: '#f8fafc', margin: '0 0 12px' }}>发送历史</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {sendRecords.map(record => (
                <div key={record.recordId} style={{
                  padding: 16,
                  background: 'rgba(30,41,59,0.9)',
                  border: '1px solid rgba(148,163,184,0.12)',
                  borderRadius: 8,
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <span style={{
                        fontSize: 11,
                        fontWeight: 600,
                        padding: '2px 6px',
                        borderRadius: 3,
                        background: 'rgba(59,130,246,0.2)',
                        color: '#3b82f6',
                        marginRight: 8,
                      }}>
                        {CHANNEL_LABELS[record.channel]}
                      </span>
                      <span style={{ fontSize: 12, color: '#64748b' }}>{formatDate(record.sentAt)}</span>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: 12, color: '#94a3b8' }}>
                        已送达 {record.deliveredCount}/{record.recipientCount}
                      </span>
                    </div>
                  </div>
                  <p style={{ fontSize: 13, color: '#e2e8f0', margin: '8px 0 0' }}>{record.content}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {loading && (
        <div style={{ textAlign: 'center', padding: 40, color: '#94a3b8', fontSize: 14 }}>
          加载中...
        </div>
      )}
    </PageShell>
  );
}