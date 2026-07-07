/**
 * LicenseStatusBadge - 授权状态徽章组件 (V9 需求 2 · V10 Day 18 Phase 88)
 *
 * 功能:
 * - 4个入口点显示: 首页 / 设置 / 后台 / 详情
 * - 5种状态展示: active/expired/suspended/trial
 * - 5端自适应: PC/H5/APP/Pad/小程序
 * - 响应式尺寸: 基于375dp设计稿
 *
 * 设计系统: M5 Design System
 * 状态对应: licenses.status (active|expired|suspended|trial)
 *
 * @note 本组件为 Web 版，使用原生 HTML 元素 + inline styles
 *       (非 react-native, 因为 @m5/ui 是 Web-only 包)
 */

import React, { useMemo, type CSSProperties } from 'react'
import { useAdaptive } from '../../../ai-model-switcher/responsive/AdaptiveLayout'
import { useLicense } from '../../hooks/useLicense'
import type { LicenseStatus } from '../../types'

// ============ 类型定义 ============

export interface LicenseStatusBadgeProps {
  /** 租户ID (可选，默认从上下文获取) */
  tenantId?: string
  /** 门店ID (可选，用于门店级授权显示) */
  storeId?: string
  /** 授权范围 */
  scope?: string
  /** 显示模式 */
  mode?: 'compact' | 'full' | 'dot'
  /** 尺寸 */
  size?: 'small' | 'medium' | 'large'
  /** 点击回调 */
  onPress?: () => void
  /** 是否显示过期倒计时 */
  showCountdown?: boolean
  /** 自定义样式 */
  style?: CSSProperties
}

// ============ 状态配置 ============

interface StatusConfig {
  label: string
  color: string
  bgColor: string
  borderColor: string
  icon?: string
}

const STATUS_CONFIG: Record<LicenseStatus, StatusConfig> = {
  active: {
    label: '已授权',
    color: '#10B981', // green-500
    bgColor: 'rgba(16, 185, 129, 0.1)',
    borderColor: '#10B981',
    icon: '✓',
  },
  expired: {
    label: '已过期',
    color: '#EF4444', // red-500
    bgColor: 'rgba(239, 68, 68, 0.1)',
    borderColor: '#EF4444',
    icon: '✕',
  },
  suspended: {
    label: '已暂停',
    color: '#F59E0B', // amber-500
    bgColor: 'rgba(245, 158, 11, 0.1)',
    borderColor: '#F59E0B',
    icon: '!',
  },
  trial: {
    label: '试用中',
    color: '#3B82F6', // blue-500
    bgColor: 'rgba(59, 130, 246, 0.1)',
    borderColor: '#3B82F6',
    icon: '◐',
  },
}

// ============ 内联样式工厂 ============

function badgeContainerStyle(config: StatusConfig, sizes: ReturnType<typeof calcSizes>, style?: CSSProperties): CSSProperties {
  return {
    display: 'inline-flex',
    flexDirection: 'column',
    alignSelf: 'flex-start',
    padding: sizes.padding,
    borderRadius: sizes.borderRadius,
    backgroundColor: config.bgColor,
    borderColor: config.borderColor,
    borderWidth: 1,
    borderStyle: 'solid',
    ...style,
  }
}

function rowStyle(): CSSProperties {
  return {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
  }
}

function columnStyle(): CSSProperties {
  return {
    display: 'flex',
    flexDirection: 'column',
  }
}

function calcSizes(
  size: 'small' | 'medium' | 'large',
  scale: number,
  isCompact: boolean,
) {
  const baseSize = isCompact ? 0.8 : 1
  switch (size) {
    case 'small':
      return {
        padding: 4 * scale * baseSize,
        fontSize: 10 * scale * baseSize,
        iconSize: 12 * scale * baseSize,
        borderRadius: 4 * scale,
      }
    case 'large':
      return {
        padding: 12 * scale * baseSize,
        fontSize: 16 * scale * baseSize,
        iconSize: 20 * scale * baseSize,
        borderRadius: 8 * scale,
      }
    default: // medium
      return {
        padding: 8 * scale * baseSize,
        fontSize: 12 * scale * baseSize,
        iconSize: 16 * scale * baseSize,
        borderRadius: 6 * scale,
      }
  }
}

// ============ 组件实现 ============

export const LicenseStatusBadge: React.FC<LicenseStatusBadgeProps> = ({
  storeId,
  scope = 'ai.capability',
  mode = 'compact',
  size = 'medium',
  onPress,
  showCountdown = false,
  style,
}) => {
  // 获取设备自适应信息
  const { device } = useAdaptive()
  const deviceType = device.type
  const scale = device.pixelRatio
  const isCompact = deviceType === 'h5' || deviceType === 'miniapp'

  // 获取授权状态
  const { license, status, isLoading, error } = useLicense({
    scope,
    storeId,
  })

  // 计算剩余天数
  const daysRemaining = useMemo(() => {
    if (!license?.validUntil) return undefined
    const end = new Date(license.validUntil).getTime()
    const now = Date.now()
    const diff = end - now
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
  }, [license?.validUntil])

  // 计算尺寸
  const sizes = useMemo(() => calcSizes(size, scale, isCompact), [size, scale, isCompact])

  // 获取状态配置 (带 optional chaining 安全兜底)
  const config: StatusConfig = status ? STATUS_CONFIG[status] : STATUS_CONFIG.active

  // 渲染倒计时
  const renderCountdown = () => {
    if (!showCountdown || daysRemaining === undefined || daysRemaining < 0) return null

    const isUrgent = daysRemaining <= 7
    const countdownText = daysRemaining === 0 ? '今天过期' : `${daysRemaining}天后过期`

    return (
      <span
        style={{
          fontSize: sizes.fontSize * 0.85,
          color: isUrgent ? '#EF4444' : config.color,
          marginLeft: sizes.padding / 2,
          fontWeight: 500,
        }}
      >
        {countdownText}
      </span>
    )
  }

  // 渲染内容
  const renderContent = () => {
    switch (mode) {
      case 'dot':
        return (
          <span
            style={{
              display: 'block',
              width: sizes.iconSize,
              height: sizes.iconSize,
              borderRadius: sizes.iconSize / 2,
              backgroundColor: config.color,
              alignSelf: 'center',
            }}
          />
        )

      case 'compact':
        return (
          <div style={rowStyle()}>
            {config?.icon && (
              <span
                style={{
                  fontSize: sizes.iconSize,
                  color: config.color,
                  marginRight: 4,
                  fontWeight: 'bold',
                  lineHeight: 1,
                }}
              >
                {config.icon}
              </span>
            )}
            <span
              style={{
                fontSize: sizes.fontSize,
                color: config.color,
                fontWeight: 500,
                lineHeight: 1,
              }}
            >
              {config?.label}
            </span>
            {renderCountdown()}
          </div>
        )

      case 'full':
      default:
        return (
          <div style={columnStyle()}>
            <div style={rowStyle()}>
              {config?.icon && (
                <span
                  style={{
                    fontSize: sizes.iconSize,
                    color: config.color,
                    marginRight: 4,
                    fontWeight: 'bold',
                    lineHeight: 1,
                  }}
                >
                  {config.icon}
                </span>
              )}
              <span
                style={{
                  fontSize: sizes.fontSize,
                  color: config.color,
                  fontWeight: 500,
                  lineHeight: 1,
                }}
              >
                {config?.label}
              </span>
            </div>
            {license && (
              <div
                style={{
                  marginTop: 8,
                  paddingTop: 8,
                  borderTopWidth: 1,
                  borderTopStyle: 'solid',
                  borderTopColor: 'rgba(0,0,0,0.1)',
                }}
              >
                <div style={{ color: '#6B7280', marginTop: 2, fontSize: sizes.fontSize * 0.9 }}>
                  有效期至: {new Date(license.validUntil).toLocaleDateString()}
                </div>
                {license.quota != null && (
                  <div style={{ color: '#6B7280', marginTop: 2, fontSize: sizes.fontSize * 0.9 }}>
                    配额: {license.quota.used ?? 0} / {license.quota.total}
                  </div>
                )}
              </div>
            )}
            {renderCountdown()}
          </div>
        )
    }
  }

  // 加载状态
  if (isLoading) {
    return (
      <div
        style={{
          display: 'inline-flex',
          alignSelf: 'flex-start',
          ...style,
        }}
      >
        <div
          style={{
            backgroundColor: 'rgba(0,0,0,0.1)',
            minWidth: 80,
            minHeight: 24,
            padding: sizes.padding,
            borderRadius: sizes.borderRadius,
          }}
        />
      </div>
    )
  }

  // 错误状态
  if (error) {
    return (
      <div
        style={{
          display: 'inline-flex',
          alignSelf: 'flex-start',
          padding: sizes.padding,
          borderRadius: sizes.borderRadius,
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          borderColor: '#EF4444',
          borderWidth: 1,
          borderStyle: 'solid',
          ...style,
        }}
      >
        <span style={{ fontSize: sizes.fontSize, color: '#EF4444', fontWeight: 500 }}>
          授权状态加载失败
        </span>
      </div>
    )
  }

  // 正常渲染
  const containerStyle = badgeContainerStyle(config, sizes, style)

  if (onPress) {
    return (
      <button
        type="button"
        onClick={onPress}
        style={{
          ...containerStyle,
          cursor: 'pointer',
          border: 'none',
          padding: 0,
          background: 'none',
          fontFamily: 'inherit',
        }}
      >
        <div style={containerStyle}>{renderContent()}</div>
      </button>
    )
  }

  return <div style={containerStyle}>{renderContent()}</div>
}
