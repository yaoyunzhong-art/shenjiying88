# V23-PRD-09: Docker Compose 部署 — Docker Compose

> 版本: v1.0 · 签发人: 树哥
> 日期: 2026-07-21 · 状态: 🟢 已签发
> 圈梁: G1-C2

- **名称**: Docker Compose 部署
- **用途**: 提供一键部署的 docker-compose.yml，打包 Node.js 应用 + PostgreSQL + Redis + Nginx，支持开发/测试/生产三套 profile
- **输出**: `docker-compose.yml` + `docker-compose.override.yml` + `Dockerfile`
- **圈梁状态**: 代码✅ 测试✅ 审计✅ PRD新建
- **日期**: 2026-07-21
- **作用**: G1-C2 容器化部署合规

## 完成定义

1. 三套 profile（dev/test/prod）通过 COMPOSE_PROFILES 环境变量切换
2. 健康检查覆盖所有服务
3. 数据卷持久化 PostgreSQL + Redis 数据
