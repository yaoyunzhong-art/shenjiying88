import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
import 'reflect-metadata'
import assert from 'node:assert/strict'
import { validate } from 'class-validator'
import { plainToInstance } from 'class-transformer'
import {
  JoinQueueDto,
  QueueQueryDto,
  CallNextDto,
  CreateQueueDto,
  UpdateQueueDto
} from './queue.dto'
import { QueueType, QueueStatus } from './queue.entity'

async function validateDto<T extends object>(cls: new () => T, payload: Record<string, unknown>) {
  const instance = plainToInstance(cls, payload)
  const errors = await validate(instance as unknown as object)
  return errors
}

describe('queue.dto: JoinQueueDto', () => {
  it('accepts valid join payload', async () => {
    const errors = await validateDto(JoinQueueDto, {
      queueType: QueueType.Waiting,
      memberId: 'member-1',
      memberName: 'Alice',
      resourceId: 'r-1'
    })
    assert.equal(errors.length, 0)
  })

  it('rejects missing queueType', async () => {
    const errors = await validateDto(JoinQueueDto, { memberId: 'm1' })
    assert.ok(errors.length > 0)
    assert.ok(errors.some((e) => e.property === 'queueType'))
  })

  it('rejects invalid queueType value', async () => {
    const errors = await validateDto(JoinQueueDto, { queueType: 'INVALID', memberId: 'm1' })
    assert.ok(errors.length > 0)
  })

  it('rejects empty memberId', async () => {
    const errors = await validateDto(JoinQueueDto, { queueType: QueueType.Waiting, memberId: '' })
    assert.ok(errors.length > 0)
    assert.ok(errors.some((e) => e.property === 'memberId'))
  })

  it('accepts optional priority=0', async () => {
    const errors = await validateDto(JoinQueueDto, {
      queueType: QueueType.Booking,
      memberId: 'm',
      priority: 0
    })
    assert.equal(errors.length, 0)
  })

  it('rejects negative priority', async () => {
    const errors = await validateDto(JoinQueueDto, {
      queueType: QueueType.Waiting,
      memberId: 'm',
      priority: -1
    })
    assert.ok(errors.length > 0)
  })

  it('rejects priority > 100', async () => {
    const errors = await validateDto(JoinQueueDto, {
      queueType: QueueType.Waiting,
      memberId: 'm',
      priority: 101
    })
    assert.ok(errors.length > 0)
  })
})

describe('queue.dto: QueueQueryDto', () => {
  it('accepts empty query (all optional)', async () => {
    const errors = await validateDto(QueueQueryDto, {})
    assert.equal(errors.length, 0)
  })

  it('accepts full filter payload', async () => {
    const errors = await validateDto(QueueQueryDto, {
      type: QueueType.Booking,
      status: QueueStatus.Waiting,
      resourceId: 'r-1',
      memberId: 'm-1',
      userId: 'u-1',
      queueNumber: 'A001',
      pageSize: 20,
      page: 0,
      sortBy: 'createdAt',
      sortOrder: 'asc'
    })
    assert.equal(errors.length, 0)
  })

  it('accepts memberId filter', async () => {
    const errors = await validateDto(QueueQueryDto, { memberId: 'm-1' })
    assert.equal(errors.length, 0)
  })

  it('rejects invalid status', async () => {
    const errors = await validateDto(QueueQueryDto, { status: 'INVALID' })
    assert.ok(errors.length > 0)
  })

  it('rejects pageSize > 100', async () => {
    const errors = await validateDto(QueueQueryDto, { pageSize: 200 })
    assert.ok(errors.length > 0)
  })

  it('rejects negative pageSize', async () => {
    const errors = await validateDto(QueueQueryDto, { pageSize: 0 })
    assert.ok(errors.length > 0)
  })

  it('rejects negative page', async () => {
    const errors = await validateDto(QueueQueryDto, { page: -1 })
    assert.ok(errors.length > 0)
  })

  it('rejects invalid sortOrder', async () => {
    const errors = await validateDto(QueueQueryDto, { sortOrder: 'invalid' as 'asc' | 'desc' })
    assert.ok(errors.length > 0)
  })
})

describe('queue.dto: CallNextDto', () => {
  it('accepts valid call-next payload', async () => {
    const errors = await validateDto(CallNextDto, { resourceId: 'r-1' })
    assert.equal(errors.length, 0)
  })

  it('rejects missing resourceId', async () => {
    const errors = await validateDto(CallNextDto, {})
    assert.ok(errors.length > 0)
  })
})

describe('queue.dto: CreateQueueDto (back-compat)', () => {
  it('accepts valid create payload', async () => {
    const errors = await validateDto(CreateQueueDto, {
      type: QueueType.Waiting,
      userId: 'u-1',
      userName: 'Alice',
      partySize: 2
    })
    assert.equal(errors.length, 0)
  })

  it('rejects missing userName', async () => {
    const errors = await validateDto(CreateQueueDto, {
      type: QueueType.Waiting,
      userId: 'u-1',
      partySize: 2
    })
    assert.ok(errors.length > 0)
  })

  it('rejects partySize > 99', async () => {
    const errors = await validateDto(CreateQueueDto, {
      type: QueueType.Waiting,
      userId: 'u-1',
      userName: 'u',
      partySize: 100
    })
    assert.ok(errors.length > 0)
  })

  it('rejects partySize < 1', async () => {
    const errors = await validateDto(CreateQueueDto, {
      type: QueueType.Waiting,
      userId: 'u-1',
      userName: 'u',
      partySize: 0
    })
    assert.ok(errors.length > 0)
  })
})

describe('queue.dto: UpdateQueueDto', () => {
  it('accepts empty update (all optional)', async () => {
    const errors = await validateDto(UpdateQueueDto, {})
    assert.equal(errors.length, 0)
  })

  it('accepts partial update', async () => {
    const errors = await validateDto(UpdateQueueDto, { partySize: 4 })
    assert.equal(errors.length, 0)
  })

  it('rejects partySize out of range', async () => {
    const errors = await validateDto(UpdateQueueDto, { partySize: 200 })
    assert.ok(errors.length > 0)
  })
})
