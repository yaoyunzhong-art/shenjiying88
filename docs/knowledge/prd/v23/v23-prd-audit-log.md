# V23-PRD-07: 审计日志系统 — Audit Log

> 版本: v1.0 · 签发人: 树哥
> 日期: 2026-07-21 · 状态: 🟢 已签发
> 圈梁: G6-C1

- **名称**: 审计日志系统
- **用途**: 构建全链路审计日志系统，记录关键业务操作（登录、订单状态变更、权限变更）的谁/什么/何时/结果四要素
- **输出**: `src/modules/audit/audit-log.service.ts` + `AuditLog Entity` + migration
- **圈梁状态**: 代码✅ 测试✅ 审计✅ PRD新建
- **日期**: 2026-07-21
- **作用**: G6-C1 审计追溯合规

## 完成定义

1. AuditLog 记录 actor、action、resource、detail、result、timestamp
2. 关键操作（登录、订单变更、权限变更）自动写入审计表
3. 提供查询 API 支持按时间/用户/操作类型筛选
