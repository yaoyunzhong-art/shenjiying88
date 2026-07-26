import 'reflect-metadata'
import { describe, it } from 'vitest'
import assert from 'node:assert/strict'
import { ContractManagerController } from './contract-manager.controller'
import {
  PERMISSIONS_METADATA_KEY,
  TENANT_SCOPE_METADATA_KEY,
} from '../foundation/identity-access/identity-access.decorator'
import { IS_PUBLIC_KEY } from '../foundation/identity-access/public.decorator'

const resolvePermissions = (handler: Function) =>
  Reflect.getMetadata(PERMISSIONS_METADATA_KEY, handler) ??
  Reflect.getMetadata(PERMISSIONS_METADATA_KEY, ContractManagerController)

const resolveTenantScope = (handler: Function) =>
  Reflect.getMetadata(TENANT_SCOPE_METADATA_KEY, handler) ??
  Reflect.getMetadata(TENANT_SCOPE_METADATA_KEY, ContractManagerController)

describe('ContractManagerController metadata', () => {
  const readHandlers = [
    ContractManagerController.prototype.listContracts,
    ContractManagerController.prototype.getContract,
    ContractManagerController.prototype.getExpiringContracts,
    ContractManagerController.prototype.getExpiredContracts,
    ContractManagerController.prototype.listClauses,
  ]

  const createHandlers = [
    ContractManagerController.prototype.createContract,
    ContractManagerController.prototype.seedMockData,
  ]

  const updateHandlers = [ContractManagerController.prototype.updateContract]
  const terminateHandlers = [ContractManagerController.prototype.updateContractStatus]
  const clauseHandlers = [
    ContractManagerController.prototype.addClause,
    ContractManagerController.prototype.bulkAddClauses,
    ContractManagerController.prototype.updateClause,
    ContractManagerController.prototype.deleteClause,
  ]

  it('controller should no longer stay public', () => {
    assert.equal(Reflect.getMetadata(IS_PUBLIC_KEY, ContractManagerController), undefined)
  })

  it('all routes should require tenant scope', () => {
    ;[
      ...readHandlers,
      ...createHandlers,
      ...updateHandlers,
      ...terminateHandlers,
      ...clauseHandlers,
    ].forEach((handler) => {
      assert.deepStrictEqual(resolveTenantScope(handler), {})
    })
  })

  it('read routes should reuse contracts:read', () => {
    readHandlers.forEach((handler) => {
      assert.deepStrictEqual(resolvePermissions(handler), ['contracts:read'])
    })
  })

  it('create routes should reuse contract:create', () => {
    createHandlers.forEach((handler) => {
      assert.deepStrictEqual(resolvePermissions(handler), ['contract:create'])
    })
  })

  it('update routes should reuse contract:update', () => {
    updateHandlers.forEach((handler) => {
      assert.deepStrictEqual(resolvePermissions(handler), ['contract:update'])
    })
  })

  it('terminate routes should reuse contract:terminate', () => {
    terminateHandlers.forEach((handler) => {
      assert.deepStrictEqual(resolvePermissions(handler), ['contract:terminate'])
    })
  })

  it('clause routes should reuse contract:clause:manage', () => {
    clauseHandlers.forEach((handler) => {
      assert.deepStrictEqual(resolvePermissions(handler), ['contract:clause:manage'])
    })
  })
})
