import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
import 'reflect-metadata'
import assert from 'node:assert/strict'
import { FoundationController } from './foundation.controller'
import { FoundationService } from './foundation.service'

 
class MockFoundationService {
  getBlueprint() { return { generatedAt: new Date().toISOString() } }
  getModuleCatalog() { return [] }
  getConsumerCatalog() { return [] }
  getConsumerDependency() { return {} }
  getOperationsOverview() { return {} }
  getOperationsAlerts() { return {} }
  getOperationsAlertsCatalog() { return {} }
  getOperationsAlertDrilldown() { return {} }
  acknowledgeOperationsAlert() { return {} }
  muteOperationsAlert() { return {} }
  unmuteOperationsAlert() { return {} }
  getOperationsModuleDetail() { return {} }
}
 

it('foundation controller path metadata is set', () => {
  const path = Reflect.getMetadata('path', FoundationController)
  assert.equal(path, 'foundation')
})

it('getBootstrap has GET metadata with path bootstrap', () => {
  const method = Reflect.getMetadata('method', FoundationController.prototype.getBootstrap)
  const path = Reflect.getMetadata('path', FoundationController.prototype.getBootstrap)
  assert.equal(method, 0)
  assert.equal(path, 'bootstrap')
})

it('getModules has GET metadata with path modules', () => {
  const method = Reflect.getMetadata('method', FoundationController.prototype.getModules)
  const path = Reflect.getMetadata('path', FoundationController.prototype.getModules)
  assert.equal(method, 0)
  assert.equal(path, 'modules')
})

it('getOverview has GET metadata with path overview', () => {
  const method = Reflect.getMetadata('method', FoundationController.prototype.getOperationsOverview)
  const path = Reflect.getMetadata('path', FoundationController.prototype.getOperationsOverview)
  assert.equal(method, 0)
  assert.equal(path, 'overview')
})

it('getOverviewAlerts has GET metadata with path overview/alerts', () => {
  const method = Reflect.getMetadata('method', FoundationController.prototype.getOperationsAlerts)
  const path = Reflect.getMetadata('path', FoundationController.prototype.getOperationsAlerts)
  assert.equal(method, 0)
  assert.equal(path, 'overview/alerts')
})

it('acknowledgeOperationsAlert has POST metadata with path overview/alerts/:code/ack', () => {
  const method = Reflect.getMetadata('method', FoundationController.prototype.acknowledgeOperationsAlert)
  const path = Reflect.getMetadata('path', FoundationController.prototype.acknowledgeOperationsAlert)
  assert.equal(method, 1)
  assert.equal(path, 'overview/alerts/:code/ack')
})

it('muteOperationsAlert has POST metadata with path overview/alerts/:code/mute', () => {
  const method = Reflect.getMetadata('method', FoundationController.prototype.muteOperationsAlert)
  const path = Reflect.getMetadata('path', FoundationController.prototype.muteOperationsAlert)
  assert.equal(method, 1)
  assert.equal(path, 'overview/alerts/:code/mute')
})

it('unmuteOperationsAlert has POST metadata with path overview/alerts/:code/unmute', () => {
  const method = Reflect.getMetadata('method', FoundationController.prototype.unmuteOperationsAlert)
  const path = Reflect.getMetadata('path', FoundationController.prototype.unmuteOperationsAlert)
  assert.equal(method, 1)
  assert.equal(path, 'overview/alerts/:code/unmute')
})

it('getConsumers has GET metadata with path consumers', () => {
  const method = Reflect.getMetadata('method', FoundationController.prototype.getConsumers)
  const path = Reflect.getMetadata('path', FoundationController.prototype.getConsumers)
  assert.equal(method, 0)
  assert.equal(path, 'consumers')
})

it('getConsumer has GET metadata with path consumers/:consumer', () => {
  const method = Reflect.getMetadata('method', FoundationController.prototype.getConsumer)
  const path = Reflect.getMetadata('path', FoundationController.prototype.getConsumer)
  assert.equal(method, 0)
  assert.equal(path, 'consumers/:consumer')
})

it('getBootstrap delegates to foundationService.getBlueprint', () => {
  const svc = new MockFoundationService() as unknown as FoundationService
  const ctrl = new FoundationController(svc)
  const result = ctrl.getBootstrap({} as any)
  assert.ok(typeof result === 'object' && result !== null)
  assert.ok('generatedAt' in result)
})

it('getModules delegates to foundationService.getModuleCatalog', () => {
  const svc = new MockFoundationService() as unknown as FoundationService
  const ctrl = new FoundationController(svc)
  const result = ctrl.getModules()
  assert.ok(Array.isArray(result))
})

it('getConsumers delegates to foundationService.getConsumerCatalog', () => {
  const svc = new MockFoundationService() as unknown as FoundationService
  const ctrl = new FoundationController(svc)
  const result = ctrl.getConsumers()
  assert.ok(Array.isArray(result))
})

it('getConsumer delegates to foundationService.getConsumerDependency', () => {
  const svc = new MockFoundationService() as unknown as FoundationService
  const ctrl = new FoundationController(svc)
  const result = ctrl.getConsumer('market')
  assert.ok(typeof result === 'object' && result !== null)
})
