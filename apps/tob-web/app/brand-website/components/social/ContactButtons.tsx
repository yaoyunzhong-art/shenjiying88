/**
 * 联系按钮组件 - Contact Buttons
 * 企业微信、手机、邮箱等联系组件的移动端适配触发
 */

'use client';

import React, { useState } from 'react';

interface ContactButtonsProps {
  phone?: string;
  email?: string;
  wechat?: string;
  layout?: 'horizontal' | 'vertical';
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  compact?: boolean;
}

const CONTACT_CONFIG = {
  phone: {
    icon: '📞',
    label: '电话咨询',
    color: '#0071e3',
    action: (phone: string) => {
      window.location.href = `tel:${phone}`;
    },
  },
  email: {
    icon: '✉️',
    label: '发送邮件',
    color: '#86868b',
    action: (email: string) => {
      window.location.href = `mailto:${email}`;
    },
  },
  wechat: {
    icon: '💬',
    label: '微信咨询',
    color: '#07c160',
    action: (wechat: string) => {
      // 复制微信号到剪贴板
      navigator.clipboard.writeText(wechat);
      alert(`微信号 ${wechat} 已复制到剪贴板`);
    },
  },
};

export default function ContactButtons({
  phone = '400-888-8888',
  email = 'business@shenjiying.com',
  wechat = 'shenjiying888',
  layout = 'horizontal',
  size = 'md',
  showLabel = true,
  compact = false,
}: ContactButtonsProps) {
  const [copied, setCopied] = useState<string | null>(null);

  const handleCopyWechat = () => {
    navigator.clipboard.writeText(wechat).then(() => {
      setCopied('wechat');
      setTimeout(() => setCopied(null), 2000);
    });
  };

  const sizeConfig = {
    sm: { padding: '8px 12px', fontSize: '12px', iconSize: 14 },
    md: { padding: '12px 20px', fontSize: '14px', iconSize: 18 },
    lg: { padding: '16px 28px', fontSize: '16px', iconSize: 22 },
  }[size];

  const buttons = [
    {
      key: 'phone',
      icon: '📞',
      label: phone,
      color: '#0071e3',
      action: () => window.open(`tel:${phone}`, '_self'),
      show: !!phone,
    },
    {
      key: 'email',
      icon: '✉️',
      label: email,
      color: '#86868b',
      action: () => window.open(`mailto:${email}`, '_self'),
      show: !!email,
    },
    {
      key: 'wechat',
      icon: copied ? '✓' : '💬',
      label: copied ? '已复制' : wechat,
      color: '#07c160',
      action: handleCopyWechat,
      show: !!wechat,
    },
  ].filter((btn) => btn.show);

  if (compact) {
    return (
      <div style={{ display: 'flex', gap: '8px' }}>
        {buttons.map((btn) => (
          <button
            key={btn.key}
            onClick={btn.action}
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: `${btn.color}15`,
              border: `1px solid ${btn.color}30`,
              cursor: 'pointer',
              fontSize: '18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease',
            }}
            title={btn.label}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = `${btn.color}25`;
              e.currentTarget.style.transform = 'scale(1.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = `${btn.color}15`;
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            {btn.icon}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'flex',
        gap: '12px',
        flexDirection: layout === 'vertical' ? 'column' : 'row',
        flexWrap: 'wrap',
      }}
    >
      {buttons.map((btn) => (
        <button
          key={btn.key}
          onClick={btn.action}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: sizeConfig.padding,
            borderRadius: '12px',
            background: `${btn.color}08`,
            border: `1px solid ${btn.color}20`,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = `${btn.color}15`;
            e.currentTarget.style.borderColor = `${btn.color}40`;
            e.currentTarget.style.transform = 'translateY(-2px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = `${btn.color}08`;
            e.currentTarget.style.borderColor = `${btn.color}20`;
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          <span style={{ fontSize: `${sizeConfig.iconSize}px` }}>{btn.icon}</span>
          {showLabel && (
            <span
              style={{
                fontSize: sizeConfig.fontSize,
                color: btn.color,
                fontWeight: 500,
              }}
            >
              {btn.label}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

/**
 * 内嵌联系卡片
 */
export function ContactCard({
  phone = '400-888-8888',
  email = 'business@shenjiying.com',
  wechat = 'shenjiying888',
  title = '联系我们',
}: {
  phone?: string;
  email?: string;
  wechat?: string;
  title?: string;
}) {
  return (
    <div
      style={{
        padding: '24px',
        background: '#f5f5f7',
        borderRadius: '16px',
      }}
    >
      <h3
        style={{
          fontSize: '18px',
          fontWeight: 600,
          color: '#1d1d1f',
          marginBottom: '20px',
        }}
      >
        {title}
      </h3>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Phone */}
        <a
          href={`tel:${phone}`}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '14px 16px',
            background: 'white',
            borderRadius: '12px',
            textDecoration: 'none',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateX(4px)';
            e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateX(0)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          <span style={{ fontSize: '20px' }}>📞</span>
          <div>
            <div style={{ fontSize: '12px', color: '#86868b' }}>商务热线</div>
            <div style={{ fontSize: '16px', fontWeight: 600, color: '#0071e3' }}>
              {phone}
            </div>
          </div>
        </a>

        {/* Email */}
        <a
          href={`mailto:${email}`}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '14px 16px',
            background: 'white',
            borderRadius: '12px',
            textDecoration: 'none',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateX(4px)';
            e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateX(0)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          <span style={{ fontSize: '20px' }}>✉️</span>
          <div>
            <div style={{ fontSize: '12px', color: '#86868b' }}>邮箱地址</div>
            <div style={{ fontSize: '14px', fontWeight: 600, color: '#1d1d1f' }}>
              {email}
            </div>
          </div>
        </a>

        {/* Wechat */}
        <button
          onClick={() => {
            navigator.clipboard.writeText(wechat);
            alert(`微信号 ${wechat} 已复制`);
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '14px 16px',
            background: 'white',
            borderRadius: '12px',
            border: 'none',
            cursor: 'pointer',
            width: '100%',
            textAlign: 'left',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateX(4px)';
            e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateX(0)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          <span style={{ fontSize: '20px' }}>💬</span>
          <div>
            <div style={{ fontSize: '12px', color: '#86868b' }}>企业微信</div>
            <div style={{ fontSize: '14px', fontWeight: 600, color: '#07c160' }}>
              {wechat} <span style={{ fontSize: '11px' }}>(点击复制)</span>
            </div>
          </div>
        </button>
      </div>
    </div>
  );
}
