import 'reflect-metadata'
import assert from 'node:assert/strict'
import test from 'node:test'
import { ResilienceOperationsController } from './resilience-operations.controller'

test('resilience operations controller exposes expected HTTP method decorators', () => {
  // Verify controller has route metadata via @Controller decorator
  const controllerPath = Reflect.getMetadata('path', ResilienceOperationsController)
  assert.equal(controllerPath, 'foundation/resilience-operations')

  // getManagementMetadata has @Get metadata
  const metadataPath = Reflect.getMetadata('path', ResilienceOperationsController.prototype.getManagementMetadata)
  const metadataMethod = Reflect.getMetadata('method', ResilienceOperationsController.prototype.getManagementMetadata)
  assert.equal(metadataPath, 'management-metadata')
  assert.equal(metadataMethod, 0) // GET

  // getOperationsOverview has @Get metadata
  const overviewPath = Reflect.getMetadata('path', ResilienceOperationsController.prototype.getOperationsOverview)
  const overviewMethod = Reflect.getMetadata('method', ResilienceOperationsController.prototype.getOperationsOverview)
  assert.equal(overviewPath, 'overview')
  assert.equal(overviewMethod, 0) // GET

  // getObservabilitySignals has @Get metadata
  const obsPath = Reflect.getMetadata('path', ResilienceOperationsController.prototype.getObservabilitySignals)
  const obsMethod = Reflect.getMetadata('method', ResilienceOperationsController.prototype.getObservabilitySignals)
  assert.equal(obsPath, 'observability')
  assert.equal(obsMethod, 0) // GET

  // getRetryPolicies has @Get metadata
  const retryPath = Reflect.getMetadata('path', ResilienceOperationsController.prototype.getRetryPolicies)
  const retryMethod = Reflect.getMetadata('method', ResilienceOperationsController.prototype.getRetryPolicies)
  assert.equal(retryPath, 'retry-policies')
  assert.equal(retryMethod, 0) // GET

  // getRecoveryPlans has @Get metadata
  const plansPath = Reflect.getMetadata('path', ResilienceOperationsController.prototype.getRecoveryPlans)
  const plansMethod = Reflect.getMetadata('method', ResilienceOperationsController.prototype.getRecoveryPlans)
  assert.equal(plansPath, 'recovery-plans')
  assert.equal(plansMethod, 0) // GET

  // getRecoveryPlan has @Get metadata with param
  const planPath = Reflect.getMetadata('path', ResilienceOperationsController.prototype.getRecoveryPlan)
  const planMethod = Reflect.getMetadata('method', ResilienceOperationsController.prototype.getRecoveryPlan)
  assert.equal(planPath, 'recovery-plans/:resource')
  assert.equal(planMethod, 0) // GET

  // stageEdgeReplay has @Post metadata
  const stagePath = Reflect.getMetadata('path', ResilienceOperationsController.prototype.stageEdgeReplay)
  const stageMethod = Reflect.getMetadata('method', ResilienceOperationsController.prototype.stageEdgeReplay)
  assert.equal(stagePath, 'edge-replay/stage')
  assert.equal(stageMethod, 1) // POST
})
