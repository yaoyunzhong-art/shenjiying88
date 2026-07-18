import 'reflect-metadata'
import assert from 'node:assert/strict'
import { afterAll, beforeAll, describe, it } from 'vitest'
import type { INestApplication } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import { PortalController } from './portal.controller'
import { PortalService } from './portal.service'

describe('Portal Swagger', () => {
  let app: INestApplication

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [PortalController],
      providers: [
        {
          provide: PortalService,
          useValue: {
            getBootstrap: () => ({
              tenantPortal: {},
              brandPortal: {},
              storePortal: {},
              marketProfile: {},
              regionalOverrides: [],
              foundationDependencies: [],
              foundationContracts: [],
            }),
            resolveTenantPortal: () => ({}),
            resolveBrandPortal: () => ({}),
            resolveStorePortal: () => ({}),
          },
        },
      ],
    }).compile()

    app = moduleRef.createNestApplication()
    await app.init()
  })

  afterAll(async () => {
    await app.close()
  })

  it('生成的 Swagger 文档包含 portal 关键路径与响应模型', () => {
    const doc = SwaggerModule.createDocument(
      app,
      new DocumentBuilder().setTitle('Portal Test').setVersion('1.0.0').build(),
    )

    assert.ok(doc.paths['/portals/bootstrap'])
    assert.ok(doc.paths['/portals/tenant-portal'])
    assert.ok(doc.paths['/portals/brand-portal'])
    assert.ok(doc.paths['/portals/store-portal'])

    const bootstrap = doc.paths['/portals/bootstrap'].get
    assert.deepEqual(bootstrap?.tags, ['portal'])

    const bootstrapResponse = bootstrap?.responses?.['200'] as
      | { content?: Record<string, { schema?: { $ref?: string } }> }
      | undefined
    const bootstrapSchema = bootstrapResponse?.content?.['application/json']?.schema
    assert.equal(bootstrapSchema?.$ref, '#/components/schemas/PortalBootstrapResponseDto')

    const tenantPortal = doc.paths['/portals/tenant-portal'].get
    const brandPortal = doc.paths['/portals/brand-portal'].get
    const storePortal = doc.paths['/portals/store-portal'].get
    const tenantSchema = (tenantPortal?.responses?.['200'] as
      | { content?: Record<string, { schema?: { $ref?: string } }> }
      | undefined)?.content?.['application/json']?.schema
    const brandSchema = (brandPortal?.responses?.['200'] as
      | { content?: Record<string, { schema?: { $ref?: string } }> }
      | undefined)?.content?.['application/json']?.schema
    const storeSchema = (storePortal?.responses?.['200'] as
      | { content?: Record<string, { schema?: { $ref?: string } }> }
      | undefined)?.content?.['application/json']?.schema

    assert.equal(tenantSchema?.$ref, '#/components/schemas/PortalDto')
    assert.equal(brandSchema?.$ref, '#/components/schemas/PortalDto')
    assert.equal(storeSchema?.$ref, '#/components/schemas/PortalDto')

    assert.ok(doc.components?.schemas?.PortalBootstrapResponseDto)
    assert.ok(doc.components?.schemas?.PortalDto)
    assert.ok(doc.components?.schemas?.MarketProfileDto)
    assert.ok(doc.components?.schemas?.MarketProfileCurrencyDto)
    assert.ok(doc.components?.schemas?.MarketProfileNetworkDto)
    assert.ok(doc.components?.schemas?.MarketProfileEmailDto)
    assert.ok(doc.components?.schemas?.RegionalOverrideDto)
    assert.ok(doc.components?.schemas?.RegionalOverrideEmailDto)
    assert.ok(doc.components?.schemas?.RegionalOverrideSocialDto)

    const bootstrapComponent = doc.components?.schemas?.PortalBootstrapResponseDto as
      | { properties?: Record<string, { $ref?: string; items?: { $ref?: string } }> }
      | undefined
    assert.equal(
      bootstrapComponent?.properties?.marketProfile?.$ref,
      '#/components/schemas/MarketProfileDto',
    )
    assert.equal(
      bootstrapComponent?.properties?.regionalOverrides?.items?.$ref,
      '#/components/schemas/RegionalOverrideDto',
    )
  })
})
