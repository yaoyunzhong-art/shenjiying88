import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
import 'reflect-metadata'
import assert from 'node:assert/strict'
import { Test, type TestingModule } from '@nestjs/testing'
import request from 'supertest'
import { MultimediaController } from './multimedia.controller'
import { MultimediaService } from './multimedia.service'

describe('MultimediaController HTTP query binding', () => {
  let moduleRef: TestingModule
  let app: any
  let capturedQuery: unknown
  let backendSeq = 0
  let backendItems: Array<Record<string, unknown>> = []
  const multimediaServiceStub = {
    async listAssets(query: unknown) {
      capturedQuery = query
      return []
    },
    async addStorageBackend(input: {
      name: string
      type: string
      bucket: string
      region: string
      endpoint?: string
      cdnDomain?: string
      isDefault?: boolean
    }) {
      const item = {
        id: `storage-${++backendSeq}`,
        name: input.name,
        type: input.type,
        bucket: input.bucket,
        region: input.region,
        endpoint: input.endpoint,
        credentialsEncrypted: 'secret',
        cdnDomain: input.cdnDomain,
        isDefault: input.isDefault ?? false,
        enabled: true,
        createdAt: '2026-06-30T00:00:00.000Z',
        updatedAt: '2026-06-30T00:00:00.000Z',
      }
      backendItems.push(item)
      return item
    },
    async listStorageBackends() {
      return backendItems
    },
  }

  beforeAll(async () => {
    capturedQuery = undefined
    backendSeq = 0
    backendItems = []
    moduleRef = await Test.createTestingModule({
      controllers: [MultimediaController],
      providers: [
        {
          provide: MultimediaService,
          useValue: multimediaServiceStub,
        },
      ],
    }).compile()

    app = moduleRef.createNestApplication()
    await app.init()
    ;(moduleRef.get(MultimediaController) as unknown as { service: typeof multimediaServiceStub }).service = multimediaServiceStub
  })

  afterAll(async () => {
    await app?.close()
  })

  it('GET /multimedia/assets should bind query string filters', async () => {
    const response = await request(app.getHttpServer())
      .get('/multimedia/assets')
      .query({
        assetType: 'image',
        tags: ['frontdesk', 'customer'],
        linkedEntityId: 'member-001',
        limit: '3',
      })

    assert.equal(response.status, 200)
    assert.deepEqual(response.body, {
      items: [],
      total: 0,
    })
    assert.deepEqual(capturedQuery, {
      assetType: 'image',
      tags: ['frontdesk', 'customer'],
      linkedEntityId: 'member-001',
      limit: 3,
    })
  })

  it('POST/GET /multimedia/storage-backends should expose backend contract fields', async () => {
    const createResponse = await request(app.getHttpServer())
      .post('/multimedia/storage-backends')
      .send({
        name: 'oss-sh',
        type: 'oss',
        bucket: 'media-bucket',
        region: 'cn-shanghai',
        endpoint: 'https://oss-cn-shanghai.aliyuncs.com',
        credentials: 'plain-secret',
        cdnDomain: 'media.shenjiying88.com',
        isDefault: true,
      })

    assert.equal(createResponse.status, 201)
    assert.equal(createResponse.body.name, 'oss-sh')
    assert.equal(createResponse.body.endpoint, 'https://oss-cn-shanghai.aliyuncs.com')
    assert.equal(createResponse.body.cdnDomain, 'media.shenjiying88.com')
    assert.equal(createResponse.body.createdAt, '2026-06-30T00:00:00.000Z')
    assert.equal(
      Object.prototype.hasOwnProperty.call(createResponse.body, 'credentialsEncrypted'),
      false,
    )

    const listResponse = await request(app.getHttpServer())
      .get('/multimedia/storage-backends')

    assert.equal(listResponse.status, 200)
    assert.equal(listResponse.body.total, undefined)
    assert.equal(listResponse.body.items.length, 1)
    assert.equal(listResponse.body.items[0]?.endpoint, 'https://oss-cn-shanghai.aliyuncs.com')
    assert.equal(listResponse.body.items[0]?.cdnDomain, 'media.shenjiying88.com')
    assert.equal(listResponse.body.items[0]?.createdAt, '2026-06-30T00:00:00.000Z')
    assert.equal(
      Object.prototype.hasOwnProperty.call(listResponse.body.items[0] ?? {}, 'credentialsEncrypted'),
      false,
    )
  })
})
