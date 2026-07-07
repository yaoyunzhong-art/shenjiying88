# Anti-Pattern · Magic Numbers (魔法数字)

> 创建: 2026-06-26 · Pulse-68 Day 2
> 严重度: 🟢 P3
> 来源: Phase-15+ 代码审查发现

---

## 1. 🚨 反模式

代码中出现无解释的数字字面量:
```typescript
// ❌ 魔法数字满天飞
if (attempts > 3) throw new Error('too many')
await sleep(1000 * 60 * 5)  // 5 分钟? 50 分钟?
const cache = new Map<string, any>()
cache.set(key, value, 300)  // 300 是什么?
```

---

## 2. ❌ 反例

```typescript
// ❌ 难维护 / 难理解 / 难修改
async function retry() {
  for (let i = 0; i < 3; i++) { /* ??? */ }
  await new Promise(r => setTimeout(r, 5000))  // 5 秒?
  if (cache.size > 1000) cache.clear()  // 1000 条?
}
```

---

## 3. ✅ 正确做法: 常量集中管理

```typescript
// apps/api/src/common/constants.ts
export const RETRY_CONFIG = {
  MAX_ATTEMPTS: 3,
  INITIAL_DELAY_MS: 1000,
  MAX_DELAY_MS: 30_000,
  BACKOFF_MULTIPLIER: 2,
} as const

export const CACHE_CONFIG = {
  USER_PROFILE_TTL_SECONDS: 300,        // 5 分钟
  COUPON_LIST_TTL_SECONDS: 60,          // 1 分钟
  DEFAULT_MAX_ENTRIES: 1000,
} as const

export const QUOTA_LIMITS = {
  MEMBER_PER_TENANT: 10_000,
  COUPON_PER_CAMPAIGN: 100_000,
  API_CALL_PER_DAY: 100_000,
} as const

// 使用
import { RETRY_CONFIG, CACHE_CONFIG } from '@/common/constants'

async function retry() {
  for (let i = 0; i < RETRY_CONFIG.MAX_ATTEMPTS; i++) {
    // ...
  }
  await new Promise(r => setTimeout(r, RETRY_CONFIG.INITIAL_DELAY_MS))
}
```

---

## 4. 📐 配置 vs 常量

| 类型 | 位置 | 示例 |
|---|---|---|
| 常量 (不变) | `constants.ts` | HTTP 状态码、错误码 |
| 配置 (可调) | `config.ts` (env 注入) | 重试次数、TTL |
| 业务参数 | 数据库 / ConfigService | 配额、限流 |

---

## 5. ❌ 反模式

- ❌ 直接用数字字面量
- ❌ 散落在代码各处
- ❌ 无注释说明
- ❌ 修改需要全局搜

---

## 6. 🔍 检测工具

```bash
# 查找数字字面量
grep -nE '\b[0-9]{2,}\b' apps/api/src/modules/**/*.service.ts | grep -v "// " | head

# 但需人工 review (排除 timestamp, line number 等)
```

---

## 7. 🔗 关联

- [code-review-checklist.md](../best-practices/code-review-checklist.md) · 评审发现
