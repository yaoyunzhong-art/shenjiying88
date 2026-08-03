import { loadAdminGovernanceReadModel, type AdminGovernanceReadModel } from '../../bootstrap'

export interface AlertDetailSnapshot {
  deliveryMode: 'api' | 'fallback'
  sourceLabel: 'alert-detail-governance'
  alertId: string
  generatedAt: string
  controlPlaneSource: string
  businessDataSource: string
  refreshPath: string
  note: string
  governance: AdminGovernanceReadModel | null
}

export async function loadAlertDetailSnapshot(alertId: string): Promise<AlertDetailSnapshot> {
  try {
    const governance = await loadAdminGovernanceReadModel()
    return {
      deliveryMode: governance.deliveryMode,
      sourceLabel: 'alert-detail-governance',
      alertId,
      generatedAt: governance.generatedAt ?? new Date().toISOString(),
      controlPlaneSource: 'loadAdminGovernanceReadModel / snapshot.governance',
      businessDataSource: 'Admin governance alert snapshot routed through detail-presenter fallback',
      refreshPath: `loadAlertDetailSnapshot(${alertId})`,
      note:
        governance.deliveryMode === 'api'
          ? '告警详情当前直接消费治理读模型快照，drilldown 不可达时由 detail-presenter 自动降级。'
          : '告警详情当前回退到 fallback governance snapshot，保持只读可见与来源态透明化。',
      governance,
    }
  } catch {
    return {
      deliveryMode: 'fallback',
      sourceLabel: 'alert-detail-governance',
      alertId,
      generatedAt: new Date().toISOString(),
      controlPlaneSource: 'loadAdminGovernanceReadModel failed -> fallback snapshot shell',
      businessDataSource: 'no governance snapshot available',
      refreshPath: `loadAlertDetailSnapshot(${alertId})`,
      note: '治理读模型暂不可达，当前仅保留 E54 壳层与告警详情降级提示。',
      governance: null,
    }
  }
}
