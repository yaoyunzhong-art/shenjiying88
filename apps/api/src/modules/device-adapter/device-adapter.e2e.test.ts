import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * E2E: Device-Adapter 设备适配器 HTTP 链路
 *
 * 链路:
 *   HTTP → DeviceAdapterController → DeviceAdapterService (策略模式: 按品牌适配)
 *
 * 验证:
 *   - 设备注册 → 连接 → POS交易 → 断开
 *   - 多种设备类型(POS/闸机/扫描仪/打印机)操作
 *   - 协议转换(不同品牌适配器不同协议)
 *   - 批量连接与设备状态
 *   - 命令历史记录
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import { Test } from '@nestjs/testing'
import request from 'supertest'
import { ResponseInterceptor } from '../../common/interceptors/response.interceptor'
import { DeviceAdapterController } from './device-adapter.controller'
import { DeviceAdapterService } from './device-adapter.service'

async function buildApp() {
  const deviceAdapterService = new DeviceAdapterService()

  const moduleRef = await Test.createTestingModule({
    controllers: [DeviceAdapterController],
    providers: [
      { provide: DeviceAdapterService, useValue: deviceAdapterService },
    ],
  }).compile()

  const app = moduleRef.createNestApplication()
  app.useGlobalInterceptors(new ResponseInterceptor())
  await app.init()
  return { app, deviceAdapterService }
}

const POS_DEVICE = {
  deviceId: 'pos-001',
  deviceType: 'pos',
  brand: 'huawei',
  model: 'HiPay-3000',
  connection: 'wifi',
  timeout: 5000,
  retries: 3,
}

const GATE_DEVICE = {
  deviceId: 'gate-001',
  deviceType: 'gate',
  brand: 'generic',
  model: 'Turnstile-X1',
  connection: 'ethernet',
  timeout: 3000,
  retries: 2,
}

const SCANNER_DEVICE = {
  deviceId: 'scanner-001',
  deviceType: 'scanner',
  brand: 'honeywell',
  model: 'HH-5180',
  connection: 'usb',
  timeout: 2000,
  retries: 1,
}

const PRINTER_DEVICE = {
  deviceId: 'printer-001',
  deviceType: 'printer',
  brand: 'epson',
  model: 'TM-T88',
  connection: 'serial',
  timeout: 4000,
  retries: 2,
}

it('e2e: 设备注册→连接→POS交易→断开全流程', async () => {
  const { app } = await buildApp()
  try {
    // 1. 注册设备
    const regRes = await request(app.getHttpServer())
      .post('/device-adapter/devices')
      .send(POS_DEVICE)
    assert.equal(regRes.statusCode, 201)
    assert.equal(regRes.body.deviceId, 'pos-001')
    assert.equal(regRes.body.brand, 'huawei')

    // 2. 连接设备
    const connRes = await request(app.getHttpServer())
      .post('/device-adapter/devices/pos-001/connect')
    assert.equal(connRes.statusCode, 201)
    assert.equal(connRes.body.success, true)

    // 3. POS 交易
    const txRes = await request(app.getHttpServer())
      .post('/device-adapter/devices/pos-001/pos/transaction')
      .send({ amount: 99.99, currency: 'CNY' })
    assert.equal(txRes.statusCode, 201)
    assert.equal(txRes.body.success, true)
    assert.ok(txRes.body.data.transactionId)
    assert.equal(txRes.body.data.status, 'approved')

    // 4. POS 读卡
    const cardRes = await request(app.getHttpServer())
      .post('/device-adapter/devices/pos-001/pos/read-card')
    assert.equal(cardRes.statusCode, 201)
    assert.equal(cardRes.body.success, true)
    assert.equal(cardRes.body.data.cardType, 'VISA')

    // 5. 断开设备
    const discRes = await request(app.getHttpServer())
      .post('/device-adapter/devices/pos-001/disconnect')
    assert.equal(discRes.statusCode, 201)
    assert.equal(discRes.body.success, true)
  } finally {
    await app.close()
  }
})

it('e2e: 闸机设备开门→访问日志→命令历史', async () => {
  const { app } = await buildApp()
  try {
    // 注册并连接闸机
    await request(app.getHttpServer())
      .post('/device-adapter/devices')
      .send(GATE_DEVICE)
    await request(app.getHttpServer())
      .post('/device-adapter/devices/gate-001/connect')

    // 闸机开门
    const openRes = await request(app.getHttpServer())
      .post('/device-adapter/devices/gate-001/gate/open')
      .send({ direction: 'in' })
    assert.equal(openRes.statusCode, 201)
    assert.equal(openRes.body.success, true)
    assert.equal(openRes.body.data.direction, 'in')

    // 查询访问日志
    const logRes = await request(app.getHttpServer())
      .get('/device-adapter/devices/gate-001/gate/access-log?limit=5')
    assert.equal(logRes.statusCode, 201)
    assert.equal(logRes.body.success, true)
    assert.ok(Array.isArray(logRes.body.data.logs))

    // 查询命令历史
    const cmdRes = await request(app.getHttpServer())
      .get('/device-adapter/devices/gate-001/commands')
    assert.equal(cmdRes.statusCode, 200)
    assert.ok(cmdRes.body.length >= 2)
  } finally {
    await app.close()
  }
})

it('e2e: 扫描仪设备扫描+解析协议转换', async () => {
  const { app } = await buildApp()
  try {
    // 注册并连接扫描仪
    await request(app.getHttpServer())
      .post('/device-adapter/devices')
      .send(SCANNER_DEVICE)
    await request(app.getHttpServer())
      .post('/device-adapter/devices/scanner-001/connect')

    // 扫描
    const scanRes = await request(app.getHttpServer())
      .post('/device-adapter/devices/scanner-001/scanner/scan')
    assert.equal(scanRes.statusCode, 201)
    assert.equal(scanRes.body.success, true)
    assert.equal(scanRes.body.data.format, 'code128')

    // 解析多种格式
    const qrRes = await request(app.getHttpServer())
      .post('/device-adapter/scanner/parse')
      .send({ data: 'https://example.com/qr' })
    assert.equal(qrRes.statusCode, 201)
    assert.equal(qrRes.body.format, 'qr')

    const eanRes = await request(app.getHttpServer())
      .post('/device-adapter/scanner/parse')
      .send({ data: '6901234567890' })
    assert.equal(eanRes.statusCode, 201)
    assert.equal(eanRes.body.format, 'ean13')

    const upcRes = await request(app.getHttpServer())
      .post('/device-adapter/scanner/parse')
      .send({ data: '123456789012' })
    assert.equal(upcRes.statusCode, 201)
    assert.equal(upcRes.body.format, 'upc')
  } finally {
    await app.close()
  }
})

it('e2e: 打印机设备打印+打印二维码', async () => {
  const { app } = await buildApp()
  try {
    // 注册并连接打印机
    await request(app.getHttpServer())
      .post('/device-adapter/devices')
      .send(PRINTER_DEVICE)
    await request(app.getHttpServer())
      .post('/device-adapter/devices/printer-001/connect')

    // 打印文本
    const printRes = await request(app.getHttpServer())
      .post('/device-adapter/devices/printer-001/printer/print')
      .send({ content: 'Receipt #123\nItems: 3\nTotal: ¥45.00' })
    assert.equal(printRes.statusCode, 201)
    assert.equal(printRes.body.success, true)
    assert.ok(printRes.body.data.jobId)

    // 打印二维码
    const qrRes = await request(app.getHttpServer())
      .post('/device-adapter/devices/printer-001/printer/print-qr')
      .send({ data: 'https://example.com/receipt/123' })
    assert.equal(qrRes.statusCode, 201)
    assert.equal(qrRes.body.success, true)
    assert.equal(qrRes.body.data.format, 'qr')
  } finally {
    await app.close()
  }
})

it('e2e: 设备注册冲突检测', async () => {
  const { app } = await buildApp()
  try {
    // 首次注册成功
    const firstRes = await request(app.getHttpServer())
      .post('/device-adapter/devices')
      .send(POS_DEVICE)
    assert.equal(firstRes.statusCode, 201)

    // 重复注册应返回 409
    const dupRes = await request(app.getHttpServer())
      .post('/device-adapter/devices')
      .send(POS_DEVICE)
    assert.equal(dupRes.statusCode, 409)
  } finally {
    await app.close()
  }
})

it('e2e: 批量连接同类设备与状态概览', async () => {
  const { app } = await buildApp()
  try {
    // 注册多个同类型设备
    const devices = ['batch-pos-1', 'batch-pos-2', 'batch-pos-3']
    for (const id of devices) {
      await request(app.getHttpServer())
        .post('/device-adapter/devices')
        .send({
          deviceId: id,
          deviceType: 'pos',
          brand: 'generic',
          connection: 'wifi',
          timeout: 3000,
          retries: 2,
        })
    }

    // 批量连接
    const batchRes = await request(app.getHttpServer())
      .post('/device-adapter/devices/connect-all')
      .send({ deviceType: 'pos' })
    assert.equal(batchRes.statusCode, 201)
    for (const id of devices) {
      assert.equal(batchRes.body[id], true)
    }

    // 状态概览
    const statusRes = await request(app.getHttpServer())
      .get('/device-adapter/status')
    assert.equal(statusRes.statusCode, 200)
    assert.ok(typeof statusRes.body['batch-pos-1'] === 'string')
  } finally {
    await app.close()
  }
})

it('e2e: 离线设备操作返回设备离线错误', async () => {
  const { app } = await buildApp()
  try {
    // 注册但未连接
    await request(app.getHttpServer())
      .post('/device-adapter/devices')
      .send(POS_DEVICE)

    // 未连接时尝试交易
    const txRes = await request(app.getHttpServer())
      .post('/device-adapter/devices/pos-001/pos/transaction')
      .send({ amount: 10, currency: 'CNY' })
    assert.equal(txRes.statusCode, 201)
    assert.equal(txRes.body.success, false)
    assert.equal(txRes.body.error, 'device_offline')
  } finally {
    await app.close()
  }
})
