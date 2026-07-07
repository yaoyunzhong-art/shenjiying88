'use client';

import React from 'react';

export type ResultStatus = 'success' | 'error' | 'info' | 'warning' | '403' | '404' | '500';

export interface ResultProps {
  status?: ResultStatus;
  title?: string;
  subTitle?: string;
  icon?: React.ReactNode;
  extra?: React.ReactNode;
  children?: React.ReactNode;
}

const STATUS_ICONS: Record<ResultStatus, string> = {
  success: '✅',
  error: '❌',
  info: 'ℹ️',
  warning: '⚠️',
  '403': '🔒',
  '404': '🔍',
  '500': '💥',
};

const STATUS_TITLES: Record<ResultStatus, string> = {
  success: '操作成功',
  error: '操作失败',
  info: '提示信息',
  warning: '警告',
  '403': '403 — 无权限访问',
  '404': '404 — 页面未找到',
  '500': '500 — 服务器错误',
};

const STATUS_SUBTITLES: Record<ResultStatus, string> = {
  success: '请等待系统处理完成',
  error: '请稍后重试或联系管理员',
  info: '',
  warning: '请确认操作是否正确',
  '403': '您没有权限访问此页面，请联系管理员',
  '404': '您访问的页面不存在或已被移除',
  '500': '服务器遇到错误，请稍后重试',
};

export function Result({
  status = 'info',
  title,
  subTitle,
  icon,
  extra,
  children,
}: ResultProps) {
  const resolvedTitle = title ?? STATUS_TITLES[status];
  const resolvedSubTitle = subTitle ?? STATUS_SUBTITLES[status];
  const resolvedIcon = icon ?? (
    <span style={{ fontSize: 48, lineHeight: 1 }}>{STATUS_ICONS[status]}</span>
  );

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 48,
        textAlign: 'center',
      }}
    >
      <div style={{ marginBottom: 20 }}>{resolvedIcon}</div>
      <h3
        style={{
          fontSize: 20,
          fontWeight: 600,
          color: '#1e293b',
          margin: 0,
          marginBottom: resolvedSubTitle ? 8 : 0,
        }}
      >
        {resolvedTitle}
      </h3>
      {resolvedSubTitle && (
        <p
          style={{
            fontSize: 14,
            color: '#64748b',
            margin: 0,
            marginBottom: extra || children ? 24 : 0,
            maxWidth: 400,
            lineHeight: 1.6,
          }}
        >
          {resolvedSubTitle}
        </p>
      )}
      {extra && <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>{extra}</div>}
      {children && <div style={{ marginTop: 24, width: '100%' }}>{children}</div>}
    </div>
  );
}
