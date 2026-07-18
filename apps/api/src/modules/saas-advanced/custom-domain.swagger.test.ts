import 'reflect-metadata'
import assert from 'node:assert/strict'
import { afterAll, beforeAll, describe, it } from 'vitest'
import type { INestApplication } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import { CustomDomainController } from './custom-domain.controller'
import { CustomDomainService } from './custom-domain.service'

describe('CustomDomain Swagger', () => {
  let app: INestApplication

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [CustomDomainController],
      providers: [
        {
          provide: CustomDomainService,
          useValue: {
            addDomain: async () => ({}),
            list: async () => [],
            getById: async () => ({
              verificationHost: '_shenjiying-verify.example.io',
              verificationToken: 'token',
            }),
            remove: async () => undefined,
            getCurrentPrimary: async () => null,
            getCurrentPrimaryBatch: async () => [],
            listActiveWithoutPrimary: async () => [],
            verify: async () => ({}),
            requestSsl: async () => ({}),
            resolveTenantByHost: () => null,
            setPrimary: async () => ({}),
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

  it('生成的 Swagger 文档包含 custom-domain 关键路径和 query 参数', () => {
    const doc = SwaggerModule.createDocument(
      app,
      new DocumentBuilder().setTitle('CustomDomain Test').setVersion('1.0.0').build(),
    )

    assert.ok(doc.paths['/saas/domain'])
    assert.ok(doc.paths['/saas/domain/primary/current'])
    assert.ok(doc.paths['/saas/domain/primary/batch/current'])
    assert.ok(doc.paths['/saas/domain/governance/active-without-primary'])
    assert.ok(doc.paths['/saas/domain/{id}'])
    assert.ok(doc.paths['/saas/domain/{id}/verify'])
    assert.ok(doc.paths['/saas/domain/{id}/ssl'])
    assert.ok(doc.paths['/saas/domain/{id}/primary'])
    assert.ok(doc.paths['/saas/domain/resolve/host'])
    assert.ok(doc.paths['/saas/domain/validate'])

    const listDomains = doc.paths['/saas/domain'].get
    const listParameters = (listDomains?.parameters ?? []) as Array<{ name?: string; in?: string }>
    const currentPrimary = doc.paths['/saas/domain/primary/current'].get
    const currentParameters = (currentPrimary?.parameters ?? []) as Array<{ name?: string; in?: string }>
    const batchCurrent = doc.paths['/saas/domain/primary/batch/current'].post
    const governance = doc.paths['/saas/domain/governance/active-without-primary'].get
    const resolveHost = doc.paths['/saas/domain/resolve/host'].get
    const hostParameter = resolveHost?.parameters?.[0] as { name?: string; in?: string } | undefined

    assert.ok(listDomains)
    assert.ok(listParameters.some((parameter) => parameter.name === 'status' && parameter.in === 'query'))
    assert.ok(listParameters.some((parameter) => parameter.name === 'page' && parameter.in === 'query'))
    assert.ok(listParameters.some((parameter) => parameter.name === 'sortBy' && parameter.in === 'query'))
    assert.ok(listParameters.some((parameter) => parameter.name === 'sortOrder' && parameter.in === 'query'))
    assert.ok(currentParameters.some((parameter) => parameter.name === 'scopeType' && parameter.in === 'query'))
    assert.ok(currentParameters.some((parameter) => parameter.name === 'brandId' && parameter.in === 'query'))
    assert.ok(currentParameters.some((parameter) => parameter.name === 'storeId' && parameter.in === 'query'))
    assert.ok(batchCurrent?.requestBody)
    assert.ok(governance)

    assert.ok(resolveHost)
    assert.deepEqual(resolveHost?.tags, ['saas-domain'])
    assert.equal(hostParameter?.name, 'host')
    assert.equal(hostParameter?.in, 'query')

    const deleteDomain = doc.paths['/saas/domain/{id}'].delete
    assert.ok(deleteDomain)
    assert.ok(deleteDomain?.responses?.['204'])

    const addDomain = doc.paths['/saas/domain'].post
    assert.ok(addDomain?.requestBody)
    assert.ok(doc.components?.schemas?.AddDomainRequest)
    assert.ok(doc.components?.schemas?.DomainListResponse)
    assert.ok(doc.components?.schemas?.CurrentPrimaryDomainResponse)
    assert.ok(doc.components?.schemas?.BatchCurrentPrimaryDomainRequest)
    assert.ok(doc.components?.schemas?.BatchCurrentPrimaryDomainResponse)
    assert.ok(doc.components?.schemas?.ActiveWithoutPrimaryGovernanceResponse)
    assert.ok(doc.components?.schemas?.ResolveHostResponse)
  })
})
