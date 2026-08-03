"use client"

import type * as React from 'react'
import { useEffect, useState } from 'react'
import SnapshotRefreshButton from '../../components/snapshot-refresh-button'
import type {
  WorkflowConfigItem,
  WorkflowNodeType,
  WorkflowSnapshotDelivery,
} from './workflow-data'
import { useSnapshotRefresh } from '../../components/use-snapshot-refresh'

export default function WorkflowClient({
  snapshot,
}: {
  snapshot: WorkflowSnapshotDelivery
}) {
  const [configs, setConfigs] = useState<WorkflowConfigItem[]>(snapshot.configs)
  const [nodeTypes, setNodeTypes] = useState<WorkflowNodeType[]>(snapshot.nodeTypes)
  const { isRefreshing, handleRefresh } = useSnapshotRefresh();

  useEffect(() => {
    setConfigs(snapshot.configs)
    setNodeTypes(snapshot.nodeTypes)
  }, [snapshot.configs, snapshot.nodeTypes])

  return (
    <main style={pageStyle}>
      <section style={heroStyle}>
        <div>
          <h1 style={titleStyle}>工作流配置</h1>
          <p style={subtitleStyle}>
            首屏由服务端装配 workflow snapshot，客户端保留节点展示、治理备注与刷新入口。
          </p>
          <div style={metaStyle}>
            Delivery {snapshot.deliveryMode} · source {snapshot.sourceLabel} · generatedAt{' '}
            {snapshot.generatedAt}
          </div>
        </div>
        <SnapshotRefreshButton
  onRefresh={handleRefresh}
  isRefreshing={isRefreshing}
  variant="light"
  idleLabel="刷新快照"
  loadingLabel="刷新中..."
/>
      </section>

      {snapshot.error ? <section style={warningStyle}>{snapshot.error}</section> : null}

      <section style={statGridStyle}>
        <StatCard label="已发布流程" value={String(snapshot.stats.publishedFlows)} detail="当前样本中的流程数" />
        <StatCard label="节点类型" value={String(snapshot.stats.nodeTypeCount)} detail="开始 / 审批 / 条件 / 动作等" />
        <StatCard label="审批策略" value={String(snapshot.stats.approvalPolicies)} detail="any / all 两类策略" />
      </section>

      <section style={panelStyle}>
        <div style={sectionTitleStyle}>示例流程: 采购审批</div>
        <div style={flowStyle}>
          <FlowNode label="开始" accent />
          <Arrow />
          <FlowNode label="经理审批" />
          <Arrow />
          <FlowNode label="金额判断" />
          <Arrow />
          <FlowNode label="执行处理" />
          <Arrow />
          <FlowNode label="结束" accent />
          <span style={branchHintStyle}>驳回 -&gt; 结束</span>
        </div>
        <div style={configListStyle}>
          {configs.map((item) => (
            <div key={item.key} style={configItemStyle}>
              <span style={configKeyStyle}>{item.key}</span>
              <span style={configValueStyle}>{item.value}</span>
            </div>
          ))}
        </div>
      </section>

      <section style={panelStyle}>
        <div style={sectionTitleStyle}>节点类型</div>
        <div style={nodeGridStyle}>
          {nodeTypes.map((item) => (
            <article key={item.name} style={nodeCardStyle}>
              <div style={nodeIconStyle}>{item.icon}</div>
              <div style={nodeTitleStyle}>{item.name}</div>
              <div style={nodeTextStyle}>{item.description}</div>
              <div style={item.automatable ? automationBadgeStyle : manualBadgeStyle}>
                {item.automatable ? '可自动推进' : '人工确认'}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section style={panelStyle}>
        <div style={sectionTitleStyle}>治理备注</div>
        <div style={noteListStyle}>
          {snapshot.governanceNotes.map((note) => (
            <div key={note} style={noteItemStyle}>
              {note}
            </div>
          ))}
        </div>
      </section>
    </main>
  )
}

function StatCard({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <article style={statCardStyle}>
      <div style={statLabelStyle}>{label}</div>
      <div style={statValueStyle}>{value}</div>
      <div style={statDetailStyle}>{detail}</div>
    </article>
  )
}

function FlowNode({ label, accent = false }: { label: string; accent?: boolean }) {
  return <span style={accent ? flowAccentNodeStyle : flowNodeStyle}>{label}</span>
}

function Arrow() {
  return <span style={arrowStyle}>-&gt;</span>
}

const pageStyle: React.CSSProperties = { display: 'grid', gap: 18 }
const heroStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  flexWrap: 'wrap',
  gap: 16,
}
const titleStyle: React.CSSProperties = { margin: 0, fontSize: 28, fontWeight: 700, color: '#0f172a' }
const subtitleStyle: React.CSSProperties = {
  margin: '8px 0 6px',
  fontSize: 14,
  lineHeight: 1.6,
  color: '#475569',
}
const metaStyle: React.CSSProperties = { fontSize: 12, color: '#64748b' }
const warningStyle: React.CSSProperties = {
  padding: '12px 14px',
  borderRadius: 12,
  border: '1px solid rgba(245, 158, 11, 0.3)',
  background: 'rgba(255, 247, 237, 0.9)',
  color: '#9a3412',
  fontSize: 13,
}
const statGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
  gap: 12,
}
const statCardStyle: React.CSSProperties = {
  borderRadius: 14,
  border: '1px solid rgba(148, 163, 184, 0.24)',
  background: '#fff',
  padding: 16,
}
const statLabelStyle: React.CSSProperties = { fontSize: 12, color: '#64748b' }
const statValueStyle: React.CSSProperties = { marginTop: 8, fontSize: 24, fontWeight: 700, color: '#0f172a' }
const statDetailStyle: React.CSSProperties = { marginTop: 6, fontSize: 12, color: '#475569' }
const panelStyle: React.CSSProperties = {
  borderRadius: 14,
  border: '1px solid rgba(148, 163, 184, 0.24)',
  background: '#fff',
  padding: 18,
}
const sectionTitleStyle: React.CSSProperties = { marginBottom: 14, fontSize: 16, fontWeight: 700, color: '#0f172a' }
const flowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  flexWrap: 'wrap',
  padding: 14,
  borderRadius: 12,
  background: 'rgba(248, 250, 252, 0.95)',
}
const flowNodeStyle: React.CSSProperties = {
  padding: '8px 12px',
  borderRadius: 10,
  background: '#e2e8f0',
  color: '#0f172a',
  fontSize: 13,
  fontWeight: 600,
}
const flowAccentNodeStyle: React.CSSProperties = {
  ...flowNodeStyle,
  background: 'rgba(59, 130, 246, 0.12)',
  color: '#1d4ed8',
}
const arrowStyle: React.CSSProperties = { color: '#64748b', fontSize: 14 }
const branchHintStyle: React.CSSProperties = { fontSize: 12, color: '#64748b' }
const configListStyle: React.CSSProperties = { display: 'grid', gap: 8, marginTop: 16 }
const configItemStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: 12,
  padding: '10px 12px',
  borderBottom: '1px solid rgba(226, 232, 240, 0.8)',
}
const configKeyStyle: React.CSSProperties = { fontSize: 13, color: '#64748b' }
const configValueStyle: React.CSSProperties = { fontSize: 13, color: '#0f172a', fontWeight: 600 }
const nodeGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
  gap: 12,
}
const nodeCardStyle: React.CSSProperties = {
  borderRadius: 12,
  border: '1px solid rgba(226, 232, 240, 0.9)',
  background: 'rgba(248, 250, 252, 0.95)',
  padding: 14,
}
const nodeIconStyle: React.CSSProperties = { fontSize: 12, color: '#1d4ed8', fontWeight: 700 }
const nodeTitleStyle: React.CSSProperties = { marginTop: 8, fontSize: 15, fontWeight: 700, color: '#0f172a' }
const nodeTextStyle: React.CSSProperties = { marginTop: 6, fontSize: 13, lineHeight: 1.6, color: '#475569' }
const automationBadgeStyle: React.CSSProperties = {
  marginTop: 10,
  display: 'inline-flex',
  padding: '4px 8px',
  borderRadius: 999,
  background: 'rgba(16, 185, 129, 0.14)',
  color: '#047857',
  fontSize: 12,
  fontWeight: 600,
}
const manualBadgeStyle: React.CSSProperties = {
  ...automationBadgeStyle,
  background: 'rgba(148, 163, 184, 0.18)',
  color: '#475569',
}
const noteListStyle: React.CSSProperties = { display: 'grid', gap: 10 }
const noteItemStyle: React.CSSProperties = {
  padding: '10px 12px',
  borderLeft: '3px solid #3b82f6',
  borderRadius: 10,
  background: 'rgba(248, 250, 252, 0.95)',
  color: '#334155',
  fontSize: 13,
  lineHeight: 1.6,
}
