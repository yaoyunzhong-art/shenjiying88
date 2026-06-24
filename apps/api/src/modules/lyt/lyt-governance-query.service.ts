import { Injectable } from '@nestjs/common'
import type {
  LytConnectionCapabilityReadinessContract,
  LytConnectionGovernanceAlertsContract,
  LytConnectionGovernanceSummaryContract,
  LytStoreCapabilityAccessViewContract
} from './lyt.contract'
import { LytConnectionManager } from './lyt-connection.manager'
import type { RequestTenantContext } from '../tenant/tenant.types'

@Injectable()
export class LytGovernanceQueryService {
  private readonly governedCapabilities = ['member', 'payment', 'order', 'device', 'gate', 'coin', 'inventory', 'shelf']

  constructor(private readonly connectionManager: LytConnectionManager) {}

  async getConnectionCapabilityReadiness(
    storeId: string,
    tenantContext?: RequestTenantContext
  ): Promise<LytConnectionCapabilityReadinessContract> {
    const [connection, storeRecord] = await Promise.all([
      this.connectionManager.getConnectionForStore(storeId, tenantContext),
      this.findStoreRecord(storeId, tenantContext)
    ])

    return this.buildConnectionCapabilityReadiness(connection, storeRecord)
  }

  async getConnectionGovernanceSummary(
    tenantContext?: RequestTenantContext
  ): Promise<LytConnectionGovernanceSummaryContract> {
    const readinessList = await this.getScopedReadinessList(tenantContext)
    const capabilityBreakdown = this.governedCapabilities.map((capability) => ({
      capability,
      readyStores: readinessList.filter((item) =>
        item.readinessByCapability.some((entry) => entry.capability === capability && entry.readiness === 'ready')
      ).length,
      inheritedReadyStores: readinessList.filter((item) =>
        item.readinessByCapability.some((entry) => entry.capability === capability && entry.readiness === 'inherited-ready')
      ).length,
      staleStores: readinessList.filter((item) =>
        item.readinessByCapability.some((entry) => entry.capability === capability && entry.readiness === 'stale')
      ).length,
      pendingStores: readinessList.filter((item) =>
        item.readinessByCapability.some((entry) => entry.capability === capability && entry.readiness === 'pending-configuration')
      ).length,
      notEnabledStores: readinessList.filter((item) =>
        item.readinessByCapability.some((entry) => entry.capability === capability && entry.readiness === 'not-enabled')
      ).length
    }))
    const storeGroups = this.buildGovernanceStoreGroups(readinessList)

    return {
      generatedAt: new Date().toISOString(),
      scope: {
        tenantId: tenantContext?.tenantId,
        brandId: tenantContext?.brandId
      },
      totalStores: readinessList.length,
      configuredStores: readinessList.filter((item) => item.connectionStatus === 'configured').length,
      pendingConfigurationStores: readinessList.filter((item) => item.connectionStatus === 'pending-configuration').length,
      staleStores: readinessList.filter((item) => item.healthStatus === 'stale').length,
      inheritedStores: readinessList.filter((item) => item.resolutionLevel === 'brand' || item.resolutionLevel === 'tenant')
        .length,
      storeLevelConfiguredStores: readinessList.filter((item) => item.resolutionLevel === 'store').length,
      capabilityBreakdown,
      recommendedNextActions: this.buildGovernanceSummaryRecommendations(readinessList, capabilityBreakdown),
      storeGroups,
      stores: readinessList
        .map((item) => this.buildGovernanceSummaryStoreItem(item))
        .sort((left, right) => {
          const riskOrder = { high: 0, medium: 1, low: 2 } as const
          return (
            riskOrder[left.governanceRiskLevel] - riskOrder[right.governanceRiskLevel] ||
            right.blockingIssueCount - left.blockingIssueCount ||
            right.alertCodes.length - left.alertCodes.length ||
            left.storeId.localeCompare(right.storeId)
          )
        })
    }
  }

  async getConnectionGovernanceAlerts(
    tenantContext?: RequestTenantContext
  ): Promise<LytConnectionGovernanceAlertsContract> {
    const readinessList = await this.getScopedReadinessList(tenantContext)
    const alerts = this.buildGovernanceAlerts(readinessList)

    return {
      generatedAt: new Date().toISOString(),
      scope: {
        tenantId: tenantContext?.tenantId,
        brandId: tenantContext?.brandId
      },
      alerts
    }
  }

  async getStoreCapabilityAccessView(
    storeId: string,
    tenantContext?: RequestTenantContext
  ): Promise<LytStoreCapabilityAccessViewContract> {
    const readiness = await this.getConnectionCapabilityReadiness(storeId, tenantContext)

    return {
      storeId: readiness.storeId,
      storeCode: readiness.storeCode,
      storeName: readiness.storeName,
      connectionStatus: readiness.connectionStatus,
      resolutionLevel: readiness.resolutionLevel,
      healthStatus: readiness.healthStatus,
      accessByCapability: readiness.readinessByCapability.map((item) => ({
        capability: item.capability,
        readiness: item.readiness,
        access: this.mapReadinessToCapabilityAccess(item.readiness),
        reason: this.getCapabilityAccessReason(item.capability, item.readiness)
      })),
      recommendedNextActions: [...readiness.recommendedNextActions]
    }
  }

  private async findStoreRecord(storeId: string, tenantContext?: RequestTenantContext) {
    const scopedStores = await this.connectionManager.listScopedStores(tenantContext)
    return scopedStores.find((store) => store.id === storeId)
  }

  private async getScopedReadinessList(tenantContext?: RequestTenantContext) {
    const scopedStores = await this.connectionManager.listScopedStores(tenantContext)
    return Promise.all(
      scopedStores.map((store) =>
        this.getConnectionCapabilityReadiness(store.id, {
          tenantId: store.tenantId,
          brandId: store.brandId
        })
      )
    )
  }

  private buildConnectionCapabilityReadiness(
    connection: Awaited<ReturnType<LytConnectionManager['getConnectionForStore']>>,
    storeRecord?: {
      id: string
      tenantId: string
      brandId: string
      code: string
      name: string
    }
  ): LytConnectionCapabilityReadinessContract {
    const readinessByCapability = this.governedCapabilities.map((capability) => ({
      capability,
      enabled: connection.capabilities.includes(capability),
      readiness: this.resolveCapabilityReadiness(connection, capability)
    }))
    const missingRequirements: string[] = []

    if (!connection.hasCredential) {
      missingRequirements.push('credential')
    }
    if (connection.connectionStatus === 'pending-configuration') {
      missingRequirements.push('store-scoped-connection')
    }
    if (connection.healthStatus === 'stale') {
      missingRequirements.push('connection-health-refresh')
    }
    if (!connection.vendorTenantId) {
      missingRequirements.push('vendor-tenant-mapping')
    }
    if (connection.brandId && !connection.vendorBrandId) {
      missingRequirements.push('vendor-brand-mapping')
    }
    if (!connection.vendorStoreId) {
      missingRequirements.push('vendor-store-mapping')
    }
    if (connection.resolutionLevel === 'brand' || connection.resolutionLevel === 'tenant') {
      missingRequirements.push('store-level-capability-verification')
    }

    return {
      storeId: connection.storeId,
      storeCode: storeRecord?.code,
      storeName: storeRecord?.name,
      tenantId: connection.tenantId,
      brandId: connection.brandId,
      vendor: connection.vendor,
      vendorTenantId: connection.vendorTenantId,
      vendorBrandId: connection.vendorBrandId,
      vendorStoreId: connection.vendorStoreId,
      connectionStatus: connection.connectionStatus,
      resolutionLevel: connection.resolutionLevel,
      healthStatus: connection.healthStatus,
      hasCredential: connection.hasCredential,
      credentialRef: connection.credentialRef,
      enabledCapabilities: [...connection.capabilities],
      readinessByCapability,
      missingRequirements,
      recommendedNextActions: this.buildCapabilityReadinessRecommendations(connection, readinessByCapability, missingRequirements)
    }
  }

  private resolveCapabilityReadiness(
    connection: Awaited<ReturnType<LytConnectionManager['getConnectionForStore']>>,
    capability: string
  ): LytConnectionCapabilityReadinessContract['readinessByCapability'][number]['readiness'] {
    if (!connection.capabilities.includes(capability)) {
      return 'not-enabled'
    }
    if (connection.connectionStatus === 'pending-configuration' || !connection.hasCredential) {
      return 'pending-configuration'
    }
    if (connection.healthStatus === 'stale') {
      return 'stale'
    }
    if (connection.resolutionLevel === 'brand' || connection.resolutionLevel === 'tenant') {
      return 'inherited-ready'
    }
    return 'ready'
  }

  private buildCapabilityReadinessRecommendations(
    connection: Awaited<ReturnType<LytConnectionManager['getConnectionForStore']>>,
    readinessByCapability: LytConnectionCapabilityReadinessContract['readinessByCapability'],
    missingRequirements: string[]
  ) {
    const actions: string[] = []

    if (connection.connectionStatus === 'pending-configuration') {
      actions.push('优先为该门店补齐独立 endpoint 与 credential，避免长期停留在 fallback/mock 状态')
    }
    if (connection.healthStatus === 'stale') {
      actions.push('尽快刷新该门店连接健康检查，确认 token、签名和 endpoint 是否仍然有效')
    }
    if (!connection.vendorTenantId || (connection.brandId && !connection.vendorBrandId) || !connection.vendorStoreId) {
      actions.push('优先补齐 vendorTenantId / vendorBrandId / vendorStoreId 映射，避免我方主键与 LYT 外部编码混用')
    }
    if (connection.resolutionLevel === 'brand' || connection.resolutionLevel === 'tenant') {
      actions.push('当前门店仍在继承上级连接，建议逐店核对 vendorStoreId 与 capability 开通范围')
    }
    if (readinessByCapability.some((item) => item.readiness === 'not-enabled')) {
      actions.push('根据门店实际设备与经营形态确认未开通 capability 是否需要补配或显式禁用')
    }
    if (missingRequirements.length === 0) {
      actions.push('当前门店连接与 capability readiness 已具备接入治理条件，可继续接真实读面与运营台')
    }

    return actions
  }

  private buildGovernanceSummaryRecommendations(
    readinessList: LytConnectionCapabilityReadinessContract[],
    capabilityBreakdown: LytConnectionGovernanceSummaryContract['capabilityBreakdown']
  ) {
    const actions: string[] = []

    if (readinessList.some((item) => item.connectionStatus === 'pending-configuration')) {
      actions.push('优先清理 pending-configuration 门店，先补真实 endpoint、credential 和 vendorStoreId 映射')
    }
    if (readinessList.some((item) => item.healthStatus === 'stale')) {
      actions.push('针对 stale 门店批量执行连接巡检，确认签名、凭证和健康检查时效')
    }
    if (readinessList.some((item) => item.missingRequirements.some((entry) => entry.startsWith('vendor-')))) {
      actions.push('优先补齐 vendorTenantId / vendorBrandId / vendorStoreId 映射，先统一外部编码再继续推进工作台接入')
    }
    if (readinessList.some((item) => item.resolutionLevel === 'brand' || item.resolutionLevel === 'tenant')) {
      actions.push('对继承品牌/租户默认连接的门店逐店核查 capability readiness，避免上级默认配置掩盖门店差异')
    }
    const topPendingCapability = [...capabilityBreakdown].sort((a, b) => b.pendingStores - a.pendingStores)[0]
    if (topPendingCapability && topPendingCapability.pendingStores > 0) {
      actions.push(`优先补齐 capability ${topPendingCapability.capability} 的门店开通信息，减少门店侧功能降级`)
    }
    if (actions.length === 0) {
      actions.push('当前租户/品牌的 LYT 连接治理状态稳定，可继续推进真实门店读面和运营工作台接入')
    }

    return actions
  }

  private buildGovernanceStoreGroups(
    readinessList: LytConnectionCapabilityReadinessContract[]
  ): LytConnectionGovernanceSummaryContract['storeGroups'] {
    const groups: LytConnectionGovernanceSummaryContract['storeGroups'] = []
    const definitions: Array<{
      code: LytConnectionGovernanceSummaryContract['storeGroups'][number]['code']
      label: string
      severity: LytConnectionGovernanceSummaryContract['storeGroups'][number]['severity']
      recommendedFocus: LytConnectionGovernanceSummaryContract['storeGroups'][number]['recommendedFocus']
      primaryActionLabel: string
      recommendedNextActions: string[]
      match: (item: LytConnectionCapabilityReadinessContract) => boolean
    }> = [
      {
        code: 'high-risk-stores',
        label: '高风险门店',
        severity: 'high',
        recommendedFocus: 'high-risk',
        primaryActionLabel: '优先处理高风险门店',
        recommendedNextActions: ['优先处理 pending、凭证缺失和 vendor 映射缺口门店，避免真实接入继续阻塞'],
        match: (item) =>
          item.connectionStatus === 'pending-configuration' ||
          !item.hasCredential ||
          item.missingRequirements.some((entry) => entry.startsWith('vendor-'))
      },
      {
        code: 'pending-configuration-stores',
        label: '待配置门店',
        severity: 'high',
        recommendedFocus: 'connection-setup',
        primaryActionLabel: '进入连接配置',
        recommendedNextActions: ['优先补齐 endpoint、credential 与 vendorStoreId，尽快退出 fallback/mock 状态'],
        match: (item) => item.connectionStatus === 'pending-configuration'
      },
      {
        code: 'stale-stores',
        label: '健康过期门店',
        severity: 'high',
        recommendedFocus: 'health-check',
        primaryActionLabel: '执行健康巡检',
        recommendedNextActions: ['批量执行连接巡检并刷新健康状态，确认 token、签名和域名仍有效'],
        match: (item) => item.healthStatus === 'stale'
      },
      {
        code: 'vendor-mapping-gaps',
        label: '外部编码映射缺口',
        severity: 'high',
        recommendedFocus: 'vendor-mapping',
        primaryActionLabel: '补齐外部编码映射',
        recommendedNextActions: ['先统一 vendorTenantId / vendorBrandId / vendorStoreId，再推进工作台接入与事件治理'],
        match: (item) => item.missingRequirements.some((entry) => entry.startsWith('vendor-'))
      },
      {
        code: 'credential-missing-stores',
        label: '凭证缺失门店',
        severity: 'high',
        recommendedFocus: 'credential-binding',
        primaryActionLabel: '绑定真实凭证',
        recommendedNextActions: ['为缺失凭证的门店补齐 credentialRef 或安全密钥绑定'],
        match: (item) => !item.hasCredential
      },
      {
        code: 'inherited-store-verification',
        label: '继承配置待核验',
        severity: 'medium',
        recommendedFocus: 'inheritance-verification',
        primaryActionLabel: '核验继承配置',
        recommendedNextActions: ['逐店核对 vendorStoreId、能力开通范围和门店级差异配置'],
        match: (item) => item.resolutionLevel === 'brand' || item.resolutionLevel === 'tenant'
      }
    ]

    for (const definition of definitions) {
      const storeIds = readinessList.filter(definition.match).map((item) => item.storeId)
      if (storeIds.length === 0) {
        continue
      }
      groups.push({
        code: definition.code,
        label: definition.label,
        severity: definition.severity,
        count: storeIds.length,
        storeIds,
        recommendedFocus: definition.recommendedFocus,
        primaryActionLabel: definition.primaryActionLabel,
        recommendedNextActions: [...definition.recommendedNextActions]
      })
    }

    return groups.sort((left, right) => {
      const severityOrder = { high: 0, medium: 1, low: 2 } as const
      return severityOrder[left.severity] - severityOrder[right.severity] || right.count - left.count || left.label.localeCompare(right.label)
    })
  }

  private buildGovernanceSummaryStoreItem(
    readiness: LytConnectionCapabilityReadinessContract
  ): LytConnectionGovernanceSummaryContract['stores'][number] {
    const alertCodes = this.getStoreAlertCodes(readiness)
    const blockingIssueCount = readiness.readinessByCapability.filter(
      (item) => item.readiness === 'pending-configuration' || item.readiness === 'stale'
    ).length
    const issueActions = this.getStoreIssueActions(readiness, alertCodes)
    const primaryAction = issueActions[0]!

    return {
      storeId: readiness.storeId,
      storeCode: readiness.storeCode,
      storeName: readiness.storeName,
      resolutionLevel: readiness.resolutionLevel,
      healthStatus: readiness.healthStatus,
      connectionStatus: readiness.connectionStatus,
      enabledCapabilities: [...readiness.enabledCapabilities],
      missingRequirements: [...readiness.missingRequirements],
      governanceRiskLevel: this.getStoreGovernanceRiskLevel(readiness, alertCodes),
      alertCodes,
      blockingIssueCount,
      primaryIssueCode: primaryAction.code,
      primaryFocus: primaryAction.focus,
      primaryActionLabel: primaryAction.label,
      secondaryIssues: issueActions.slice(1),
      focusTrail: this.buildStoreFocusTrail(issueActions),
      recommendedNextActions: [...readiness.recommendedNextActions]
    }
  }

  private getStoreAlertCodes(readiness: LytConnectionCapabilityReadinessContract) {
    const alertCodes: LytConnectionGovernanceSummaryContract['stores'][number]['alertCodes'] = []

    if (readiness.connectionStatus === 'pending-configuration') {
      alertCodes.push('pending-configuration-stores')
    }
    if (readiness.healthStatus === 'stale') {
      alertCodes.push('stale-connections')
    }
    if (!readiness.hasCredential) {
      alertCodes.push('credential-missing-stores')
    }
    if (readiness.missingRequirements.some((item) => item.startsWith('vendor-'))) {
      alertCodes.push('vendor-mapping-gaps')
    }
    if (readiness.resolutionLevel === 'brand' || readiness.resolutionLevel === 'tenant') {
      alertCodes.push('inherited-store-verification')
    }
    if (readiness.readinessByCapability.some((item) => item.readiness === 'pending-configuration')) {
      alertCodes.push('capability-pending-stores')
    }
    if (readiness.readinessByCapability.some((item) => item.readiness === 'not-enabled')) {
      alertCodes.push('capability-not-enabled-gaps')
    }

    return alertCodes
  }

  private getStoreGovernanceRiskLevel(
    readiness: LytConnectionCapabilityReadinessContract,
    alertCodes: LytConnectionGovernanceSummaryContract['stores'][number]['alertCodes']
  ): LytConnectionGovernanceSummaryContract['stores'][number]['governanceRiskLevel'] {
    if (
      readiness.connectionStatus === 'pending-configuration' ||
      !readiness.hasCredential ||
      readiness.missingRequirements.some((item) => item.startsWith('vendor-'))
    ) {
      return 'high'
    }
    if (
      readiness.healthStatus === 'stale' ||
      readiness.resolutionLevel === 'brand' ||
      readiness.resolutionLevel === 'tenant' ||
      alertCodes.includes('capability-pending-stores')
    ) {
      return 'medium'
    }
    return 'low'
  }

  private getStoreIssueActions(
    readiness: LytConnectionCapabilityReadinessContract,
    alertCodes: LytConnectionGovernanceSummaryContract['stores'][number]['alertCodes']
  ): LytConnectionGovernanceSummaryContract['stores'][number]['secondaryIssues'] {
    const actions: LytConnectionGovernanceSummaryContract['stores'][number]['secondaryIssues'] = []
    const pushAction = (action: LytConnectionGovernanceSummaryContract['stores'][number]['secondaryIssues'][number]) => {
      if (!actions.some((item) => item.code === action.code)) {
        actions.push(action)
      }
    }

    if (readiness.connectionStatus === 'pending-configuration') {
      pushAction({
        code: 'pending-configuration-stores',
        focus: 'connection-setup',
        label: '补齐连接配置'
      })
    }
    if (readiness.missingRequirements.some((item) => item.startsWith('vendor-'))) {
      pushAction({
        code: 'vendor-mapping-gaps',
        focus: 'vendor-mapping',
        label: '补齐外部编码映射'
      })
    }
    if (!readiness.hasCredential) {
      pushAction({
        code: 'credential-missing-stores',
        focus: 'credential-binding',
        label: '绑定真实凭证'
      })
    }
    if (readiness.healthStatus === 'stale') {
      pushAction({
        code: 'stale-connections',
        focus: 'health-check',
        label: '执行健康巡检'
      })
    }
    if (readiness.resolutionLevel === 'brand' || readiness.resolutionLevel === 'tenant') {
      pushAction({
        code: 'inherited-store-verification',
        focus: 'inheritance-verification',
        label: '核验继承配置'
      })
    }
    if (alertCodes.includes('capability-pending-stores')) {
      pushAction({
        code: 'capability-pending-stores',
        focus: 'capability-rollout',
        label: '推进能力开通'
      })
    }

    if (actions.length === 0) {
      pushAction({
        code: 'healthy',
        focus: 'stable',
        label: '查看稳定读面'
      })
    }

    return actions
  }

  private buildStoreFocusTrail(
    issueActions: LytConnectionGovernanceSummaryContract['stores'][number]['secondaryIssues']
  ): LytConnectionGovernanceSummaryContract['stores'][number]['focusTrail'] {
    const focusTrail: LytConnectionGovernanceSummaryContract['stores'][number]['focusTrail'] = []

    for (const action of issueActions) {
      if (!focusTrail.includes(action.focus)) {
        focusTrail.push(action.focus)
      }
    }

    return focusTrail
  }

  private buildGovernanceAlerts(readinessList: LytConnectionCapabilityReadinessContract[]) {
    const alerts: LytConnectionGovernanceAlertsContract['alerts'] = []

    const pendingStores = readinessList.filter((item) => item.connectionStatus === 'pending-configuration')
    if (pendingStores.length > 0) {
      alerts.push({
        severity: 'high',
        code: 'pending-configuration-stores',
        count: pendingStores.length,
        summary: '存在仍未完成真实连接配置的门店，相关能力将持续被阻塞',
        affectedStoreIds: pendingStores.map((item) => item.storeId),
        affectedCapabilities: this.collectAffectedCapabilities(pendingStores, ['pending-configuration']),
        recommendedNextActions: ['优先补齐 endpoint、credential 与 vendorStoreId，尽快退出 fallback/mock 状态']
      })
    }

    const staleStores = readinessList.filter((item) => item.healthStatus === 'stale')
    if (staleStores.length > 0) {
      alerts.push({
        severity: 'high',
        code: 'stale-connections',
        count: staleStores.length,
        summary: '存在健康状态已 stale 的门店连接，需尽快复核凭证、签名与 endpoint',
        affectedStoreIds: staleStores.map((item) => item.storeId),
        affectedCapabilities: this.collectAffectedCapabilities(staleStores, ['stale']),
        recommendedNextActions: ['批量执行连接巡检并刷新健康状态，确认 token、签名和域名仍有效']
      })
    }

    const credentialMissingStores = readinessList.filter((item) => !item.hasCredential)
    if (credentialMissingStores.length > 0) {
      alerts.push({
        severity: 'high',
        code: 'credential-missing-stores',
        count: credentialMissingStores.length,
        summary: '存在缺少真实 credential 的门店，无法安全进入正式接入链路',
        affectedStoreIds: credentialMissingStores.map((item) => item.storeId),
        affectedCapabilities: this.collectAffectedCapabilities(credentialMissingStores, ['pending-configuration']),
        recommendedNextActions: ['为缺失凭证的门店补齐 credentialRef 或安全密钥绑定']
      })
    }

    const vendorMappingGapStores = readinessList.filter((item) =>
      item.missingRequirements.some((entry) => entry.startsWith('vendor-'))
    )
    if (vendorMappingGapStores.length > 0) {
      alerts.push({
        severity: 'high',
        code: 'vendor-mapping-gaps',
        count: vendorMappingGapStores.length,
        summary: '存在门店缺少 LYT 外部编码映射，需先补齐 vendorTenantId / vendorBrandId / vendorStoreId',
        affectedStoreIds: vendorMappingGapStores.map((item) => item.storeId),
        affectedCapabilities: this.collectEnabledCapabilities(vendorMappingGapStores),
        recommendedNextActions: ['先统一 LYT 外部编码映射，再推进真实门店接入、事件治理与前端读面']
      })
    }

    const inheritedStores = readinessList.filter((item) => item.resolutionLevel === 'brand' || item.resolutionLevel === 'tenant')
    if (inheritedStores.length > 0) {
      alerts.push({
        severity: 'medium',
        code: 'inherited-store-verification',
        count: inheritedStores.length,
        summary: '存在仍继承品牌或租户默认连接的门店，需逐店核对 capability 与 vendorStoreId',
        affectedStoreIds: inheritedStores.map((item) => item.storeId),
        affectedCapabilities: this.collectAffectedCapabilities(inheritedStores, ['inherited-ready']),
        recommendedNextActions: ['优先核验继承门店的 vendorStoreId、能力开通范围和门店级差异配置']
      })
    }

    const pendingByCapability = this.governedCapabilities
      .map((capability) => ({
        capability,
        stores: readinessList.filter((item) =>
          item.readinessByCapability.some((entry) => entry.capability === capability && entry.readiness === 'pending-configuration')
        )
      }))
      .filter((entry) => entry.stores.length > 0)
      .sort((left, right) => right.stores.length - left.stores.length)[0]
    if (pendingByCapability) {
      alerts.push({
        severity: 'medium',
        code: 'capability-pending-stores',
        count: pendingByCapability.stores.length,
        summary: `capability ${pendingByCapability.capability} 在多个门店仍未达到接入就绪，相关工作台需保持阻塞`,
        affectedStoreIds: pendingByCapability.stores.map((item) => item.storeId),
        affectedCapabilities: [pendingByCapability.capability],
        recommendedNextActions: [`优先补齐 capability ${pendingByCapability.capability} 的门店开通、凭证和真实链路校验`]
      })
    }

    const notEnabledByCapability = this.governedCapabilities
      .map((capability) => ({
        capability,
        stores: readinessList.filter((item) =>
          item.readinessByCapability.some((entry) => entry.capability === capability && entry.readiness === 'not-enabled')
        )
      }))
      .filter((entry) => entry.stores.length > 0)
      .sort((left, right) => right.stores.length - left.stores.length)[0]
    if (notEnabledByCapability) {
      alerts.push({
        severity: 'low',
        code: 'capability-not-enabled-gaps',
        count: notEnabledByCapability.stores.length,
        summary: `capability ${notEnabledByCapability.capability} 在部分门店未启用，前端需按门店能力隐藏无效入口`,
        affectedStoreIds: notEnabledByCapability.stores.map((item) => item.storeId),
        affectedCapabilities: [notEnabledByCapability.capability],
        recommendedNextActions: [`确认 capability ${notEnabledByCapability.capability} 是业务不适用还是待补配，避免前端误开放入口`]
      })
    }

    return alerts
  }

  private collectAffectedCapabilities(
    readinessList: LytConnectionCapabilityReadinessContract[],
    targetStates: Array<LytConnectionCapabilityReadinessContract['readinessByCapability'][number]['readiness']>
  ) {
    return this.governedCapabilities.filter((capability) =>
      readinessList.some((item) =>
        item.readinessByCapability.some((entry) => entry.capability === capability && targetStates.includes(entry.readiness))
      )
    )
  }

  private collectEnabledCapabilities(readinessList: LytConnectionCapabilityReadinessContract[]) {
    return this.governedCapabilities.filter((capability) =>
      readinessList.some((item) => item.enabledCapabilities.includes(capability))
    )
  }

  private mapReadinessToCapabilityAccess(
    readiness: LytConnectionCapabilityReadinessContract['readinessByCapability'][number]['readiness']
  ): LytStoreCapabilityAccessViewContract['accessByCapability'][number]['access'] {
    if (readiness === 'ready') {
      return 'enabled'
    }
    if (readiness === 'inherited-ready' || readiness === 'stale') {
      return 'degraded'
    }
    if (readiness === 'pending-configuration') {
      return 'blocked'
    }
    return 'hidden'
  }

  private getCapabilityAccessReason(
    capability: string,
    readiness: LytConnectionCapabilityReadinessContract['readinessByCapability'][number]['readiness']
  ) {
    if (readiness === 'ready') {
      return `${capability} 已具备门店级稳定接入条件，可正常开放`
    }
    if (readiness === 'inherited-ready') {
      return `${capability} 当前来自品牌/租户继承连接，建议保留降级提示并继续逐店核验`
    }
    if (readiness === 'stale') {
      return `${capability} 当前连接健康状态已 stale，建议降级显示并优先巡检`
    }
    if (readiness === 'pending-configuration') {
      return `${capability} 尚未完成真实连接配置，前端应阻塞相关操作入口`
    }
    return `${capability} 未在当前门店启用，前端应隐藏无效入口`
  }
}
