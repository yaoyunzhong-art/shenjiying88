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
            verify: async () => ({}),
            requestSsl: async () => ({}),
            resolveTenantByHost: () => null,
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
    assert.ok(doc.paths['/saas/domain/{id}'])
    assert.ok(doc.paths['/saas/domain/{id}/verify'])
    assert.ok(doc.paths['/saas/domain/{id}/ssl'])
    assert.ok(doc.paths['/saas/domain/{id}/primary'])
    assert.ok(doc.paths['/saas/domain/resolve/host'])
    assert.ok(doc.paths['/saas/domain/validate'])

    const listDomains = doc.paths['/saas/domain'].get
    const listParameters = (listDomains?.parameters ?? []) as Array<{ name?: string; in?: string }>
    const resolveHost = doc.paths['/saas/domain/resolve/host'].get
    const hostParameter = resolveHost?.parameters?.[0] as { name?: string; in?: string } | undefined

    assert.ok(listDomains)
    assert.ok(listParameters.some((parameter) => parameter.name === 'status' && parameter.in === 'query'))
    assert.ok(listParameters.some((parameter) => parameter.name === 'page' && parameter.in === 'query'))
    assert.ok(listParameters.some((parameter) => parameter.name === 'sortBy' && parameter.in === 'query'))
    assert.ok(listParameters.some((parameter) => parameter.name === 'sortOrder' && parameter.in === 'query'))

    assert.ok(resolveHost)
    assert.deepEqual(resolveHost?.tags, ['saas-domain'])
    assert.equal(hostParameter?.name, 'host')
    assert.equal(hostParameter?.in, 'query')

    const addDomain = doc.paths['/saas/domain'].post
    assert.ok(addDomain?.requestBody)
    assert.ok(doc.components?.schemas?.AddDomainRequest)
    assert.ok(doc.components?.schemas?.DomainListResponse)
    assert.ok(doc.components?.schemas?.ResolveHostResponse)
  })
})
