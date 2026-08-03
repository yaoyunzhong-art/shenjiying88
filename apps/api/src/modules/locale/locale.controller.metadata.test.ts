import 'reflect-metadata'
import { describe, it } from 'vitest'
import assert from 'node:assert/strict'
import { LocaleController } from './locale.controller'

describe('LocaleController metadata', () => {
  it('controller should keep locale path', () => {
    assert.equal(Reflect.getMetadata('path', LocaleController), 'locale')
  })

  it('routes should keep REST metadata', () => {
    const cases = [
      [LocaleController.prototype.getTimeZone, 0, 'timezone/:countryCode'],
      [LocaleController.prototype.getCountryCode, 0, 'country/:timeZone'],
      [LocaleController.prototype.getNow, 0, 'now/:timeZone'],
      [LocaleController.prototype.formatDate, 1, 'format-date'],
      [LocaleController.prototype.formatNumber, 1, 'format-number'],
      [LocaleController.prototype.formatCurrency, 1, 'format-currency'],
      [LocaleController.prototype.convertTime, 1, 'convert-time'],
      [LocaleController.prototype.isWorkday, 1, 'is-workday'],
      [LocaleController.prototype.getConfig, 0, 'config'],
      [LocaleController.prototype.updateConfig, 1, 'config'],
    ] as const

    cases.forEach(([handler, method, path]) => {
      assert.equal(Reflect.getMetadata('method', handler), method)
      assert.equal(Reflect.getMetadata('path', handler), path)
    })
  })
})
