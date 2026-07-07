/**
 * audit-logs/[id]/page.tsx — 审计日志详情页 (ToB 安全审计)
 * 角色视角: 👔 安全审计员 / 超级管理员
 * 功能: 审计日志详情查看、操作追溯
 */
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { StatusBadge, Badge, DescriptionList } from '@m5/ui';
import type { DescriptionItem } from '@m5/ui';
import {
  MOCK_AUDIT_LOGS,
  STATUS_LABELS,
  STATUS_VARIANTS,
  SEVERITY_LABELS,
  SEVERITY_COLORS,
  CATEGORY_LABELS,
  type AuditLog,
} from '../audit-logs-data';

function getLogById(id: string): AuditLog | undefined {
  return MOCK_AUDIT_LOGS.find((log) => log.id === id);
}

export default function AuditLogDetailPage() {
  const params = useParams();
  const logId = params.id as string;
  const [log] = useState<AuditLog | null>(() => getLogById(logId) ?? null);

  if (!log) {
    return (
      <div style={{ padding: 48, textAlign: 'center', color: '#94a3b8' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>📋</div>
        <div style={{ fontSize: 16, marginBottom: 16 }}>日志不存在</div>
        <Link
          href="/audit-logs"
          style={{
            padding: '10px 20px',
            borderRadius: 8,
            background: 'rgba(102, 126, 234, 0.2)',
            color: '#a5b4fc',
            textDecoration: 'none',
            fontSize: 14,
          }}
        >
          返回日志列表
        </Link>
      </div>
    );
  }

  const severityColor = SEVERITY_COLORS[log.severity];

  const basicInfoItems: DescriptionItem[] = [
    { label: '日志编号', value: <code style={{ color: '#60a5fa' }}>{log.logCode}</code> },
    { label: '操作名称', value: log.action },
    { label: '操作类别', value: <Badge variant="neutral">{CATEGORY_LABELS[log.category]}</Badge> },
    { label: '严重级别', value: (
      <span
        style={{
          fontSize: 12,
          padding: '2px 8px',
          borderRadius: 4,
          background: `${severityColor}20`,
          color: severityColor,
        }}
      >
        {SEVERITY_LABELS[log.severity]}
      </span>
    )},
    { label: '执行状态', value: (
      <StatusBadge
        variant={STATUS_VARIANTS[log.status]}
        label={STATUS_LABELS[log.status]}
      />
    )},
    { label: '操作时间', value: new Date(log.timestamp).toLocaleString('zh-CN') },
  ];

  const actorInfoItems: DescriptionItem[] = [
    { label: '用户ID', value: <code style={{ color: '#94a3b8' }}>{log.actor.userId}</code> },
    { label: '用户名称', value: log.actor.userName },
    { label: '用户角色', value: log.actor.role },
    { label: 'IP地址', value: <code style={{ color: '#94a3b8' }}>{log.actor.ip}</code> },
    { label: 'UserAgent', value: (
      <span style={{ fontSize: 12, color: '#64748b', wordBreak: 'break-all' }}>
        {log.actor.userAgent || '-'}
      </span>
    )},
  ];

  const requestInfoItems: DescriptionItem[] = log.request ? [
    { label: '请求方法', value: (
      <Badge variant="neutral" style={{ fontFamily: 'monospace' }}>
        {log.request.method}
      </Badge>
    )},
    { label: '请求路径', value: <code style={{ color: '#94a3b8', fontSize: 13 }}>{log.request.path}</code> },
  ] : [];

  const responseInfoItems: DescriptionItem[] = log.response ? [
    { label: '响应码', value: (
      <span
        style={{
          color: log.response.code >= 400 ? '#ef4444' : '#4ade80',
          fontWeight: 600,
        }}
      >
        {log.response.code}
      </span>
    )},
    { label: '响应消息', value: log.response.message || '-' },
    { label: '响应耗时', value: (
      <span style={{ color: log.response.duration > 1000 ? '#f97316' : '#94a3b8' }}>
        {log.response.duration}ms
      </span>
    )},
  ] : [];

  return (
    <div style={{ padding: '24px 32px', color: '#e2e8f0' }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <Link
          href="/audit-logs"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            color: '#94a3b8',
            textDecoration: 'none',
            fontSize: 14,
            marginBottom: 16,
          }}
        >
          ← 返回日志列表
        </Link>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>{log.action}</h1>
          <StatusBadge
            variant={STATUS_VARIANTS[log.status]}
            label={STATUS_LABELS[log.status]}
          />
        </div>
        <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
          <code style={{ fontSize: 13, color: '#60a5fa' }}>{log.logCode}</code>
          <span style={{ color: '#64748b' }}>·</span>
          <span style={{ fontSize: 13, color: '#64748b' }}>
            {new Date(log.timestamp).toLocaleString('zh-CN')}
          </span>
        </div>
      </div>

      {/* Message */}
      <div
        style={{
          borderRadius: 12,
          padding: 16,
          background: 'rgba(30, 41, 59, 0.6)',
          border: '1px solid rgba(148, 163, 184, 0.12)',
          marginBottom: 24,
        }}
      >
        <div style={{ fontSize: 14, color: '#e2e8f0' }}>{log.message}</div>
      </div>

      {/* Basic Info */}
      <div
        style={{
          borderRadius: 12,
          background: 'rgba(15, 23, 42, 0.5)',
          border: '1px solid rgba(148, 163, 184, 0.12)',
          padding: 24,
          marginBottom: 24,
        }}
      >
        <h2 style={{ fontSize: 16, fontWeight: 600, color: '#f8fafc', margin: '0 0 20px' }}>
          基本信息
        </h2>
        <DescriptionList items={basicInfoItems} columns={3} />
      </div>

      {/* Actor Info */}
      <div
        style={{
          borderRadius: 12,
          background: 'rgba(15, 23, 42, 0.5)',
          border: '1px solid rgba(148, 163, 184, 0.12)',
          padding: 24,
          marginBottom: 24,
        }}
      >
        <h2 style={{ fontSize: 16, fontWeight: 600, color: '#f8fafc', margin: '0 0 20px' }}>
          操作人信息
        </h2>
        <DescriptionList items={actorInfoItems} columns={3} />
      </div>

      {/* Tenant/Store Info */}
      {(log.tenant || log.store) && (
        <div
          style={{
            borderRadius: 12,
            background: 'rgba(15, 23, 42, 0.5)',
            border: '1px solid rgba(148, 163, 184, 0.12)',
            padding: 24,
            marginBottom: 24,
          }}
        >
          <h2 style={{ fontSize: 16, fontWeight: 600, color: '#f8fafc', margin: '0 0 20px' }}>
            关联信息
          </h2>
          <DescriptionList
            items={[
              log.tenant && { label: '所属租户', value: log.tenant.tenantName },
              log.store && { label: '所属门店', value: log.store.storeName },
            ].filter(Boolean) as DescriptionItem[]}
            columns={2}
          />
        </div>
      )}

      {/* Request Info */}
      {requestInfoItems.length > 0 && (
        <div
          style={{
            borderRadius: 12,
            background: 'rgba(15, 23, 42, 0.5)',
            border: '1px solid rgba(148, 163, 184, 0.12)',
            padding: 24,
            marginBottom: 24,
          }}
        >
          <h2 style={{ fontSize: 16, fontWeight: 600, color: '#f8fafc', margin: '0 0 20px' }}>
            请求信息
          </h2>
          <DescriptionList items={requestInfoItems} columns={2} />
          {log.request?.body && (
            <div style={{ marginTop: 16 }}>
              <div style={{ fontSize: 13, color: '#94a3b8', marginBottom: 8 }}>请求体</div>
              <pre
                style={{
                  background: 'rgba(15, 23, 42, 0.8)',
                  padding: 12,
                  borderRadius: 8,
                  fontSize: 12,
                  color: '#e2e8f0',
                  overflow: 'auto',
                }}
              >
                {JSON.stringify(log.request.body, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}

      {/* Response Info */}
      {responseInfoItems.length > 0 && (
        <div
          style={{
            borderRadius: 12,
            background: 'rgba(15, 23, 42, 0.5)',
            border: '1px solid rgba(148, 163, 184, 0.12)',
            padding: 24,
            marginBottom: 24,
          }}
        >
          <h2 style={{ fontSize: 16, fontWeight: 600, color: '#f8fafc', margin: '0 0 20px' }}>
            响应信息
          </h2>
          <DescriptionList items={responseInfoItems} columns={3} />
        </div>
      )}

      {/* Changes */}
      {log.changes && log.changes.length > 0 && (
        <div
          style={{
            borderRadius: 12,
            background: 'rgba(15, 23, 42, 0.5)',
            border: '1px solid rgba(148, 163, 184, 0.12)',
            padding: 24,
          }}
        >
          <h2 style={{ fontSize: 16, fontWeight: 600, color: '#f8fafc', margin: '0 0 20px' }}>
            变更内容
          </h2>
          <div style={{ display: 'grid', gap: 12 }}>
            {log.changes.map((change, index) => (
              <div
                key={index}
                style={{
                  padding: 12,
                  borderRadius: 8,
                  background: 'rgba(30, 41, 59, 0.6)',
                  border: '1px solid rgba(148, 163, 184, 0.08)',
                }}
              >
                <div style={{ fontSize: 13, color: '#94a3b8', marginBottom: 8 }}>
                  字段: <code style={{ color: '#60a5fa' }}>{change.field}</code>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 12, alignItems: 'center' }}>
                  <div
                    style={{
                      padding: '8px 12px',
                      borderRadius: 6,
                      background: 'rgba(239, 68, 68, 0.1)',
                      border: '1px solid rgba(239, 68, 68, 0.2)',
                      fontSize: 13,
                      color: '#fca5a5',
                    }}
                  >
                    {String(change.oldValue ?? '(空)')}
                  </div>
                  <span style={{ color: '#64748b', fontSize: 12 }}>→</span>
                  <div
                    style={{
                      padding: '8px 12px',
                      borderRadius: 6,
                      background: 'rgba(74, 222, 128, 0.1)',
                      border: '1px solid rgba(74, 222, 128, 0.2)',
                      fontSize: 13,
                      color: '#86efac',
                    }}
                  >
                    {String(change.newValue ?? '(空)')}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
