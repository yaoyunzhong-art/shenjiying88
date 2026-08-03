import 'reflect-metadata'
import { describe, it } from 'vitest'
import assert from 'node:assert/strict'
import { BrandOperationsController } from './brand-operations.controller'
import {
  PERMISSIONS_METADATA_KEY,
  TENANT_SCOPE_METADATA_KEY,
} from '../foundation/identity-access/identity-access.decorator'
import { IS_PUBLIC_KEY } from '../foundation/identity-access/public.decorator'

const resolvePermissions = (handler: Function) =>
  Reflect.getMetadata(PERMISSIONS_METADATA_KEY, handler)
  ?? Reflect.getMetadata(PERMISSIONS_METADATA_KEY, BrandOperationsController)

const resolveTenantScope = (handler: Function) =>
  Reflect.getMetadata(TENANT_SCOPE_METADATA_KEY, handler)
  ?? Reflect.getMetadata(TENANT_SCOPE_METADATA_KEY, BrandOperationsController)

describe('BrandOperationsController metadata', () => {
  const readHandlers = [
    BrandOperationsController.prototype.listAssets,
    BrandOperationsController.prototype.getAsset,
    BrandOperationsController.prototype.listCampaigns,
    BrandOperationsController.prototype.getCampaign,
    BrandOperationsController.prototype.getSyncRecords,
    BrandOperationsController.prototype.getSyncedCampaigns,
    BrandOperationsController.prototype.listTemplates,
    BrandOperationsController.prototype.getTemplate,
    BrandOperationsController.prototype.listCollaborations,
    BrandOperationsController.prototype.getCollaboration,
    BrandOperationsController.prototype.getCollaborationMetrics,
    BrandOperationsController.prototype.getMetrics,
    BrandOperationsController.prototype.listCampaignSchedules,
    BrandOperationsController.prototype.getCampaignSchedule,
    BrandOperationsController.prototype.listRevenueShares,
    BrandOperationsController.prototype.getRevenueShare,
    BrandOperationsController.prototype.getRevenueShareSummary,
    BrandOperationsController.prototype.listAssetCategories,
    BrandOperationsController.prototype.getAssetCategoryTree,
    BrandOperationsController.prototype.getAssetCategory,
    BrandOperationsController.prototype.listAssetTags,
    BrandOperationsController.prototype.getDashboard,
    BrandOperationsController.prototype.listExportRecords,
    BrandOperationsController.prototype.getExportRecord,
    BrandOperationsController.prototype.listCollaborationContracts,
    BrandOperationsController.prototype.getCollaborationContract,
    BrandOperationsController.prototype.listCampaignABTests,
    BrandOperationsController.prototype.getCampaignABTest,
    BrandOperationsController.prototype.getABTestComparison,
    BrandOperationsController.prototype.getCalendarTimeline,
    BrandOperationsController.prototype.listRecycleBinItems,
    BrandOperationsController.prototype.listBrandChannels,
    BrandOperationsController.prototype.getBrandChannel,
    BrandOperationsController.prototype.listBrandKPIs,
    BrandOperationsController.prototype.getBrandKPI,
    BrandOperationsController.prototype.getBrandKPISummary,
  ]

  const writeHandlers = [
    BrandOperationsController.prototype.createAsset,
    BrandOperationsController.prototype.updateAsset,
    BrandOperationsController.prototype.deleteAsset,
    BrandOperationsController.prototype.submitCampaign,
    BrandOperationsController.prototype.approveCampaign,
    BrandOperationsController.prototype.rejectCampaign,
    BrandOperationsController.prototype.publishCampaign,
    BrandOperationsController.prototype.createCampaign,
    BrandOperationsController.prototype.updateCampaign,
    BrandOperationsController.prototype.deleteCampaign,
    BrandOperationsController.prototype.syncToStores,
    BrandOperationsController.prototype.createTemplate,
    BrandOperationsController.prototype.updateTemplate,
    BrandOperationsController.prototype.deleteTemplate,
    BrandOperationsController.prototype.applyTemplate,
    BrandOperationsController.prototype.createCollaboration,
    BrandOperationsController.prototype.updateCollaboration,
    BrandOperationsController.prototype.deleteCollaboration,
    BrandOperationsController.prototype.linkCampaignToCollaboration,
    BrandOperationsController.prototype.createCampaignSchedule,
    BrandOperationsController.prototype.cancelCampaignSchedule,
    BrandOperationsController.prototype.executeDueSchedules,
    BrandOperationsController.prototype.calculateRevenueShare,
    BrandOperationsController.prototype.settleRevenueShare,
    BrandOperationsController.prototype.disputeRevenueShare,
    BrandOperationsController.prototype.createAssetCategory,
    BrandOperationsController.prototype.updateAssetCategory,
    BrandOperationsController.prototype.deleteAssetCategory,
    BrandOperationsController.prototype.createAssetTag,
    BrandOperationsController.prototype.deleteAssetTag,
    BrandOperationsController.prototype.requestExport,
    BrandOperationsController.prototype.createCollaborationContract,
    BrandOperationsController.prototype.updateCollaborationContract,
    BrandOperationsController.prototype.deleteCollaborationContract,
    BrandOperationsController.prototype.createCampaignABTest,
    BrandOperationsController.prototype.startCampaignABTest,
    BrandOperationsController.prototype.pauseCampaignABTest,
    BrandOperationsController.prototype.resumeCampaignABTest,
    BrandOperationsController.prototype.recordVariantMetrics,
    BrandOperationsController.prototype.decideABTestWinner,
    BrandOperationsController.prototype.softDeleteEntity,
    BrandOperationsController.prototype.restoreFromRecycleBin,
    BrandOperationsController.prototype.permanentlyDeleteFromRecycleBin,
    BrandOperationsController.prototype.cleanExpiredRecycleBinItems,
    BrandOperationsController.prototype.createBrandChannel,
    BrandOperationsController.prototype.updateBrandChannel,
    BrandOperationsController.prototype.deleteBrandChannel,
    BrandOperationsController.prototype.createBrandKPI,
    BrandOperationsController.prototype.updateBrandKPI,
    BrandOperationsController.prototype.deleteBrandKPI,
  ]

  it('controller should no longer stay public', () => {
    assert.equal(Reflect.getMetadata(IS_PUBLIC_KEY, BrandOperationsController), undefined)
  })

  it('all routes should require tenant scope', () => {
    ;[...readHandlers, ...writeHandlers].forEach((handler) => {
      assert.deepEqual(resolveTenantScope(handler), {})
    })
  })

  it('read routes should reuse foundation.governance.read', () => {
    readHandlers.forEach((handler) => {
      assert.deepEqual(resolvePermissions(handler), ['foundation.governance.read'])
    })
  })

  it('write routes should reuse foundation.governance.write', () => {
    writeHandlers.forEach((handler) => {
      assert.deepEqual(resolvePermissions(handler), ['foundation.governance.write'])
    })
  })
})
