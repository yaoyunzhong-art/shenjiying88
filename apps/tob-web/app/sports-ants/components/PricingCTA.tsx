/**
 * 运动蚂蚁定价页三步转化法CTA组件
 * BigAnts Pricing CTA Block - Three-Step Conversion Method
 *
 * 基于桑德斯销售原则：
 * 第一步：痛点共情 - 挖掘用户选择困难
 * 第二步：价值锚定 - 匹配发展阶段的方案
 * 第三步：自主决策 - 无压力的选择式文案
 */

'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { BigAntsColors, BigAntsRadius, BigAntsTransitions, BigAntsFonts, BigAntsSpacing } from '../lib/bigants-design';
import { conversionService } from '../lib/conversion-service';

interface PricingCTAProps {
  onSelectPlan?: (planId: string) => void;
}

export default function PricingCTA({ onSelectPlan }: PricingCTAProps) {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isHovered, setIsHovered] = useState<string | null>(null);

  const handleOptionClick = (option: string) => {
    setSelectedOption(option);
    conversionService.trackCTAClick('pricing', `pricing_cta_${option}`);

    setTimeout(() => {
      switch (option) {
        case 'compare':
          // 先了解各方案详细区别 - 滚动到对比区域
          window.location.href = '/sports-ants/pricing#compare';
          break;
        case 'consult':
          // 让顾问帮我分析适合方案
          window.location.href = '/sports-ants/contact?type=pricing';
          break;
        case 'view_cases':
          // 查看同行都选了什么方案
          window.location.href = '/sports-ants/cases';
          break;
      }
    }, 300);
  };

  const options = [
    {
      id: 'compare',
      icon: '📊',
      title: '先了解各方案详细区别',
      subtitle: '查看功能对比表，找到最适合的',
    },
    {
      id: 'consult',
      icon: '👨‍💼',
      title: '让顾问帮我分析适合方案',
      subtitle: '根据您的情况量身推荐',
      isPrimary: true,
    },
    {
      id: 'view_cases',
      icon: '🏆',
      title: '查看同行都选了什么方案',
      subtitle: '借鉴成功经验，少走弯路',
    },
  ];

  return (
    <div
      style={{
        background: '#FFFFFF',
        borderRadius: BigAntsRadius.xl,
        padding: BigAntsSpacing['2xl'],
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
        border: '1px solid #F1F5F9',
      }}
    >
      {/* 第一步：痛点共情 */}
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 16px',
          background: `${BigAntsColors.primary}10`,
          borderRadius: '9999px',
          marginBottom: BigAntsSpacing.lg,
        }}
      >
        <span style={{ fontSize: '14px' }}>💭</span>
        <span
          style={{
            fontFamily: BigAntsFonts.chinese,
            fontSize: '13px',
            fontWeight: 600,
            color: BigAntsColors.primary,
          }}
        >
          不知道哪个方案最适合您的场馆规模和业务需求？
        </span>
      </div>

      {/* 第二步：价值锚定 */}
      <div
        style={{
          background: `linear-gradient(135deg, ${BigAntsColors.primary} 0%, ${BigAntsColors.primaryDark} 100%)`,
          borderRadius: BigAntsRadius.lg,
          padding: BigAntsSpacing.lg,
          marginBottom: BigAntsSpacing.xl,
          textAlign: 'center',
        }}
      >
        <div
          style={{
            fontFamily: BigAntsFonts.chinese,
            fontSize: '15px',
            color: '#FFFFFF',
            marginBottom: BigAntsSpacing.md,
          }}
        >
          从初创门店到大型连锁，总有方案匹配您的发展阶段
        </div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: BigAntsSpacing['2xl'],
            flexWrap: 'wrap',
          }}
        >
          {[
            { value: '500+', label: '合作伙伴' },
            { value: '50+', label: '覆盖城市' },
            { value: '99.5%', label: '设备完好率' },
          ].map((stat) => (
            <div key={stat.label} style={{ textAlign: 'center' }}>
              <div
                style={{
                  fontFamily: BigAntsFonts.display,
                  fontSize: '24px',
                  fontWeight: 700,
                  color: '#FFFFFF',
                }}
              >
                {stat.value}
              </div>
              <div
                style={{
                  fontFamily: BigAntsFonts.chinese,
                  fontSize: '12px',
                  color: 'rgba(255,255,255,0.7)',
                }}
              >
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 第三步：自主决策 */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
        }}
      >
        <p
          style={{
            fontFamily: BigAntsFonts.chinese,
            fontSize: '13px',
            color: '#666666',
            marginBottom: '4px',
            textAlign: 'center',
          }}
        >
          选择您感兴趣的方式继续了解：
        </p>

        {options.map((option) => (
          <button
            key={option.id}
            onClick={() => handleOptionClick(option.id)}
            onMouseEnter={() => setIsHovered(option.id)}
            onMouseLeave={() => setIsHovered(null)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '14px 16px',
              background: option.isPrimary
                ? BigAntsColors.primary
                : selectedOption === option.id
                  ? '#F1F5F9'
                  : '#FFFFFF',
              border: option.isPrimary
                ? 'none'
                : selectedOption === option.id
                  ? `2px solid ${BigAntsColors.primary}`
                  : '2px solid #E2E8F0',
              borderRadius: BigAntsRadius.lg,
              cursor: 'pointer',
              transition: `all ${BigAntsTransitions.fast}`,
              transform: isHovered === option.id && !option.isPrimary ? 'translateX(4px)' : 'none',
            }}
          >
            <span style={{ fontSize: '22px' }}>{option.icon}</span>
            <div style={{ flex: 1, textAlign: 'left' }}>
              <div
                style={{
                  fontFamily: BigAntsFonts.chinese,
                  fontSize: '15px',
                  fontWeight: 600,
                  color: option.isPrimary ? '#FFFFFF' : '#1A1A2E',
                }}
              >
                {option.title}
              </div>
              <div
                style={{
                  fontFamily: BigAntsFonts.chinese,
                  fontSize: '13px',
                  color: option.isPrimary ? 'rgba(255,255,255,0.8)' : '#666666',
                }}
              >
                {option.subtitle}
              </div>
            </div>
            <span
              style={{
                color: option.isPrimary ? 'rgba(255,255,255,0.8)' : '#CCCCCC',
                fontSize: '18px',
              }}
            >
              →
            </span>
          </button>
        ))}
      </div>

      {/* 权益说明 */}
      <p
        style={{
          fontFamily: BigAntsFonts.chinese,
          fontSize: '11px',
          color: '#999999',
          textAlign: 'center',
          marginTop: BigAntsSpacing.md,
        }}
      >
        ✨ 所有方案均包含一年免费质保，顾问1小时内响应
      </p>
    </div>
  );
}
