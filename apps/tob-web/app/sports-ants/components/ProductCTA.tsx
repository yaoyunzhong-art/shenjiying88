/**
 * 运动蚂蚁产品中心三步转化法CTA组件
 * BigAnts Product CTA Block - Three-Step Conversion Method
 *
 * 基于桑德斯销售原则：
 * 第一步：痛点共情 - 挖掘用户对设备品质和售后服务的担忧
 * 第二步：价值锚定 - 可量化的服务保障
 * 第三步：自主决策 - 无压力的选择式文案
 */

'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { BigAntsColors, BigAntsRadius, BigAntsTransitions, BigAntsFonts, BigAntsSpacing } from '../lib/bigants-design';
import { conversionService } from '../lib/conversion-service';

interface ProductCTAProps {
  productName: string;
  productCategory: string;
}

export default function ProductCTA({ productName, productCategory }: ProductCTAProps) {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isHovered, setIsHovered] = useState<string | null>(null);

  const handleOptionClick = (option: string) => {
    setSelectedOption(option);
    conversionService.trackCTAClick('products', `product_cta_${option}_${productName}`);

    // 根据选项跳转
    setTimeout(() => {
      switch (option) {
        case 'learn_more':
          // 了解设备详细功能 - 跳转到产品详情
          window.location.href = `/sports-ants/products#${productName}`;
          break;
        case 'watch_video':
          // 查看设备使用视频 - 跳转到视频专区
          window.open('/sports-ants/about#video', '_blank');
          break;
        case 'get_quote':
          // 获取详细报价方案 - 跳转到联系页
          window.location.href = `/sports-ants/contact?product=${encodeURIComponent(productName)}&category=${encodeURIComponent(productCategory)}`;
          break;
      }
    }, 300);
  };

  const options = [
    {
      id: 'learn_more',
      icon: '📚',
      title: '了解设备的详细功能',
      subtitle: '查看完整的参数和特点',
    },
    {
      id: 'watch_video',
      icon: '🎬',
      title: '查看设备使用视频',
      subtitle: '1-2分钟快速了解',
    },
    {
      id: 'get_quote',
      icon: '💰',
      title: '获取详细报价方案',
      subtitle: '包含限时优惠信息',
      isPrimary: true,
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
          想引进数字运动设备，但担心设备品质和售后服务？
        </span>
      </div>

      {/* 第二步：价值锚定 */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: BigAntsSpacing.md,
          marginBottom: BigAntsSpacing.xl,
        }}
      >
        {[
          { icon: '🛡️', value: '2年', label: '整机质保' },
          { icon: '⚡', value: '7×24h', label: '技术支持' },
          { icon: '📍', value: '50+', label: '覆盖城市' },
        ].map((stat) => (
          <div
            key={stat.label}
            style={{
              textAlign: 'center',
              padding: BigAntsSpacing.md,
              background: '#F8FAFC',
              borderRadius: BigAntsRadius.lg,
            }}
          >
            <div style={{ fontSize: '20px', marginBottom: '4px' }}>{stat.icon}</div>
            <div
              style={{
                fontFamily: BigAntsFonts.display,
                fontSize: '18px',
                fontWeight: 700,
                color: BigAntsColors.primary,
              }}
            >
              {stat.value}
            </div>
            <div
              style={{
                fontFamily: BigAntsFonts.chinese,
                fontSize: '12px',
                color: '#666666',
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
        ✨ 咨询不收取任何费用，顾问将根据您的需求提供定制化建议
      </p>
    </div>
  );
}
