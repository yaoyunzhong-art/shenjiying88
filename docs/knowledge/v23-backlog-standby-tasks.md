# V23 空闲期保底任务 (2026-07-21)

> 用途: 当V23主要cron完成当前阶段任务后，立即切入保底任务队列，确保永不空转。
> 优先级: P-38→安全基线→E2E→代码质量→文档

## 保底任务队列 (按优先级)

### P0: P-38 财务对账模块 (截止7/22 🚨)
- 目标: 85%→100%
- 动作: finance controller/service/测试补齐
- 文件: apps/api/src/modules/finance/ + admin-web/stores/[id]/finance/
- 派单: 派树哥50+测试 + UI增强

### P0: 安全基线第8项
- 目标: 7/8→8/8
- 动作: 修复deviceToken持久化/MFA/SLSA或其他缺失项
- 脚本: scripts/security-baseline-scan.sh

### P1: E2E链补齐 (目标58链全部L3)
- L0: 5链 ✅
- L1: 26链 ✅
- L2: 27链 ✅
- L3: 0链 ❌ (300ms以下页面)
- 动作: 启动L3链创建 → 店长看板/收银/会员管理 等高频页面

### P1: P-31 剩余E2E链补齐
- E2E#51~#58 中未完成的链

### P2: 二级页面loading.tsx补齐
- 已一级满覆盖 ✅
- 二级深度页面缺 loading.tsx → 保底补

### P2: type/API文档同步
- controllers新增未写JSDoc → AI自动补

### P2: as any清理
- 系统还有4442处 → 周日分解
