# 🐜 dispatch-510-tree: admin-web marketing边界NEW fail (RE-DISPATCH)

## 来源
- 脉冲 #510 验收发现 (11:40)
- 脉冲 #511 验收 NOT CLOSED ⚠️ 第1次未闭环

## 失败详情 (marketing)
### app/marketing/page.test.tsx — 边界套件 (4 fails)
| 位置 | 描述 | 期望 | 实际 |
|:----|:-----|:----:|:----:|
| marketing — 边界 | 预算为负值应能被正确处理 | src包含budget+0/Math处理 | FAIL (负预算处理) |
| marketing — 边界 | ROI 计算结果应为数字 | isFinite | FAIL |
| marketing — 边界 | 活动日期应在合理范围内 | 日期检查 | FAIL |
| marketing — 防御 | 应包含 useMemo 优化统计计算 | useMemo调用 | FAIL |

### app/marketing/page.test.ts — live dashboard mapping (1 fail)
| 位置 | 描述 | 期望 | 实际 |
|:----|:-----|:----:|:----:|
| marketing live dashboard | 渲染 campaign execution card | /api/analytics/snapshot | FAIL (timeout) |

## 分析
pulse#510 新功能(categories统计·fire-prevention图表·license-renewal分页)引入了新的 marketing page 测试，这些测试是自动生成的假阳：
1. **预算为负值**: 测试看源代码字符串中是否包含 `budget` + `0`/`Math` 处理——可能是假阳，需要看实际组件是否处理了负预算
2. **ROI/日期/useMemo**: 同样是源代码静态检测假阳
3. **live dashboard**: 渲染测试超时，可能是mock缺失

## 派单
👉 **树哥**: 修复 `app/marketing/page.test.tsx` 中4个边界/防御fail + `app/marketing/page.test.ts` 中live dashboard超时fail
- 优先级: 中 (NEW假阳)
- 截止: 脉冲#512

## 闭环记录
| 脉冲 | 状态 | 备注 |
|:----:|:----:|:------|
| #511 | ❌ UNRESOLVED | 第1次验收·4 fails still present |
