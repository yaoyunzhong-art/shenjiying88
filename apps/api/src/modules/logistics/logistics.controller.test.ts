import { describe, it } from 'vitest'
import 'reflect-metadata'
import assert from 'node:assert/strict'
import {
  PERMISSIONS_METADATA_KEY,
  TENANT_SCOPE_METADATA_KEY,
} from '../foundation/identity-access/identity-access.decorator'
import { LogisticsController } from './logistics.controller'

function resolvePermissions(handler: Function) {
  return (
    Reflect.getMetadata(PERMISSIONS_METADATA_KEY, handler) ??
    Reflect.getMetadata(PERMISSIONS_METADATA_KEY, LogisticsController)
  )
}

function resolveTenantScope(handler: Function) {
  return (
    Reflect.getMetadata(TENANT_SCOPE_METADATA_KEY, handler) ??
    Reflect.getMetadata(TENANT_SCOPE_METADATA_KEY, LogisticsController)
  )
}

describe('LogisticsController metadata', () => {
  const defaultHandlers = [
    LogisticsController.prototype.create,
    LogisticsController.prototype.list,
    LogisticsController.prototype.detail,
    LogisticsController.prototype.remind,
    LogisticsController.prototype.sweep,
    LogisticsController.prototype.recordResult,
    LogisticsController.prototype.createCleanSchedule,
    LogisticsController.prototype.listCleanSchedules,
    LogisticsController.prototype.cleanScheduleDetail,
    LogisticsController.prototype.assignCleanArea,
    LogisticsController.prototype.checkInCleanSchedule,
    LogisticsController.prototype.createMaterialRequest,
    LogisticsController.prototype.listMaterialRequests,
    LogisticsController.prototype.materialRequestDetail,
    LogisticsController.prototype.approveMaterialRequest,
    LogisticsController.prototype.outboundMaterialRequest,
    LogisticsController.prototype.createMaintenanceOrder,
    LogisticsController.prototype.listMaintenanceOrders,
    LogisticsController.prototype.getMaintenanceOrder,
    LogisticsController.prototype.startMaintenanceOrder,
    LogisticsController.prototype.completeMaintenanceOrder,
    LogisticsController.prototype.acceptMaintenanceOrder,
    LogisticsController.prototype.createProcurementRequest,
    LogisticsController.prototype.listProcurementRequests,
    LogisticsController.prototype.getProcurementRequest,
    LogisticsController.prototype.submitProcurementRequest,
    LogisticsController.prototype.approveProcurementRequest,
    LogisticsController.prototype.rejectProcurementRequest,
    LogisticsController.prototype.orderProcurementRequest,
    LogisticsController.prototype.receiveProcurementRequest,
    LogisticsController.prototype.checkInventory,
    LogisticsController.prototype.createReservation,
    LogisticsController.prototype.listReservations,
    LogisticsController.prototype.getReservation,
    LogisticsController.prototype.cancelReservation,
    LogisticsController.prototype.fulfillReservation,
    LogisticsController.prototype.createSchedulePlan,
    LogisticsController.prototype.listSchedulePlans,
    LogisticsController.prototype.getSchedulePlan,
    LogisticsController.prototype.updateSchedulePlan,
    LogisticsController.prototype.deleteSchedulePlan,
    LogisticsController.prototype.computeNextRun,
    LogisticsController.prototype.sweepDueSchedules,
    LogisticsController.prototype.executeSchedulePlan,
    LogisticsController.prototype.listScheduleTaskLogs,
    LogisticsController.prototype.getSchedulePlanMetrics,
    LogisticsController.prototype.createRepairFeedback,
    LogisticsController.prototype.listRepairFeedbacks,
    LogisticsController.prototype.getRepairFeedback,
    LogisticsController.prototype.createRepairKnowledge,
    LogisticsController.prototype.listRepairKnowledge,
    LogisticsController.prototype.getRepairKnowledge,
    LogisticsController.prototype.updateRepairKnowledge,
    LogisticsController.prototype.createConsumableAlertRule,
    LogisticsController.prototype.listConsumableAlertRules,
    LogisticsController.prototype.updateConsumableAlertRule,
    LogisticsController.prototype.deleteConsumableAlertRule,
    LogisticsController.prototype.checkConsumableAlerts,
    LogisticsController.prototype.listConsumableAlerts,
    LogisticsController.prototype.resolveConsumableAlert,
    LogisticsController.prototype.createVenueInspectionRecord,
    LogisticsController.prototype.listVenueInspectionRecords,
    LogisticsController.prototype.getVenueInspectionTrend,
    LogisticsController.prototype.getLogisticsReport,
  ]

  const repairListHandlers = [
    LogisticsController.prototype.createRepairOrder,
    LogisticsController.prototype.listRepairOrders,
  ]

  const repairDetailHandlers = [
    LogisticsController.prototype.repairDetail,
    LogisticsController.prototype.assignRepairOrder,
    LogisticsController.prototype.startRepairOrder,
    LogisticsController.prototype.completeRepairOrder,
    LogisticsController.prototype.verifyRepairOrder,
  ]

  const supplierReadHandlers = [
    LogisticsController.prototype.listSuppliers,
    LogisticsController.prototype.getSupplierMetrics,
  ]

  const supplierDetailHandlers = [
    LogisticsController.prototype.getSupplier,
    LogisticsController.prototype.listSupplierContracts,
    LogisticsController.prototype.listSupplierEvaluations,
  ]

  const supplierFormHandlers = [
    LogisticsController.prototype.createSupplier,
    LogisticsController.prototype.updateSupplier,
    LogisticsController.prototype.deleteSupplier,
    LogisticsController.prototype.addSupplierContact,
    LogisticsController.prototype.addSupplierContract,
    LogisticsController.prototype.evaluateSupplier,
  ]

  it('controller path should be logistics', () => {
    assert.equal(Reflect.getMetadata('path', LogisticsController), 'logistics')
  })

  it('all protected routes should require tenant scope', () => {
    ;[
      ...defaultHandlers,
      ...repairListHandlers,
      ...repairDetailHandlers,
      ...supplierReadHandlers,
      ...supplierDetailHandlers,
      ...supplierFormHandlers,
    ].forEach((handler) => {
      assert.deepEqual(resolveTenantScope(handler), {})
    })
  })

  it('default logistics routes should reuse logistics:read', () => {
    defaultHandlers.forEach((handler) => {
      assert.deepEqual(resolvePermissions(handler), ['logistics:read'])
    })
  })

  it('repair list routes should reuse logistics:repairs:read', () => {
    repairListHandlers.forEach((handler) => {
      assert.deepEqual(resolvePermissions(handler), ['logistics:repairs:read'])
    })
  })

  it('repair detail routes should reuse logistics:repairs:id:read', () => {
    repairDetailHandlers.forEach((handler) => {
      assert.deepEqual(resolvePermissions(handler), ['logistics:repairs:id:read'])
    })
  })

  it('supplier list routes should reuse suppliers:read', () => {
    supplierReadHandlers.forEach((handler) => {
      assert.deepEqual(resolvePermissions(handler), ['suppliers:read'])
    })
  })

  it('supplier detail routes should reuse suppliers:id:read', () => {
    supplierDetailHandlers.forEach((handler) => {
      assert.deepEqual(resolvePermissions(handler), ['suppliers:id:read'])
    })
  })

  it('supplier mutation routes should reuse suppliers:form:read', () => {
    supplierFormHandlers.forEach((handler) => {
      assert.deepEqual(resolvePermissions(handler), ['suppliers:form:read'])
    })
  })
})
