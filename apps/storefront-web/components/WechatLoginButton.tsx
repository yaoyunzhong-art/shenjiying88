/**
 * WechatLoginButton.tsx · 微信登录按钮组件
 * Phase-FP T-FP-028 · 2026-07-02
 */
'use client';

import React, { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  wechatAuthService,
  type WechatAuthStatus,
} from '../lib/wechat-auth-service';

export interface WechatLoginButtonProps {
  mode?: 'button' | 'qrcode' | 'miniprogram';
  onSuccess?: (data: any) => void;
  onError?: (error: any) => void;
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  className?: string;
}

export function WechatLoginButton({
  mode = 'button',
  onSuccess,
  onError,
  size = 'md',
  fullWidth = false,
  className = '',
}: WechatLoginButtonProps) {
  const router = useRouter();
  const [status, setStatus] = useState<WechatAuthStatus>('idle');
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);

  const handleLogin = useCallback(async () => {
    setStatus('loading');

    try {
      if (mode === 'miniprogram') {
        // 小程序登录 - 使用wx.login获取code
        // #ifndef H5
        // const loginRes = await wx.login();
        // const result = await wechatAuthService.loginWithMiniprogram(loginRes.code);
        // #endif
        // Mock小程序登录
        const result = await wechatAuthService.loginWithMiniprogram('mock_miniprogram_code');
        if (result.success && result.data) {
          handleSuccess(result.data);
        } else {
          handleFailure(result.error);
        }
      } else if (mode === 'qrcode') {
        // H5扫码登录 - 生成二维码
        // const appId = 'your_wechat_app_id';
        // const redirectUri = encodeURIComponent(window.location.origin + '/h5/wechat/callback');
        // const authUrl = wechatAuthService.getAuthorizeUrl(appId, redirectUri);
        // setQrCodeUrl(`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(authUrl)}`);
        setQrCodeUrl('https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=https%3A%2F%2Fexample.com%2Fwechat');
        setStatus('idle');
      } else {
        // 公众号登录 - 跳转授权
        // const appId = 'your_wechat_app_id';
        // const redirectUri = encodeURIComponent(window.location.origin + '/h5/wechat/callback');
        // window.location.href = wechatAuthService.getAuthorizeUrl(appId, redirectUri);
        // Mock登录
        const result = await wechatAuthService.loginWithOfficialAccount('mock_official_code');
        if (result.success && result.data) {
          handleSuccess(result.data);
        } else {
          handleFailure(result.error);
        }
      }
    } catch (error) {
      handleFailure({ message: '登录失败，请重试' });
    }
  }, [mode]);

  function handleSuccess(data: any) {
    setStatus('success');
    // 保存登录状态
    localStorage.setItem('member_access_token', data.accessToken);
    localStorage.setItem('member_refresh_token', data.refreshToken);
    if (data.member) {
      localStorage.setItem('member_info', JSON.stringify(data.member));
    }
    onSuccess?.(data);
    // 跳转
    if (data.member?.isNewUser) {
      router.push('/member-register?wechat=1');
    } else {
      router.push('/member-center');
    }
  }

  function handleFailure(error: any) {
    setStatus('failed');
    onError?.(error);
  }

  const sizeStyles = {
    sm: { padding: '8px 16px', fontSize: 13 },
    md: { padding: '12px 24px', fontSize: 14 },
    lg: { padding: '14px 32px', fontSize: 16 },
  };

  if (mode === 'qrcode' && qrCodeUrl) {
    return (
      <div
        style={{
          display: 'inline-flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 12,
        }}
        className={className}
      >
        <div
          style={{
            padding: 16,
            background: '#fff',
            borderRadius: 12,
          }}
        >
          <img src={qrCodeUrl} alt="微信扫码登录" width={180} height={180} />
        </div>
        <span style={{ fontSize: 13, color: '#64748b' }}>
          请使用微信扫码登录
        </span>
        <button
          onClick={() => setQrCodeUrl(null)}
          style={{
            background: 'none',
            border: 'none',
            color: '#667eea',
            fontSize: 13,
            cursor: 'pointer',
          }}
        >
          取消
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={handleLogin}
      disabled={status === 'loading'}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        borderRadius: 10,
        background: mode === 'miniprogram'
          ? 'linear-gradient(135deg, #07c160 0%, #06ad56 100%)'
          : 'rgba(34, 197, 94, 0.15)',
        border: mode === 'miniprogram'
          ? 'none'
          : '1px solid rgba(34, 197, 94, 0.3)',
        color: mode === 'miniprogram' ? '#fff' : '#4ade80',
        fontWeight: 500,
        cursor: status === 'loading' ? 'not-allowed' : 'pointer',
        opacity: status === 'loading' ? 0.7 : 1,
        width: fullWidth ? '100%' : 'auto',
        ...sizeStyles[size],
      }}
      className={className}
    >
      {status === 'loading' ? (
        '登录中...'
      ) : (
        <>
          <span style={{ fontSize: size === 'sm' ? 16 : size === 'lg' ? 22 : 18 }}>
            {mode === 'miniprogram' ? '📱' : '💚'}
          </span>
          {mode === 'miniprogram' ? '微信小程序登录' : '微信登录'}
        </>
      )}
    </button>
  );
}

// ============================================================
// WechatLoginModal - 微信登录弹窗
// ============================================================

export interface WechatLoginModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: (data: any) => void;
  mode?: 'button' | 'qrcode';
}

export function WechatLoginModal({
  open,
  onClose,
  onSuccess,
  mode = 'qrcode',
}: WechatLoginModalProps) {
  if (!open) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0, 0, 0, 0.7)',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: 280,
          borderRadius: 16,
          background: 'rgba(15, 23, 42, 0.95)',
          border: '1px solid rgba(148, 163, 184, 0.15)',
          padding: 24,
          textAlign: 'center',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3
          style={{
            fontSize: 16,
            fontWeight: 600,
            color: '#f8fafc',
            margin: '0 0 16px',
          }}
        >
          微信登录
        </h3>
        <WechatLoginButton mode={mode} onSuccess={onSuccess} />
        <button
          onClick={onClose}
          style={{
            marginTop: 16,
            background: 'none',
            border: 'none',
            color: '#64748b',
            fontSize: 13,
            cursor: 'pointer',
          }}
        >
          取消
        </button>
      </div>
    </div>
  );
}
