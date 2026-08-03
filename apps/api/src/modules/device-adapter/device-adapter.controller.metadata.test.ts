import 'reflect-metadata'
import { describe, it } from 'vitest'
import assert from 'node:assert/strict'
import { DeviceAdapterController } from './device-adapter.controller'
import {
  PERMISSIONS_METADATA_KEY,
  TENANT_SCOPE_METADATA_KEY,
} from '../foundation/identity-access/identity-access.decorator'

const resolvePermissions = (handler: Function) =>
  Reflect.getMetadata(PERMISSIONS_METADATA_KEY, handler)
  ?? Reflect.getMetadata(PERMISSIONS_METADATA_KEY, DeviceAdapterController)

const resolveTenantScope = (handler: Function) =>
  Reflect.getMetadata(TENANT_SCOPE_METADATA_KEY, handler)
  ?? Reflect.getMetadata(TENANT_SCOPE_METADATA_KEY, DeviceAdapterController)

describe('DeviceAdapterController metadata', () => {
  const storeReadHandlers = [
    DeviceAdapterController.prototype.listDevices,
    DeviceAdapterController.prototype.getDevice,
    DeviceAdapterController.prototype.getDeviceStatus,
    DeviceAdapterController.prototype.getAllStatus,
    DeviceAdapterController.prototype.gateAccessLog,
    DeviceAdapterController.prototype.scannerParse,
    DeviceAdapterController.prototype.getCommandHistory,
  ]

  const storeWriteHandlers = [
    DeviceAdapterController.prototype.registerDevice,
    DeviceAdapterController.prototype.unregisterDevice,
    DeviceAdapterController.prototype.connectDevice,
    DeviceAdapterController.prototype.disconnectDevice,
    DeviceAdapterController.prototype.connectAll,
    DeviceAdapterController.prototype.heartbeat,
    DeviceAdapterController.prototype.gateOpen,
    DeviceAdapterController.prototype.scannerScan,
    DeviceAdapterController.prototype.printerPrint,
    DeviceAdapterController.prototype.printerPrintQr,
  ]

  const paymentExecuteHandlers = [
    DeviceAdapterController.prototype.posTransaction,
    DeviceAdapterController.prototype.posReadCard,
  ]

  const paymentRefundHandlers = [
    DeviceAdapterController.prototype.posRefund,
  ]

  it('all routes should require tenant scope', () => {
    ;[
      ...storeReadHandlers,
      ...storeWriteHandlers,
      ...paymentExecuteHandlers,
      ...paymentRefundHandlers,
    ].forEach((handler) => {
      assert.deepEqual(resolveTenantScope(handler), {})
    })
  })

  it('read routes should reuse store:read', () => {
    storeReadHandlers.forEach((handler) => {
      assert.deepEqual(resolvePermissions(handler), ['store:read'])
    })
  })

  it('device operation routes should reuse store:update', () => {
    storeWriteHandlers.forEach((handler) => {
      assert.deepEqual(resolvePermissions(handler), ['store:update'])
    })
  })

  it('payment execution routes should reuse payment:execute', () => {
    paymentExecuteHandlers.forEach((handler) => {
      assert.deepEqual(resolvePermissions(handler), ['payment:execute'])
    })
  })

  it('refund route should reuse payment:refund', () => {
    paymentRefundHandlers.forEach((handler) => {
      assert.deepEqual(resolvePermissions(handler), ['payment:refund'])
    })
  })
})
