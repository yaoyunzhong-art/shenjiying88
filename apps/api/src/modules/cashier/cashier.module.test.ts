// @ts-nocheck
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
import assert from 'node:assert/strict'
import { Test } from '@nestjs/testing'
import { CashierModule } from './cashier.module'
import { CashierController } from './cashier.controller'
import { CashierService } from './cashier.service'
import { OrderService } from './order.service'
import { PaymentService } from './payment.service'
import { RefundService } from './refund.service'
import { CashierToLytBridge } from './bridges/cashier-to-lyt.bridge'
import { LytToCashierBridge } from './bridges/lyt-to-cashier.bridge'
it('CashierModule exposes controller, provider, export wiring', () => {
  const metadata = Reflect.getMetadata('imports', CashierModule) as unknown[] | undefined
  const controllers = Reflect.getMetadata('controllers', CashierModule) as unknown[] | undefined
  const providers = Reflect.getMetadata('providers', CashierModule) as unknown[] | undefined
  const exportsList = Reflect.getMetadata('exports', CashierModule) as unknown[] | undefined
  assert.ok(metadata === undefined || Array.isArray(metadata))
  assert.ok(controllers?.includes(CashierController))
  assert.ok(providers?.includes(CashierService))
  assert.ok(providers?.includes(OrderService))
  assert.ok(providers?.includes(PaymentService))
  assert.ok(providers?.includes(RefundService))
  assert.ok(exportsList?.includes(CashierService))
  assert.ok(exportsList?.includes(OrderService))
})
it('CashierModule can resolve CashierService through Nest DI', async () => {
  // CashierToLytBridge / LytToCashierBridge use TS interfaces as ctor params
  // (CashierToLytBridgeDeps, LytToCashierBridgeDeps) which erase to `Object` at
  // runtime. Override both so DI can wire everything up without real deps.
  const moduleRef = await Test.createTestingModule({
    imports: [CashierModule]
  })
    .overrideProvider(CashierToLytBridge).useFactory({
      factory: () => new CashierToLytBridge({ resolveLytAdapter: () => null })
    })
    .overrideProvider(LytToCashierBridge).useFactory({
      factory: () => new LytToCashierBridge({
        syncMemberProfile: async () => ({ updated: false }),
        syncExternalOrder: async () => ({ cashierOrderId: '' }),
        recordGatePass: async () => ({ recorded: false })
      })
    })
    .compile()
  const service = moduleRef.get(CashierService)
  assert.ok(service instanceof CashierService)
  await moduleRef.close()
})
