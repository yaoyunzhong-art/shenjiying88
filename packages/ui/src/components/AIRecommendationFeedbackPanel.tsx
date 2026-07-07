'use client'

import React, { useState, useCallback } from 'react'
import { Card } from './Card'
import { Button } from './Button'
import { TextArea } from './TextArea'
import { Badge } from './Badge'
import { useToast } from './Toast'
import type { ButtonVariant } from './Button'
import type { BadgeVariant } from './Badge'
import { Spinner } from './Spinner'
import { StatTrend } from './StatTrend'
import type { TrendDirection as TrendIndicatorDirection } from './StatTrend'

/* -------------------------------------------------------------------------- */
/*  Types                                                                     */
/* -------------------------------------------------------------------------- */

/** 反馈来源上下文 */
export interface FeedbackSource {
  /** 来源标识（推荐ID / 预测ID / 规则ID） */
  id: string
  /** 来源类型 */
  type: 'recommendation' | 'prediction' | 'decision' | 'insight'
  /** 来源名称 */
  label: string
  /** 推荐/预测的具体内容摘要 */
  summary: string
  /** 置信度 (0-100) */
  confidence?: number
  /** 相关指标影响 */
  metricImpact?: string
}

/** 用户反馈条目 */
export interface UserFeedbackItem {
  sourceId: string
  rating: FeedbackRating
  comment: string
  timestamp: string
}

/** 反馈评分 */
export type FeedbackRating = 'helpful' | 'somewhat' | 'not_helpful' | 'inaccurate'

/** 聚合统计 */
export interface FeedbackAggregate {
  totalFeedback: number
  helpfulRate: number
  somewhatRate: number
  notHelpfulRate: number
  inaccurateRate: number
  trend: 'up' | 'down' | 'stable'
}

export interface AIRecommendationFeedbackPanelProps {
  /** 当前待反馈的推荐来源 */
  source: FeedbackSource
  /** 历史反馈统计 */
  aggregate?: FeedbackAggregate
  /** 提交反馈回调 */
  onSubmitFeedback: (sourceId: string, rating: FeedbackRating, comment: string) => Promise<void>
  /** 忽略/跳过回调 */
  onSkip?: (sourceId: string) => void
  /** 是否正在提交 */
  submitting?: boolean
  /** 自定义类名 */
  className?: string
}

/* -------------------------------------------------------------------------- */
/*  rating metadata                                                           */
/* -------------------------------------------------------------------------- */

const ratingMeta: Record<FeedbackRating, { label: string; variant: BadgeVariant; buttonVariant: ButtonVariant; icon: string }> = {
  helpful: { label: '有帮助', variant: 'success', buttonVariant: 'primary', icon: '👍' },
  somewhat: { label: '部分有用', variant: 'info', buttonVariant: 'outline', icon: '🤔' },
  not_helpful: { label: '不相关', variant: 'warning', buttonVariant: 'outline', icon: '👎' },
  inaccurate: { label: '不准确', variant: 'error', buttonVariant: 'outline', icon: '⚠️' },
}

/* -------------------------------------------------------------------------- */
/*  Sub-component: Source Summary                                              */
/* -------------------------------------------------------------------------- */

function SourceSummary({ source }: { source: FeedbackSource }) {
  const typeLabel: Record<string, string> = {
    recommendation: '推荐',
    prediction: '预测',
    decision: '决策',
    insight: '洞察',
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Badge variant="primary">{typeLabel[source.type] ?? source.type}</Badge>
          <span className="text-sm font-medium text-gray-900">{source.label}</span>
        </div>
        {source.confidence !== undefined && (
          <span className="text-xs text-gray-500">
            AI 置信度: {source.confidence}%
          </span>
        )}
      </div>
      <p className="text-sm text-gray-700 leading-relaxed">{source.summary}</p>
      {source.metricImpact && (
        <p className="text-xs text-gray-500 mt-2">预期影响: {source.metricImpact}</p>
      )}
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*  Sub-component: Aggregate Stats                                             */
/* -------------------------------------------------------------------------- */

function AggregateStats({ agg }: { agg: FeedbackAggregate }) {
  return (
    <div className="grid grid-cols-4 gap-3">
      <div className="rounded-lg border border-gray-200 bg-white p-3 text-center">
        <div className="text-lg font-bold text-green-600">{agg.helpfulRate}%</div>
        <div className="text-xs text-gray-500 mt-1">有帮助</div>
      </div>
      <div className="rounded-lg border border-gray-200 bg-white p-3 text-center">
        <div className="text-lg font-bold text-blue-600">{agg.somewhatRate}%</div>
        <div className="text-xs text-gray-500 mt-1">部分有用</div>
      </div>
      <div className="rounded-lg border border-gray-200 bg-white p-3 text-center">
        <div className="text-lg font-bold text-amber-600">{agg.notHelpfulRate}%</div>
        <div className="text-xs text-gray-500 mt-1">不相关</div>
      </div>
      <div className="rounded-lg border border-gray-200 bg-white p-3 text-center">
        <div className="text-lg font-bold text-red-600">{agg.inaccurateRate}%</div>
        <div className="text-xs text-gray-500 mt-1">不准确</div>
      </div>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*  Main Component                                                            */
/* -------------------------------------------------------------------------- */

export function AIRecommendationFeedbackPanel({
  source,
  aggregate,
  onSubmitFeedback,
  onSkip,
  submitting = false,
  className = '',
}: AIRecommendationFeedbackPanelProps) {
  const [selectedRating, setSelectedRating] = useState<FeedbackRating | null>(null)
  const [comment, setComment] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const { toast: showToast } = useToast()

  const handleSubmit = useCallback(async () => {
    if (selectedRating === null) return
    try {
      await onSubmitFeedback(source.id, selectedRating, comment)
      setSubmitted(true)
      showToast('反馈已提交，感谢您的反馈，AI 将持续优化推荐质量。', { variant: 'success' })
    } catch {
      showToast('提交失败，请稍后重试。', { variant: 'error' })
    }
  }, [selectedRating, comment, source.id, onSubmitFeedback, showToast])

  const handleSkip = useCallback(() => {
    onSkip?.(source.id)
  }, [onSkip, source.id])

  const handleReset = useCallback(() => {
    setSelectedRating(null)
    setComment('')
    setSubmitted(false)
  }, [])

  /* ── Submitted confirmation ── */
  if (submitted) {
    return (
      <Card className={`p-6 ${className}`}>
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <div className="text-4xl mb-3">🎉</div>
          <h3 className="text-lg font-semibold text-gray-900">反馈已记录</h3>
          <p className="text-sm text-gray-500 mt-1 mb-4">
            您的反馈将帮助 AI 系统持续改进推荐质量
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleReset}>
              继续反馈
            </Button>
          </div>
        </div>
      </Card>
    )
  }

  return (
    <>
      <Card className={`p-6 ${className}`}>
        {/* Header */}
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-gray-900">AI 推荐反馈</h2>
          <p className="text-sm text-gray-500 mt-1">
            您的反馈将用于优化 AI 模型的推荐准确性
          </p>
        </div>

        {/* Aggregate stats */}
        {aggregate && (
          <div className="mb-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">历史反馈统计</span>
              <StatTrend
                value={String(aggregate.helpfulRate)}
                direction={aggregate.trend as TrendIndicatorDirection}
                label="有效率"
                size="sm"
              />
            </div>
            <AggregateStats agg={aggregate} />
          </div>
        )}

        {/* Source context */}
        <div className="mb-5">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            当前推荐内容
          </label>
          <SourceSummary source={source} />
        </div>

        {/* Rating selector */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            此推荐对您有帮助吗？
          </label>
          <div className="flex flex-wrap gap-2">
            {(Object.entries(ratingMeta) as [FeedbackRating, typeof ratingMeta['helpful']][]).map(
              ([key, meta]) => {
                const isSelected = selectedRating === key
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setSelectedRating(key)}
                    disabled={submitting}
                    className={`
                      inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium
                      transition-colors border
                      ${isSelected
                        ? 'border-blue-500 bg-blue-50 text-blue-700 ring-1 ring-blue-500'
                        : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50 hover:border-gray-300'
                      }
                      disabled:opacity-50 disabled:cursor-not-allowed
                    `}
                  >
                    <span className="text-base">{meta.icon}</span>
                    {meta.label}
                  </button>
                )
              }
            )}
          </div>
        </div>

        {/* Comment textarea */}
        <div className="mb-5">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            补充说明 <span className="text-gray-400 font-normal">（选填）</span>
          </label>
          <TextArea
            placeholder="请输入您的想法或改进建议…"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            disabled={submitting}
            maxLength={500}
            rows={3}
          />
          <p className="text-xs text-gray-400 text-right mt-1">{comment.length}/500</p>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <div className="text-xs text-gray-400">
            反馈将匿名用于模型优化
          </div>
          <div className="flex gap-2">
            {onSkip && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleSkip}
                disabled={submitting}
              >
                跳过
              </Button>
            )}
            <Button
              variant="primary"
              size="sm"
              onClick={handleSubmit}
              disabled={!selectedRating || submitting}
            >
              {submitting ? (
                <span className="inline-flex items-center gap-1">
                  <Spinner size="sm" />
                  提交中…
                </span>
              ) : (
                '提交反馈'
              )}
            </Button>
          </div>
        </div>
      </Card>
    </>
  )
}

export default AIRecommendationFeedbackPanel
