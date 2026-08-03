# Infra — 基础设施代码

> **模块**: 基础设施即代码（IaC） | **位置**: `infra/`
>
> M5 平台的完整基础设施定义，覆盖 Kubernetes 编排、Terraform 云资源管���、Docker 容器化、监控告警、数据库 SQL 脚本和备份策略。

## 目录结构

```
infra/
├── backup/              # 备份脚本 & 配置
├── docker/              # Docker Compose 配置（dev / staging / prod）
├── k8s/                 # Kubernetes 清单文件
│   ├── backups/         # K8s 配置备份（含开切快照）
│   └── *.yaml           # ConfigMap / Ingress / Deployment 等
├── monitoring/          # 监控告警配置
│   ├── alertmanager/    # AlertManager 告警规则
│   ├── grafana/         # Grafana 仪表盘 JSON
│   ├── prometheus/      # Prometheus 配置 & 规则
│   └── loki/            # Loki 日志聚合配置
├── sql/                 # SQL 迁移脚本 & 初始化 DDL
├── terraform/           # Terraform IAC（阿里云资源定义）
│
├── canary-deployment-plan.md     # 金丝雀部署方案
└── production-config.yaml       # 生产环境完整 YAML 配置
```

## 各模块详解

### ☸️ Kubernetes（k8s/）
生产集群的 Kubernetes 清单文件，包括：
- `m5-config.live.yaml` — ConfigMap 配置
- `m5-ingress.live.yaml` — Ingress 入口配置
- 开切快照备份（`backups/public-cutover/`）

### 🏗️ Terraform（terraform/）
阿里云基础设施资源定义，使用 Terraform 管理：
- VPC / 子网 / 安全组
- ECS 实例 / RDS 数据库 / Redis
- ACK（阿里云 K8s）/ SLB / NAT 网关
- OSS 对象存储 / ACR 镜像仓库

### 🐳 Docker（docker/）
多环境 Docker Compose 配置：
- `docker-compose.dev.yml` — 开发环境
- `docker-compose.staging.yml` — 预发布环境
- `docker-compose.yml` — 生产环境

### 📊 监控（monitoring/）
可观测性三支柱完整配置：
- **Prometheus** — 指标采集 & 告警规则
- **Grafana** — 仪表盘 JSON 定义
- **Loki** — 日志聚合
- **AlertManager** — 告警通知规则

### 🗄️ SQL（sql/）
数据库迁移脚本与初始化 DDL，用于 PostgreSQL 数据库架构管理。

### 💾 备份（backup/）
定期备份脚本与策略配置，覆盖数据库快照与 K8s 配置备份。

## 快速开始

```bash
# Terraform 预览
cd infra/terraform
terraform plan

# 部署 K8s 配置
cd infra/k8s
kubectl apply -f m5-config.live.yaml

# 启动 Docker Compose 环境
cd infra/docker
docker compose -f docker-compose.dev.yml up -d

# 查看监控配置
ls infra/monitoring/prometheus/
```

## 相关文档

- [README.md](../README.md) — 项目主文档
- [DEPLOY-README.md](../DEPLOY-README.md) — 部署总览
- [COMPOSE-DEPLOY-RUNBOOK.md](../COMPOSE-DEPLOY-RUNBOOK.md) — Docker Compose 部署手册
- [canary-deployment-plan.md](canary-deployment-plan.md) — 金丝雀发布方案
- [scripts/](../scripts/) — 部署开切 & 运维脚本
- [docs/deployment-guide.md](../docs/deployment-guide.md) — 完整部署指南
- [docs/operations/](../docs/operations/) — 运维操作手册
