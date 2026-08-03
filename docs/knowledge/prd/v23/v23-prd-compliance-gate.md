# V23-PRD-COMPLIANCE: 合规阀门 — WP-COMPLIANCE

> 版本: v1.0 · 签发人: 树哥
> 日期: 2026-07-23 · 状态: 🟢 已签发
> 圈梁: G1-C1

- **名称**: 合规阀门 (Compliance Gate)
- **用途**: 提供配置化合规阀门检查、偏离单注册、季度模拟、持续优化 KPI 追踪
- **输出**: 
  - `apps/api/src/modules/compliance/compliance-gate.service.ts`
  - `scripts/compliance-quarterly-simulate.sh`
  - `.trae/compliance/deviation-registry.json`
  - `docs/operations/r19-compliance-gate.md`
- **圈梁状态**: 代码✅ 测试✅ 文档✅ 验收卡✅
- **日期**: 2026-07-23
- **作用**: WP-COMPLIANCE 合规闭环核心

## 完成定义

1. 合规阀门引擎支持三项自动检查：代码审查完成率 ≥90%、TSC 通过率 100%、测试通过率 100%
2. 阀门配置可动态调整（阈值 / 开启/关闭）
3. 季度模拟脚本可独立运行，输出通过/失败状态
4. 偏离单注册表结构完整（id/severity/title/status/createdAt/closedAt/blocker）
5. 验收卡覆盖全部验收标准，含回滚模板
6. 合规声明含 `6-8_refs: [BS-0233, BS-0248, BS-0250, BS-0261, BS-0262]`

## 引用 BS

| BS 编号 | 描述 | 优先级 |
|:-------:|------|:------:|
| BS-0233 | 开发合规阀门 | P0 |
| BS-0248 | 季度全系统模拟 | P0 |
| BS-0250 | 问题闭环追踪 | P0 |
| BS-0261 | 持续优化 KPI | P0 |
| BS-0262 | 模拟运行覆盖率 100% | P0 |
