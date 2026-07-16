import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * E2E: Chain 智能合约 HTTP 链路
 *
 * 链路:
 *   HTTP → ChainController → PointsSettlementContract / RevenueShareContract / ContractExecutor / SmartContractService
 *
 * 验证:
 *   - 积分清算合约创建→审批→执行→查询
 *   - 分账合约创建→分配→参与者查询
 *   - 合约执行器部署→执行→结果查询
 *   - 链上智能合约部署→方法调用→Gas估算
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import { Controller, Get, Post, Body, Param, Inject } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import request from 'supertest'
import { ResponseInterceptor } from '../../common/interceptors/response.interceptor'
import { ChainController } from './chain.controller'
import {
  PointsSettlementContract,
  RevenueShareContract,
  ContractExecutor,
  SmartContractService,
  resetSmartContractTestState,
} from './smart-contract.service'

async function buildApp() {
  const pointsSettlement = new PointsSettlementContract()
  const revenueShare = new RevenueShareContract()
  const contractExecutor = new ContractExecutor()
  const smartContractService = new SmartContractService()

  const moduleRef = await Test.createTestingModule({
    controllers: [ChainController],
    providers: [
      { provide: PointsSettlementContract, useValue: pointsSettlement },
      { provide: RevenueShareContract, useValue: revenueShare },
      { provide: ContractExecutor, useValue: contractExecutor },
      { provide: SmartContractService, useValue: smartContractService },
    ],
  }).compile()

  const app = moduleRef.createNestApplication()
  app.useGlobalInterceptors(new ResponseInterceptor())
  await app.init()
  return { app, pointsSettlement, revenueShare }
}

beforeEach(() => {
  resetSmartContractTestState()
})

it('e2e: 积分清算合约创建→审批→执行→查询全流程', async () => {
  const { app } = await buildApp()
  try {
    // 1. 创建清算合约
    const createRes = await request(app.getHttpServer())
      .post('/chain/settlements')
      .send({
        payerId: 'corp-a',
        payerName: 'Corporation A',
        payees: [
          { payeeId: 'user-1', payeeName: 'Alice', amount: 500 },
          { payeeId: 'user-2', payeeName: 'Bob', amount: 300 },
        ],
      })
    assert.equal(createRes.statusCode, 201)
    const contractId = createRes.body.data.contractId
    assert.ok(contractId)
    assert.equal(createRes.body.data.status, 'Created')
    assert.equal(createRes.body.data.totalAmount, 800)

    // 2. 审批合约
    const approveRes = await request(app.getHttpServer())
      .post(`/chain/settlements/${contractId}/approve`)
    assert.equal(approveRes.statusCode, 201)
    assert.equal(approveRes.body.data.status, 'Approved')
    assert.ok(approveRes.body.data.approvedAt)

    // 3. 执行合约
    const execRes = await request(app.getHttpServer())
      .post(`/chain/settlements/${contractId}/execute`)
    assert.equal(execRes.statusCode, 201)
    assert.equal(execRes.body.data.status, 'Completed')
    assert.ok(execRes.body.data.executedAt)

    // 4. 查询合约状态
    const getRes = await request(app.getHttpServer())
      .get(`/chain/settlements/${contractId}`)
    assert.equal(getRes.statusCode, 200)
    assert.equal(getRes.body.data.status, 'Completed')
    assert.ok(getRes.body.data.participants.every((p: Record<string, unknown>) => p.transferred === true))
  } finally {
    await app.close()
  }
})

it('e2e: 分账合约创建→分配→参与者份额查询', async () => {
  const { app } = await buildApp()
  try {
    // 1. 创建分账合约
    const createRes = await request(app.getHttpServer())
      .post('/chain/revenue-shares')
      .send({
        totalRevenue: 10000,
        participants: [
          { participantId: 'partner-a', participantName: 'Partner A', ratio: 0.5 },
          { participantId: 'partner-b', participantName: 'Partner B', ratio: 0.3 },
          { participantId: 'partner-c', participantName: 'Partner C', ratio: 0.2 },
        ],
      })
    assert.equal(createRes.statusCode, 201)
    const contractId = createRes.body.data.contractId
    assert.ok(contractId)
    assert.equal(createRes.body.data.totalRevenue, 10000)
    assert.equal(createRes.body.data.status, 'Created')

    // 2. 执行分账
    const distRes = await request(app.getHttpServer())
      .post(`/chain/revenue-shares/${contractId}/distribute`)
    assert.equal(distRes.statusCode, 201)
    assert.equal(distRes.body.data.status, 'Completed')

    // 3. 查询参与者份额
    const shareRes = await request(app.getHttpServer())
      .get(`/chain/revenue-shares/${contractId}/participant/partner-a`)
    assert.equal(shareRes.statusCode, 200)
    assert.equal(shareRes.body.data.expected, 5000)
    assert.equal(shareRes.body.data.distributed, true)

    // 4. 查询分账历史
    const historyRes = await request(app.getHttpServer())
      .get(`/chain/revenue-shares/${contractId}/history`)
    assert.equal(historyRes.statusCode, 200)
    assert.ok(historyRes.body.data.length >= 3)
  } finally {
    await app.close()
  }
})

it('e2e: 合约执行器部署→执行→结果查询', async () => {
  const { app } = await buildApp()
  try {
    // 先创建一个结算合约
    const createRes = await request(app.getHttpServer())
      .post('/chain/settlements')
      .send({
        payerId: 'exec-corp',
        payerName: 'Exec Corp',
        payees: [{ payeeId: 'exec-user', payeeName: 'User', amount: 100 }],
      })
    const settlementId = createRes.body.data.contractId

    // 通过执行器部署 PointsSettlement
    const deployRes = await request(app.getHttpServer())
      .post('/chain/executor/deploy')
      .send({
        contractType: 'PointsSettlement',
        params: {
          payerId: 'exec-corp',
          payerName: 'Exec Corp',
          payees: [{ payeeId: 'exec-user', payeeName: 'User', amount: 100 }],
        },
      })
    assert.equal(deployRes.statusCode, 201)
    const deployedId = deployRes.body.data.deployedContractId
    assert.ok(deployedId)

    // 执行合约
    const execRes = await request(app.getHttpServer())
      .post('/chain/executor/execute')
      .send({ contractId: settlementId })
    assert.equal(execRes.statusCode, 201)
    assert.equal(execRes.body.data.success, true)

    // 查询执行结果
    const resultRes = await request(app.getHttpServer())
      .get(`/chain/executor/result/${settlementId}`)
    assert.equal(resultRes.statusCode, 200)
    assert.ok(resultRes.body.data.executedAt)
  } finally {
    await app.close()
  }
})

it('e2e: 链上智能合约部署→方法调用→Gas估算', async () => {
  const { app } = await buildApp()
  try {
    // 1. 部署智能合约
    const deployRes = await request(app.getHttpServer())
      .post('/chain/smart-contracts')
      .send({ name: 'TokenContract', params: ['ERC20', '1000000'] })
    assert.equal(deployRes.statusCode, 201)
    const contractId = deployRes.body.data.contractId
    assert.ok(contractId)
    assert.ok(deployRes.body.data.address)

    // 2. 执行合约方法
    const execRes = await request(app.getHttpServer())
      .post('/chain/smart-contracts/execute')
      .send({ contractId, method: 'transfer', args: ['recipient-addr', '100'] })
    assert.equal(execRes.statusCode, 201)
    assert.equal(execRes.body.data.success, true)

    // 3. 估算 Gas
    const gasRes = await request(app.getHttpServer())
      .post('/chain/smart-contracts/estimate-gas')
      .send({ contractId, method: 'transfer', args: ['addr', '50'] })
    assert.equal(gasRes.statusCode, 201)
    assert.ok(gasRes.body.data.gas > 0)

    // 4. 列出合约
    const listRes = await request(app.getHttpServer())
      .get('/chain/smart-contracts')
    assert.equal(listRes.statusCode, 200)
    assert.ok(listRes.body.data.length >= 1)
  } finally {
    await app.close()
  }
})

it('e2e: 积分清算合约取消流程', async () => {
  const { app } = await buildApp()
  try {
    const createRes = await request(app.getHttpServer())
      .post('/chain/settlements')
      .send({
        payerId: 'cancel-corp',
        payerName: 'Cancel Corp',
        payees: [{ payeeId: 'cancel-user', payeeName: 'User', amount: 200 }],
      })
    const contractId = createRes.body.data.contractId

    // 审批后取消
    await request(app.getHttpServer()).post(`/chain/settlements/${contractId}/approve`)
    const cancelRes = await request(app.getHttpServer())
      .post(`/chain/settlements/${contractId}/cancel`)
    assert.equal(cancelRes.statusCode, 201)
    assert.equal(cancelRes.body.data.status, 'Cancelled')
    assert.ok(cancelRes.body.data.cancelledAt)
  } finally {
    await app.close()
  }
})

it('e2e: 智能合约验证与事件查询', async () => {
  const { app } = await buildApp()
  try {
    const deployRes = await request(app.getHttpServer())
      .post('/chain/smart-contracts')
      .send({ name: 'VerifyToken', params: [] })
    const contractId = deployRes.body.data.contractId

    // 验证合约
    const verifyRes = await request(app.getHttpServer())
      .post('/chain/smart-contracts/verify')
      .send({ contractId, sourceCode: 'contract source', compiler: 'solc-0.8.0' })
    assert.equal(verifyRes.statusCode, 201)
    assert.equal(verifyRes.body.data.verified, true)

    // 查询事件
    const eventsRes = await request(app.getHttpServer())
      .get(`/chain/smart-contracts/${contractId}/events`)
    assert.equal(eventsRes.statusCode, 200)
    assert.ok(Array.isArray(eventsRes.body.data))
  } finally {
    await app.close()
  }
})
