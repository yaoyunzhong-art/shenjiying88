// @ts-nocheck
'use client'

/**
 * settings/system-config/page.tsx — 系统配置
 *
 * 全局系统参数与运行配置
 * 模块: 基础设置 | 品牌信息 | 运行参数
 */

import React, { useState, useEffect } from 'react';
import { AdminPermissionGate } from '../../components/admin-permission-gate';

const styles: Record<string, React.CSSProperties> = {
  page: { padding: 32, maxWidth: 960, margin: '0 auto' },
  title: { fontSize: 22, fontWeight: 700, color: '#f1f5f9', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#64748b', marginBottom: 28 },
  section: { background: 'rgba(30, 41, 59, 0.8)', borderRadius: 12, border: '1px solid rgba(148, 163, 184, 0.1)', padding: 24, marginBottom: 20 },
  sectionTitle: { fontSize: 15, fontWeight: 600, color: '#e2e8f0', marginBottom: 12 },
  sectionText: { fontSize: 13, color: '#94a3b8', lineHeight: 1.6, marginBottom: 16 },
  configList: { display: 'flex', flexDirection: 'column' as const, gap: 4 },
  configItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid rgba(148, 163, 184, 0.06)' },
  configKey: { fontSize: 13, color: '#94a3b8' },
  configValue: { fontSize: 13, color: '#e2e8f0', fontWeight: 500 },
};

const permissionGate = {
  requiredPermission: 'foundation.governance.read',
  title: '系统配置访问受限',
  description:
    '系统配置页已接入管理员本地 session，只有具备 foundation.governance.read 的账号才能查看品牌信息、运行参数与会话配置。',
} as const;

export default function SystemConfigPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<boolean>(false);

  useEffect(() => {
    try {
      setData(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : '数据加载失败');
    } finally {
      setLoading(false);
    }
  }, []);

  if (loading) return <AdminPermissionGate {...permissionGate}><div style={styles.page}><div style={{ color: '#94a3b8', textAlign: 'center', padding: 64 }}>加载中...</div></div></AdminPermissionGate>;
  if (error) return <AdminPermissionGate {...permissionGate}><div style={styles.page}><div style={{ color: '#ef4444', textAlign: 'center', padding: 64 }}>数据获取失败: {error}</div></div></AdminPermissionGate>;
  if (!data) return <AdminPermissionGate {...permissionGate}><div style={styles.page}><div style={{ color: '#94a3b8', textAlign: 'center', padding: 64 }}>暂无数据</div></div></AdminPermissionGate>;

  return (
    <AdminPermissionGate {...permissionGate}>
      <div style={styles.page}>
        <h1 style={styles.title}>⚙️ 系统配置</h1>
        <p style={styles.subtitle}>全局系统参数与运行配置。管理平台基础信息、品牌设置、运行参数与环境配置。</p>

        {/* 品牌信息 */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>🏷️ 品牌信息</h2>
          <div style={styles.configList}>
            <div style={styles.configItem}><span style={styles.configKey}>平台名称</span><span style={styles.configValue}>神机营体育</span></div>
            <div style={styles.configItem}><span style={styles.configKey}>平台简称</span><span style={styles.configValue}>ShenJiYing</span></div>
            <div style={styles.configItem}><span style={styles.configKey}>官方域名</span><span style={styles.configValue}>shenjiying.com</span></div>
            <div style={styles.configItem}><span style={styles.configKey}>客服邮箱</span><span style={styles.configValue}>support@shenjiying.com</span></div>
            <div style={styles.configItem}><span style={styles.configKey}>客服电话</span><span style={styles.configValue}>400-888-0000</span></div>
            <div style={styles.configItem}><span style={styles.configKey}>ICP 备案号</span><span style={styles.configValue}>京ICP备XXXXXXXX号</span></div>
          </div>
        </div>

        {/* 运行参数 */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>🔧 运行参数</h2>
          <div style={styles.configList}>
            <div style={styles.configItem}><span style={styles.configKey}>系统语言</span><span style={styles.configValue}>简体中文（zh-CN）</span></div>
            <div style={styles.configItem}><span style={styles.configKey}>时区</span><span style={styles.configValue}>Asia/Shanghai (UTC+8)</span></div>
            <div style={styles.configItem}><span style={styles.configKey}>货币单位</span><span style={styles.configValue}>人民币（CNY）</span></div>
            <div style={styles.configItem}><span style={styles.configKey}>日期格式</span><span style={styles.configValue}>YYYY-MM-DD</span></div>
            <div style={styles.configItem}><span style={styles.configKey}>时间格式</span><span style={styles.configValue}>HH:mm:ss (24小时制)</span></div>
            <div style={styles.configItem}><span style={styles.configKey}>小数精度</span><span style={styles.configValue}>2 位（分）</span></div>
            <div style={styles.configItem}><span style={styles.configKey}>会话超时</span><span style={styles.configValue}>30 分钟</span></div>
            <div style={styles.configItem}><span style={styles.configKey}>最大并发用户</span><span style={styles.configValue}>1000</span></div>
          </div>
        </div>
      </div>
    </AdminPermissionGate>
  )
}
