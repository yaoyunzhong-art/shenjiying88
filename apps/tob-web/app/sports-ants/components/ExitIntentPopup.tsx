/**
 * 运动蚂蚁退出意图弹窗组件
 * BigAnts Exit Intent Popup
 *
 * 基于桑德斯销售原则的三步转化法：
 * 第一步：痛点共情 - 提醒用户可能错过的价值
 * 第二步：价值锚定 - 提供限时权益
 * 第三步：自主决策 - 无压力的选择项
 */

'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { BigAntsColors, BigAntsRadius, BigAntsShadows, BigAntsSpacing, BigAntsTransitions, BigAntsFonts } from '../lib/bigants-design';
import { conversionService } from '../lib/conversion-service';

interface ExitIntentPopupProps {
  delaySeconds?: number;
  onConvert?: (action: string) => void;
}

export default function ExitIntentPopup({
  delaySeconds = 5,
  onConvert,
}: ExitIntentPopupProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [hasShown, setHasShown] = useState(false);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  useEffect(() => {
    // 延迟触发，避免误触
    const timer = setTimeout(() => {
      const handleMouseLeave = (e: MouseEvent) => {
        // 只有当鼠标移向浏览器外时才触发
        if (e.clientY <= 0 && !hasShown) {
          setIsVisible(true);
          setHasShown(true);
          conversionService.trackPopupShow('exit_intent');
        }
      };

      document.addEventListener('mouseleave', handleMouseLeave);

      return () => {
        document.removeEventListener('mouseleave', handleMouseLeave);
        clearTimeout(timer);
      };
    }, delaySeconds * 1000);

    return () => clearTimeout(timer);
  }, [delaySeconds, hasShown]);

  const handleClose = () => {
    setIsVisible(false);
    conversionService.trackPopupClose('exit_intent');
  };

  const handleOptionClick = (option: string) => {
    setSelectedOption(option);
    conversionService.trackPopupClick('exit_intent', option);
    onConvert?.(option);

    // 根据选项跳转
    setTimeout(() => {
      switch (option) {
        case 'continue':
          setIsVisible(false);
          break;
        case 'download':
          // 下载案例资料包
          window.open('/sports-ants/cases', '_blank');
          setIsVisible(false);
          break;
        case 'callback':
          // 留下联系方式
          window.location.href = '/sports-ants/contact?type=callback';
          break;
      }
    }, 300);
  };

  if (!isVisible) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.7)',
        zIndex: 100000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: BigAntsSpacing.lg,
        animation: 'fadeIn 0.3s ease',
      }}
      onClick={handleClose}
    >
      <style>
        {`
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          @keyframes slideUp {
            from { transform: translateY(20px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
          }
        `}
      </style>

      <div
        style={{
          background: '#FFFFFF',
          borderRadius: BigAntsRadius.xl,
          maxWidth: '520px',
          width: '100%',
          overflow: 'hidden',
          animation: 'slideUp 0.3s ease',
          position: 'relative',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={handleClose}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            width: '32px',
            height: '32px',
            background: '#F1F5F9',
            border: 'none',
            borderRadius: '50%',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '16px',
            color: '#666666',
            zIndex: 10,
            transition: `all ${BigAntsTransitions.fast}`,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#E2E8F0';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = '#F1F5F9';
          }}
        >
          ✕
        </button>

        {/* Header - 第一步：痛点共情 */}
        <div
          style={{
            background: `linear-gradient(135deg, ${BigAntsColors.primary} 0%, ${BigAntsColors.primaryDark} 100%)`,
            padding: `${BigAntsSpacing['2xl']} ${BigAntsSpacing.lg}`,
            textAlign: 'center',
          }}
        >
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 14px',
              background: 'rgba(255, 255, 255, 0.2)',
              borderRadius: '9999px',
              marginBottom: BigAntsSpacing.md,
            }}
          >
            <span style={{ fontSize: '14px' }}>💭</span>
            <span
              style={{
                fontFamily: BigAntsFonts.chinese,
                fontSize: '13px',
                color: '#FFFFFF',
              }}
            >
              确定要离开吗？
            </span>
          </div>

          <h2
            style={{
              fontFamily: BigAntsFonts.display,
              fontSize: '22px',
              fontWeight: 700,
              color: '#FFFFFF',
              marginBottom: BigAntsSpacing.sm,
            }}
          >
            您可能错过的信息
          </h2>

          {/* 第二步：价值锚定 */}
          <p
            style={{
              fontFamily: BigAntsFonts.chinese,
              fontSize: '14px',
              color: 'rgba(255, 255, 255, 0.9)',
              lineHeight: 1.6,
            }}
          >
            前100名咨询用户可获得：
            <br />
            <strong>免费场馆规划方案 + 投资回报分析报告</strong>
          </p>
        </div>

        {/* Body - 第三步：自主决策 */}
        <div style={{ padding: BigAntsSpacing.xl }}>
          <p
            style={{
              fontFamily: BigAntsFonts.chinese,
              fontSize: '14px',
              color: '#666666',
              textAlign: 'center',
              marginBottom: BigAntsSpacing.lg,
            }}
          >
            选择您感兴趣的方式继续了解：
          </p>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            {/* 选项1：继续浏览 */}
            <button
              onClick={() => handleOptionClick('continue')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '16px 20px',
                background: selectedOption === 'continue' ? '#F1F5F9' : '#FFFFFF',
                border: `2px solid ${selectedOption === 'continue' ? BigAntsColors.primary : '#E2E8F0'}`,
                borderRadius: BigAntsRadius.lg,
                cursor: 'pointer',
                transition: `all ${BigAntsTransitions.fast}`,
                textAlign: 'left',
              }}
              onMouseEnter={(e) => {
                if (selectedOption !== 'continue') {
                  e.currentTarget.style.borderColor = BigAntsColors.primary;
                }
              }}
              onMouseLeave={(e) => {
                if (selectedOption !== 'continue') {
                  e.currentTarget.style.borderColor = '#E2E8F0';
                }
              }}
            >
              <span style={{ fontSize: '24px' }}>📚</span>
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    fontFamily: BigAntsFonts.chinese,
                    fontSize: '15px',
                    fontWeight: 700,
                    color: '#1A1A2E',
                    marginBottom: '2px',
                  }}
                >
                  继续了解方案
                </div>
                <div
                  style={{
                    fontFamily: BigAntsFonts.chinese,
                    fontSize: '13px',
                    color: '#666666',
                  }}
                >
                  留在页面继续浏览
                </div>
              </div>
              <span style={{ color: '#CCCCCC', fontSize: '18px' }}>→</span>
            </button>

            {/* 选项2：下载资料 */}
            <button
              onClick={() => handleOptionClick('download')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '16px 20px',
                background: selectedOption === 'download' ? '#F1F5F9' : '#FFFFFF',
                border: `2px solid ${selectedOption === 'download' ? BigAntsColors.primary : '#E2E8F0'}`,
                borderRadius: BigAntsRadius.lg,
                cursor: 'pointer',
                transition: `all ${BigAntsTransitions.fast}`,
                textAlign: 'left',
              }}
              onMouseEnter={(e) => {
                if (selectedOption !== 'download') {
                  e.currentTarget.style.borderColor = BigAntsColors.primary;
                }
              }}
              onMouseLeave={(e) => {
                if (selectedOption !== 'download') {
                  e.currentTarget.style.borderColor = '#E2E8F0';
                }
              }}
            >
              <span style={{ fontSize: '24px' }}>📥</span>
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    fontFamily: BigAntsFonts.chinese,
                    fontSize: '15px',
                    fontWeight: 700,
                    color: '#1A1A2E',
                    marginBottom: '2px',
                  }}
                >
                  下载完整案例资料包
                </div>
                <div
                  style={{
                    fontFamily: BigAntsFonts.chinese,
                    fontSize: '13px',
                    color: '#666666',
                  }}
                >
                  包含10+成功案例详情 + 投资分析
                </div>
              </div>
              <span style={{ color: '#CCCCCC', fontSize: '18px' }}>→</span>
            </button>

            {/* 选项3：预约回电 */}
            <button
              onClick={() => handleOptionClick('callback')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '16px 20px',
                background: BigAntsColors.primary,
                border: 'none',
                borderRadius: BigAntsRadius.lg,
                cursor: 'pointer',
                transition: `all ${BigAntsTransitions.fast}`,
                textAlign: 'left',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = BigAntsColors.primaryDark;
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = BigAntsColors.primary;
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <span style={{ fontSize: '24px' }}>📞</span>
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    fontFamily: BigAntsFonts.chinese,
                    fontSize: '15px',
                    fontWeight: 700,
                    color: '#FFFFFF',
                    marginBottom: '2px',
                  }}
                >
                  让顾问稍后联系我
                </div>
                <div
                  style={{
                    fontFamily: BigAntsFonts.chinese,
                    fontSize: '13px',
                    color: 'rgba(255, 255, 255, 0.8)',
                  }}
                >
                  24小时内安排专业顾问回访
                </div>
              </div>
              <span style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '18px' }}>→</span>
            </button>
          </div>

          {/* 隐私保证 */}
          <p
            style={{
              fontFamily: BigAntsFonts.chinese,
              fontSize: '12px',
              color: '#999999',
              textAlign: 'center',
              marginTop: BigAntsSpacing.lg,
            }}
          >
            🔒 您的信息将被严格保护，仅用于提供顾问服务
          </p>
        </div>
      </div>
    </div>
  );
}
