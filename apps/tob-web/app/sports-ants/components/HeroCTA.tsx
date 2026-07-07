/**
 * 运动蚂蚁首页Hero区域三步转化法CTA
 * BigAnts Hero CTA - Three-Step Conversion Method
 *
 * 基于桑德斯销售原则：
 * 第一步：痛点共情 - 挖掘场馆引流难、运营效率低等痛点
 * 第二步：价值锚定 - 可量化的成果数据
 * 第三步：自主决策 - 无压力的选择式文案
 */

'use client';

import React, { useState } from 'react';
import { BigAntsColors, BigAntsFonts, BigAntsSpacing, BigAntsRadius, BigAntsTransitions } from '../lib/bigants-design';
import { conversionService } from '../lib/conversion-service';

export default function HeroCTA() {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  const handleOptionClick = (option: string) => {
    setSelectedOption(option);
    conversionService.trackCTAClick('homepage', `hero_cta_${option}`);

    setTimeout(() => {
      switch (option) {
        case 'consult':
          window.location.href = '/sports-ants/contact';
          break;
        case 'cases':
          window.location.href = '/sports-ants/cases';
          break;
        case 'solution':
          window.location.href = '/sports-ants/solutions';
          break;
      }
    }, 200);
  };

  const options = [
    {
      id: 'consult',
      icon: '📞',
      title: '立即咨询',
      subtitle: '专业顾问1小时内回电',
      primary: false,
    },
    {
      id: 'cases',
      icon: '🏆',
      title: '查看案例',
      subtitle: '500+成功案例参考',
      primary: false,
    },
    {
      id: 'solution',
      icon: '📋',
      title: '了解方案',
      subtitle: '获取定制化解决方案',
      primary: true,
    },
  ];

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: BigAntsSpacing.md,
      }}
    >
      {/* 第一步：痛点共情 */}
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 16px',
          background: 'rgba(0, 102, 255, 0.15)',
          border: '1px solid rgba(0, 102, 255, 0.3)',
          borderRadius: BigAntsRadius.full,
          marginBottom: BigAntsSpacing.sm,
        }}
      >
        <span style={{ fontSize: '14px' }}>💭</span>
        <span
          style={{
            fontFamily: BigAntsFonts.chinese,
            fontSize: '13px',
            color: BigAntsColors.primary,
          }}
        >
          还在为场馆引流难、客户留存率低而发愁？
        </span>
      </div>

      {/* 第二步：价值锚定 */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          gap: BigAntsSpacing.xl,
          marginBottom: BigAntsSpacing.md,
        }}
      >
        {[
          { value: '40%+', label: '客流提升' },
          { value: '8-14', label: '月回本' },
          { value: '75%', label: '复购率' },
        ].map((stat) => (
          <div key={stat.label} style={{ textAlign: 'center' }}>
            <div
              style={{
                fontFamily: BigAntsFonts.display,
                fontSize: '24px',
                fontWeight: 700,
                color: BigAntsColors.white,
              }}
            >
              {stat.value}
            </div>
            <div
              style={{
                fontFamily: BigAntsFonts.chinese,
                fontSize: '12px',
                color: 'rgba(255,255,255,0.6)',
              }}
            >
              {stat.label}
            </div>
          </div>
        ))}
      </div>

      {/* 第三步：自主决策 */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: BigAntsSpacing.sm,
        }}
      >
        <p
          style={{
            fontFamily: BigAntsFonts.chinese,
            fontSize: '12px',
            color: 'rgba(255,255,255,0.5)',
            marginBottom: '4px',
          }}
        >
          选择您感兴趣的方式继续了解：
        </p>

        <div
          style={{
            display: 'flex',
            gap: BigAntsSpacing.sm,
            flexWrap: 'wrap',
            justifyContent: 'center',
          }}
        >
          {options.map((option) => (
            <button
              key={option.id}
              onClick={() => handleOptionClick(option.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: option.primary ? '14px 28px' : '12px 24px',
                background: option.primary
                  ? BigAntsColors.primary
                  : selectedOption === option.id
                    ? 'rgba(255,255,255,0.2)'
                    : 'rgba(255,255,255,0.08)',
                color: BigAntsColors.white,
                fontFamily: BigAntsFonts.chinese,
                fontSize: option.primary ? '15px' : '14px',
                fontWeight: 600,
                borderRadius: BigAntsRadius.full,
                border: option.primary ? 'none' : '1px solid rgba(255,255,255,0.2)',
                cursor: 'pointer',
                transition: `all ${BigAntsTransitions.fast}`,
              }}
              onMouseEnter={(e) => {
                if (option.primary) {
                  e.currentTarget.style.background = BigAntsColors.primaryDark;
                  e.currentTarget.style.transform = 'translateY(-2px)';
                } else {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.15)';
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.4)';
                }
              }}
              onMouseLeave={(e) => {
                if (option.primary) {
                  e.currentTarget.style.background = BigAntsColors.primary;
                  e.currentTarget.style.transform = 'translateY(0)';
                } else {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)';
                }
              }}
            >
              <span style={{ fontSize: '16px' }}>{option.icon}</span>
              <span>{option.title}</span>
              <span
                style={{
                  fontSize: '11px',
                  opacity: 0.7,
                  display: 'none',
                }}
              >
                {option.subtitle}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
