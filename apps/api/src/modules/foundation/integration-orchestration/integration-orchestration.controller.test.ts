import 'reflect-metadata'
import assert from 'node:assert/strict'
import test from 'node:test'
import { IntegrationOrchestrationController } from './integration-orchestration.controller'
import {
  PERMISSIONS_METADATA_KEY,
  ROLES_METADATA_KEY,
  TENANT_SCOPE_METADATA_KEY
} from '../identity-access/identity-access.decorator'

test('integration orchestration controller exposes expected HTTP method decorators', () => {
  // Verify controller has route metadata via @Controller decorator
  const controllerPath = Reflect.getMetadata('path', IntegrationOrchestrationController)
  assert.equal(controllerPath, 'foundation/integration-orchestration')

  // getWebhookSources has @Get metadata  
  const webhookSourcesPath = Reflect.getMetadata('path', IntegrationOrchestrationController.prototype.getWebhookSources)
  const webhookSourcesMethod = Reflect.getMetadata('method', IntegrationOrchestrationController.prototype.getWebhookSources)
  assert.equal(webhookSourcesPath, 'webhooks/sources')
  assert.equal(webhookSourcesMethod, 0) // GET

  // getEvents has @Get metadata
  const eventsPath = Reflect.getMetadata('path', IntegrationOrchestrationController.prototype.getEvents)
  const eventsMethod = Reflect.getMetadata('method', IntegrationOrchestrationController.prototype.getEvents)
  assert.equal(eventsPath, 'events')
  assert.equal(eventsMethod, 0) // GET

  // publishEvent has @Post metadata
  const publishPath = Reflect.getMetadata('path', IntegrationOrchestrationController.prototype.publishEvent)
  const publishMethod = Reflect.getMetadata('method', IntegrationOrchestrationController.prototype.publishEvent)
  assert.equal(publishPath, 'events')
  assert.equal(publishMethod, 1) // POST

  // ingestWebhook has @Post metadata with param
  const ingestPath = Reflect.getMetadata('path', IntegrationOrchestrationController.prototype.ingestWebhook)
  const ingestMethod = Reflect.getMetadata('method', IntegrationOrchestrationController.prototype.ingestWebhook)
  assert.equal(ingestPath, 'webhooks/:source/ingest')
  assert.equal(ingestMethod, 1) // POST
})

test('integration orchestration controller has no access control decorators (public webhook endpoints)', () => {
  const tenantScope = Reflect.getMetadata(TENANT_SCOPE_METADATA_KEY, IntegrationOrchestrationController)
  assert.equal(tenantScope, undefined)

  const publishPermissions = Reflect.getMetadata(PERMISSIONS_METADATA_KEY, IntegrationOrchestrationController.prototype.publishEvent)
  assert.equal(publishPermissions, undefined)

  const publishRoles = Reflect.getMetadata(ROLES_METADATA_KEY, IntegrationOrchestrationController.prototype.publishEvent)
  assert.equal(publishRoles, undefined)
})

test('integration orchestration controller constructor accepts service dependency', () => {
  // Controller can be instantiated with a mock service (structural check)
  const controller = new IntegrationOrchestrationController({} as any)
  assert.ok(controller instanceof IntegrationOrchestrationController)
  assert.equal(typeof controller.getWebhookSources, 'function')
  assert.equal(typeof controller.getEvents, 'function')
  assert.equal(typeof controller.publishEvent, 'function')
  assert.equal(typeof controller.ingestWebhook, 'function')
})
