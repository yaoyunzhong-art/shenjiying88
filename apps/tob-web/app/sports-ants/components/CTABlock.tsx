/**
 * 运动蚂蚁增强型CTA区块（三步转化法）
 * BigAnts Enhanced CTA Section - Based on Sanders Sales Principle
 *
 * 三步转化法：
 * 第一步：痛点共情 - 挖掘用户真实需求
 * 第二步：价值锚定 - 可量化的核心价值点
 * 第三步：自主决策 - 无压力的选择式文案
 */

'use client';

import React, { useState } from 'react';
import { BigAntsColors, BigAntsRadius, BigAntsSpacing, BigAntsTransitions, BigAntsFonts } from '../lib/bigants-design';
import { conversionService } from '../lib/conversion-service';

interface CTABlockProps {
  variant?: 'default' | 'hero' | 'product' | 'pricing' | 'case';
  painPoint?: string;
  valueProposition?: string;
  testimonials?: string;
  onConvert?: (action: string) => void;
}

export default function CTABlock({
  variant = 'default',
  painPoint = '想让您的场馆成为区域标杆，但不知从何下手？',
  valueProposition = '专业团队全程服务，从选址到运营一站式帮扶，平均回本周期8-14个月',
  onConvert,
}: CTABlockProps) {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  const handleOptionClick = (option: string, action: string) => {
    setSelectedOption(option);
    conversionService.trackThreeStepCTAClick(variant, action);
    onConvert?.(action);
  };

  const getVariantStyles = () => {
    switch (variant) {
      case 'hero':
        return {
          background: `linear-gradient(135deg, ${BigAntsColors.primary} 0%, ${BigAntsColors.primaryDark} 100%)`,
          textColor: '#FFFFFF',
          subtitleColor: 'rgba(255, 255, 255, 0.8)',
          buttonBg: '#FFFFFF',
          buttonColor: BigAntsColors.primary,
        };
      case 'product':
        return {
          background: '#FFFFFF',
          textColor: '#1A1A2E',
          subtitleColor: '#666666',
          buttonBg: BigAntsColors.primary,
          buttonColor: '#FFFFFF',
        };
      case 'pricing':
        return {
          background: `linear-gradient(135deg, ${BigAntsColors.primary} 0%, ${BigAntsColors.primaryDark} 100%)`,
          textColor: '#FFFFFF',
          subtitleColor: 'rgba(255, 255, 255, 0.8)',
          buttonBg: '#FFFFFF',
          buttonColor: BigAntsColors.primary,
        };
      case 'case':
        return {
          background: '#F8FAFC',
          textColor: '#1A1A2E',
          subtitleColor: '#666666',
          buttonBg: BigAntsColors.primary,
          buttonColor: '#FFFFFF',
        };
      default:
        return {
          background: BigAntsColors.primary,
          textColor: '#FFFFFF',
          subtitleColor: 'rgba(255, 255, 255, 0.8)',
          buttonBg: '#FFFFFF',
          buttonColor: BigAntsColors.primary,
        };
    }
  };

  const styles = getVariantStyles();

  return (
    <section
      style={{
        background: styles.background,
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
        {/* ========== 第一步：痛点共情 ========== */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 16px',
            background: variant === 'default' || variant === 'hero' || variant === 'pricing'
              ? 'rgba(255, 255, 255, 0.15)'
              : `${BigAntsColors.primary}10`,
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
              color: styles.textColor,
            }}
          >
            {painPoint}
          </span>
        </div>

        {/* ========== 标题 ========== */}
        <h2
          style={{
            fontFamily: BigAntsFonts.display,
            fontSize: 'clamp(2rem, 5vw, 3rem)',
            fontWeight: 700,
            color: styles.textColor,
            marginBottom: BigAntsSpacing.md,
            lineHeight: 1.2,
          }}
        >
          开启您的数字运动事业
        </h2>

        {/* ========== 第二步：价值锚定 ========== */}
        <p
          style={{
            fontFamily: BigAntsFonts.chinese,
            fontSize: '18px',
            color: styles.subtitleColor,
            lineHeight: 1.7,
            maxWidth: '600px',
            margin: '0 auto',
            marginBottom: BigAntsSpacing.lg,
          }}
        >
          {valueProposition}
        </p>

        {/* ========== 第三步：自主决策 ========== */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: BigAntsSpacing.md,
            marginBottom: BigAntsSpacing.xl,
          }}
        >
          <p
            style={{
              fontFamily: BigAntsFonts.chinese,
              fontSize: '14px',
              color: styles.subtitleColor,
              marginBottom: BigAntsSpacing.sm,
            }}
          >
            选择您感兴趣的方式继续了解：
          </p>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              width: '100%',
              maxWidth: '500px',
            }}
          >
            {/* 选项1：了解更多 */}
            <button
              onClick={() => handleOptionClick('learn_more', 'learn_more')}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '14px 20px',
                background: selectedOption === 'learn_more' ? styles.buttonBg : 'transparent',
                color: styles.textColor,
                fontFamily: BigAntsFonts.chinese,
                fontSize: '14px',
                fontWeight: 600,
                borderRadius: BigAntsRadius.lg,
                border: `2px solid ${selectedOption === 'learn_more' ? styles.buttonBg : 'rgba(255, 255, 255, 0.3)'}`,
                cursor: 'pointer',
                transition: `all ${BigAntsTransitions.fast}`,
              }}
              onMouseEnter={(e) => {
                if (selectedOption !== 'learn_more') {
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.5)';
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                }
              }}
              onMouseLeave={(e) => {
                if (selectedOption !== 'learn_more') {
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)';
                  e.currentTarget.style.background = 'transparent';
                }
              }}
            >
              <span>📚</span>
              <span>先了解更多方案</span>
            </button>

            {/* 选项2：查看案例 */}
            <button
              onClick={() => handleOptionClick('view_cases', 'view_cases')}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '14px 20px',
                background: selectedOption === 'view_cases' ? styles.buttonBg : 'transparent',
                color: styles.textColor,
                fontFamily: BigAntsFonts.chinese,
                fontSize: '14px',
                fontWeight: 600,
                borderRadius: BigAntsRadius.lg,
                border: `2px solid ${selectedOption === 'view_cases' ? styles.buttonBg : 'rgba(255, 255, 255, 0.3)'}`,
                cursor: 'pointer',
                transition: `all ${BigAntsTransitions.fast}`,
              }}
              onMouseEnter={(e) => {
                if (selectedOption !== 'view_cases') {
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.5)';
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                }
              }}
              onMouseLeave={(e) => {
                if (selectedOption !== 'view_cases') {
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)';
                  e.currentTarget.style.background = 'transparent';
                }
              }}
            >
              <span>📊</span>
              <span>查看同行成功案例</span>
            </button>

            {/* 选项3：预约顾问 */}
            <button
              onClick={() => handleOptionClick('consult', 'consult')}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '14px 20px',
                background: styles.buttonBg,
                color: styles.buttonColor,
                fontFamily: BigAntsFonts.chinese,
                fontSize: '14px',
                fontWeight: 600,
                borderRadius: BigAntsRadius.lg,
                border: 'none',
                cursor: 'pointer',
                transition: `all ${BigAntsTransitions.fast}`,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 8px 20px rgba(0, 0, 0, 0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <span>📞</span>
              <span>预约15分钟顾问沟通</span>
            </button>
          </div>

          {/* 权益说明 */}
          <p
            style={{
              fontFamily: BigAntsFonts.chinese,
              fontSize: '12px',
              color: styles.subtitleColor,
              marginTop: BigAntsSpacing.sm,
            }}
          >
            ✨ 咨询不收取任何费用，顾问将根据您的情况提供定制化建议
          </p>
        </div>

        {/* 转化成果展示 */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: BigAntsSpacing['2xl'],
            flexWrap: 'wrap',
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
              <span style={{ fontSize: '20px' }}>{stat.icon}</span>
              <span
                style={{
                  fontFamily: BigAntsFonts.display,
                  fontSize: '24px',
                  fontWeight: 700,
                  color: styles.textColor,
                }}
              >
                {stat.value}
              </span>
              <span
                style={{
                  fontFamily: BigAntsFonts.chinese,
                  fontSize: '14px',
                  color: styles.subtitleColor,
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
