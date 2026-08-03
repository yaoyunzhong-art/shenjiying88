import 'reflect-metadata'
import { describe, it } from 'vitest'
import assert from 'node:assert/strict'
import { I18nController } from './i18n.controller'

describe('I18nController metadata', () => {
  it('controller should keep i18n path', () => {
    assert.equal(Reflect.getMetadata('path', I18nController), 'i18n')
  })

  it('routes should keep REST metadata', () => {
    const cases = [
      [I18nController.prototype.createTranslation, 1, 'translations'],
      [I18nController.prototype.queryTranslations, 0, 'translations'],
      [I18nController.prototype.updateTranslation, 2, 'translations/:id'],
      [I18nController.prototype.bulkRegister, 1, 'translations/bulk'],
      [I18nController.prototype.extractKeysFromSource, 0, 'translations/extract'],
      [I18nController.prototype.listLocales, 0, 'locales'],
      [I18nController.prototype.validate, 0, 'validate'],
      [I18nController.prototype.validateWithBody, 1, 'validate'],
    ] as const

    for (const [handler, method, path] of cases) {
      assert.equal(Reflect.getMetadata('method', handler), method)
      assert.equal(Reflect.getMetadata('path', handler), path)
    }
  })
})
