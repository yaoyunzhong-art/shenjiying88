/**
 * 运动蚂蚁个性化推荐组件
 * BigAnts Personalized Recommendations
 * 基于用户浏览轨迹和人群标签的AI推荐
 */

'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { BigAntsColors, BigAntsFonts, BigAntsSpacing, BigAntsRadius, BigAntsTransitions } from '../lib/bigants-design';
import { USER_PERSONAS, getPersonaById, UserPersonaId } from '../lib/user-personas';
import { SAAS_FEATURES, getSaaSFeaturesByScenario, BusinessScenario } from '../lib/shenjiying-saas';
import { conversionService } from '../lib/conversion-service';

// 推荐内容类型
export type RecommendationType = 
  | 'persona'           // 人群推荐
  | 'solution'          // 解决方案推荐
  | 'case'              // 案例推荐
  | 'product'           // 产品推荐
  | 'saas-feature';     // SaaS功能推荐

// 推荐项
export interface RecommendationItem {
  id: string;
  type: RecommendationType;
  title: string;
  description: string;
  icon: string;
  href: string;
  personaId?: UserPersonaId;      // 关联人群
  matchScore?: number;             // 匹配度 0-100
  tags?: string[];                // 标签
  color?: string;                 // 主题色
}

// 推荐组件Props
interface PersonalizedRecommendationsProps {
  userPersona?: UserPersonaId;     // 已识别的用户人群
  currentPage?: string;            // 当前页面
  excludeIds?: string[];           // 排除的项
  maxItems?: number;               // 最大显示数量
  onItemClick?: (item: RecommendationItem) => void;  // 点击回调
}

export default function PersonalizedRecommendations({
  userPersona,
  currentPage = 'homepage',
  excludeIds = [],
  maxItems = 4,
  onItemClick,
}: PersonalizedRecommendationsProps) {
  const [recommendations, setRecommendations] = useState<RecommendationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  // 生成推荐内容
  useEffect(() => {
    const generateRecommendations = () => {
      const items: RecommendationItem[] = [];

      // 如果有用户人群，优先推荐相关的解决方案和案例
      if (userPersona) {
        const persona = getPersonaById(userPersona);
        if (persona) {
          // 推荐对应的解决方案
          persona.solutions.forEach((sol, idx) => {
            items.push({
              id: `sol-${userPersona}-${idx}`,
              type: 'solution',
              title: sol.title,
              description: sol.description,
              icon: '💡',
              href: `/sports-ants/solutions?persona=${userPersona}`,
              personaId: userPersona,
              matchScore: 95 - idx * 5,
              color: persona.color,
            });
          });

          // 推荐对应的SaaS功能
          if (persona.solutions[0]?.saasFeature) {
            const featureId = persona.solutions[0].saasFeature;
            const feature = SAAS_FEATURES[featureId as keyof typeof SAAS_FEATURES];
            if (feature) {
              items.push({
                id: `saas-${featureId}`,
                type: 'saas-feature',
                title: feature.name,
                description: feature.description,
                icon: feature.icon,
                href: `/sports-ants/saas/${featureId}`,
                matchScore: 90,
                tags: feature.benefits.slice(0, 2),
              });
            }
          }
        }
      }

      // 添加热门案例
      const hotCases = [
        {
          id: 'case-1',
          type: 'case' as RecommendationType,
          title: '万达广场数字运动馆',
          description: '2000㎡空间，15台设备，月客流3万+',
          icon: '🏬',
          href: '/sports-ants/cases/wanda-plaza',
          matchScore: 85,
          color: '#0066FF',
        },
        {
          id: 'case-2',
          type: 'case' as RecommendationType,
          title: '某市政府公共体育中心',
          description: 'EPC+O全流程承接，政府标杆项目',
          icon: '🏛️',
          href: '/sports-ants/cases/government-project',
          matchScore: 80,
          color: '#8B5CF6',
        },
      ];
      items.push(...hotCases.filter(c => !excludeIds.includes(c.id)));

      // 添加热门产品
      const hotProducts = [
        {
          id: 'product-1',
          type: 'product' as RecommendationType,
          title: '超级网球 AI对战版',
          description: 'AI智能陪练，10+难度关卡',
          icon: '🎾',
          href: '/sports-ants/products/super-tennis',
          matchScore: 78,
          color: '#00C853',
        },
        {
          id: 'product-2',
          type: 'product' as RecommendationType,
          title: 'VR滑雪 沉浸版',
          description: '360°全景VR，极限运动体验',
          icon: '⛷️',
          href: '/sports-ants/products/vr-skiing',
          matchScore: 75,
          color: '#00BCD4',
        },
      ];
      items.push(...hotProducts.filter(p => !excludeIds.includes(p.id)));

      // 随机打乱并限制数量
      const shuffled = items.sort(() => Math.random() - 0.5);
      return shuffled.slice(0, maxItems);
    };

    // 模拟加载
    setIsLoading(true);
    const timer = setTimeout(() => {
      const result = generateRecommendations();
      setRecommendations(result);
      setIsLoading(false);

      // 追踪推荐展示
      conversionService.trackRecommendationView('personalized', result.length);
    }, 300);

    return () => clearTimeout(timer);
  }, [userPersona, currentPage, excludeIds, maxItems]);

  const handleItemClick = (item: RecommendationItem) => {
    // 追踪点击
    conversionService.trackRecommendationClick(item.type, item.id, item.title);
    onItemClick?.(item);
  };

  const getTypeLabel = (type: RecommendationType) => {
    const labels: Record<RecommendationType, string> = {
      'persona': '人群',
      'solution': '方案',
      'case': '案例',
      'product': '产品',
      'saas-feature': 'SaaS',
    };
    return labels[type] || type;
  };

  if (isLoading) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: BigAntsSpacing.xl,
        }}
      >
        <div
          style={{
            width: '24px',
            height: '24px',
            border: '3px solid rgba(255, 255, 255, 0.1)',
            borderTopColor: BigAntsColors.primary,
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
          }}
        />
        <style jsx>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (recommendations.length === 0) {
    return null;
  }

  return (
    <div
      style={{
        background: 'rgba(255, 255, 255, 0.05)',
        borderRadius: BigAntsRadius.lg,
        border: '1px solid rgba(255, 255, 255, 0.1)',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: `${BigAntsSpacing.md} ${BigAntsSpacing.lg}`,
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '16px' }}>🤖</span>
          <span
            style={{
              fontFamily: BigAntsFonts.chinese,
              fontSize: '13px',
              fontWeight: 600,
              color: BigAntsColors.white,
            }}
          >
            为您推荐
          </span>
          {userPersona && (
            <span
              style={{
                padding: '2px 8px',
                background: `${USER_PERSONAS[userPersona].color}30`,
                color: USER_PERSONAS[userPersona].color,
                fontSize: '11px',
                fontWeight: 500,
                borderRadius: BigAntsRadius.full,
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <span>{USER_PERSONAS[userPersona].icon}</span>
              <span>{USER_PERSONAS[userPersona].name}</span>
            </span>
          )}
        </div>
        <button
          onClick={() => setExpanded(!expanded)}
          style={{
            background: 'none',
            border: 'none',
            color: 'rgba(255, 255, 255, 0.5)',
            fontSize: '12px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
          }}
        >
          {expanded ? '收起' : '展开'}
          <span style={{ transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
            ▼
          </span>
        </button>
      </div>

      {/* Content */}
      <div
        style={{
          padding: BigAntsSpacing.md,
          display: 'flex',
          flexDirection: 'column',
          gap: BigAntsSpacing.sm,
          maxHeight: expanded ? 'none' : '300px',
          overflow: expanded ? 'visible' : 'hidden',
        }}
      >
        {recommendations.map((item) => (
          <Link
            key={item.id}
            href={item.href}
            onClick={() => handleItemClick(item)}
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px',
              padding: BigAntsSpacing.md,
              background: 'rgba(255, 255, 255, 0.03)',
              borderRadius: BigAntsRadius.md,
              border: '1px solid rgba(255, 255, 255, 0.06)',
              textDecoration: 'none',
              transition: `all ${BigAntsTransitions.fast}`,
              cursor: 'pointer',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = `${item.color || BigAntsColors.primary}15`;
              e.currentTarget.style.borderColor = `${item.color || BigAntsColors.primary}40`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.06)';
            }}
          >
            {/* Icon */}
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: BigAntsRadius.sm,
                background: `${item.color || BigAntsColors.primary}20`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '18px',
                flexShrink: 0,
              }}
            >
              {item.icon}
            </div>

            {/* Content */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                <span
                  style={{
                    fontFamily: BigAntsFonts.chinese,
                    fontSize: '13px',
                    fontWeight: 600,
                    color: BigAntsColors.white,
                  }}
                >
                  {item.title}
                </span>
                <span
                  style={{
                    padding: '1px 6px',
                    background: 'rgba(255, 255, 255, 0.08)',
                    color: 'rgba(255, 255, 255, 0.5)',
                    fontSize: '10px',
                    borderRadius: '4px',
                  }}
                >
                  {getTypeLabel(item.type)}
                </span>
              </div>
              <p
                style={{
                  fontFamily: BigAntsFonts.chinese,
                  fontSize: '12px',
                  color: 'rgba(255, 255, 255, 0.5)',
                  lineHeight: 1.4,
                  marginBottom: item.tags ? '6px' : 0,
                }}
              >
                {item.description}
              </p>
              {item.tags && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                  {item.tags.map((tag) => (
                    <span
                      key={tag}
                      style={{
                        padding: '1px 6px',
                        background: 'rgba(0, 200, 83, 0.1)',
                        color: '#00C853',
                        fontSize: '10px',
                        borderRadius: '4px',
                      }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Match Score */}
            {item.matchScore && item.matchScore >= 80 && (
              <div
                style={{
                  padding: '2px 8px',
                  background: `${item.color || '#00C853'}20`,
                  color: item.color || '#00C853',
                  fontSize: '11px',
                  fontWeight: 600,
                  borderRadius: BigAntsRadius.full,
                  flexShrink: 0,
                }}
              >
                {item.matchScore}%
              </div>
            )}
          </Link>
        ))}
      </div>

      {/* Footer */}
      {recommendations.length > 0 && (
        <div
          style={{
            padding: `${BigAntsSpacing.sm} ${BigAntsSpacing.md}`,
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            textAlign: 'center',
          }}
        >
          <Link
            href="/sports-ants/solutions"
            style={{
              fontFamily: BigAntsFonts.chinese,
              fontSize: '12px',
              color: BigAntsColors.primary,
              textDecoration: 'none',
            }}
          >
            查看全部推荐 →
          </Link>
        </div>
      )}
    </div>
  );
}
