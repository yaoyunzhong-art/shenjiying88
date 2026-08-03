# V23-PRD-06: 环境密钥管理 — Env Key Management

> 版本: v1.0 · 签发人: 树哥
> 日期: 2026-07-21 · 状态: 🟢 已签发
> 圈梁: G5-C1

- **名称**: 环境密钥管理
- **用途**: 建立环境密钥集中管理机制，将 JWT_SECRET、DB_PASSWORD 等敏感配置从硬编码迁移至 .env + 密钥轮换脚本
- **输出**: `.env.example` + `scripts/rotate-secret.sh` + `config/secret-manager.ts`
- **圈梁状态**: 代码✅ 测试✅ 审计✅ PRD新建
- **日期**: 2026-07-21
- **作用**: G5-C1 密钥安全合规

## 完成定义

1. 所有敏感密钥移出代码，统一通过环境变量注入
2. 密钥轮换脚本支持 JWT/Database/Redis 三套密钥热替换
3. .env.example 标注每项密钥的用途与最小权限描述
