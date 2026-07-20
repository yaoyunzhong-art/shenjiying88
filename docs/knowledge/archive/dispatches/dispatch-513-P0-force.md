# 🐜 【🚨🚨P0危机】派树哥 #pulse513 — marketing 4 fails 连续3次未闭环(树哥0 commit)

> **发现时间**: 2026-07-16 13:03 CST (pulse#513)
> **状态**: 🚨🚨 **P0危机** — 连续3次验收失败(dispatch-510→#511→#512→#513)·树哥0 commit
> **根因**: marketing/page.tsx 边界和防御测试不符合实现

## 升级履历
| 脉冲 | 派单 | 状态 |
|:----|:----|:----:|
| #510 | dispatch-510-tree 签发 | ❌ 首次验收失败 |
| #511 | 重派dispatch-510-tree | ❌ 第2次失败→P0升级 |
| #512 | dispatch-512-P0-tree 🚨 | ❌ **第3次失败·树哥0 commit** |
| **#513** | **dispatch-513-P0-force 🚨🚨** | **🆕 强制派单·附精确修复代码** |

## 未闭环失败 (marketing边界4件套)
| 测试 | 类型 | 预期 | 实际 |
|:----|:----:|:----:|:----:|
| 预算为负值应能被正确处理 | 边界 | 负预算不崩 | ❌ 待修复 |
| ROI 计算结果应为数字 | 边界 | ROI输出数字型 | ❌ 待修复 |
| date formatting (inlined) | 格式 | 日期格式化正确 | ❌ 待修复 |
| 应包含 useMemo 优化统计计算 | 性能 | useMemo存在 | ❌ 待修复 |

## 精确修复代码(必须应用)

### 1. apps/admin-web/app/marketing/page.tsx — 负预算防御
```typescript
// 在统计计算前添加:
const safeBudgets = campaigns?.map(c => ({
  ...c,
  budget: Math.max(0, Number(c.budget) || 0)
})) || [];
```

### 2. ROI 数字类型修复
```typescript
// 确保ROI输出为number:
const roi = safeBudgets.length > 0
  ? Number((totalRevenue / totalCost).toFixed(2))
  : 0;
```

### 3. 日期格式修复
```typescript
// 匹配测试断言格式 (YYYY-MM-DD):
const formatDate = (date: string) => {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
};
```

### 4. useMemo 优化统计计算
```typescript
import { useMemo } from 'react';

const stats = useMemo(() => {
  // 统计计算逻辑
  return { totalBudget, totalRevenue, totalCost, roi };
}, [campaigns]);
```

## 截止
⏰ **必须下个脉冲(#514)前修复！连续3次未闭环且0 commit视为P0危机**
