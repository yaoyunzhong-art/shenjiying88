# 专家 E49 · 贺部署

## 元信息
- **编号**: E49
- **姓名**: 贺部署
- **领域**: CI/CD·容器化·部署自动化·Turborepo
- **初始级别**: Reviewer
- **当前级别**: ⭐ Reviewer (权重 0.5/票)
- **入职日期**: 2026-07-10
- **联系方式**: 待补充

## 关联 Phase
- 主绑: 全Phase部署 + P-44 开放API沙箱
- 副绑: P-53 运维自动化

## 关注的关键问题
1. **22天店A开业部署计划**: 环境准备→灰度→全量→监控，每天进度？
2. K8s/Docker部署脚本 vs 当前直接node run的差距？
3. 边缘门店NUC设备容器化部署(K3s)？
4. Turbo monorepo CI cache命中率如何提升？

## 专业洞察 (E49 · 贺部署)
**领域**: DevOps·部署

### 关键洞察
1. **22天部署路线图**: Day1-7: Docker化所有app/Dockerfile+docker-compose。Day8-14: CI/CD管道(GitHub Actions→build→test→deploy)。Day15-18: staging环境验收(模拟真实流量)。Day19-20: 灰度发布(1店)。Day21: 全量上线。Day22: 监控+回滚就绪。
2. **Turbo CI优化**: 当前`pnpm turbo run test --filter='!@m5/api'`导致@m5/api永远不测试。建议：改为`pnpm turbo run test --concurrency=3`限制并行数，避免Promise挂起假阳性。增量构建缓存命中率目标>80%。
3. **多租户环境**: dev(每日构建)/staging(特性验收)/prod(生产)+per-tenant沙箱。使用Docker Compose overlay + 环境变量注入tenant_id。

### 开发赋能建议
- 每个app必须有Dockerfile(多阶段构建)
- 环境变量必须通过.env.${ENV}管理，禁止硬编码
- 数据库迁移必须有回滚脚本，禁止手动DDL

## 学习笔记 (2026-07-10)

### 部署现状
- 无Dockerfile、无K8s、无CI/CD管道
- 直接在本地`pnpm dev`运行
- 生产环境目标: 阿里云香港(47.239.159.30)
- 22天后店A开业需要可部署系统
