/**
 * 悬浮咨询栏组件
 * Floating Contact Bar - 右下角悬浮的快捷咨询入口
 */

'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { BigAntsColors, BigAntsRadius, BigAntsShadows, BigAntsTransitions } from '../lib/bigants-design';
import { conversionService } from '../lib/conversion-service';

interface FloatingContactProps {
  defaultOpen?: boolean;
}

export default function FloatingContact({ defaultOpen = false }: FloatingContactProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [showWechatQR, setShowWechatQR] = useState(false);

  const handlePhoneClick = () => {
    conversionService.trackPhoneClick('400-888-8888');
  };

  const handleWechatClick = () => {
    conversionService.trackWechatClick('BigAnts888');
    setShowWechatQR(true);
  };

  const handleConsultClick = () => {
    conversionService.trackCTAClick('homepage', 'floating_consult');
  };

  return (
    <>
      {/* 悬浮按钮区域 */}
      <div
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
          gap: '12px',
        }}
      >
        {/* 展开菜单 */}
        {isOpen && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              marginBottom: '8px',
            }}
          >
            {/* 在线咨询 */}
            <Link
              href="/sports-ants/contact"
              onClick={handleConsultClick}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 16px',
                background: '#FFFFFF',
                borderRadius: BigAntsRadius.lg,
                boxShadow: BigAntsShadows.lg,
                textDecoration: 'none',
                transition: `all ${BigAntsTransitions.fast}`,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateX(-4px)';
                e.currentTarget.style.boxShadow = BigAntsShadows.xl;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateX(0)';
                e.currentTarget.style.boxShadow = BigAntsShadows.lg;
              }}
            >
              <span style={{ fontSize: '20px' }}>💬</span>
              <span style={{ fontWeight: 600, color: '#1A1A2E', fontSize: '14px' }}>在线咨询</span>
            </Link>

            {/* 电话咨询 */}
            <a
              href="tel:400-888-8888"
              onClick={handlePhoneClick}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 16px',
                background: '#FFFFFF',
                borderRadius: BigAntsRadius.lg,
                boxShadow: BigAntsShadows.lg,
                textDecoration: 'none',
                transition: `all ${BigAntsTransitions.fast}`,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateX(-4px)';
                e.currentTarget.style.boxShadow = BigAntsShadows.xl;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateX(0)';
                e.currentTarget.style.boxShadow = BigAntsShadows.lg;
              }}
            >
              <span style={{ fontSize: '20px' }}>📞</span>
              <div>
                <div style={{ fontWeight: 600, color: '#1A1A2E', fontSize: '14px' }}>电话咨询</div>
                <div style={{ fontSize: '12px', color: '#0066FF', fontWeight: 600 }}>400-888-8888</div>
              </div>
            </a>

            {/* 微信咨询 */}
            <button
              onClick={handleWechatClick}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 16px',
                background: '#FFFFFF',
                borderRadius: BigAntsRadius.lg,
                boxShadow: BigAntsShadows.lg,
                border: 'none',
                cursor: 'pointer',
                transition: `all ${BigAntsTransitions.fast}`,
                width: '100%',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateX(-4px)';
                e.currentTarget.style.boxShadow = BigAntsShadows.xl;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateX(0)';
                e.currentTarget.style.boxShadow = BigAntsShadows.lg;
              }}
            >
              <span style={{ fontSize: '20px' }}>💚</span>
              <div>
                <div style={{ fontWeight: 600, color: '#1A1A2E', fontSize: '14px', textAlign: 'left' }}>微信咨询</div>
                <div style={{ fontSize: '12px', color: '#07C160', fontWeight: 600, textAlign: 'left' }}>添加好友</div>
              </div>
            </button>
          </div>
        )}

        {/* 主按钮 */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            background: `linear-gradient(135deg, ${BigAntsColors.primary} 0%, ${BigAntsColors.primaryDark} 100%)`,
            color: '#FFFFFF',
            fontSize: '24px',
            border: 'none',
            cursor: 'pointer',
            boxShadow: BigAntsShadows.lg,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: `all ${BigAntsTransitions.normal}`,
            transform: isOpen ? 'rotate(45deg)' : 'rotate(0deg)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = isOpen ? 'rotate(45deg) scale(1.1)' : 'scale(1.1)';
            e.currentTarget.style.boxShadow = BigAntsShadows.xl;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = isOpen ? 'rotate(45deg) scale(1)' : 'scale(1)';
            e.currentTarget.style.boxShadow = BigAntsShadows.lg;
          }}
        >
          {isOpen ? '✕' : '💬'}
        </button>
      </div>

      {/* 微信二维码弹窗 */}
      {showWechatQR && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.6)',
            zIndex: 10000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          onClick={() => setShowWechatQR(false)}
        >
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: BigAntsRadius.xl,
              padding: '32px',
              textAlign: 'center',
              maxWidth: '320px',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                width: '120px',
                height: '120px',
                background: '#F8FAFC',
                borderRadius: BigAntsRadius.lg,
                margin: '0 auto 16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '64px',
              }}
            >
              💚
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#1A1A2E', marginBottom: '8px' }}>
              扫码添加客服微信
            </h3>
            <p style={{ fontSize: '14px', color: '#666666', marginBottom: '16px' }}>
              备注"运动蚂蚁"，更快响应
            </p>
            <div
              style={{
                padding: '8px 16px',
                background: '#07C16015',
                borderRadius: BigAntsRadius.md,
                display: 'inline-block',
                marginBottom: '24px',
              }}
            >
              <span style={{ fontSize: '14px', fontWeight: 600, color: '#07C160' }}>
                微信号：BigAnts888
              </span>
            </div>
            <button
              onClick={() => setShowWechatQR(false)}
              style={{
                width: '100%',
                padding: '12px',
                background: '#F1F5F9',
                color: '#666666',
                fontSize: '14px',
                fontWeight: 600,
                borderRadius: BigAntsRadius.md,
                border: 'none',
                cursor: 'pointer',
              }}
            >
              关闭
            </button>
          </div>
        </div>
      )}
    </>
  );
}
