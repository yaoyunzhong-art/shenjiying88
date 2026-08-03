# V23-PRD-08: CI 工作流 — CI Workflow

> 版本: v1.0 · 签发人: 树哥
> 日期: 2026-07-21 · 状态: 🟢 已签发
> 圈梁: G1-C1

- **名称**: CI 工作流
- **用途**: 配置 GitHub Actions / CodeUp CI 流水线，自动执行 lint → type-check → test → build → security-scan，保证每次推送质量门禁
- **输出**: `.github/workflows/ci.yml`
- **圈梁状态**: 代码✅ 测试✅ 审计✅ PRD新建
- **日期**: 2026-07-21
- **作用**: G1-C1 持续集成合规

## 完成定义

1. 流水线包含 lint、type-check、unit test、build、security scan 五个 stage
2. 任意 stage 失败阻断合并
3. 流水线耗时 ≤ 8 分钟
