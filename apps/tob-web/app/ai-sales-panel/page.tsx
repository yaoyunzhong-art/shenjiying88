/**
 * AI销售面板页面 - AI Sales Panel Page (ToB企业端)
 * Phase-FP · 2026-07-03
 * 角色视角: 🏢 企业销售/客服
 * 功能: 智能推荐、异议处理、跟进任务、销售话术
 */

'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  MOCK_RECOMMENDATIONS,
  MOCK_OBJECTIONS,
  MOCK_FOLLOW_UPS,
  MOCK_SCRIPTS,
  type RecommendedProduct,
  type ObjectionCase,
  type FollowUpTask,
  type SalesScript,
  type ObjectionType,
  type ToneType,
} from './ai-sales-data';
import {
  getRecommendations,
  handleObjection,
  getFollowUps,
  completeFollowUp,
  getSalesScript,
} from './ai-sales-service';

type TabType = 'recommend' | 'objection' | 'followup' | 'script';

export default function AISalesPanelPage() {
  const [activeTab, setActiveTab] = useState<TabType>('recommend');
  const [loading, setLoading] = useState(true);

  // 智能推荐
  const [recommendations, setRecommendations] = useState<RecommendedProduct[]>([]);

  // 异议处理
  const [objectionType, setObjectionType] = useState<ObjectionType>('price');
  const [aiResponse, setAiResponse] = useState('');
  const [suggestedQuestions, setSuggestedQuestions] = useState<string[]>([]);

  // 跟进任务
  const [followUps, setFollowUps] = useState<FollowUpTask[]>([]);

  // 销售话术
  const [scripts, setScripts] = useState<SalesScript[]>(MOCK_SCRIPTS);
  const [selectedScript, setSelectedScript] = useState<SalesScript | null>(null);

  useEffect(() => {
    loadData();
  }, [activeTab]);

  async function loadData() {
    setLoading(true);
    try {
      switch (activeTab) {
        case 'recommend':
          const recs = await getRecommendations('current-user');
          setRecommendations(recs);
          break;
        case 'objection':
          const resp = await handleObjection(objectionType, {});
          setAiResponse(resp.response);
          setSuggestedQuestions(resp.suggestedQuestions);
          break;
        case 'followup':
          const tasks = await getFollowUps('current-user');
          setFollowUps(tasks);
          break;
        case 'script':
          break;
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleObjectionChange(type: ObjectionType) {
    setObjectionType(type);
    const resp = await handleObjection(type, {});
    setAiResponse(resp.response);
    setSuggestedQuestions(resp.suggestedQuestions);
  }

  async function handleCompleteTask(taskId: string) {
    await completeFollowUp(taskId);
    setFollowUps((prev) => prev.map((t) => (t.id === taskId ? { ...t, status: 'completed' as const } : t)));
  }

  const tabs: { key: TabType; label: string; icon: string }[] = [
    { key: 'recommend', label: '智能推荐', icon: '🎯' },
    { key: 'objection', label: '异议处理', icon: '💬' },
    { key: 'followup', label: '跟进任务', icon: '📋' },
    { key: 'script', label: '销售话术', icon: '📝' },
  ];

  return (
    <main style={{ minHeight: '100vh', background: '#0f172a', padding: 24 }}>
      <div style={{ maxWidth: 1400, margin: '0 auto' }}>
        {/* 页面标题 */}
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#f8fafc', marginBottom: 8 }}>
            AI销售助手
          </h1>
          <p style={{ fontSize: 14, color: '#94a3b8' }}>
            智能推荐 · 异议处理 · 跟进提醒 · 销售话术
          </p>
        </div>

        {/* 标签导航 */}
        <div
          style={{
            display: 'flex',
            gap: 8,
            marginBottom: 24,
            borderBottom: '1px solid rgba(148,163,184,0.1)',
            paddingBottom: 16,
          }}
        >
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                padding: '10px 20px',
                borderRadius: 8,
                border: 'none',
                fontSize: 14,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                background: activeTab === tab.key ? 'rgba(99,102,241,0.2)' : 'rgba(148,163,184,0.1)',
                color: activeTab === tab.key ? '#a5b4fc' : '#94a3b8',
              }}
            >
              <span style={{ fontSize: 18 }}>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* 内容区域 */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: 48, color: '#94a3b8' }}>加载中...</div>
        ) : (
          <>
            {/* 智能推荐 */}
            {activeTab === 'recommend' && (
              <div>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                    gap: 16,
                  }}
                >
                  {recommendations.map((product) => (
                    <div
                      key={product.id}
                      style={{
                        borderRadius: 12,
                        background: 'rgba(15,23,42,0.8)',
                        border: '1px solid rgba(148,163,184,0.1)',
                        padding: 16,
                      }}
                    >
                      <div
                        style={{
                          height: 120,
                          borderRadius: 8,
                          background: 'linear-gradient(135deg, #1e293b, #0f172a)',
                          marginBottom: 12,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 48,
                        }}
                      >
                        🎁
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                        <span
                          style={{
                            padding: '2px 8px',
                            borderRadius: 4,
                            background: 'rgba(99,102,241,0.2)',
                            color: '#a5b4fc',
                            fontSize: 11,
                          }}
                        >
                          {product.category}
                        </span>
                        <span style={{ fontSize: 11, color: '#64748b' }}>库存: {product.stock}</span>
                      </div>
                      <h3 style={{ fontSize: 15, fontWeight: 600, color: '#f8fafc', marginBottom: 4 }}>
                        {product.name}
                      </h3>
                      <div style={{ fontSize: 18, fontWeight: 700, color: '#f59e0b', marginBottom: 8 }}>
                        ¥{product.price.toLocaleString()}
                      </div>
                      <p style={{ fontSize: 12, color: '#94a3b8', marginBottom: 12, lineHeight: 1.6 }}>
                        {product.reason}
                      </p>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span
                          style={{
                            padding: '4px 10px',
                            borderRadius: 12,
                            background: product.matchScore >= 90 ? 'rgba(16,185,129,0.2)' : 'rgba(245,158,11,0.2)',
                            color: product.matchScore >= 90 ? '#4ade80' : '#fbbf24',
                            fontSize: 12,
                            fontWeight: 500,
                          }}
                        >
                          匹配度 {product.matchScore}%
                        </span>
                        <button
                          style={{
                            padding: '6px 14px',
                            borderRadius: 6,
                            background: 'rgba(99,102,241,0.2)',
                            border: '1px solid rgba(99,102,241,0.4)',
                            color: '#a5b4fc',
                            fontSize: 12,
                            cursor: 'pointer',
                          }}
                        >
                          推荐给客户
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 异议处理 */}
            {activeTab === 'objection' && (
              <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 24 }}>
                {/* 左侧：异议类型 */}
                <div
                  style={{
                    borderRadius: 12,
                    background: 'rgba(15,23,42,0.8)',
                    border: '1px solid rgba(148,163,184,0.1)',
                    padding: 16,
                  }}
                >
                  <h3 style={{ fontSize: 15, fontWeight: 600, color: '#f8fafc', marginBottom: 16 }}>
                    客户异议类型
                  </h3>
                  {(['price', 'quality', 'competitor', 'need'] as ObjectionType[]).map((type) => {
                    const labels = { price: '💰 价格异议', quality: '✅ 质量疑虑', competitor: '🏢 竞品比较', need: '🤔 需求考虑' };
                    return (
                      <button
                        key={type}
                        onClick={() => handleObjectionChange(type)}
                        style={{
                          width: '100%',
                          padding: 12,
                          marginBottom: 8,
                          borderRadius: 8,
                          border: 'none',
                          textAlign: 'left',
                          fontSize: 13,
                          cursor: 'pointer',
                          background: objectionType === type ? 'rgba(99,102,241,0.2)' : 'rgba(148,163,184,0.05)',
                          color: objectionType === type ? '#a5b4fc' : '#94a3b8',
                        }}
                      >
                        {labels[type]}
                      </button>
                    );
                  })}
                </div>

                {/* 右侧：AI回复 */}
                <div
                  style={{
                    borderRadius: 12,
                    background: 'rgba(15,23,42,0.8)',
                    border: '1px solid rgba(148,163,184,0.1)',
                    padding: 24,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                    <span style={{ fontSize: 32 }}>🤖</span>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 600, color: '#f8fafc' }}>AI助手回复</div>
                      <div style={{ fontSize: 12, color: '#64748b' }}>基于海量销售数据生成的应对话术</div>
                    </div>
                  </div>
                  <div
                    style={{
                      padding: 16,
                      borderRadius: 8,
                      background: 'rgba(30,41,59,0.5)',
                      marginBottom: 20,
                    }}
                  >
                    <p style={{ fontSize: 14, color: '#e2e8f0', lineHeight: 1.8 }}>{aiResponse}</p>
                  </div>
                  {suggestedQuestions.length > 0 && (
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 500, color: '#94a3b8', marginBottom: 12 }}>
                        建议追问:
                      </div>
                      {suggestedQuestions.map((q, idx) => (
                        <div
                          key={idx}
                          style={{
                            padding: '10px 14px',
                            marginBottom: 8,
                            borderRadius: 6,
                            background: 'rgba(99,102,241,0.1)',
                            border: '1px solid rgba(99,102,241,0.2)',
                            fontSize: 13,
                            color: '#a5b4fc',
                          }}
                        >
                          {q}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 跟进任务 */}
            {activeTab === 'followup' && (
              <div
                style={{
                  borderRadius: 12,
                  background: 'rgba(15,23,42,0.8)',
                  border: '1px solid rgba(148,163,184,0.1)',
                  overflow: 'hidden',
                }}
              >
                <div style={{ padding: 16, borderBottom: '1px solid rgba(148,163,184,0.08)' }}>
                  <h3 style={{ fontSize: 15, fontWeight: 600, color: '#f8fafc' }}>待跟进任务</h3>
                </div>
                {followUps.map((task, idx) => (
                  <div
                    key={task.id}
                    style={{
                      padding: 16,
                      borderBottom: idx < followUps.length - 1 ? '1px solid rgba(148,163,184,0.08)' : 'none',
                      opacity: task.status === 'completed' ? 0.6 : 1,
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                          <span
                            style={{
                              padding: '2px 8px',
                              borderRadius: 4,
                              fontSize: 11,
                              background:
                                task.priority === 'high'
                                  ? 'rgba(239,68,68,0.2)'
                                  : task.priority === 'medium'
                                  ? 'rgba(245,158,11,0.2)'
                                  : 'rgba(100,116,139,0.2)',
                              color:
                                task.priority === 'high'
                                  ? '#f87171'
                                  : task.priority === 'medium'
                                  ? '#fbbf24'
                                  : '#94a3b8',
                            }}
                          >
                            {task.priority === 'high' ? '紧急' : task.priority === 'medium' ? '普通' : '低'}
                          </span>
                          <span
                            style={{
                              padding: '2px 8px',
                              borderRadius: 4,
                              fontSize: 11,
                              background:
                                task.status === 'completed' ? 'rgba(16,185,129,0.2)' : 'rgba(59,130,246,0.2)',
                              color: task.status === 'completed' ? '#4ade80' : '#60a5fa',
                            }}
                          >
                            {task.status === 'completed' ? '已完成' : '待处理'}
                          </span>
                        </div>
                        <div style={{ fontSize: 14, fontWeight: 500, color: '#f8fafc', marginBottom: 4 }}>
                          {task.content}
                        </div>
                        <div style={{ fontSize: 12, color: '#64748b' }}>
                          客户: {task.customerName} · {new Date(task.dueDate).toLocaleDateString('zh-CN')}
                        </div>
                      </div>
                      {task.status === 'pending' && (
                        <button
                          onClick={() => handleCompleteTask(task.id)}
                          style={{
                            padding: '8px 16px',
                            borderRadius: 6,
                            background: 'rgba(16,185,129,0.2)',
                            border: '1px solid rgba(16,185,129,0.4)',
                            color: '#4ade80',
                            fontSize: 12,
                            cursor: 'pointer',
                          }}
                        >
                          标记完成
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* 销售话术 */}
            {activeTab === 'script' && (
              <div>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
                    gap: 16,
                  }}
                >
                  {scripts.map((script) => (
                    <div
                      key={script.id}
                      style={{
                        borderRadius: 12,
                        background: 'rgba(15,23,42,0.8)',
                        border:
                          selectedScript?.id === script.id
                            ? '1px solid rgba(99,102,241,0.5)'
                            : '1px solid rgba(148,163,184,0.1)',
                        padding: 16,
                        cursor: 'pointer',
                      }}
                      onClick={() => setSelectedScript(script)}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 600, color: '#f8fafc', marginBottom: 4 }}>
                            {script.productName}
                          </div>
                          <div style={{ fontSize: 12, color: '#64748b' }}>{script.scenario}</div>
                        </div>
                        <span
                          style={{
                            padding: '4px 10px',
                            borderRadius: 12,
                            fontSize: 11,
                            background:
                              script.tone === 'professional'
                                ? 'rgba(59,130,246,0.2)'
                                : script.tone === 'friendly'
                                ? 'rgba(16,185,129,0.2)'
                                : 'rgba(239,68,68,0.2)',
                            color:
                              script.tone === 'professional'
                                ? '#60a5fa'
                                : script.tone === 'friendly'
                                ? '#4ade80'
                                : '#f87171',
                          }}
                        >
                          {script.tone === 'professional' ? '专业' : script.tone === 'friendly' ? '友好' : '紧迫'}
                        </span>
                      </div>
                      <p
                        style={{
                          fontSize: 13,
                          color: '#94a3b8',
                          lineHeight: 1.7,
                          overflow: 'hidden',
                          display: '-webkit-box',
                          WebkitLineClamp: 3,
                          WebkitBoxOrient: 'vertical',
                        }}
                      >
                        {script.content}
                      </p>
                    </div>
                  ))}
                </div>

                {/* 话术详情弹窗 */}
                {selectedScript && (
                  <div
                    style={{
                      position: 'fixed',
                      inset: 0,
                      background: 'rgba(0,0,0,0.7)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      zIndex: 100,
                    }}
                    onClick={() => setSelectedScript(null)}
                  >
                    <div
                      style={{
                        width: '90%',
                        maxWidth: 600,
                        borderRadius: 16,
                        background: 'rgba(15,23,42,0.98)',
                        border: '1px solid rgba(148,163,184,0.1)',
                        padding: 24,
                      }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
                        <div>
                          <h3 style={{ fontSize: 18, fontWeight: 600, color: '#f8fafc', marginBottom: 4 }}>
                            {selectedScript.productName}
                          </h3>
                          <p style={{ fontSize: 13, color: '#94a3b8' }}>{selectedScript.scenario}</p>
                        </div>
                        <button
                          onClick={() => setSelectedScript(null)}
                          style={{
                            padding: '6px 12px',
                            borderRadius: 6,
                            background: 'rgba(148,163,184,0.1)',
                            border: 'none',
                            color: '#94a3b8',
                            fontSize: 12,
                            cursor: 'pointer',
                          }}
                        >
                          关闭
                        </button>
                      </div>
                      <div
                        style={{
                          padding: 16,
                          borderRadius: 8,
                          background: 'rgba(30,41,59,0.5)',
                          marginBottom: 20,
                        }}
                      >
                        <p style={{ fontSize: 14, color: '#e2e8f0', lineHeight: 1.8 }}>{selectedScript.content}</p>
                      </div>
                      <button
                        style={{
                          width: '100%',
                          padding: 12,
                          borderRadius: 8,
                          background: 'rgba(99,102,241,0.2)',
                          border: '1px solid rgba(99,102,241,0.4)',
                          color: '#a5b4fc',
                          fontSize: 14,
                          cursor: 'pointer',
                        }}
                      >
                        复制话术
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
