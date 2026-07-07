/**
 * 运动蚂蚁CTA转化区域（三步转化法）
 * BigAnts CTA Section - Three-Step Conversion Method
 *
 * 基于桑德斯销售原则：
 * 第一步：痛点共情 - 挖掘用户投资顾虑
 * 第二步：价值锚定 - 可量化的服务保障
 * 第三步：自主决策 - 无压力的选择式文案
 */

'use client';

import React, { useState } from 'react';
import { BigAntsColors, BigAntsFonts, BigAntsSpacing, BigAntsRadius, BigAntsTransitions } from '../lib/bigants-design';
import { conversionService } from '../lib/conversion-service';

export default function CTASection() {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  const handleOptionClick = (option: string) => {
    setSelectedOption(option);
    conversionService.trackCTAClick('homepage', `cta_section_${option}`);

    setTimeout(() => {
      switch (option) {
        case 'consult':
          window.location.href = '/sports-ants/contact';
          break;
        case 'cases':
          window.location.href = '/sports-ants/cases';
          break;
        case 'policy':
          window.location.href = '/sports-ants/franchise';
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
    },
    {
      id: 'cases',
      icon: '🏆',
      title: '查看案例',
      subtitle: '500+成功案例参考',
    },
    {
      id: 'policy',
      icon: '📋',
      title: '招商政策',
      subtitle: '0加盟费起政策',
    },
  ];

  return (
    <section
      style={{
        background: `linear-gradient(135deg, ${BigAntsColors.primary} 0%, ${BigAntsColors.primaryDark} 100%)`,
        padding: `${BigAntsSpacing['4xl']} 0`,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Background Pattern */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `
            radial-gradient(circle at 20% 50%, rgba(255, 255, 255, 0.1) 0%, transparent 50%),
            radial-gradient(circle at 80% 50%, rgba(255, 255, 255, 0.1) 0%, transparent 50%)
          `,
        }}
      />

      {/* Grid Pattern */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `
            linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
        }}
      />

      <div
        style={{
          maxWidth: '900px',
          margin: '0 auto',
          padding: `0 ${BigAntsSpacing.lg}`,
          textAlign: 'center',
          position: 'relative',
          zIndex: 10,
        }}
      >
        {/* 第一步：痛点共情 */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 16px',
            background: 'rgba(255, 255, 255, 0.15)',
            borderRadius: '9999px',
            marginBottom: BigAntsSpacing.lg,
          }}
        >
          <span style={{ fontSize: '16px' }}>💭</span>
          <span
            style={{
              fontFamily: BigAntsFonts.chinese,
              fontSize: '14px',
              fontWeight: 600,
              color: BigAntsColors.white,
            }}
          >
            想让您的场馆成为区域标杆，但不知从何下手？
          </span>
        </div>

        {/* Content */}
        <h2
          style={{
            fontFamily: BigAntsFonts.display,
            fontSize: 'clamp(2rem, 5vw, 3rem)',
            fontWeight: 700,
            color: BigAntsColors.white,
            marginBottom: BigAntsSpacing.md,
            lineHeight: 1.2,
          }}
        >
          开启您的数字运动事业
        </h2>

        {/* 第二步：价值锚定 */}
        <p
          style={{
            fontFamily: BigAntsFonts.chinese,
            fontSize: '18px',
            color: 'rgba(255, 255, 255, 0.8)',
            lineHeight: 1.7,
            maxWidth: '600px',
            margin: '0 auto',
            marginBottom: BigAntsSpacing.lg,
          }}
        >
          专业团队全程服务，从选址到运营一站式帮扶，平均回本周期8-14个月
        </p>

        {/* 第三步：自主决策 */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: BigAntsSpacing.md,
            marginBottom: BigAntsSpacing['2xl'],
          }}
        >
          <p
            style={{
              fontFamily: BigAntsFonts.chinese,
              fontSize: '13px',
              color: 'rgba(255, 255, 255, 0.7)',
              marginBottom: '4px',
            }}
          >
            选择您感兴趣的方式继续了解：
          </p>

          <div
            style={{
              display: 'flex',
              gap: BigAntsSpacing.md,
              flexWrap: 'wrap',
              justifyContent: 'center',
            }}
          >
            {options.map((option, index) => (
              <button
                key={option.id}
                onClick={() => handleOptionClick(option.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: index === 0 ? '16px 32px' : '14px 28px',
                  background: index === 0
                    ? BigAntsColors.white
                    : selectedOption === option.id
                      ? 'rgba(255,255,255,0.2)'
                      : 'rgba(255,255,255,0.1)',
                  color: index === 0 ? BigAntsColors.primary : BigAntsColors.white,
                  fontFamily: BigAntsFonts.chinese,
                  fontSize: index === 0 ? '15px' : '14px',
                  fontWeight: 600,
                  borderRadius: BigAntsRadius.full,
                  border: index === 0 ? 'none' : '2px solid rgba(255,255,255,0.3)',
                  cursor: 'pointer',
                  transition: `all ${BigAntsTransitions.fast}`,
                }}
                onMouseEnter={(e) => {
                  if (index === 0) {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 10px 30px rgba(0,0,0,0.2)';
                  } else {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.15)';
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.5)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (index === 0) {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  } else {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)';
                  }
                }}
              >
                <span style={{ fontSize: '18px' }}>{option.icon}</span>
                <span>{option.title}</span>
              </button>
            ))}
          </div>

          <p
            style={{
              fontFamily: BigAntsFonts.chinese,
              fontSize: '12px',
              color: 'rgba(255, 255, 255, 0.6)',
              marginTop: BigAntsSpacing.sm,
            }}
          >
            ✨ 咨询不收取任何费用，顾问将根据您的情况提供定制化建议
          </p>
        </div>

        {/* 成果数据展示 */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: BigAntsSpacing['2xl'],
            flexWrap: 'wrap',
            paddingTop: BigAntsSpacing.lg,
            borderTop: '1px solid rgba(255,255,255,0.1)',
          }}
        >
          {[
            { icon: '🏆', value: '500+', label: '合作伙伴' },
            { icon: '📍', value: '50+', label: '覆盖城市' },
            { icon: '⏱️', value: '8-14', label: '月回本周期' },
            { icon: '💯', value: '99.5%', label: '设备完好率' },
          ].map((stat) => (
            <div
              key={stat.label}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <span style={{ fontSize: '18px' }}>{stat.icon}</span>
              <span
                style={{
                  fontFamily: BigAntsFonts.display,
                  fontSize: '22px',
                  fontWeight: 700,
                  color: BigAntsColors.white,
                }}
              >
                {stat.value}
              </span>
              <span
                style={{
                  fontFamily: BigAntsFonts.chinese,
                  fontSize: '13px',
                  color: 'rgba(255,255,255,0.7)',
                }}
              >
                {stat.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
