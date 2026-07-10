'use client';

import React from 'react';

// ─── Types ────────────────────────────────────────────

export interface UpgradeCondition {
  label: string;
  met: boolean;
}

export interface UpgradeTierNode {
  /**
   * 等级标识
   */
  key: string;
  /**
   * 等级显示名
   */
  name: string;
  /**
   * 等级颜色 (CSS color)
   */
  color: string;
  /**
   * 所需积分/消费额等关键数值
   */
  requiredValue?: string;
  /**
   * 是否为当前等级
   */
  current?: boolean;
  /**
   * 升级条件列表
   */
  conditions?: UpgradeCondition[];
  /**
   * 等级权益简述
   */
  benefits?: string[];
}

export interface MemberUpgradePathProps {
  /**
   * 从低到高的等级节点列表
   */
  tiers: UpgradeTierNode[];
  /**
   * 当前等级 key
   */
  currentTierKey?: string;
  /**
   * 关联网卡/门店信息
   */
  subtitle?: string;
}

// ─── Component ────────────────────────────────────────

/**
 * MemberUpgradePath — 会员升级路径可视化组件
 * 以横向阶梯方式展示从当前等级到下一等级的升级进度
 */
export function MemberUpgradePath({
  tiers,
  currentTierKey,
  subtitle,
}: MemberUpgradePathProps) {
  if (!tiers || tiers.length === 0) {
    return (
      <div
        data-testid="member-upgrade-path-empty"
        style={{
          padding: 32,
          textAlign: 'center',
          color: '#9ca3af',
          fontSize: 14,
        }}
      >
        暂无会员等级数据
      </div>
    );
  }

  const currentIdx = currentTierKey
    ? tiers.findIndex((t) => t.key === currentTierKey)
    : -1;

  return (
    <div data-testid="member-upgrade-path" style={{ padding: 20 }}>
      {/* 标题栏 */}
      <div style={{ marginBottom: 24 }}>
        <h2
          data-testid="upgrade-path-title"
          style={{ fontSize: 18, fontWeight: 700, margin: 0 }}
        >
          ⬆ 会员升级路径
        </h2>
        {subtitle && (
          <p
            data-testid="upgrade-path-subtitle"
            style={{ margin: '4px 0 0', fontSize: 13, color: '#6b7280' }}
          >
            {subtitle}
          </p>
        )}
      </div>

      {/* 等级阶梯渲染 */}
      <div
        data-testid="tier-steps"
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: 8,
          overflowX: 'auto',
          paddingBottom: 12,
        }}
      >
        {tiers.map((tier, idx) => {
          const isCurrent = idx === currentIdx;
          const isPassed = currentIdx >= 0 && idx < currentIdx;
          const isNext = currentIdx >= 0 && idx === currentIdx + 1;

          return (
            <React.Fragment key={tier.key}>
              {/* 等级节点卡片 */}
              <div
                data-testid={`tier-node-${tier.key}`}
                data-current={isCurrent ? 'true' : undefined}
                data-passed={isPassed ? 'true' : undefined}
                style={{
                  minWidth: 180,
                  maxWidth: 220,
                  flexShrink: 0,
                  borderRadius: 12,
                  border: `2px solid ${isCurrent ? tier.color : '#e5e7eb'}`,
                  background: isCurrent
                    ? `${tier.color}10`
                    : '#fff',
                  padding: 16,
                  position: 'relative',
                  boxShadow:
                    isCurrent
                      ? `0 0 0 2px ${tier.color}40, 0 4px 12px rgba(0,0,0,0.08)`
                      : '0 1px 3px rgba(0,0,0,0.06)',
                  opacity: isPassed ? 0.6 : 1,
                  transition: 'all 0.2s ease',
                }}
              >
                {/* 等级圆点 */}
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    backgroundColor: isPassed ? '#d1d5db' : tier.color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    fontWeight: 700,
                    fontSize: 14,
                    marginBottom: 10,
                  }}
                >
                  {tier.name.charAt(0).toUpperCase()}
                </div>

                {/* 等级名 */}
                <div
                  style={{
                    fontSize: 16,
                    fontWeight: 700,
                    color: isCurrent ? tier.color : '#111827',
                    marginBottom: 4,
                  }}
                >
                  {tier.name}
                  {isCurrent && (
                    <span
                      style={{
                        display: 'inline-block',
                        marginLeft: 6,
                        fontSize: 11,
                        backgroundColor: tier.color,
                        color: '#fff',
                        borderRadius: 4,
                        padding: '1px 6px',
                      }}
                    >
                      当前
                    </span>
                  )}
                </div>

                {/* 所需条件 */}
                {tier.requiredValue && (
                  <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 8 }}>
                    需 {tier.requiredValue}
                  </div>
                )}

                {/* 升级条件列表 */}
                {tier.conditions && tier.conditions.length > 0 && (
                  <div style={{ marginTop: 8 }}>
                    {tier.conditions.map((cond, ci) => (
                      <div
                        key={ci}
                        data-testid={`condition-${tier.key}-${ci}`}
                        style={{
                          fontSize: 12,
                          color: cond.met ? '#16a34a' : '#9ca3af',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4,
                          marginBottom: 2,
                        }}
                      >
                        <span>{cond.met ? '✅' : '⬜'}</span>
                        <span>{cond.label}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* 下一等级提示 */}
                {isNext && (
                  <div
                    data-testid="next-tier-hint"
                    style={{
                      position: 'absolute',
                      bottom: -28,
                      left: '50%',
                      transform: 'translateX(-50%)',
                      fontSize: 11,
                      color: tier.color,
                      whiteSpace: 'nowrap',
                      fontWeight: 600,
                    }}
                  >
                    ▼ 下一目标
                  </div>
                )}
              </div>

              {/* 箭头连接（非最后一个） */}
              {idx < tiers.length - 1 && (
                <div
                  data-testid={`arrow-${tier.key}-to-${tiers[idx + 1]!.key}`}
                  style={{
                    flexShrink: 0,
                    display: 'flex',
                    alignItems: 'center',
                    paddingTop: 20,
                    color: '#d1d5db',
                    fontSize: 20,
                  }}
                >
                  →
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* 等级权益汇总 */}
      {tiers.some((t) => t.benefits && t.benefits.length > 0) && (
        <div
          data-testid="benefits-section"
          style={{
            marginTop: 32,
            padding: 16,
            backgroundColor: '#f9fafb',
            borderRadius: 8,
          }}
        >
          <h3
            data-testid="benefits-title"
            style={{ fontSize: 14, fontWeight: 600, margin: '0 0 12px' }}
          >
            🎁 当前等级权益
          </h3>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {(currentIdx >= 0 ? tiers.slice(0, currentIdx + 1) : tiers).map(
              (tier) =>
                tier.benefits &&
                tier.benefits.length > 0 && (
                  <div
                    key={tier.key}
                    data-testid={`benefit-tier-${tier.key}`}
                    style={{
                      flex: '1 1 180px',
                      padding: 12,
                      borderRadius: 8,
                      backgroundColor: '#fff',
                      border: `1px solid ${tier.color}30`,
                    }}
                  >
                    <div style={{ fontWeight: 600, fontSize: 13, color: tier.color, marginBottom: 6 }}>
                      {tier.name}
                    </div>
                    {tier.benefits.map((b, bi) => (
                      <div
                        key={bi}
                        style={{
                          fontSize: 12,
                          color: '#374151',
                          marginBottom: 2,
                          paddingLeft: 8,
                        }}
                      >
                        • {b}
                      </div>
                    ))}
                  </div>
                ),
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default MemberUpgradePath;
