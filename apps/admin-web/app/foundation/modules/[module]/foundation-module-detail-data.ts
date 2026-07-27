import {
  loadFoundationModuleDetail,
  type FoundationModuleDetail,
} from '../../../foundation-detail-view-model'

export interface FoundationModuleDetailPageSnapshot extends FoundationModuleDetail {
  sourceLabel:
    | 'foundation-module-detail-api'
    | 'foundation-module-detail-fallback'
  controlPlaneSource: string
  businessDataSource: string
  refreshPath: string
  note: string
}

export async function loadFoundationModuleDetailPageSnapshot(
  moduleKey: string,
): Promise<FoundationModuleDetailPageSnapshot> {
  const snapshot = await loadFoundationModuleDetail(moduleKey)

  return {
    ...snapshot,
    sourceLabel:
      snapshot.deliveryMode === 'api'
        ? 'foundation-module-detail-api'
        : 'foundation-module-detail-fallback',
    controlPlaneSource:
      snapshot.deliveryMode === 'api'
        ? 'loadFoundationModuleDetailPageSnapshot -> loadFoundationModuleDetail -> foundation workspace upstream'
        : 'loadFoundationModuleDetailPageSnapshot -> loadFoundationModuleDetail fallback blueprint snapshot',
    businessDataSource:
      snapshot.deliveryMode === 'api'
        ? 'foundation workspace selectedModuleDetail / blueprint module detail'
        : 'fallback foundation blueprint and governance detail samples',
    refreshPath: `FoundationModuleDetailPage -> loadFoundationModuleDetailPageSnapshot(${moduleKey || 'empty'})`,
    note:
      snapshot.deliveryMode === 'api'
        ? '当前页面已消费 foundation 服务端详情快照，并保留 notFound / fallback 结构证据。'
        : '当前页面展示 fallback foundation 模块详情，仅可作为结构演练与来源态证据。',
  }
}
