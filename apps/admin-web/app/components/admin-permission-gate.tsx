'use client';

import Link from 'next/link';
import { useEffect, useState, type ReactNode } from 'react';
import {
  getCachedAdminUser,
  hasAdminPermission,
  type AdminSessionUser,
} from '../lib/admin-session';

interface AdminPermissionGateProps {
  requiredPermission: string;
  title: string;
  description: string;
  children: ReactNode;
}

export function AdminPermissionGate({
  requiredPermission,
  title,
  description,
  children,
}: AdminPermissionGateProps) {
  const [currentUser, setCurrentUser] = useState<AdminSessionUser | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setCurrentUser(getCachedAdminUser());
    setReady(true);
  }, []);

  if (!ready) {
    return (
      <section
        style={{
          marginTop: 20,
          borderRadius: 18,
          padding: 20,
          background: 'rgba(15, 23, 42, 0.35)',
          border: '1px solid rgba(148, 163, 184, 0.18)',
          color: '#cbd5e1',
        }}
      >
        正在校验管理员会话...
      </section>
    );
  }

  if (!currentUser) {
    return (
      <section
        style={{
          marginTop: 20,
          borderRadius: 18,
          padding: 20,
          background: 'rgba(15, 23, 42, 0.35)',
          border: '1px solid rgba(248, 113, 113, 0.3)',
          color: '#f8fafc',
        }}
      >
        <div style={{ fontSize: 18, fontWeight: 700 }}>{title}</div>
        <div style={{ marginTop: 8, color: '#cbd5e1', lineHeight: 1.7 }}>
          {description}
        </div>
        <div style={{ marginTop: 10, color: '#fca5a5', fontSize: 14 }}>
          未检测到管理员本地会话，请先登录后再访问。
        </div>
        <Link
          href="/login"
          style={{ marginTop: 12, display: 'inline-block', color: '#93c5fd' }}
        >
          前往管理员登录
        </Link>
      </section>
    );
  }

  if (!hasAdminPermission(currentUser, requiredPermission)) {
    return (
      <section
        style={{
          marginTop: 20,
          borderRadius: 18,
          padding: 20,
          background: 'rgba(15, 23, 42, 0.35)',
          border: '1px solid rgba(245, 158, 11, 0.35)',
          color: '#f8fafc',
        }}
      >
        <div style={{ fontSize: 18, fontWeight: 700 }}>{title}</div>
        <div style={{ marginTop: 8, color: '#cbd5e1', lineHeight: 1.7 }}>
          {description}
        </div>
        <div style={{ marginTop: 10, color: '#fbbf24', fontSize: 14 }}>
          当前账号缺少 `{requiredPermission}` 权限，角色 `{currentUser.role}` 暂不可访问。
        </div>
        <Link
          href="/dashboard"
          style={{ marginTop: 12, display: 'inline-block', color: '#93c5fd' }}
        >
          返回管理员首页
        </Link>
      </section>
    );
  }

  return <>{children}</>;
}
