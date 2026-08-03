import 'reflect-metadata'
import assert from 'node:assert/strict'
import { describe, it } from 'vitest'

import { OmnichannelController } from './omnichannel.controller'

describe('OmnichannelController metadata', () => {
  it('controller should keep omnichannel path', () => {
    assert.equal(Reflect.getMetadata('path', OmnichannelController), 'omnichannel')
  })

  it('routes should keep REST metadata', () => {
    const cases = [
      [OmnichannelController.prototype.reach, 1, 'reach'],
      [OmnichannelController.prototype.reachAll, 1, 'reach-all'],
      [OmnichannelController.prototype.getHistory, 0, 'history/:memberId'],
      [OmnichannelController.prototype.getChannelStatus, 0, 'channel/:channel'],
      [OmnichannelController.prototype.setChannelStatus, 4, 'channel/:channel'],
      [OmnichannelController.prototype.listChannels, 0, 'channels'],
      [OmnichannelController.prototype.sendSms, 1, 'sms/send'],
      [OmnichannelController.prototype.sendSmsBackup, 1, 'sms/send-backup'],
      [OmnichannelController.prototype.sendSmsFallback, 1, 'sms/send-fallback'],
      [OmnichannelController.prototype.getSmsStatus, 0, 'sms/status/:messageId'],
      [OmnichannelController.prototype.sendEmail, 1, 'email/send'],
      [OmnichannelController.prototype.sendBulkEmail, 1, 'email/bulk'],
      [OmnichannelController.prototype.renderTemplate, 1, 'email/render'],
      [OmnichannelController.prototype.getEmailStatus, 0, 'email/status/:messageId'],
    ] as const

    cases.forEach(([handler, method, path]) => {
      assert.equal(Reflect.getMetadata('method', handler), method)
      assert.equal(Reflect.getMetadata('path', handler), path)
    })
  })
})
