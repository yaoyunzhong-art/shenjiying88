// @ts-nocheck
'use client'

/**
 * settings/workflow/page.tsx — 工作流配置
 *
 * 审批工作流与自动化流程配置
 * 模块: 流程定义 | 节点管理 | 审批策略
 * 三态: loading / empty / error
 */

import React, { useEffect, useState } from 'react';

const FLOW_CONFIGS = [
  { key: '当前版本', value: 'v1' },
  { key: '流程状态', value: '已发布' },
  { key: '审批策略', value: '任意一人通过（any）' },
  { key: '条件分支', value: '金额 > ¥10,000 → 高级审批' },
  { key: '驳回处理', value: '驳回即终止流程' },
];

const NODE_TYPES = [
  { icon: '🟢', name: '开始', desc: '流程起点，每个工作流有且仅有一个' },
  { icon: '🔴', name: '结束', desc: '流程终点，可能包含驳回结束' },
  { icon: '👤', name: '审批', desc: '指定审批人，支持 any/all 策略' },
  { icon: '🔀', name: '条件', desc: '条件判断分支，根据表达式路由' },
  { icon: '⚡', name: '动作', desc: '自动化执行节点，触发系统操作' },
  { icon: '⏳', name: '等待', desc: '定时等待节点，超时自动推进' },
];

const styles: Record<string, React.CSSProperties> = {
  page: { padding: 32, maxWidth: 960, margin: '0 auto' },
  title: { fontSize: 22, fontWeight: 700, color: '#f1f5f9', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#64748b', marginBottom: 28 },
  section: { background: 'rgba(30, 41, 59, 0.8)', borderRadius: 12, border: '1px solid rgba(148, 163, 184, 0.1)', padding: 24, marginBottom: 20 },
  sectionTitle: { fontSize: 15, fontWeight: 600, color: '#e2e8f0', marginBottom: 12 },
  sectionText: { fontSize: 13, color: '#94a3b8', lineHeight: 1.6, marginBottom: 16 },
  flowDiagram: { display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' as const, padding: 16, background: 'rgba(15, 23, 42, 0.4)', borderRadius: 10, marginBottom: 16 },
  flowNode: (isSpecial: boolean) => ({ padding: '8px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600, color: isSpecial ? '#3b82f6' : '#cbd5e1', background: isSpecial ? 'rgba(59, 130, 246, 0.1)' : 'rgba(30, 41, 59, 0.6)', border: `1px solid ${isSpecial ? 'rgba(59, 130, 246, 0.2)' : 'rgba(148, 163, 184, 0.08)'}` }),
  flowArrow: { fontSize: 16, color: '#475569' },
  configList: { display: 'flex', flexDirection: 'column' as const, gap: 4 },
  configItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid rgba(148, 163, 184, 0.06)' },
  configKey: { fontSize: 13, color: '#94a3b8' },
  configValue: { fontSize: 13, color: '#e2e8f0', fontWeight: 500 },
  nodeGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginTop: 12 },
  nodeCard: { padding: 16, background: 'rgba(15, 23, 42, 0.4)', borderRadius: 10, border: '1px solid rgba(148, 163, 184, 0.08)' },
  nodeIcon: { fontSize: 20, marginBottom: 6 },
  nodeName: { fontSize: 14, fontWeight: 600, color: '#e2e8f0', marginBottom: 4 },
  nodeDesc: { fontSize: 12, color: '#64748b', lineHeight: 1.5 },
  empty: { textAlign: 'center' as const, padding: '48px 24px', color: '#94a3b8' },
  error: { textAlign: 'center' as const, padding: '48px 24px', color: '#ef4444' },
  loading: { textAlign: 'center' as const, padding: '80px 24px', color: '#94a3b8' },
};

export default function WorkflowPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    queueMicrotask(() => setLoading(false));
  }, []);

  if (loading) {
    return <div style={{ ...styles.page, ...styles.loading }}><div style={{ fontSize: 14 }}>加载中...</div></div>;
  }

  if (error) {
    return <div style={{ ...styles.page, ...styles.error }}><div style={{ fontSize: 14 }}>错误: {error}</div></div>;
  }

  return (
    <div style={styles.page}>
      <h1 style={styles.title}>🔄 工作流配置</h1>
      <p style={styles.subtitle}>审批工作流与自动化流程配置。支持多节点流程编排、条件分支、多人审批策略与驳回处理。</p>

      {/* 示例工作流 */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>📋 示例流程：采购审批</h2>
        <p style={styles.sectionText}>一个典型的采购审批工作流，按金额大小自动路由到不同审批人。</p>
        <div style={styles.flowDiagram}>
          <span style={styles.flowNode(true)}>🟢 开始</span>
          <span style={styles.flowArrow}>→</span>
          <span style={styles.flowNode(false)}>经理审批</span>
          <span style={styles.flowArrow}>→</span>
          <span style={styles.flowNode(false)}>金额判断</span>
          <span style={styles.flowArrow}>→</span>
          <span style={styles.flowNode(false)}>执行处理</span>
          <span style={styles.flowArrow}>→</span>
          <span style={styles.flowNode(true)}>🔴 结束</span>
          <span style={{ color: '#475569', fontSize: 12, marginLeft: 8 }}>| 驳回 → 结束</span>
        </div>

        <div style={styles.configList}>
          {FLOW_CONFIGS.map(c => (
            <div key={c.key} style={styles.configItem}><span style={styles.configKey}>{c.key}</span><span style={styles.configValue}>{c.value}</span></div>
          ))}
        </div>
      </div>

      {/* 节点类型 */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>🏗️ 节点类型</h2>
        <p style={styles.sectionText}>工作流支持以下节点类型，灵活组合实现复杂审批流程。</p>
        <div style={styles.nodeGrid}>
          {NODE_TYPES.map(nt => (
            <div key={nt.name} style={styles.nodeCard}>
              <div style={styles.nodeIcon}>{nt.icon}</div>
              <div style={styles.nodeName}>{nt.name}</div>
              <div style={styles.nodeDesc}>{nt.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
