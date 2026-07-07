/**
 * 运动蚂蚁解决方案三步转化法CTA组件
 * BigAnts Solutions CTA Block - Three-Step Conversion Method
 *
 * 基于桑德斯销售原则：
 * 第一步：痛点共情 - 挖掘用户对方案选择和实施效果的担忧
 * 第二步：价值锚定 - 专业团队和成功案例背书
 * 第三步：自主决策 - 无压力的选择式文案
 */

'use client';

import React, { useState } from 'react';
import { BigAntsColors, BigAntsRadius, BigAntsTransitions, BigAntsFonts, BigAntsSpacing } from '../lib/bigants-design';
import { conversionService } from '../lib/conversion-service';

interface SolutionCTAProps {
  onScheduleConsult?: () => void;
}

export default function SolutionCTA({ onScheduleConsult }: SolutionCTAProps) {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isHovered, setIsHovered] = useState<string | null>(null);

  const handleOptionClick = (option: string) => {
    setSelectedOption(option);
    conversionService.trackCTAClick('solutions', `solution_cta_${option}`);

    setTimeout(() => {
      switch (option) {
        case 'compare':
          // 查看方案对比
          window.location.href = '/sports-ants/pricing';
          break;
        case 'cases':
          // 查看同行案例
          window.location.href = '/sports-ants/cases';
          break;
        case 'consult':
          // 预约顾问咨询
          onScheduleConsult?.();
          break;
      }
    }, 300);
  };

  const options = [
    {
      id: 'compare',
      icon: '📊',
      title: '先了解各方案详细区别',
      subtitle: '查看功能对比，找到最适合的',
    },
    {
      id: 'cases',
      icon: '🏆',
      title: '查看同行成功案例',
      subtitle: '借鉴500+场地成功经验',
      isPrimary: true,
    },
    {
      id: 'consult',
      icon: '👨‍💼',
      title: '预约顾问一对一咨询',
      subtitle: '根据您的情况量身推荐',
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
          想找到最适合您场馆的数字化转型方案，但不知从何入手？
        </span>
      </div>

      {/* 第二步：价值锚定 */}
      <div
        style={{
          background: `linear-gradient(135deg, ${BigAntsColors.primary} 0%, ${BigAntsColors.primaryDark} 100%)`,
          borderRadius: BigAntsRadius.lg,
          padding: BigAntsSpacing.lg,
          marginBottom: BigAntsSpacing.xl,
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
          专注数字运动领域9年，已帮助500+场馆成功转型
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: BigAntsSpacing.md,
          }}
        >
          {[
            { value: '500+', label: '成功案例' },
            { value: '9年', label: '行业经验' },
            { value: '98%', label: '客户满意度' },
          ].map((stat) => (
            <div key={stat.label} style={{ textAlign: 'center' }}>
              <div
                style={{
                  fontFamily: BigAntsFonts.display,
                  fontSize: '22px',
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
        ✨ 咨询完全免费，顾问将在1小时内给您回复
      </p>
    </div>
  );
}
