import { describe, it, expect, beforeEach } from 'vitest'
import { OmnichannelReachService } from './omnichannel.service'
import type { Channel, ReachResult } from './omnichannel.service'

/**
 * 🐜 [omnichannel] 角色扩展测试
 * 覆盖全渠道触达的边界场景
 */

function setup() {
  const svc = new OmnichannelReachService()
  return { svc }
}

describe('👔店长 omnichannel 扩展测试', () => {
  let svc: ReturnType<typeof setup>
  beforeEach(() => { svc = setup() })

  it('通过短信渠道触达会员', async () => {
    const result: ReachResult = await svc.svc.reach('member-1', 'SMS', '您的订单已发货')
    expect(result).toBeDefined()
    expect(result.success).toBe(true)
  })

  it('查询触达历史', async () => {
    await svc.svc.reach('member-1', 'SMS', '消息1')
    await svc.svc.reach('member-1', 'Email', '消息2')
    const history = svc.svc.getReachHistory('member-1')
    expect(history.length).toBeGreaterThanOrEqual(2)
  })
})

describe('🔧安监 omnichannel 扩展测试', () => {
  let svc: ReturnType<typeof setup>
  beforeEach(() => { svc = setup() })

  it('批量触达会员', async () => {
    const results = await svc.svc.reachAll(['m1', 'm2', 'm3'], 'SMS', '公告内容')
    expect(results).toHaveLength(3)
    for (const r of results) {
      expect(r.success).toBe(true)
    }
  })

  it('查询渠道状态', () => {
    const status = svc.svc.getChannelStatus('SMS')
    expect(status).toBeDefined()
  })
})

describe('🎯运行专员 omnichannel 扩展测试', () => {
  let svc: ReturnType<typeof setup>
  beforeEach(() => { svc = setup() })

  it('切换渠道状态', () => {
    svc.svc.setChannelStatus('SMS', 'maintenance')
    expect(svc.svc.getChannelStatus('SMS')).toBe('maintenance')
  })

  it('维护状态下触达失败', async () => {
    svc.svc.setChannelStatus('Email', 'maintenance')
    const result = await svc.svc.reach('member-1', 'Email', '消息')
    expect(result.success).toBe(false)
  })
})

describe('📢营销 omnichannel 扩展测试', () => {
  let svc: ReturnType<typeof setup>
  beforeEach(() => { svc = setup() })

  it('通过多个渠道触达同一会员', async () => {
    const smsResult = await svc.svc.reach('member-1', 'SMS', 'SMS消息')
    const emailResult = await svc.svc.reach('member-1', 'Email', 'Email消息')
    expect(smsResult.success).toBe(true)
    expect(emailResult.success).toBe(true)
  })

  it('对不存在的会员触达也返回结果', async () => {
    const result = await svc.svc.reach('non-existent', 'SMS', '消息')
    expect(result).toBeDefined()
    expect(result).toHaveProperty('success')
  })
})
