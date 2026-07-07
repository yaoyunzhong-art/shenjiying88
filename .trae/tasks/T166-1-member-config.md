# T166-1 · Member 可配置中心任务卡

## 元信息
- **T-NN**: T166-1 (T166 拆分 3 子任务之一)
- **Phase**: 36
- **标题**: member.config.ts + admin-web 会员配置中心
- **优先级**: 🟢 P1 (高,大飞哥 D3 决策要求可配置)
- **估时**: 0.5d (4h)
- **创建日期**: 2026-06-27
- **派发人**: 🦞 龙虾哥
- **执行人**: 🌲 树哥trae
- **状态**: 🟡 待派发
- **依赖**: ✅ Phase-36 95% 已就位 (397/397 PASS)

---

## 1. 现状盘点 (派发前必做)

### ✅ 已实现
- `apps/api/src/modules/member/member.entity.ts` 含 5 档等级 + MEMBER_LEVEL_THRESHOLDS
- `apps/api/src/modules/member/member.service.ts` 2903 行 Prisma 集成
- `User.mobile @unique` (DB 层 D1 已落地)
- `MEMBER_LEVEL_THRESHOLDS` 硬编码: Bronze(0)/Silver(500)/Gold(2000)/Platinum(10000)/Diamond(50000)

### ❌ 待建 (T166-1 真正待办)
- `apps/api/src/modules/member/member-config.ts` 配置服务
- `apps/admin-web/app/member/config/page.tsx` 配置界面
- 把硬编码阈值迁入可配置

---

## 2. 验收标准 (AC · 8 项)

### AC-1: member.config.ts 接口定义
- [ ] `MemberConfig` interface 完整定义 (8 个字段)
- [ ] `DEFAULT_MEMBER_CONFIG` 默认值锁定
- [ ] `MemberConfigService` 提供 get/update 接口

### AC-2: 配置项覆盖所有决策
- [ ] `points.earnRate = 1` (D3 默认)
- [ ] `points.redeemRate = 100` (D3 默认)
- [ ] `levels.thresholds` 5 档 (D2 现状 500/2000/10000/50000 + Bronze=0)
- [ ] `lifecycle.dormantDays = 90` (D4 大飞哥)
- [ ] `lifecycle.churnedDays = 180`
- [ ] `phoneUniqueScope = 'global'` (D1)
- [ ] `crossTenantEnabled = true` (D5)

### AC-3: service 接口
- [ ] `getConfig(): MemberConfig` 返回当前配置
- [ ] `updateConfig(patch: Partial<MemberConfig>): MemberConfig` 热更新
- [ ] `getThreshold(level: MemberLevel): number` 等级阈值查询
- [ ] `getPointsRate(): { earn: number, redeem: number }` 积分比例

### AC-4: 配置持久化
- [ ] 配置写入 `@m5/config` 或新建 `member-config.store.ts` (内存)
- [ ] 启动时从持久化读取,fallback DEFAULT
- [ ] 运行时 updateConfig 后立即生效

### AC-5: admin-web 配置界面
- [ ] `apps/admin-web/app/member/config/page.tsx` 新建
- [ ] 表单:积分比例 (earnRate/redeemRate) + 等级阈值 (5 档) + 休眠天数
- [ ] 保存按钮调用 updateConfig API
- [ ] 实时反馈 (toast 成功/失败)

### AC-6: 反模式库 v4 命中 (2 文件)
- [ ] [tsx-decorator-pitfall.md](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/knowledge/anti-patterns/v4/tsx-decorator-pitfall.md): NestJS 装饰器
- [ ] [async-try-catch-pattern.md](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/knowledge/anti-patterns/v4/async-try-catch-pattern.md): 配置 update 错误处理

### AC-7: 测试覆盖 (≥ 10 断言)
- [ ] `member-config.test.ts` 新建
- [ ] 默认值断言 (8 字段)
- [ ] updateConfig 部分更新断言
- [ ] getThreshold 5 档断言
- [ ] 配置变更后立即生效断言

### AC-8: race-safe commit
- [ ] commit 前跑 `bash scripts/race-safe-commit.sh "T166-1 Member 配置中心"`
- [ ] commit message 含 `Phase-36 step 1: T166-1 Member 可配置中心`

---

## 3. 实施步骤 (3 步)

### Step 1: member-config.ts 后端 (2h)

```typescript
// apps/api/src/modules/member/member-config.ts

export interface MemberConfig {
  points: {
    earnRate: number
    redeemRate: number
    enabled: boolean
    expiryDays: number
  }
  levels: {
    thresholds: {
      BRONZE: number
      SILVER: number
      GOLD: number
      PLATINUM: number
      DIAMOND: number
    }
  }
  lifecycle: {
    dormantDays: number
    churnedDays: number
  }
  phoneUniqueScope: 'global' | 'tenant'
  crossTenantEnabled: boolean
}

export const DEFAULT_MEMBER_CONFIG: MemberConfig = {
  points: { earnRate: 1, redeemRate: 100, enabled: true, expiryDays: 365 },
  levels: {
    thresholds: {
      BRONZE: 0,
      SILVER: 500,
      GOLD: 2000,
      PLATINUM: 10000,
      DIAMOND: 50000
    }
  },
  lifecycle: { dormantDays: 90, churnedDays: 180 },
  phoneUniqueScope: 'global',
  crossTenantEnabled: true
}

@Injectable()
export class MemberConfigService {
  private current: MemberConfig = { ...DEFAULT_MEMBER_CONFIG }
  
  getConfig(): MemberConfig { return this.current }
  
  updateConfig(patch: Partial<MemberConfig>): MemberConfig {
    this.current = { ...this.current, ...patch }
    return this.current
  }
  
  getThreshold(level: MemberLevel): number {
    return this.current.levels.thresholds[level]
  }
  
  getPointsRate(): { earn: number, redeem: number } {
    return {
      earn: this.current.points.earnRate,
      redeem: this.current.points.redeemRate
    }
  }
}
```

### Step 2: admin-web 配置界面 (1.5h)

```typescript
// apps/admin-web/app/member/config/page.tsx
'use client'

import { useState } from 'react'

export default function MemberConfigPage() {
  const [config, setConfig] = useState<MemberConfig>(DEFAULT_MEMBER_CONFIG)
  
  const handleSave = async () => {
    const res = await fetch('/api/member/config', {
      method: 'PATCH',
      body: JSON.stringify(config)
    })
    if (res.ok) toast.success('保存成功')
  }
  
  return (
    <form>
      <fieldset>
        <legend>积分比例 (D3)</legend>
        <input type="number" value={config.points.earnRate}
               onChange={e => setConfig({...config, points: {...config.points, earnRate: +e.target.value}})} />
        <label>元 = N 积分</label>
        
        <input type="number" value={config.points.redeemRate} />
        <label>N 积分 = 1 元</label>
      </fieldset>
      
      <fieldset>
        <legend>等级阈值 (D2)</legend>
        <input value={config.levels.thresholds.SILVER} />
        <input value={config.levels.thresholds.GOLD} />
        <input value={config.levels.thresholds.PLATINUM} />
        <input value={config.levels.thresholds.DIAMOND} />
      </fieldset>
      
      <fieldset>
        <legend>休眠判定 (D4)</legend>
        <input type="number" value={config.lifecycle.dormantDays} />
        <label>天未访问</label>
      </fieldset>
      
      <button onClick={handleSave}>保存</button>
    </form>
  )
}
```

### Step 3: 测试 + commit (0.5h)

```typescript
// apps/api/src/modules/member/member-config.test.ts
import test, { describe } from 'node:test'
import assert from 'node:assert/strict'
import { MemberConfigService, DEFAULT_MEMBER_CONFIG } from './member-config'

describe('MemberConfigService', () => {
  test('默认配置 8 字段全', () => {
    const svc = new MemberConfigService()
    assert.equal(svc.getConfig().points.earnRate, 1)
    assert.equal(svc.getConfig().points.redeemRate, 100)
    // ... 共 8 断言
  })
  
  test('updateConfig 部分更新', () => {
    const svc = new MemberConfigService()
    svc.updateConfig({ points: { ...DEFAULT_MEMBER_CONFIG.points, earnRate: 2 } })
    assert.equal(svc.getConfig().points.earnRate, 2)
    assert.equal(svc.getConfig().points.redeemRate, 100) // 不变
  })
  
  test('getThreshold 5 档', () => {
    const svc = new MemberConfigService()
    assert.equal(svc.getThreshold('BRONZE'), 0)
    assert.equal(svc.getThreshold('SILVER'), 500)
    assert.equal(svc.getThreshold('GOLD'), 2000)
    assert.equal(svc.getThreshold('PLATINUM'), 10000)
    assert.equal(svc.getThreshold('DIAMOND'), 50000)
  })
})
```

---

## 4. 风险与对策

| 风险 | 概率 | 影响 | 对策 |
|------|------|------|------|
| 配置变更影响历史订单 | 中 | 中 | 配置只影响新订单,历史订单用创建时配置 |
| admin-web 调用权限 | 低 | 中 | 后端加 `@UseGuards(TenantAdminGuard)` |
| Prisma migration 失败 | 低 | 高 | 用内存 store,真实 DB 后续迁移 |

---

## 5. 上下游依赖

### 上游 (✅ 已就位)
- Phase-36 Member 397/397 PASS
- `MEMBER_LEVEL_THRESHOLDS` 硬编码(可平滑迁移)

### 下游 (T166-2 + T167 依赖)
- T166-2 休眠 cron 用 `lifecycle.dormantDays`
- T167 自动升降级用 `levels.thresholds`
- T168 积分系统用 `points.earnRate/redeemRate`

---

## 6. 提交格式

```
🛡️ R-06 race-safe auto-commit

Phase-36 step 1: T166-1 Member 可配置中心
- apps/api/src/modules/member/member-config.ts (8 字段 + service)
- apps/admin-web/app/member/config/page.tsx (配置表单)
- apps/api/src/modules/member/member-config.test.ts (10 断言)
- 静态扫描: tenantId / ConfigService / updateConfig 命中
- 反模式库 v4: tsx-decorator + async-try-catch
- R-06 防御: race-safe + HEARTBEAT.record
```

---

> 🦞 **"T166-1 = 配置可调 = 后台运营灵活 = 大飞哥 D3 落地"**