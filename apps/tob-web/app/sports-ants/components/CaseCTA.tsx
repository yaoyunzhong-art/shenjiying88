/**
 * 运动蚂蚁案例中心三步转化法CTA组件
 * BigAnts Case CTA Block - Three-Step Conversion Method
 *
 * 基于桑德斯销售原则：
 * 第一步：痛点共情 - 挖掘用户对实际效果的不确定
 * 第二步：价值锚定 - 可量化的成果数据
 * 第三步：自主决策 - 无压力的选择式文案
 */

'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { BigAntsColors, BigAntsRadius, BigAntsTransitions, BigAntsFonts, BigAntsSpacing } from '../lib/bigants-design';
import { conversionService } from '../lib/conversion-service';

interface CaseCTAProps {
  caseName: string;
  caseType: string;
  caseLocation: string;
  onScheduleVisit?: () => void;
}

export default function CaseCTA({ caseName, caseType, caseLocation, onScheduleVisit }: CaseCTAProps) {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isHovered, setIsHovered] = useState<string | null>(null);

  const handleOptionClick = (option: string) => {
    setSelectedOption(option);
    conversionService.trackCTAClick('cases', `case_cta_${option}_${caseName}`);

    switch (option) {
      case 'view_details':
        // 查看完整案例详情
        window.location.href = `/sports-ants/cases#${caseName}`;
        break;
      case 'schedule_visit':
        // 预约实地考察
        onScheduleVisit?.();
        break;
      case 'consult':
        // 让顾问帮我分析
        window.location.href = `/sports-ants/contact?case=${encodeURIComponent(caseName)}&type=${encodeURIComponent(caseType)}`;
        break;
    }
  };

  const options = [
    {
      id: 'view_details',
      icon: '📋',
      title: '查看完整案例详情',
      subtitle: '了解落地全过程和效果数据',
    },
    {
      id: 'schedule_visit',
      icon: '🏢',
      title: '预约实地考察',
      subtitle: '亲临现场体验设备效果',
      isPrimary: true,
    },
    {
      id: 'consult',
      icon: '💬',
      title: '让顾问帮我分析是否适合',
      subtitle: '根据您的情况量身评估',
    },
  ];

  return (
    <div
      style={{
        background: '#FFFFFF',
        borderRadius: BigAntsRadius.xl,
        padding: BigAntsSpacing.xl,
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
          想了解其他场馆的实际效果，但不确定是否适合自己？
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
            fontSize: '14px',
            color: 'rgba(255,255,255,0.9)',
            marginBottom: BigAntsSpacing.md,
          }}
        >
          已帮助500+场馆实现：
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: BigAntsSpacing.md,
          }}
        >
          {[
            { value: '40%+', label: '客流提升' },
            { value: '8-14', label: '月回本周期' },
            { value: '75%', label: '会员复购率' },
            { value: '200+', label: '月均体验人次' },
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
              padding: '12px 16px',
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
            <span style={{ fontSize: '20px' }}>{option.icon}</span>
            <div style={{ flex: 1, textAlign: 'left' }}>
              <div
                style={{
                  fontFamily: BigAntsFonts.chinese,
                  fontSize: '14px',
                  fontWeight: 600,
                  color: option.isPrimary ? '#FFFFFF' : '#1A1A2E',
                }}
              >
                {option.title}
              </div>
              <div
                style={{
                  fontFamily: BigAntsFonts.chinese,
                  fontSize: '12px',
                  color: option.isPrimary ? 'rgba(255,255,255,0.8)' : '#666666',
                }}
              >
                {option.subtitle}
              </div>
            </div>
            <span
              style={{
                color: option.isPrimary ? 'rgba(255,255,255,0.8)' : '#CCCCCC',
                fontSize: '16px',
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
        ✨ 预约考察不收取任何费用，商务经理将全程陪同讲解
      </p>
    </div>
  );
}
