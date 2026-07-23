# 环境分离 (dev / staging / prod)

> 日期: 2026-07-23  
> 状态: ✅ 第一版  
> 关联: WP-00 架构底座 (BS-0001~BS-0020)

---

## 1. 总览

当前项目实现了 **dev / staging / prod** 三环境分离骨架，但部分环节仅完成「骨架」级别，存在明显缺失项。

| 环境 | 配置骨架 | 变量文件 | Docker Compose | K8s Manifests | TLS | 可独立上线 |
|:----:|:--------:|:--------:|:--------------:|:-------------:|:---:|:----------:|
| dev | ✅ | `.env.docker` | `docker-compose.yml` / `docker-compose.dev.yml` | ❌ | ❌ (http) | ✅ |
| staging | ✅ | `.env.staging.example` | `docker-compose.staging.yml` | ❌ | ⚠️ (nginx 层有 TLS 端口, 缺 cert) | ⚠️ |
| prod | ✅ | `.env.production.example` | ❌ (引用统一的 `docker-compose.yml`) | ✅ `infra/k8s/*.yaml` | ⚠️ (规划中) | ❌ |

---

## 2. dev 环境 ✅ (完整)

**配置源**: `.env.docker`  
**Compose 文件**: `docker-compose.yml` (主) + `docker-compose.dev.yml` (Qdrant 补充)  
**CLI 启动**: `docker compose --env-file .env.docker up -d`  
**数据库**: 本地 PostgreSQL 容器 `m5_dev`  
**特征**:
- NODE_ENV=development, LYT_MODE=mock, LOG_LEVEL=debug
- 端口外露: postgres 5432, redis 6379, api 3001, admin-web 3002 等
- 全部 http, 无 TLS
- CORS 本地开发域名已配

**当前状态**: ✅ 可正常工作, 每日 CI 使用

---

## 3. staging 环境 ⚠️ (骨架就绪, 缺运行证据)

**配置源**: `.env.staging.example`  
**Compose 文件**: `docker-compose.staging.yml`  
**变量文件**: 已定义独立 DB 名称 `m5_staging`, 独立 volume 名称 (前缀 `m5_staging_`), 独立端口偏移  
**特征**:
- NODE_ENV=production (与实际生产对齐)
- LOG_LEVEL=info
- 端口偏移: postgres 55432, redis 16379, api 3101, admin-web 3102 等
- nginx 服务预留了 443 TLS 端口, 但 **cert 未配置**
- `docker-compose.staging.yml` 对大部分基础设施已做端口绑定

**缺失项** (需补):
1. ❌ 尚无 staging CI/CD pipeline (当前只有 dev → prod 流程)
2. ❌ `.env.staging` 实际文件不存在, 只有 `.env.staging.example`
3. ❌ staging TLS 证书未配置
4. ❌ 未跑通过 staging compose 的完整 smoke test

---

## 4. prod 环境 ❌ (部分骨架, 缺少运行态)

**配置源**: `.env.production.example`  
**Compose 文件**: 无独立的 prod compose; 引用统一 `docker-compose.yml` + 生产环境变量  
**K8s Manifests**: `infra/k8s/*-deployment.yaml` 覆盖 api/admin/storefront/tob/redis/rabbitmq/minio  
**Terraform**: `infra/terraform/aliyun-prod-*.tf` 阿里云基础设施定义  
**特征**:
- `.env.production.example` 仅包含核心变量 (DB/Redis/JWT/URL), 缺少 AI/RabbitMQ/MinIO 等配置段
- Terraform 定义了阿里云 ECS/RDS/Redis/MQ, 但**未确定是否已生产部署**
- 有独立的 `docs/operations/deployment-guide.md` (Docker) 和 `docs/production-deployment-guide.md` (生产部署)

**缺失项** (需补):
1. ❌ prod 独立 compose 不存在
2. ❌ `.env.production` 实际文件不存在 (敏感值应以 K8s Secret/GitHub Secrets 注入)
3. ❌ 生产 TLS 证书 `infra/k8s/tls-secret.yaml` 在 G8 部署脚本中有提及, 但实际证书未安装
4. ❌ 生产域名为 `api.example.com` placeholder, 未替换为真实域名
5. ❌ 生产部署仅跑过 dry-run, 未实际上线
6. ❌ 生产回滚方案存在文字描述但未演练

---

## 5. 对比总表：缺失项 Matrix

| # | 缺失项 | dev | staging | prod | 优先级 | 关联 BS |
|:-:|:-------|:---:|:-------:|:----:|:------:|:-------:|
| 1 | 独立 compose 文件 | ✅ | ✅ | ❌ | P0 | BS-0006 |
| 2 | 实际 .env 文件 (非 example) | ✅ | ❌ | ❌ | P0 | BS-0006 |
| 3 | CI/CD pipeline | ✅ | ❌ | ⚠️ (半) | P1 | BS-0006 |
| 4 | TLS 证书 | ❌ http only | ⚠️ nginx 壳 | ❌ | P1 | BS-0006 |
| 5 | Smoke test 证据 | ✅ | ❌ | ❌ | P0 | BS-0007 |
| 6 | 回滚演练 | ❌ | ❌ | ❌ | P1 | BS-0008 |
| 7 | 灾备/冷备脚本 | ❌ | ❌ | ❌ | P1 | BS-0009 |
| 8 | 真实域名 | N/A | N/A | ❌ | P0 | BS-0010 |
| 9 | 监控告警 | ⚠️ (基础) | ❌ | ❌ | P1 | BS-0011 |

---

## 6. 推荐下一步

```
P0:
  1. 创建 staging 实际 .env.staging 文件 (从 example 复制 + 填真实值)
  2. 在 staging 上完整跑通 docker-compose up smoke test
  3. 补生产域名 (修改 .env.production.example → 实际域名)
  4. 建立 backup-db.sh / restore-db.sh 基础备份骨架 (已在本 WP-00 中补充)

P1:
  5. 搭建 staging CI/CD pipeline (与 dev 对齐)
  6. 为 staging 配置 Let's Encrypt TLS 证书
  7. 制定生产发布流水线 (含回滚 + smoke 门禁)
  8. 执行至少一次全流程灾备演练
```

---

## 7. 证据参考

| 文件 | 说明 |
|:----|:-----|
| `.env.docker` | dev 环境变量 |
| `.env.staging.example` | staging 环境变量模板 |
| `.env.production.example` | 生产环境变量模板 |
| `docker-compose.yml` | 统一 compose (dev 为主) |
| `docker-compose.staging.yml` | staging compose (独立) |
| `docker-compose.dev.yml` | Qdrant dev compose |
| `infra/k8s/*-deployment.yaml` | K8s 生产部署 manifests |
| `infra/terraform/aliyun-prod-*.tf` | Terraform 阿里云基础设施定义 |
| `docs/operations/deployment-guide.md` | 运维部署手册 |
| `docs/production-deployment-guide.md` | 生产部署指南 |
