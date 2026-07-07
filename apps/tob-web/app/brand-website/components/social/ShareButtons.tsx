/**
 * 社交分享按钮组件 - Social Share Buttons
 * 支持微信、抖音、LinkedIn等主流平台的一键分享
 */

'use client';

import React from 'react';

interface ShareButtonsProps {
  url: string;
  title: string;
  description?: string;
  image?: string;
  platforms?: ('wechat' | 'weibo' | 'douyin' | 'linkedin' | 'twitter' | 'facebook')[];
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  layout?: 'horizontal' | 'vertical';
}

const PLATFORM_CONFIG = {
  wechat: {
    name: '微信',
    icon: '💬',
    color: '#07c160',
    getShareUrl: (url: string, title: string) => {
      // 微信分享需要使用微信SDK，这里返回二维码链接
      return `https://qr.axshare.cn/?id=wechat&data=${encodeURIComponent(url)}`;
    },
  },
  weibo: {
    name: '微博',
    icon: '📝',
    color: '#e6162d',
    getShareUrl: (url: string, title: string) =>
      `https://service.weibo.com/share/share.php?url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}`,
  },
  douyin: {
    name: '抖音',
    icon: '🎵',
    color: '#000000',
    getShareUrl: (url: string, title: string) =>
      `https://www.douyin.com/share/video/${encodeURIComponent(url)}`,
  },
  linkedin: {
    name: 'LinkedIn',
    icon: '💼',
    color: '#0a66c2',
    getShareUrl: (url: string, title: string) =>
      `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
  },
  twitter: {
    name: 'Twitter',
    icon: '🐦',
    color: '#1da1f2',
    getShareUrl: (url: string, title: string) =>
      `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`,
  },
  facebook: {
    name: 'Facebook',
    icon: '📘',
    color: '#1877f2',
    getShareUrl: (url: string) =>
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
  },
};

const SIZE_CONFIG = {
  sm: { button: 32, icon: 16, gap: 8 },
  md: { button: 40, icon: 20, gap: 12 },
  lg: { button: 48, icon: 24, gap: 16 },
};

export default function ShareButtons({
  url,
  title,
  description,
  image,
  platforms = ['wechat', 'weibo', 'linkedin', 'twitter'],
  size = 'md',
  showLabel = false,
  layout = 'horizontal',
}: ShareButtonsProps) {
  const sizeConfig = SIZE_CONFIG[size];

  const handleShare = (platform: keyof typeof PLATFORM_CONFIG) => {
    const config = PLATFORM_CONFIG[platform];
    const shareUrl = config.getShareUrl(url, title);

    // 打开分享窗口
    if (platform === 'wechat') {
      // 微信需要显示二维码，使用window.open
      window.open(shareUrl, '_blank', 'width=400,height=400');
    } else {
      window.open(
        shareUrl,
        '_blank',
        'width=600,height=400,noopener,noreferrer'
      );
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        gap: `${sizeConfig.gap}px`,
        flexDirection: layout === 'vertical' ? 'column' : 'row',
        alignItems: 'center',
      }}
    >
      {platforms.map((platform) => {
        const config = PLATFORM_CONFIG[platform];

        return (
          <button
            key={platform}
            onClick={() => handleShare(platform)}
            title={`分享到${config.name}`}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: showLabel ? '8px' : '0',
              width: showLabel ? 'auto' : `${sizeConfig.button}px`,
              height: `${sizeConfig.button}px`,
              padding: showLabel ? '0 12px' : '0',
              borderRadius: `${sizeConfig.button / 2}px`,
              background: `${config.color}15`,
              border: `1px solid ${config.color}30`,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              fontSize: `${sizeConfig.icon}px`,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = `${config.color}25`;
              e.currentTarget.style.transform = 'scale(1.05)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = `${config.color}15`;
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            <span>{config.icon}</span>
            {showLabel && (
              <span
                style={{
                  fontSize: '13px',
                  color: config.color,
                  fontWeight: 500,
                }}
              >
                {config.name}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

/**
 * 分享到微信（显示二维码）
 */
export function WechatShareQR({ url, title }: { url: string; title: string }) {
  const [show, setShow] = React.useState(false);

  // 生成二维码URL (使用API)
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(url)}`;

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <button
        onClick={() => setShow(!show)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '8px 12px',
          borderRadius: '8px',
          background: '#07c16015',
          border: '1px solid #07c16030',
          cursor: 'pointer',
          fontSize: '14px',
          color: '#07c160',
        }}
      >
        <span>💬</span>
        <span>微信分享</span>
      </button>

      {show && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: '50%',
            transform: 'translateX(-50%)',
            marginTop: '8px',
            padding: '12px',
            background: 'white',
            borderRadius: '12px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
            zIndex: 1000,
          }}
        >
          <img src={qrUrl} alt="微信分享二维码" width={200} height={200} />
          <p
            style={{
              textAlign: 'center',
              fontSize: '12px',
              color: '#666',
              marginTop: '8px',
            }}
          >
            扫码分享到微信
          </p>
        </div>
      )}
    </div>
  );
}
