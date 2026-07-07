'use client';

import React, { useState } from 'react';

// ==================== 类型定义 ====================

/** 会员画像标签 */
export interface MemberTag {
  /** 标签编码 */
  code: string;
  /** 标签名称 */
  label: string;
  /** 标签类别 */
  category: 'demographic' | 'behavior' | 'consumption' | 'lifestyle' | 'interest';
  /** 置信度 0-100 */
  confidence: number;
  /** 标签说明 */
  description?: string;
}

/** 用户画像评分 */
export interface PersonaScore {
  /** 维度名称 */
  dimension: string;
  /** 评分 0-100 */
  score: number;
  /** 维度图标 emoji */
  icon: string;
  /** 维度说明 */
  description: string;
}

/** 偏好项 */
export interface Preference {
  /** 偏好编码 */
  code: string;
  /** 偏好名称 */
  label: string;
  /** 偏好类型 */
  type: 'category' | 'brand' | 'service' | 'channel';
  /** 偏好强度 0-100 */
  intensity: number;
  /** 偏好评级 */
  rank: number;
}

/** AI 洞察项 */
export interface AIInsight {
  /** 洞察编码 */
  code: string;
  /** 洞察标题 */
  title: string;
  /** 洞察内容 */
  content: string;
  /** 洞察类型 */
  type: 'opportunity' | 'risk' | 'suggestion' | 'trend';
  /** 生成时间 */
  generatedAt: string;
}

/** 会员智能画像数据 */
export interface MemberProfile {
  /** 会员 ID */
  memberId: string;
  /** 会员名称 */
  memberName: string;
  /** 会员头像 URL */
  avatarUrl?: string;
  /** 会员等级 */
  tier: string;
  /** 累计消费金额 */
  totalSpent: number;
  /** 近30天消费金额 */
  monthlySpent: number;
  /** 会员入会天数 */
  membershipDays: number;
  /** AI 自动打标 */
  tags: MemberTag[];
  /** 画像评分 */
  personaScores: PersonaScore[];
  /** 偏好列表 */
  preferences: Preference[];
  /** AI 洞察 */
  insights: AIInsight[];
  /** 上次更新时间 */
  lastUpdated: string;
}

// ==================== 常量 ====================

const TAG_CATEGORY_LABELS: Record<string, string> = {
  demographic: '人口统计',
  behavior: '行为特征',
  consumption: '消费习惯',
  lifestyle: '生活方式',
  interest: '兴趣爱好',
};

const TAG_CATEGORY_COLORS: Record<string, string> = {
  demographic: '#6366f1',
  behavior: '#f59e0b',
  consumption: '#22c55e',
  lifestyle: '#ec4899',
  interest: '#06b6d4',
};

const INSIGHT_TYPE_CONFIG: Record<string, { label: string; icon: string; color: string }> = {
  opportunity: { label: '商机洞察', icon: '💡', color: '#22c55e' },
  risk: { label: '风险提示', icon: '⚠️', color: '#ef4444' },
  suggestion: { label: '行动建议', icon: '📋', color: '#6366f1' },
  trend: { label: '趋势分析', icon: '📈', color: '#06b6d4' },
};

const PREFERENCE_TYPE_LABELS: Record<string, string> = {
  category: '品类偏好',
  brand: '品牌偏好',
  service: '服务偏好',
  channel: '渠道偏好',
};

// ==================== 子组件 ====================

/** 标签云组件 */
function TagCloud({ tags }: { tags: MemberTag[] }) {
  const [expanded, setExpanded] = useState(false);
  const displayTags = expanded ? tags : tags.slice(0, 8);

  if (tags.length === 0) {
    return <p className="text-xs text-gray-400 text-center py-3">暂无画像标签</p>;
  }

  return (
    <div>
      <div className="flex flex-wrap gap-1.5">
        {displayTags.map((tag) => (
          <span
            key={tag.code}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium text-white"
            style={{ backgroundColor: TAG_CATEGORY_COLORS[tag.category] || '#6b7280', opacity: Math.max(0.5, tag.confidence / 100) }}
            title={`${tag.description || tag.label} (置信度: ${tag.confidence}%)`}
          >
            {tag.label}
            <span className="opacity-70 text-[10px]">{tag.confidence}%</span>
          </span>
        ))}
      </div>
      {tags.length > 8 && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-xs text-indigo-500 hover:text-indigo-700 mt-1.5"
        >
          {expanded ? '收起' : `展开全部 (${tags.length} 项)`}
        </button>
      )}
    </div>
  );
}

/** 单项评分条 */
function ScoreBar({ dimension, score, icon, description }: PersonaScore) {
  return (
    <div className="mb-2">
      <div className="flex justify-between items-center mb-0.5">
        <span className="text-xs font-medium text-gray-700 flex items-center gap-1">
          <span>{icon}</span>
          <span>{dimension}</span>
        </span>
        <span className="text-xs font-semibold" style={{ color: score >= 70 ? '#22c55e' : score >= 40 ? '#f59e0b' : '#ef4444' }}>
          {score} 分
        </span>
      </div>
      <div className="w-full bg-gray-100 rounded-full h-1.5">
        <div
          className="h-1.5 rounded-full transition-all"
          style={{
            width: `${score}%`,
            backgroundColor: score >= 70 ? '#22c55e' : score >= 40 ? '#f59e0b' : '#ef4444',
          }}
        />
      </div>
      <p className="text-[10px] text-gray-400 mt-0.5">{description}</p>
    </div>
  );
}

/** 偏好展示条 */
function PreferenceBar({ preference }: { preference: Preference }) {
  const barColor = preference.intensity >= 70 ? '#6366f1' : preference.intensity >= 40 ? '#8b5cf6' : '#a78bfa';
  return (
    <div className="flex items-center gap-2 mb-1.5">
      <span className="text-xs text-gray-600 min-w-[60px] truncate" title={preference.label}>
        {preference.label}
      </span>
      <div className="flex-1 bg-gray-100 rounded-full h-1.5">
        <div
          className="h-1.5 rounded-full transition-all"
          style={{ width: `${preference.intensity}%`, backgroundColor: barColor }}
        />
      </div>
      <span className="text-[10px] text-gray-400 min-w-[40px] text-right">{preference.intensity}%</span>
    </div>
  );
}

/** AI 洞察卡片 */
function InsightCard({ insight }: { insight: AIInsight }) {
  const config = INSIGHT_TYPE_CONFIG[insight.type] || { label: '洞察', icon: '📌', color: '#6b7280' };
  return (
    <div className="border border-gray-200 rounded-lg p-3 mb-2 bg-white hover:shadow-sm transition-shadow">
      <div className="flex items-start justify-between mb-1">
        <div className="flex items-center gap-1.5">
          <span className="text-sm">{config.icon}</span>
          <span className="text-sm font-medium text-gray-800">{insight.title}</span>
        </div>
        <span
          className="text-[10px] px-1.5 py-0.5 rounded-full text-white font-medium"
          style={{ backgroundColor: config.color }}
        >
          {config.label}
        </span>
      </div>
      <p className="text-xs text-gray-600 leading-relaxed">{insight.content}</p>
      <p className="text-[10px] text-gray-400 mt-1">
        生成于 {new Date(insight.generatedAt).toLocaleString('zh-CN')}
      </p>
    </div>
  );
}

/** 金额格式化 */
function formatCurrency(value: number): string {
  if (value >= 10000) {
    return `${(value / 10000).toFixed(1)}万`;
  }
  return value.toLocaleString('zh-CN');
}

// ==================== 主组件 ====================

export interface AIMemberProfilePanelProps {
  /** 会员画像数据 */
  profile: MemberProfile;
  /** 是否加载中 */
  loading?: boolean;
  /** 错误信息 */
  error?: string | null;
  /** 刷新回调 */
  onRefresh?: () => void;
  /** 标签点击回调 */
  onTagClick?: (tag: MemberTag) => void;
  /** 自定义类名 */
  className?: string;
}

export function AIMemberProfilePanel({
  profile,
  loading = false,
  error = null,
  onRefresh,
  onTagClick,
  className = '',
}: AIMemberProfilePanelProps) {
  const [activeTab, setActiveTab] = useState<'tags' | 'persona' | 'preferences' | 'insights'>('tags');

  const tabs = [
    { key: 'tags' as const, label: 'AI 标签', count: profile.tags.length },
    { key: 'persona' as const, label: '画像评分', count: profile.personaScores.length },
    { key: 'preferences' as const, label: '偏好分析', count: profile.preferences.length },
    { key: 'insights' as const, label: 'AI 洞察', count: profile.insights.length },
  ];

  // ---- 加载态 ----
  if (loading) {
    return (
      <div className={`bg-white rounded-lg border border-gray-200 overflow-hidden ${className}`}>
        <div className="animate-pulse p-5">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-12 h-12 bg-gray-200 rounded-full" />
            <div>
              <div className="h-4 bg-gray-200 rounded w-24 mb-2" />
              <div className="h-3 bg-gray-200 rounded w-16" />
            </div>
          </div>
          <div className="flex gap-2 mb-4">
            <div className="h-6 bg-gray-200 rounded w-16" />
            <div className="h-6 bg-gray-200 rounded w-16" />
            <div className="h-6 bg-gray-200 rounded w-16" />
          </div>
          <div className="h-20 bg-gray-200 rounded mb-2" />
          <div className="h-20 bg-gray-200 rounded" />
        </div>
      </div>
    );
  }

  // ---- 错误态 ----
  if (error) {
    return (
      <div className={`bg-red-50 border border-red-200 rounded-lg p-5 ${className}`}>
        <div className="flex items-center gap-2 text-red-600 mb-2">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="font-medium">画像加载失败</span>
        </div>
        <p className="text-sm text-red-500 mb-3">{error}</p>
        {onRefresh && (
          <button
            onClick={onRefresh}
            className="text-sm px-3 py-1.5 bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
          >
            重新加载
          </button>
        )}
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg border border-gray-200 overflow-hidden ${className}`}>
      {/* 头部：会员基本信息 */}
      <div className="px-5 py-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {profile.avatarUrl ? (
              <img
                src={profile.avatarUrl}
                alt={profile.memberName}
                className="w-12 h-12 rounded-full object-cover border-2 border-gray-100"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-500 font-bold text-lg">
                {profile.memberName.charAt(0)}
              </div>
            )}
            <div>
              <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                {profile.memberName}
                <span className="text-xs px-1.5 py-0.5 rounded-full bg-yellow-100 text-yellow-700 font-medium">
                  {profile.tier}
                </span>
              </h3>
              <p className="text-xs text-gray-400">
                已入会 {profile.membershipDays} 天 · 累计消费 ¥{formatCurrency(profile.totalSpent)}
              </p>
            </div>
          </div>
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="text-xs px-2 py-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
              title="刷新画像"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          )}
        </div>
        {/* 月度消费速览 */}
        <div className="mt-3 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg p-3">
          <div className="flex items-center gap-4">
            <div>
              <p className="text-[10px] text-gray-500">本月消费</p>
              <p className="text-lg font-bold text-indigo-600">¥{formatCurrency(profile.monthlySpent)}</p>
            </div>
            <div className="w-px h-8 bg-indigo-200" />
            <div>
              <p className="text-[10px] text-gray-500">画像更新</p>
              <p className="text-xs text-gray-600">
                {new Date(profile.lastUpdated).toLocaleDateString('zh-CN')}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 标签页切换 */}
      <div className="flex border-b border-gray-100">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 text-xs py-3 font-medium transition-colors relative ${
              activeTab === tab.key
                ? 'text-indigo-600 border-b-2 border-indigo-500'
                : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            {tab.label}
            {tab.count > 0 && (
              <span
                className={`ml-1 text-[10px] px-1 rounded-full ${
                  activeTab === tab.key ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-400'
                }`}
              >
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* 标签页内容 */}
      <div className="p-5">
        {/* AI 标签 */}
        {activeTab === 'tags' && (
          <div>
            {profile.tags.length > 0 ? (
              <div className="space-y-3">
                {/* 按类别分组统计 */}
                <div className="flex gap-3 flex-wrap mb-3">
                  {Object.entries(TAG_CATEGORY_LABELS).map(([cat, label]) => {
                    const count = profile.tags.filter((t) => t.category === cat).length;
                    if (count === 0) return null;
                    return (
                      <span
                        key={cat}
                        className="text-[10px] px-2 py-0.5 rounded-full text-white"
                        style={{ backgroundColor: TAG_CATEGORY_COLORS[cat] }}
                      >
                        {label} ×{count}
                      </span>
                    );
                  })}
                </div>
                <TagCloud tags={profile.tags} />
                {onTagClick && profile.tags.length > 0 && (
                  <p className="text-[10px] text-gray-400 mt-2">点击标签可查看更多</p>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-3xl mb-2">🏷️</p>
                <p className="text-sm text-gray-400">暂无 AI 标签数据</p>
                <p className="text-xs text-gray-300 mt-1">系统将根据会员行为自动生成画像标签</p>
              </div>
            )}
          </div>
        )}

        {/* 画像评分 */}
        {activeTab === 'persona' && (
          <div>
            {profile.personaScores.length > 0 ? (
              <div>
                {profile.personaScores.map((ps) => (
                  <ScoreBar key={ps.dimension} {...ps} />
                ))}
                {/* 平均分 */}
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500">综合评分</span>
                    <span className="text-sm font-bold text-indigo-600">
                      {Math.round(profile.personaScores.reduce((s, p) => s + p.score, 0) / profile.personaScores.length)} 分
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-3xl mb-2">📊</p>
                <p className="text-sm text-gray-400">暂无画像评分</p>
              </div>
            )}
          </div>
        )}

        {/* 偏好分析 */}
        {activeTab === 'preferences' && (
          <div>
            {profile.preferences.length > 0 ? (
              <div>
                {/* 偏好类型统计 */}
                <div className="flex gap-2 flex-wrap mb-3">
                  {Object.entries(PREFERENCE_TYPE_LABELS).map(([type, label]) => {
                    const count = profile.preferences.filter((p) => p.type === type).length;
                    if (count === 0) return null;
                    return (
                      <span key={type} className="text-[10px] px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">
                        {label} ×{count}
                      </span>
                    );
                  })}
                </div>
                <div className="space-y-0.5">
                  {profile.preferences
                    .sort((a, b) => b.intensity - a.intensity)
                    .map((pref) => (
                      <PreferenceBar key={pref.code} preference={pref} />
                    ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-3xl mb-2">🎯</p>
                <p className="text-sm text-gray-400">暂无偏好数据</p>
              </div>
            )}
          </div>
        )}

        {/* AI 洞察 */}
        {activeTab === 'insights' && (
          <div>
            {profile.insights.length > 0 ? (
              <div>
                {profile.insights.map((insight) => (
                  <InsightCard key={insight.code} insight={insight} />
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-3xl mb-2">🤖</p>
                <p className="text-sm text-gray-400">暂无 AI 洞察</p>
                <p className="text-xs text-gray-300 mt-1">系统将基于会员数据持续生成洞察建议</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 脚注 */}
      <div className="px-5 py-2.5 border-t border-gray-100 bg-gray-50 rounded-b-lg">
        <p className="text-xs text-gray-400">
          画像由 AI 基于会员历史行为、消费记录等多维数据自动生成，仅供参考
        </p>
      </div>
    </div>
  );
}
