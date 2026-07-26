import 'reflect-metadata'
import { describe, it } from 'vitest'
import assert from 'node:assert/strict'
import {
  PERMISSIONS_METADATA_KEY,
  TENANT_SCOPE_METADATA_KEY,
} from '../foundation/identity-access/identity-access.decorator'
import { IS_PUBLIC_KEY } from '../foundation/identity-access/public.decorator'
import { PushController } from './push.controller'

function resolvePermissions(handler: Function) {
  return (
    Reflect.getMetadata(PERMISSIONS_METADATA_KEY, handler) ??
    Reflect.getMetadata(PERMISSIONS_METADATA_KEY, PushController)
  )
}

function resolveTenantScope(handler: Function) {
  return (
    Reflect.getMetadata(TENANT_SCOPE_METADATA_KEY, handler) ??
    Reflect.getMetadata(TENANT_SCOPE_METADATA_KEY, PushController)
  )
}

describe('PushController metadata', () => {
  const readHandlers = [
    PushController.prototype.queryScheduledPushes,
    PushController.prototype.getPriorityLevels,
    PushController.prototype.getDndConfig,
    PushController.prototype.checkDnd,
    PushController.prototype.getFrequencyCapConfig,
    PushController.prototype.getFrequencyCapStatus,
    PushController.prototype.getChannelHealth,
    PushController.prototype.getStats,
    PushController.prototype.getPushHistory,
    PushController.prototype.getWSConnections,
    PushController.prototype.getUserPreference,
    PushController.prototype.checkPushPreference,
    PushController.prototype.getUserPreferredChannels,
    PushController.prototype.getPushDashboard,
    PushController.prototype.queryPushHistory,
  ]

  const writeHandlers = [
    PushController.prototype.registerTemplate,
    PushController.prototype.sendPush,
    PushController.prototype.sendHighPriority,
    PushController.prototype.revokeToken,
    PushController.prototype.schedulePush,
    PushController.prototype.cancelScheduledPush,
    PushController.prototype.connectWS,
    PushController.prototype.disconnectWS,
    PushController.prototype.sendWS,
    PushController.prototype.broadcastWS,
    PushController.prototype.reconnectWS,
    PushController.prototype.checkPriority,
    PushController.prototype.updateDndConfig,
    PushController.prototype.updateFrequencyCapConfig,
    PushController.prototype.checkFrequencyCap,
    PushController.prototype.sendEmail,
    PushController.prototype.sendSms,
    PushController.prototype.sendDualChannel,
    PushController.prototype.updateUserPreference,
    PushController.prototype.disableMarketingPush,
    PushController.prototype.enableMarketingPush,
    PushController.prototype.setUserDndHours,
    PushController.prototype.setPreferredChannel,
    PushController.prototype.sendSmartChannel,
    PushController.prototype.recordPushEvent,
    PushController.prototype.recordClickEvent,
  ]

  it('controller should keep push path and stay non-public', () => {
    assert.equal(Reflect.getMetadata('path', PushController), 'push')
    assert.equal(Reflect.getMetadata(IS_PUBLIC_KEY, PushController), undefined)
    assert.deepEqual(Reflect.getMetadata(TENANT_SCOPE_METADATA_KEY, PushController), {})
    assert.deepEqual(Reflect.getMetadata(PERMISSIONS_METADATA_KEY, PushController), ['notification:read'])
  })

  it('routes should keep REST metadata and tenant scope', () => {
    const cases = [
      [PushController.prototype.registerTemplate, 1, 'templates'],
      [PushController.prototype.sendPush, 1, 'send'],
      [PushController.prototype.sendHighPriority, 1, 'send-high-priority'],
      [PushController.prototype.revokeToken, 1, 'revoke-token'],
      [PushController.prototype.schedulePush, 1, 'schedule'],
      [PushController.prototype.cancelScheduledPush, 1, 'schedule/cancel'],
      [PushController.prototype.queryScheduledPushes, 0, 'schedule'],
      [PushController.prototype.connectWS, 1, 'ws/connect'],
      [PushController.prototype.disconnectWS, 1, 'ws/disconnect'],
      [PushController.prototype.sendWS, 1, 'ws/send'],
      [PushController.prototype.broadcastWS, 1, 'ws/broadcast'],
      [PushController.prototype.reconnectWS, 1, 'ws/reconnect'],
      [PushController.prototype.checkPriority, 1, 'priority/check'],
      [PushController.prototype.getPriorityLevels, 0, 'priority/levels'],
      [PushController.prototype.getDndConfig, 0, 'dnd/:tenantId'],
      [PushController.prototype.updateDndConfig, 4, 'dnd/:tenantId'],
      [PushController.prototype.checkDnd, 0, 'dnd/:tenantId/check'],
      [PushController.prototype.getFrequencyCapConfig, 0, 'frequency-cap/:tenantId'],
      [PushController.prototype.updateFrequencyCapConfig, 4, 'frequency-cap/:tenantId'],
      [PushController.prototype.getFrequencyCapStatus, 0, 'frequency-cap/:tenantId/status/:memberId'],
      [PushController.prototype.checkFrequencyCap, 1, 'frequency-cap/:tenantId/check/:memberId'],
      [PushController.prototype.getChannelHealth, 0, 'channels/health'],
      [PushController.prototype.sendEmail, 1, 'channels/email'],
      [PushController.prototype.sendSms, 1, 'channels/sms'],
      [PushController.prototype.sendDualChannel, 1, 'channels/send-dual'],
      [PushController.prototype.getStats, 0, 'stats'],
      [PushController.prototype.getPushHistory, 0, 'history/:deviceToken'],
      [PushController.prototype.getWSConnections, 0, 'ws/connections'],
      [PushController.prototype.getUserPreference, 0, 'preference/:tenantId/:memberId'],
      [PushController.prototype.updateUserPreference, 4, 'preference/:tenantId/:memberId'],
      [PushController.prototype.disableMarketingPush, 1, 'preference/:tenantId/:memberId/disable-marketing'],
      [PushController.prototype.enableMarketingPush, 1, 'preference/:tenantId/:memberId/enable-marketing'],
      [PushController.prototype.setUserDndHours, 1, 'preference/:tenantId/:memberId/dnd'],
      [PushController.prototype.setPreferredChannel, 1, 'preference/:tenantId/:memberId/channel'],
      [PushController.prototype.checkPushPreference, 0, 'preference/:tenantId/:memberId/check'],
      [PushController.prototype.getUserPreferredChannels, 0, 'preference/:tenantId/:memberId/channels'],
      [PushController.prototype.sendSmartChannel, 1, 'channels/send-smart'],
      [PushController.prototype.recordPushEvent, 1, 'events'],
      [PushController.prototype.recordClickEvent, 1, 'events/click'],
      [PushController.prototype.getPushDashboard, 0, 'dashboard/:tenantId'],
      [PushController.prototype.queryPushHistory, 0, 'history'],
    ] as const

    cases.forEach(([handler, method, path]) => {
      assert.equal(Reflect.getMetadata('method', handler), method)
      assert.equal(Reflect.getMetadata('path', handler), path)
      assert.deepEqual(resolveTenantScope(handler), {})
    })
  })

  it('read routes should reuse notification:read', () => {
    readHandlers.forEach((handler) => {
      assert.deepEqual(resolvePermissions(handler), ['notification:read'])
    })
  })

  it('write routes should reuse notification:write', () => {
    writeHandlers.forEach((handler) => {
      assert.deepEqual(resolvePermissions(handler), ['notification:write'])
    })
  })
})
