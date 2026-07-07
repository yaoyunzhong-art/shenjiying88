'use client';

import React, { useEffect, useState } from 'react';
import { PageShell } from '@m5/ui';
import {
  MOCK_EVENTS,
  MOCK_REPORTS,
  MOCK_PERFORMANCES,
  type TeamBuildingEvent,
  type EventReport,
  type PerformanceRecord,
  type EventStatus,
} from './team-building-data';
import {
  getEvents,
  getReport,
  generateReport,
  getMemberPerformances,
} from './team-building-service';

type Tab = 'events' | 'details' | 'performance';

const STATUS_COLORS: Record<EventStatus, string> = {
  upcoming: '#3b82f6',
  ongoing: '#22c55e',
  completed: '#64748b',
  cancelled: '#ef4444',
};

const STATUS_LABELS: Record<EventStatus, string> = {
  upcoming: '即将开始',
  ongoing: '进行中',
  completed: '已完成',
  cancelled: '已取消',
};

export default function TeamBuildingPage() {
  const [activeTab, setActiveTab] = useState<Tab>('events');
  const [events, setEvents] = useState<TeamBuildingEvent[]>(MOCK_EVENTS);
  const [selectedEvent, setSelectedEvent] = useState<TeamBuildingEvent | null>(null);
  const [report, setReport] = useState<EventReport | null>(null);
  const [performances, setPerformances] = useState<PerformanceRecord[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    getEvents().then(setEvents);
  }, []);

  const handleEventSelect = async (event: TeamBuildingEvent) => {
    setSelectedEvent(event);
    setActiveTab('details');
    
    const eventReport = await getReport(event.id);
    setReport(eventReport);
    
    if (event.status === 'completed') {
      const memberPerformances = await getMemberPerformances(event.id);
      setPerformances(memberPerformances);
    }
  };

  const handleGenerateReport = async () => {
    if (!selectedEvent) return;
    setIsGenerating(true);
    const newReport = await generateReport(selectedEvent.id);
    setReport(newReport);
    setIsGenerating(false);
  };

  return (
    <PageShell title="团建报告中心" description="团建活动管理与效果分析">
      {/* Tab Navigation */}
      <div style={{
        display: 'flex',
        gap: 8,
        marginBottom: 24,
        borderBottom: '1px solid rgba(148,163,184,0.12)',
        paddingBottom: 12,
      }}>
        {([
          { key: 'events', label: '活动列表' },
          { key: 'details', label: '活动详情' },
          { key: 'performance', label: '成员表现' },
        ] as { key: Tab; label: string }[]).map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              padding: '8px 16px',
              fontSize: 14,
              fontWeight: 500,
              borderRadius: 6,
              border: 'none',
              cursor: 'pointer',
              background: activeTab === tab.key ? 'rgba(59,130,246,0.15)' : 'transparent',
              color: activeTab === tab.key ? '#60a5fa' : '#94a3b8',
              transition: 'all 0.2s',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Events List Tab */}
      {activeTab === 'events' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
            {events.map(event => (
              <div
                key={event.id}
                onClick={() => handleEventSelect(event)}
                style={{
                  background: 'rgba(30,41,59,0.9)',
                  border: '1px solid rgba(148,163,184,0.12)',
                  borderRadius: 12,
                  padding: 20,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <h4 style={{ fontSize: 15, fontWeight: 600, color: '#f8fafc', margin: 0 }}>{event.name}</h4>
                  <span style={{
                    padding: '4px 10px',
                    fontSize: 12,
                    fontWeight: 600,
                    borderRadius: 4,
                    background: `${STATUS_COLORS[event.status]}20`,
                    color: STATUS_COLORS[event.status],
                  }}>
                    {STATUS_LABELS[event.status]}
                  </span>
                </div>
                <p style={{ fontSize: 13, color: '#94a3b8', margin: '0 0 12px' }}>{event.description}</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <div style={{ background: 'rgba(15,23,42,0.6)', padding: 10, borderRadius: 6 }}>
                    <p style={{ fontSize: 11, color: '#64748b', margin: '0 0 4px' }}>活动日期</p>
                    <p style={{ fontSize: 13, fontWeight: 600, color: '#f8fafc', margin: 0 }}>
                      {new Date(event.date).toLocaleDateString('zh-CN')}
                    </p>
                  </div>
                  <div style={{ background: 'rgba(15,23,42,0.6)', padding: 10, borderRadius: 6 }}>
                    <p style={{ fontSize: 11, color: '#64748b', margin: '0 0 4px' }}>参与人数</p>
                    <p style={{ fontSize: 13, fontWeight: 600, color: '#f8fafc', margin: 0 }}>
                      {event.participantCount}人
                    </p>
                  </div>
                </div>
                <div style={{ marginTop: 12, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {event.highlights.map((tag, i) => (
                    <span
                      key={i}
                      style={{
                        padding: '4px 10px',
                        fontSize: 11,
                        fontWeight: 500,
                        borderRadius: 4,
                        background: 'rgba(59,130,246,0.1)',
                        color: '#60a5fa',
                      }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Event Details Tab */}
      {activeTab === 'details' && selectedEvent && (
        <div>
          {/* Event Basic Info */}
          <div style={{
            background: 'rgba(30,41,59,0.9)',
            border: '1px solid rgba(148,163,184,0.12)',
            borderRadius: 12,
            padding: 24,
            marginBottom: 20,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
              <div>
                <h3 style={{ fontSize: 18, fontWeight: 600, color: '#f8fafc', margin: '0 0 8px' }}>
                  {selectedEvent.name}
                </h3>
                <p style={{ fontSize: 13, color: '#94a3b8', margin: 0 }}>
                  {selectedEvent.description}
                </p>
              </div>
              <span style={{
                padding: '6px 12px',
                fontSize: 12,
                fontWeight: 600,
                borderRadius: 6,
                background: `${STATUS_COLORS[selectedEvent.status]}20`,
                color: STATUS_COLORS[selectedEvent.status],
              }}>
                {STATUS_LABELS[selectedEvent.status]}
              </span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
              <div style={{ background: 'rgba(15,23,42,0.6)', padding: 14, borderRadius: 8 }}>
                <p style={{ fontSize: 11, color: '#64748b', margin: '0 0 6px' }}>活动日期</p>
                <p style={{ fontSize: 14, fontWeight: 600, color: '#f8fafc', margin: 0 }}>
                  {new Date(selectedEvent.date).toLocaleDateString('zh-CN')}
                </p>
              </div>
              <div style={{ background: 'rgba(15,23,42,0.6)', padding: 14, borderRadius: 8 }}>
                <p style={{ fontSize: 11, color: '#64748b', margin: '0 0 6px' }}>活动地点</p>
                <p style={{ fontSize: 14, fontWeight: 600, color: '#f8fafc', margin: 0 }}>
                  {selectedEvent.location}
                </p>
              </div>
              <div style={{ background: 'rgba(15,23,42,0.6)', padding: 14, borderRadius: 8 }}>
                <p style={{ fontSize: 11, color: '#64748b', margin: '0 0 6px' }}>参与人数</p>
                <p style={{ fontSize: 14, fontWeight: 600, color: '#f8fafc', margin: 0 }}>
                  {selectedEvent.participantCount}人
                </p>
              </div>
              <div style={{ background: 'rgba(15,23,42,0.6)', padding: 14, borderRadius: 8 }}>
                <p style={{ fontSize: 11, color: '#64748b', margin: '0 0 6px' }}>预算</p>
                <p style={{ fontSize: 14, fontWeight: 600, color: '#22c55e', margin: 0 }}>
                  ¥{selectedEvent.budget.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          {/* Report Section */}
          {report ? (
            <div style={{
              background: 'rgba(30,41,59,0.9)',
              border: '1px solid rgba(148,163,184,0.12)',
              borderRadius: 12,
              padding: 24,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h3 style={{ fontSize: 15, fontWeight: 600, color: '#f8fafc', margin: 0 }}>
                  AI 生成报告
                </h3>
                <span style={{ fontSize: 11, color: '#64748b' }}>
                  生成时间：{new Date(report.generatedAt).toLocaleString('zh-CN')}
                </span>
              </div>
              <p style={{ fontSize: 14, color: '#e2e8f0', lineHeight: 1.7, margin: '0 0 16px' }}>
                {report.summary}
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 16 }}>
                <div style={{ background: 'rgba(15,23,42,0.6)', padding: 14, borderRadius: 8, textAlign: 'center' }}>
                  <p style={{ fontSize: 11, color: '#64748b', margin: '0 0 6px' }}>参与率</p>
                  <p style={{ fontSize: 22, fontWeight: 700, color: '#60a5fa', margin: 0 }}>
                    {report.participationRate > 0 ? `${report.participationRate}%` : '-'}
                  </p>
                </div>
                <div style={{ background: 'rgba(15,23,42,0.6)', padding: 14, borderRadius: 8, textAlign: 'center' }}>
                  <p style={{ fontSize: 11, color: '#64748b', margin: '0 0 6px' }}>预算使用</p>
                  <p style={{ fontSize: 22, fontWeight: 700, color: '#22c55e', margin: 0 }}>
                    {report.budgetUsage > 0 ? `${report.budgetUsage}%` : '-'}
                  </p>
                </div>
                <div style={{ background: 'rgba(15,23,42,0.6)', padding: 14, borderRadius: 8, textAlign: 'center' }}>
                  <p style={{ fontSize: 11, color: '#64748b', margin: '0 0 6px' }}>满意度</p>
                  <p style={{ fontSize: 22, fontWeight: 700, color: '#fbbf24', margin: 0 }}>
                    {report.satisfactionScore > 0 ? `${report.satisfactionScore}/5.0` : '-'}
                  </p>
                </div>
              </div>
              <div>
                <h4 style={{ fontSize: 13, fontWeight: 600, color: '#f8fafc', margin: '0 0 10px' }}>亮点标签</h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {report.highlights.map((tag, i) => (
                    <span
                      key={i}
                      style={{
                        padding: '6px 12px',
                        fontSize: 12,
                        fontWeight: 500,
                        borderRadius: 6,
                        background: 'rgba(34,197,94,0.15)',
                        color: '#22c55e',
                      }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div style={{
              background: 'rgba(30,41,59,0.9)',
              border: '1px solid rgba(148,163,184,0.12)',
              borderRadius: 12,
              padding: 24,
              textAlign: 'center',
            }}>
              <p style={{ fontSize: 14, color: '#94a3b8', margin: '0 0 16px' }}>
                暂无活动报告
              </p>
              <button
                onClick={handleGenerateReport}
                disabled={isGenerating}
                style={{
                  padding: '10px 24px',
                  fontSize: 14,
                  fontWeight: 500,
                  borderRadius: 6,
                  border: 'none',
                  background: 'linear-gradient(135deg, #3b82f6, #60a5fa)',
                  color: '#fff',
                  cursor: isGenerating ? 'not-allowed' : 'pointer',
                  opacity: isGenerating ? 0.6 : 1,
                }}
              >
                {isGenerating ? '生成中...' : 'AI生成报告'}
              </button>
            </div>
          )}
        </div>
      )}

      {activeTab === 'details' && !selectedEvent && (
        <div style={{
          background: 'rgba(30,41,59,0.9)',
          border: '1px solid rgba(148,163,184,0.12)',
          borderRadius: 12,
          padding: 40,
          textAlign: 'center',
        }}>
          <p style={{ fontSize: 14, color: '#94a3b8', margin: 0 }}>
            请从活动列表选择一个活动查看详情
          </p>
        </div>
      )}

      {/* Member Performance Tab */}
      {activeTab === 'performance' && (
        <div>
          {performances.length > 0 ? (
            <div style={{
              background: 'rgba(30,41,59,0.9)',
              border: '1px solid rgba(148,163,184,0.12)',
              borderRadius: 12,
              overflow: 'hidden',
            }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'rgba(15,23,42,0.6)' }}>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#64748b' }}>排名</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#64748b' }}>姓名</th>
                    <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: 12, fontWeight: 600, color: '#64748b' }}>参与分</th>
                    <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: 12, fontWeight: 600, color: '#64748b' }}>协作分</th>
                    <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: 12, fontWeight: 600, color: '#64748b' }}>领导力</th>
                    <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: 12, fontWeight: 600, color: '#64748b' }}>进步幅度</th>
                    <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: 12, fontWeight: 600, color: '#64748b' }}>奖项</th>
                  </tr>
                </thead>
                <tbody>
                  {performances.map(member => (
                    <tr
                      key={member.id}
                      style={{ borderTop: '1px solid rgba(148,163,184,0.08)' }}
                    >
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: 28,
                          height: 28,
                          borderRadius: 6,
                          fontSize: 13,
                          fontWeight: 700,
                          background: member.rank === 1 ? 'rgba(251,191,36,0.2)' :
                                       member.rank === 2 ? 'rgba(148,163,184,0.2)' :
                                       member.rank === 3 ? 'rgba(180,83,9,0.2)' : 'rgba(148,163,184,0.1)',
                          color: member.rank === 1 ? '#fbbf24' :
                                member.rank === 2 ? '#94a3b8' :
                                member.rank === 3 ? '#b45309' : '#64748b',
                        }}>
                          {member.rank}
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{ fontSize: 14, fontWeight: 500, color: '#f8fafc' }}>
                          {member.memberName}
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                        <span style={{ fontSize: 14, fontWeight: 600, color: '#60a5fa' }}>
                          {member.participationScore}
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                        <span style={{ fontSize: 14, fontWeight: 600, color: '#22c55e' }}>
                          {member.teamworkScore}
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                        <span style={{ fontSize: 14, fontWeight: 600, color: '#a855f7' }}>
                          {member.leadershipScore}
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                        <span style={{
                          fontSize: 14,
                          fontWeight: 600,
                          color: member.improvementRate > 0 ? '#22c55e' : '#ef4444',
                        }}>
                          {member.improvementRate > 0 ? '+' : ''}{member.improvementRate}%
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                        {member.award ? (
                          <span style={{
                            padding: '4px 10px',
                            fontSize: 11,
                            fontWeight: 600,
                            borderRadius: 4,
                            background: 'rgba(251,191,36,0.15)',
                            color: '#fbbf24',
                          }}>
                            {member.award}
                          </span>
                        ) : (
                          <span style={{ fontSize: 12, color: '#64748b' }}>-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{
              background: 'rgba(30,41,59,0.9)',
              border: '1px solid rgba(148,163,184,0.12)',
              borderRadius: 12,
              padding: 40,
              textAlign: 'center',
            }}>
              <p style={{ fontSize: 14, color: '#94a3b8', margin: 0 }}>
                请先选择一个已完成的团建活动查看成员表现
              </p>
            </div>
          )}
        </div>
      )}
    </PageShell>
  );
}
