'use client';

import React, { useEffect, useState } from 'react';
import { PageShell } from '@m5/ui';
import {
  MOCK_CAMPAIGNS,
  MOCK_AB_EXPERIMENTS,
  MOCK_SEGMENTS,
  type Campaign,
  type CopyVariant,
  type ABExperiment,
  type MemberSegment,
} from './ai-marketing-data';
import {
  getCampaigns,
  createCampaign,
  pauseCampaign,
  generateCopy,
  getCopyVariants,
  runABTest,
  getABResults,
  getSegments,
  getOptimalTiming,
  getCampaignROI,
} from './ai-marketing-service';

type Tab = 'campaigns' | 'copy' | 'abtest' | 'segments';

const STATUS_COLORS: Record<string, string> = {
  active: '#22c55e',
  paused: '#eab308',
  draft: '#94a3b8',
  ended: '#64748b',
};

const STATUS_LABELS: Record<string, string> = {
  active: '进行中',
  paused: '已暂停',
  draft: '草稿',
  ended: '已结束',
};

const SEGMENT_COLORS: Record<string, string> = {
  new: '#3b82f6',
  active: '#22c55e',
  dormant: '#eab308',
  churned: '#ef4444',
};

export default function AIMarketingPage() {
  const [activeTab, setActiveTab] = useState<Tab>('campaigns');
  const [campaigns, setCampaigns] = useState<Campaign[]>(MOCK_CAMPAIGNS);
  const [experiments, setExperiments] = useState<ABExperiment[]>(MOCK_AB_EXPERIMENTS);
  const [segments, setSegments] = useState<MemberSegment[]>(MOCK_SEGMENTS);

  // Copy assistant state
  const [brief, setBrief] = useState('');
  const [generatedCopy, setGeneratedCopy] = useState<{ title: string; body: string; cta: string } | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // New campaign form
  const [newCampaignName, setNewCampaignName] = useState('');
  const [newCampaignDesc, setNewCampaignDesc] = useState('');

  useEffect(() => {
    getCampaigns().then(setCampaigns);
    getSegments().then(setSegments);
  }, []);

  const handleCreateCampaign = async () => {
    if (!newCampaignName.trim()) return;
    const newCampaign = await createCampaign({
      name: newCampaignName,
      description: newCampaignDesc,
    });
    setCampaigns(prev => [...prev, newCampaign]);
    setNewCampaignName('');
    setNewCampaignDesc('');
  };

  const handlePauseCampaign = async (id: string) => {
    const paused = await pauseCampaign(id);
    if (paused) {
      setCampaigns(prev => prev.map(c => c.id === id ? paused : c));
    }
  };

  const handleGenerateCopy = async () => {
    if (!brief.trim()) return;
    setIsGenerating(true);
    const copy = await generateCopy(brief);
    setGeneratedCopy(copy);
    setIsGenerating(false);
  };

  const handleRunABTest = async (campaignId: string) => {
    if (!generatedCopy) return;
    const experiment = await runABTest(campaignId, [
      { title: generatedCopy.title, body: generatedCopy.body, cta: generatedCopy.cta },
      { title: `${generatedCopy.title} - 变体B`, body: generatedCopy.body, cta: '点击领取' },
    ]);
    setExperiments(prev => [...prev, experiment]);
  };

  return (
    <PageShell title="AI营销中心" description="智能营销活动管理与优化">
      {/* Tab Navigation */}
      <div style={{
        display: 'flex',
        gap: 8,
        marginBottom: 24,
        borderBottom: '1px solid rgba(148,163,184,0.12)',
        paddingBottom: 12,
      }}>
        {(['campaigns', 'copy', 'abtest', 'segments'] as Tab[]).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '8px 16px',
              fontSize: 14,
              fontWeight: 500,
              borderRadius: 6,
              border: 'none',
              cursor: 'pointer',
              background: activeTab === tab ? 'rgba(59,130,246,0.15)' : 'transparent',
              color: activeTab === tab ? '#60a5fa' : '#94a3b8',
              transition: 'all 0.2s',
            }}
          >
            {tab === 'campaigns' && '活动管理'}
            {tab === 'copy' && '文案助手'}
            {tab === 'abtest' && 'A/B测试'}
            {tab === 'segments' && '会员分群'}
          </button>
        ))}
      </div>

      {/* Campaign Management Tab */}
      {activeTab === 'campaigns' && (
        <div>
          {/* New Campaign Form */}
          <div style={{
            background: 'rgba(30,41,59,0.9)',
            border: '1px solid rgba(148,163,184,0.12)',
            borderRadius: 12,
            padding: 20,
            marginBottom: 24,
          }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, color: '#f8fafc', margin: '0 0 16px' }}>
              创建新活动
            </h3>
            <div style={{ display: 'flex', gap: 12 }}>
              <input
                type="text"
                placeholder="活动名称"
                value={newCampaignName}
                onChange={e => setNewCampaignName(e.target.value)}
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  borderRadius: 6,
                  border: '1px solid rgba(148,163,184,0.2)',
                  background: 'rgba(15,23,42,0.8)',
                  color: '#e2e8f0',
                  fontSize: 14,
                }}
              />
              <input
                type="text"
                placeholder="活动描述"
                value={newCampaignDesc}
                onChange={e => setNewCampaignDesc(e.target.value)}
                style={{
                  flex: 2,
                  padding: '8px 12px',
                  borderRadius: 6,
                  border: '1px solid rgba(148,163,184,0.2)',
                  background: 'rgba(15,23,42,0.8)',
                  color: '#e2e8f0',
                  fontSize: 14,
                }}
              />
              <button
                onClick={handleCreateCampaign}
                style={{
                  padding: '8px 20px',
                  borderRadius: 6,
                  border: 'none',
                  background: 'linear-gradient(135deg, #3b82f6, #60a5fa)',
                  color: '#fff',
                  fontSize: 14,
                  fontWeight: 500,
                  cursor: 'pointer',
                }}
              >
                创建
              </button>
            </div>
          </div>

          {/* Campaign Cards Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
            {campaigns.map(campaign => (
              <div
                key={campaign.id}
                style={{
                  background: 'rgba(30,41,59,0.9)',
                  border: '1px solid rgba(148,163,184,0.12)',
                  borderRadius: 12,
                  padding: 20,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <h4 style={{ fontSize: 15, fontWeight: 600, color: '#f8fafc', margin: 0 }}>{campaign.name}</h4>
                  <span style={{
                    padding: '4px 10px',
                    fontSize: 12,
                    fontWeight: 600,
                    borderRadius: 4,
                    background: `${STATUS_COLORS[campaign.status]}20`,
                    color: STATUS_COLORS[campaign.status],
                  }}>
                    {STATUS_LABELS[campaign.status]}
                  </span>
                </div>
                <p style={{ fontSize: 13, color: '#94a3b8', margin: '0 0 12px' }}>{campaign.description}</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <div style={{ background: 'rgba(15,23,42,0.6)', padding: 10, borderRadius: 6 }}>
                    <p style={{ fontSize: 11, color: '#64748b', margin: '0 0 4px' }}>ROI</p>
                    <p style={{ fontSize: 18, fontWeight: 700, color: '#22c55e', margin: 0 }}>{campaign.roi}x</p>
                  </div>
                  <div style={{ background: 'rgba(15,23,42,0.6)', padding: 10, borderRadius: 6 }}>
                    <p style={{ fontSize: 11, color: '#64748b', margin: '0 0 4px' }}>触达人数</p>
                    <p style={{ fontSize: 18, fontWeight: 700, color: '#60a5fa', margin: 0 }}>{(campaign.reachCount / 1000).toFixed(1)}k</p>
                  </div>
                </div>
                {campaign.status === 'active' && (
                  <button
                    onClick={() => handlePauseCampaign(campaign.id)}
                    style={{
                      marginTop: 12,
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 6,
                      border: '1px solid rgba(234,179,8,0.3)',
                      background: 'transparent',
                      color: '#eab308',
                      fontSize: 13,
                      fontWeight: 500,
                      cursor: 'pointer',
                    }}
                  >
                    暂停活动
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Copy Assistant Tab */}
      {activeTab === 'copy' && (
        <div>
          <div style={{
            background: 'rgba(30,41,59,0.9)',
            border: '1px solid rgba(148,163,184,0.12)',
            borderRadius: 12,
            padding: 24,
            marginBottom: 24,
          }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, color: '#f8fafc', margin: '0 0 16px' }}>
              AI文案助手
            </h3>
            <textarea
              placeholder="输入营销brief，如：推广新款运动鞋，主打轻便透气，适合跑步爱好者"
              value={brief}
              onChange={e => setBrief(e.target.value)}
              style={{
                width: '100%',
                minHeight: 100,
                padding: 12,
                borderRadius: 8,
                border: '1px solid rgba(148,163,184,0.2)',
                background: 'rgba(15,23,42,0.8)',
                color: '#e2e8f0',
                fontSize: 14,
                resize: 'vertical',
                marginBottom: 16,
              }}
            />
            <div style={{ display: 'flex', gap: 12 }}>
              <button
                onClick={handleGenerateCopy}
                disabled={isGenerating}
                style={{
                  padding: '10px 24px',
                  borderRadius: 6,
                  border: 'none',
                  background: 'linear-gradient(135deg, #3b82f6, #60a5fa)',
                  color: '#fff',
                  fontSize: 14,
                  fontWeight: 500,
                  cursor: isGenerating ? 'not-allowed' : 'pointer',
                  opacity: isGenerating ? 0.6 : 1,
                }}
              >
                {isGenerating ? '生成中...' : 'AI生成文案'}
              </button>
              {generatedCopy && (
                <button
                  onClick={() => handleRunABTest(campaigns[0]?.id ?? 'C001')}
                  style={{
                    padding: '10px 24px',
                    borderRadius: 6,
                    border: '1px solid rgba(59,130,246,0.3)',
                    background: 'transparent',
                    color: '#60a5fa',
                    fontSize: 14,
                    fontWeight: 500,
                    cursor: 'pointer',
                  }}
                >
                  生成A/B变体
                </button>
              )}
            </div>
          </div>

          {generatedCopy && (
            <div style={{
              background: 'rgba(30,41,59,0.9)',
              border: '1px solid rgba(148,163,184,0.12)',
              borderRadius: 12,
              padding: 24,
            }}>
              <h3 style={{ fontSize: 15, fontWeight: 600, color: '#f8fafc', margin: '0 0 16px' }}>
                生成结果
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ background: 'rgba(15,23,42,0.6)', padding: 16, borderRadius: 8 }}>
                  <p style={{ fontSize: 12, color: '#64748b', margin: '0 0 6px' }}>标题</p>
                  <p style={{ fontSize: 16, fontWeight: 600, color: '#f8fafc', margin: 0 }}>{generatedCopy.title}</p>
                </div>
                <div style={{ background: 'rgba(15,23,42,0.6)', padding: 16, borderRadius: 8 }}>
                  <p style={{ fontSize: 12, color: '#64748b', margin: '0 0 6px' }}>正文</p>
                  <p style={{ fontSize: 14, color: '#e2e8f0', margin: 0 }}>{generatedCopy.body}</p>
                </div>
                <div style={{ background: 'rgba(15,23,42,0.6)', padding: 16, borderRadius: 8 }}>
                  <p style={{ fontSize: 12, color: '#64748b', margin: '0 0 6px' }}>CTA按钮</p>
                  <p style={{ fontSize: 14, fontWeight: 600, color: '#22c55e', margin: 0 }}>{generatedCopy.cta}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* A/B Testing Tab */}
      {activeTab === 'abtest' && (
        <div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {experiments.map(exp => (
              <div
                key={exp.id}
                style={{
                  background: 'rgba(30,41,59,0.9)',
                  border: '1px solid rgba(148,163,184,0.12)',
                  borderRadius: 12,
                  padding: 20,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                  <div>
                    <h4 style={{ fontSize: 15, fontWeight: 600, color: '#f8fafc', margin: '0 0 4px' }}>{exp.name}</h4>
                    <p style={{ fontSize: 12, color: '#64748b', margin: 0 }}>
                      {new Date(exp.startDate).toLocaleDateString('zh-CN')}
                      {exp.endDate && ` - ${new Date(exp.endDate).toLocaleDateString('zh-CN')}`}
                    </p>
                  </div>
                  <span style={{
                    padding: '4px 10px',
                    fontSize: 12,
                    fontWeight: 600,
                    borderRadius: 4,
                    background: exp.status === 'running' ? 'rgba(34,197,94,0.15)' : 'rgba(148,163,184,0.15)',
                    color: exp.status === 'running' ? '#22c55e' : '#94a3b8',
                  }}>
                    {exp.status === 'running' ? '进行中' : exp.status === 'completed' ? '已完成' : '草稿'}
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                  {exp.variants.map((v, i) => (
                    <div key={v.id} style={{
                      background: 'rgba(15,23,42,0.6)',
                      padding: 14,
                      borderRadius: 8,
                      border: i === 0 ? '1px solid rgba(59,130,246,0.3)' : '1px solid rgba(234,179,8,0.3)',
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                        <span style={{
                          padding: '2px 8px',
                          fontSize: 11,
                          fontWeight: 700,
                          borderRadius: 3,
                          background: i === 0 ? 'rgba(59,130,246,0.2)' : 'rgba(234,179,8,0.2)',
                          color: i === 0 ? '#60a5fa' : '#fbbf24',
                        }}>
                          变体{v.variant}
                        </span>
                      </div>
                      <p style={{ fontSize: 14, fontWeight: 600, color: '#f8fafc', margin: '0 0 4px' }}>{v.title}</p>
                      <p style={{ fontSize: 12, color: '#94a3b8', margin: '0 0 4px' }}>{v.body}</p>
                      <p style={{ fontSize: 12, color: '#22c55e', margin: 0 }}>CTA: {v.cta}</p>
                    </div>
                  ))}
                </div>

                {exp.status !== 'draft' && (
                  <div style={{ display: 'flex', gap: 16 }}>
                    <div style={{ background: 'rgba(15,23,42,0.6)', padding: 12, borderRadius: 6, flex: 1 }}>
                      <p style={{ fontSize: 11, color: '#64748b', margin: '0 0 4px' }}>提升率</p>
                      <p style={{ fontSize: 20, fontWeight: 700, color: '#22c55e', margin: 0 }}>+{exp.lift}%</p>
                    </div>
                    <div style={{ background: 'rgba(15,23,42,0.6)', padding: 12, borderRadius: 6, flex: 1 }}>
                      <p style={{ fontSize: 11, color: '#64748b', margin: '0 0 4px' }}>置信度</p>
                      <p style={{ fontSize: 20, fontWeight: 700, color: '#60a5fa', margin: 0 }}>{exp.confidence}%</p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Member Segments Tab */}
      {activeTab === 'segments' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
            {segments.map(segment => (
              <div
                key={segment.id}
                style={{
                  background: 'rgba(30,41,59,0.9)',
                  border: '1px solid rgba(148,163,184,0.12)',
                  borderRadius: 12,
                  padding: 20,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                  <div style={{
                    width: 48,
                    height: 48,
                    borderRadius: 10,
                    background: `${SEGMENT_COLORS[segment.type]}20`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 20,
                    fontWeight: 700,
                    color: SEGMENT_COLORS[segment.type],
                  }}>
                    {segment.type === 'new' && '新'}
                    {segment.type === 'active' && '活'}
                    {segment.type === 'dormant' && '沉'}
                    {segment.type === 'churned' && '流'}
                  </div>
                  <div>
                    <h4 style={{ fontSize: 15, fontWeight: 600, color: '#f8fafc', margin: 0 }}>{segment.name}</h4>
                    <p style={{ fontSize: 12, color: '#64748b', margin: 0 }}>
                      {segment.memberCount.toLocaleString()} 人
                    </p>
                  </div>
                </div>
                <p style={{ fontSize: 13, color: '#94a3b8', margin: '0 0 12px' }}>{segment.description}</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <div style={{ background: 'rgba(15,23,42,0.6)', padding: 10, borderRadius: 6 }}>
                    <p style={{ fontSize: 11, color: '#64748b', margin: '0 0 4px' }}>平均客单价</p>
                    <p style={{ fontSize: 16, fontWeight: 700, color: '#f8fafc', margin: 0 }}>
                      {segment.avgOrderValue > 0 ? `¥${segment.avgOrderValue}` : '-'}
                    </p>
                  </div>
                  <div style={{ background: 'rgba(15,23,42,0.6)', padding: 10, borderRadius: 6 }}>
                    <p style={{ fontSize: 11, color: '#64748b', margin: '0 0 4px' }}>最近活跃</p>
                    <p style={{ fontSize: 16, fontWeight: 700, color: '#f8fafc', margin: 0 }}>
                      {segment.lastActiveDays}天前
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </PageShell>
  );
}
