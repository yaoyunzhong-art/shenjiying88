import { describe, it, expect, beforeEach } from 'vitest'
import { CacheTierService } from './cache-tier.service'
import { K8sScaleService } from './k8s-scale.service'
import { DbOptimizeService } from './db-optimize.service'
import { K6RunnerService } from './k6-runner.service'

/**
 * 🐜 [performance] 角色扩展测试
 */

function setup() {
  return {
    cache: new CacheTierService(),
    k8s: new K8sScaleService(),
    db: new DbOptimizeService(),
    k6: new K6RunnerService(),
  }
}

describe('👔店长 performance 扩展测试', () => {
  let svc: ReturnType<typeof setup>>
  beforeEach(() => { svc = setup() })

  it('获取缓存命中率', () => {
    svc.cache.recordHit('key1')
    svc.cache.recordMiss('key2')
    const rate = svc.cache.getHitRate()
    expect(rate).toBeGreaterThanOrEqual(0)
    expect(rate).toBeLessThanOrEqual(1)
  })
})

describe('🎯运行专员 performance 扩展测试', () => {
  let svc: ReturnType<typeof setup>>
  beforeEach(() => { svc = setup() })

  it('设置并获取缓存', () => {
    svc.cache.set('k', 'v', 60)
    expect(svc.cache.get('k')).toBe('v')
  })

  it('过期缓存返回 null', async () => {
    svc.cache.set('k2', 'v2', 0)
    await new Promise(r => setTimeout(r, 10))
    expect(svc.cache.get('k2')).toBeNull()
  })

  it('K8s 扩缩容建议', async () => {
    const rec = svc.k8s.getScaleRecommendation('service-a', { cpu: 80, mem: 70 })
    expect(rec).toBeDefined()
  })
})

describe('📢营销 performance 扩展测试', () => {
  let svc: ReturnType<typeof setup>>
  beforeEach(() => { svc = setup() })

  it('DB 查询优化建议', () => {
    const advice = svc.db.analyzeQuery('SELECT * FROM orders WHERE id = ?')
    expect(advice).toBeDefined()
  })

  it('K6 压测运行', async () => {
    const result = await svc.k6.runTest({ vus: 10, duration: '5s', script: 'test.js' })
    expect(result).toBeDefined()
  })
})
