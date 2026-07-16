# 🐜 dispatch-507-tree: admin-web test 回归 (pulse#507)

> 派单时间: 2026-07-16 10:34 CST
> 截止: pulse#508 (下个脉冲·约11:00)

## 问题

pulse#507 发现 admin-web test NEW +19 fail:

### Fix-1 ✅ (已完成)
- **agents/studio page**: 13✖ → 31/31全通
  - commit: e2744d046, 853d35c02
  - async导出+snapshot结构+LoadingSkeleton+Suspense+maxWidth:1280+PageShell

### Fix-2 🔴 (待修: 6 NEW + 10 预计基线改善)
- **admin-alerts**: AdminAlertsClient useEffect/空状态/表格组件/页面结构/边界防御 约8✖
- **ai-decision**: AiScenarioSimulatorPage boundary/boundary cases 约4✖
- **stock-operations**: 统计卡片grid布局 约1✖
- 预计修复后可降至基线63左右

### 基线 (持续·共63✖)
- alerts 10 · categories 5 · orders 4 · marketing 4 · settings各1 · etc
- 建议: 批量假阳清除 (AM-020闭环)
