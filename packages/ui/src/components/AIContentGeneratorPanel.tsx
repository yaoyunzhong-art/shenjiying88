'use client';

import React, { useCallback, useMemo, useState } from 'react';
import { Card } from './Card';
import { Button } from './Button';
import { Select } from './Select';
import { Tag } from './Tag';
import { Spinner } from './Spinner';
import { Input } from './Input';
import { TextArea } from './TextArea';

// ==================== 类型定义 ====================

/** 生成内容类型 */
export type ContentType = 'campaign_title' | 'campaign_desc' | 'sms_text' | 'push_text' | 'wechat_msg' | 'landing_copy';

/** 生成内容样式/语气 */
export type ContentTone = 'formal' | 'casual' | 'urgent' | 'friendly' | 'luxury' | 'humorous';

/** 单条生成结果 */
export interface GeneratedContent {
  /** 唯一标识 */
  id: string;
  /** 内容文本 */
  text: string;
  /** 内容类型 */
  type: ContentType;
  /** 使用次数 (用于推荐排序) */
  usageCount?: number;
  /** 是否收藏 */
  starred?: boolean;
}

/** 生成请求参数 */
export interface ContentGenerateRequest {
  /** 内容类型 */
  type: ContentType;
  /** 品牌/项目名称 */
  brandName?: string;
  /** 关键词 (逗号分隔) */
  keywords?: string;
  /** 目标受众 */
  targetAudience?: string;
  /** 特殊要求 */
  specialNotes?: string;
  /** 语气风格 */
  tone?: ContentTone;
  /** 生成条数 */
  count?: number;
}

/** 生成历史记录 */
export interface GenerationHistoryItem {
  id: string;
  type: ContentType;
  prompt: string;
  resultCount: number;
  createdAt: string;
}

/** AI 内容生成面板 Props */
export interface AIContentGeneratorPanelProps {
  /** 当前生成结果列表 */
  results?: GeneratedContent[];
  /** 历史生成记录 */
  history?: GenerationHistoryItem[];
  /** 是否正在生成 */
  generating?: boolean;
  /** 生成回调: 接收请求参数 */
  onGenerate?: (req: ContentGenerateRequest) => void;
  /** 使用/采纳某条内容 */
  onUseContent?: (content: GeneratedContent) => void;
  /** 收藏/取消收藏 */
  onToggleStar?: (contentId: string) => void;
  /** 重新生成 (使用相同参数) */
  onRegenerate?: () => void;
  /** 面板标题 */
  title?: string;
  /** 空状态文案 */
  emptyText?: string;
  /** 自定义类名 */
  className?: string;
  /** 最大结果展示数 */
  maxResults?: number;
  /** 测试 id */
  testId?: string;
}

// ==================== 常量 ====================

/** 内容类型选项 */
const CONTENT_TYPE_OPTIONS: { value: ContentType; label: string }[] = [
  { value: 'campaign_title', label: '活动标题' },
  { value: 'campaign_desc', label: '活动描述' },
  { value: 'sms_text', label: '短信文案' },
  { value: 'push_text', label: '推送文案' },
  { value: 'wechat_msg', label: '微信消息' },
  { value: 'landing_copy', label: '落地页文案' },
];

/** 语气选项 */
const TONE_OPTIONS: { value: ContentTone; label: string }[] = [
  { value: 'formal', label: '正式' },
  { value: 'casual', label: '轻松' },
  { value: 'urgent', label: '紧迫' },
  { value: 'friendly', label: '友好' },
  { value: 'luxury', label: '高端' },
  { value: 'humorous', label: '幽默' },
];

/** 内容类型映射中文 */
const CONTENT_TYPE_LABELS: Record<ContentType, string> = {
  campaign_title: '活动标题',
  campaign_desc: '活动描述',
  sms_text: '短信文案',
  push_text: '推送文案',
  wechat_msg: '微信消息',
  landing_copy: '落地页文案',
};

// ==================== 组件 ====================

export const AIContentGeneratorPanel: React.FC<AIContentGeneratorPanelProps> = ({
  results = [],
  history = [],
  generating = false,
  onGenerate,
  onUseContent,
  onToggleStar,
  onRegenerate,
  title = 'AI 内容生成',
  emptyText = '暂无生成内容，输入参数点击生成',
  className = '',
  maxResults = 10,
  testId,
}) => {
  // 表单状态
  const [contentType, setContentType] = useState<ContentType>('campaign_title');
  const [brandName, setBrandName] = useState('');
  const [keywords, setKeywords] = useState('');
  const [tone, setTone] = useState<ContentTone>('friendly');
  const [targetAudience, setTargetAudience] = useState('');
  const [specialNotes, setSpecialNotes] = useState('');
  const [activeTab, setActiveTab] = useState<'generator' | 'history'>('generator');

  /** 处理生成点击 */
  const handleGenerate = useCallback(() => {
    if (!onGenerate) return;
    onGenerate({
      type: contentType,
      brandName: brandName || undefined,
      keywords: keywords || undefined,
      tone,
      targetAudience: targetAudience || undefined,
      specialNotes: specialNotes || undefined,
      count: 3,
    });
  }, [onGenerate, contentType, brandName, keywords, tone, targetAudience, specialNotes]);

  /** 是否可以生成 */
  const canGenerate = useMemo(() => {
    return !generating && !!onGenerate;
  }, [generating, onGenerate]);

  /** 展示结果列表 */
  const displayResults = useMemo(() => {
    return results.slice(0, maxResults);
  }, [results, maxResults]);

  return (
    <Card className={`ai-content-generator-panel ${className}`} data-testid={testId}>
      {/* 头部 */}
      <div className="ai-content-generator-panel__header" style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
      }}>
        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>{title}</h3>
        <div style={{ display: 'flex', gap: 8 }}>
          <Button
            variant={activeTab === 'generator' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setActiveTab('generator')}
          >
            生成器
          </Button>
          <Button
            variant={activeTab === 'history' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setActiveTab('history')}
          >
            历史记录
          </Button>
        </div>
      </div>

      {/* 生成器面板 */}
      {activeTab === 'generator' && (
        <div className="ai-content-generator-panel__generator">
          {/* 参数表单 */}
          <div className="ai-content-generator-panel__form" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', gap: 12 }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: 12, color: '#666', marginBottom: 4 }}>内容类型</label>
                <Select
                  value={contentType}
                  onChange={v => setContentType(v as ContentType)}
                  options={CONTENT_TYPE_OPTIONS}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: 12, color: '#666', marginBottom: 4 }}>语气风格</label>
                <Select
                  value={tone}
                  onChange={v => setTone(v as ContentTone)}
                  options={TONE_OPTIONS}
                />
              </div>
            </div>
            <Input
              placeholder="品牌/项目名称"
              value={brandName}
              onChange={e => setBrandName(e.target.value)}
            />
            <Input
              placeholder="关键词 (逗号分隔)"
              value={keywords}
              onChange={e => setKeywords(e.target.value)}
            />
            <Input
              placeholder="目标受众"
              value={targetAudience}
              onChange={e => setTargetAudience(e.target.value)}
            />
            <TextArea
              placeholder="特殊要求或备注"
              value={specialNotes}
              onChange={e => setSpecialNotes(e.target.value)}
              rows={2}
            />
            <div style={{ display: 'flex', gap: 8 }}>
              <Button
                onClick={handleGenerate}
                disabled={!canGenerate}
              >
                {generating ? '生成中...' : '生成内容'}
              </Button>
              {results.length > 0 && onRegenerate && (
                <Button variant="outline" onClick={onRegenerate} disabled={generating}>
                  重新生成
                </Button>
              )}
            </div>
          </div>

          {/* 生成结果 */}
          <div className="ai-content-generator-panel__results" style={{ marginTop: 16 }}>
            {generating && (
              <div style={{ textAlign: 'center', padding: 24 }}>
                <Spinner />
                <p style={{ color: '#999', fontSize: 13, marginTop: 8 }}>AI 正在生成内容…</p>
              </div>
            )}

            {!generating && displayResults.length === 0 && (
              <div style={{ textAlign: 'center', padding: 24, color: '#999', fontSize: 13 }}>
                {emptyText}
              </div>
            )}

            {!generating && displayResults.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {displayResults.map((content, idx) => (
                  <div
                    key={content.id}
                    data-testid={`${testId ? testId + '-' : ''}content-item-${idx}`}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 8,
                      padding: 12,
                      border: '1px solid #e5e7eb',
                      borderRadius: 8,
                      background: '#fafafa',
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ marginBottom: 4 }}>
                        <Tag variant="info" size="sm">{CONTENT_TYPE_LABELS[content.type]}</Tag>
                        {content.starred && <Tag variant="warning" size="sm" style={{ marginLeft: 4 }}>★ 收藏</Tag>}
                      </div>
                      <p style={{ margin: 0, fontSize: 14, lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>{content.text}</p>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flexShrink: 0 }}>
                      {onUseContent && (
                        <Button size="sm" variant="primary" onClick={() => onUseContent(content)}>
                          采纳
                        </Button>
                      )}
                      {onToggleStar && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onToggleStar(content.id)}
                        >
                          {content.starred ? '取消收藏' : '收藏'}
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 历史记录面板 */}
      {activeTab === 'history' && (
        <div className="ai-content-generator-panel__history">
          {history.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 24, color: '#999', fontSize: 13 }}>
              暂无历史记录
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {history.map((item) => (
                <div
                  key={item.id}
                  data-testid={`${testId ? testId + '-' : ''}history-item-${item.id}`}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '8px 12px',
                    fontSize: 13,
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ color: '#666', marginRight: 8 }}>
                      {CONTENT_TYPE_LABELS[item.type]}
                    </span>
                    <span style={{ color: '#333' }}>{item.prompt}</span>
                  </div>
                  <span style={{ color: '#999', fontSize: 12, flexShrink: 0 }}>
                    {item.createdAt} · {item.resultCount}条
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </Card>
  );
};
