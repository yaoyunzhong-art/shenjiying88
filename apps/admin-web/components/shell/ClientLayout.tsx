'use client';

/**
 * 🎨 ClientLayout — 客户端全局 Shell 包裹器
 * 分离 client/server 边界，确保 AdminShell 可访问 hooks
 */
import React from 'react';
import AdminShell from './AdminShell';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return <AdminShell>{children}</AdminShell>;
}
