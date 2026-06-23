'use client';

import React from 'react';
import { Progress } from './Progress';
import { StatusBadge } from './StatusBadge';

// ---- 类型 ----

/** 密钥态势 */
export interface SecretPosture {
  total: number;
  rotationDue: number;
  expired: number;
}

/** 证书态势 */
export interface CertificatePosture {
  total: number;
  expiringSoon: number;
  expired: number;
}

/** 配置态势面板属性 */
export interface ConfigurationPosturePanelProps {
  /** 密钥态势 */
  secrets: SecretPosture;
  /** 证书态势 */
  certificates: CertificatePosture;
  /** 面板标题 */
  title?: string;
}

// ---- 默认样式 ----

const STYLES: Record<string, React.CSSProperties> = {
  container: {
    display: 'grid',
    gap: 16,
  },
  grid: {
    display: 'grid',
    gap: 14,
    gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
  },
  card: {
    borderRadius: 16,
    padding: 18,
    background: 'rgba(15, 23, 42, 0.38)',
    border: '1px solid rgba(148, 163, 184, 0.18)',
  },
  headerRow: {
    display: 'flex',
    gap: 12,
    alignItems: 'center',
  },
  title: {
    fontSize: 15,
    fontWeight: 700,
    color: '#f8fafc',
    margin: 0,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: 600,
    color: '#94a3b8',
    marginBottom: 12,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.4,
  },
  row: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    fontSize: 13,
    color: '#cbd5f5',
  },
  rowLabel: {
    color: '#94a3b8',
  },
  rowValue: {
    fontFamily: 'monospace',
    fontWeight: 600,
    color: '#e2e8f0',
  },
  progressBar: {
    marginBottom: 14,
    marginTop: 4,
  },
  healthLine: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
    lineHeight: 1.6,
  },
  badgeWrap: {
    display: 'inline-flex',
    marginLeft: 6,
    verticalAlign: 'middle',
  },
};

// ---- 组件 ----

/**
 * ConfigurationPosturePanel — 配置态势面板
 *
 * 聚合展示密钥与证书的健康风险指标，用于 configuration workspace overview 区域。
 * 同时渲染风险占比进度条和标签。
 *
 * @example
 * <ConfigurationPosturePanel
 *   secrets={{ total: 24, rotationDue: 3, expired: 1 }}
 *   certificates={{ total: 12, expiringSoon: 2, expired: 0 }}
 *   title="配置治理态势"
 * />
 */
export function ConfigurationPosturePanel({
  secrets,
  certificates,
  title = '配置治理态势',
}: ConfigurationPosturePanelProps) {
  const secretHealthy = secrets.total - secrets.rotationDue - secrets.expired;
  const certHealthy = certificates.total - certificates.expiringSoon - certificates.expired;

  const secretRiskPct =
    secrets.total > 0
      ? Math.round(((secrets.rotationDue + secrets.expired) / secrets.total) * 100)
      : 0;

  const certRiskPct =
    certificates.total > 0
      ? Math.round(((certificates.expiringSoon + certificates.expired) / certificates.total) * 100)
      : 0;

  const overallStatus: 'success' | 'warning' | 'danger' =
    secrets.expired > 0 || certificates.expired > 0
      ? 'danger'
      : secrets.rotationDue > 0 || certificates.expiringSoon > 0
        ? 'warning'
        : 'success';

  const overallLabel =
    overallStatus === 'danger'
      ? '有风险'
      : overallStatus === 'warning'
        ? '需关注'
        : '健康';

  const progressVariant =
    overallStatus === 'danger' ? 'danger' : overallStatus === 'warning' ? 'warning' : 'success';

  return (
    <div style={STYLES.container}>
      <div style={STYLES.headerRow}>
        <h2 style={STYLES.title}>{title}</h2>
        <StatusBadge label={overallLabel} variant={overallStatus as 'success' | 'warning' | 'danger'} dot size="sm" />
      </div>

      <div style={STYLES.grid}>
        {/* 密钥卡片 */}
        <div style={STYLES.card}>
          <div style={STYLES.sectionTitle}>密钥</div>

          <div style={STYLES.row}>
            <span style={STYLES.rowLabel}>总数</span>
            <span style={STYLES.rowValue}>{secrets.total}</span>
          </div>
          <div style={STYLES.row}>
            <span style={STYLES.rowLabel}>
              正常
            </span>
            <span style={{ ...STYLES.rowValue, color: '#4ade80' }}>{secretHealthy}</span>
          </div>
          <div style={STYLES.row}>
            <span style={STYLES.rowLabel}>
              待轮换
              {secrets.rotationDue > 0 ? <span style={STYLES.badgeWrap}><StatusBadge label={String(secrets.rotationDue)} variant="warning" size="sm" /></span> : null}
            </span>
            <span style={{ ...STYLES.rowValue, color: secrets.rotationDue > 0 ? '#f59e0b' : '#e2e8f0' }}>
              {secrets.rotationDue}
            </span>
          </div>
          <div style={STYLES.row}>
            <span style={STYLES.rowLabel}>
              已过期
              {secrets.expired > 0 ? <span style={STYLES.badgeWrap}><StatusBadge label={String(secrets.expired)} variant="danger" size="sm" /></span> : null}
            </span>
            <span style={{ ...STYLES.rowValue, color: secrets.expired > 0 ? '#ef4444' : '#e2e8f0' }}>
              {secrets.expired}
            </span>
          </div>

          <div style={STYLES.progressBar}>
            <Progress
              value={secrets.total > 0 ? (secretHealthy / secrets.total) * 100 : 100}
              variant={progressVariant}
              height={6}
            />
          </div>

          <div style={STYLES.healthLine}>
            {secretRiskPct > 0
              ? `${secretRiskPct}% 密钥存在轮换或过期风险`
              : '全部密钥处于健康状态'}
          </div>
        </div>

        {/* 证书卡片 */}
        <div style={STYLES.card}>
          <div style={STYLES.sectionTitle}>证书</div>

          <div style={STYLES.row}>
            <span style={STYLES.rowLabel}>总数</span>
            <span style={STYLES.rowValue}>{certificates.total}</span>
          </div>
          <div style={STYLES.row}>
            <span style={STYLES.rowLabel}>
              有效
            </span>
            <span style={{ ...STYLES.rowValue, color: '#4ade80' }}>{certHealthy}</span>
          </div>
          <div style={STYLES.row}>
            <span style={STYLES.rowLabel}>
              即将到期
              {certificates.expiringSoon > 0 ? <span style={STYLES.badgeWrap}><StatusBadge label={String(certificates.expiringSoon)} variant="warning" size="sm" /></span> : null}
            </span>
            <span style={{ ...STYLES.rowValue, color: certificates.expiringSoon > 0 ? '#f59e0b' : '#e2e8f0' }}>
              {certificates.expiringSoon}
            </span>
          </div>
          <div style={STYLES.row}>
            <span style={STYLES.rowLabel}>
              已过期
              {certificates.expired > 0 ? <span style={STYLES.badgeWrap}><StatusBadge label={String(certificates.expired)} variant="danger" size="sm" /></span> : null}
            </span>
            <span style={{ ...STYLES.rowValue, color: certificates.expired > 0 ? '#ef4444' : '#e2e8f0' }}>
              {certificates.expired}
            </span>
          </div>

          <div style={STYLES.progressBar}>
            <Progress
              value={certificates.total > 0 ? (certHealthy / certificates.total) * 100 : 100}
              variant={progressVariant}
              height={6}
            />
          </div>

          <div style={STYLES.healthLine}>
            {certRiskPct > 0
              ? `${certRiskPct}% 证书存在到期或即将到期风险`
              : '全部证书处于有效状态'}
          </div>
        </div>
      </div>
    </div>
  );
}
