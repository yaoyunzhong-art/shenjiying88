# Terraform — 阿里云基础设施即代码

> **模块**: Terraform 基础设施 | **位置**: `infra/terraform/`
>
> M5 数字运动潮玩平台阿里云（Aliyun）生产环境基础设施定义，使用 **Terraform** 进行全声明式管理。

## 目录结构

```
infra/terraform/
├── README.md                              # 本文档
├── .gitignore                             # 忽略 .terraform/ 和锁文件
├── .terraform/                            # Terraform 缓存目录（不提交）
├── .terraform.lock.hcl                    # Provider 版本锁定文件
├── variables.tf                           # 变量定义
├── terraform.tfvars                       # 变量赋值（敏感信息，勿提交）
├── terraform.tfstate                      # 状态文件（勿手动编辑）
├── terraform.tfstate.backup               # 状态文件备份
├── aliyun-prod-main.tf                    # 主配置：VPC / ACK K8s / 网络
├── aliyun-prod-data.tf                    # 数据层：RDS PostgreSQL / Redis
├── environments/                          # 环境配置目录
│   ├── production/                        # 生产环境
│   └── staging/                           # 预发布环境
├── modules/                               # 可复用模块
│   └── vpc/                               # VPC 网络模块
├── deploy.sh                              # 部署脚本
├── deploy-full.sh                         # 全量部署脚本（含 apply）
├── import-existing.sh                     # 导入已有资源脚本
├── setup-ack-roles.sh                     # ACK RAM 角色授权
├── setup-all-ack-roles.sh                 # 全量 ACK 角色设置
├── setup-csi-roles.sh                     # CSI 插件角色设置
└── *.log                                  # 部署日志归档
```

## 核心职责

### ☁️ 阿里云资源管理

Terraform 配置覆盖以下阿里云资源：

| 资源 | 配置文件 | 说明 |
|------|---------|------|
| **VPC** | `aliyun-prod-main.tf` | 10.0.0.0/16 私有网络 |
| **VSwitch** | `aliyun-prod-main.tf` | 多可用区子网（zone-b） |
| **NAT Gateway** | `aliyun-prod-main.tf` | 出网 NAT 网关 + EIP |
| **安全组** | `aliyun-prod-main.tf` | 流量控制规则 |
| **ACK K8s 集群** | `aliyun-prod-main.tf` | 阿里云托管 K8s，含系统/应用/数据节点池 |
| **SLB** | `aliyun-prod-main.tf` | 负载均衡 |
| **OSS Bucket** | `aliyun-prod-main.tf` | 对象存储（文件/备份） |
| **ACR** | `aliyun-prod-main.tf` | 容器镜像仓库 |
| **RDS PostgreSQL** | `aliyun-prod-data.tf` | 主从架构数据库 |
| **Redis** | `aliyun-prod-data.tf` | 缓存服务 |

### 📦 部署脚本

| 脚本 | 说明 |
|------|------|
| `deploy.sh` | 标准部署（plan → apply） |
| `deploy-full.sh` | 全量部署（含基础设施创建） |
| `import-existing.sh` | 将已有阿里云资源导入 Terraform 管理 |
| `setup-ack-roles.sh` | 配置 ACK K8s RAM 角色授权 |

### 🗂️ 环境管理

- **environments/production/** — 生产环境 Terraform 后端配置
- **environments/staging/** — 预发布环境 Terraform 后端配置
- **modules/vpc/** — 可复用的 VPC 网络模块

## 快速开始

```bash
# 1. 初始化 Terraform
cd infra/terraform
terraform init

# 2. 预览变更
terraform plan

# 3. 应用变更
terraform apply

# 4. 使用部署脚本（推荐）
./deploy.sh

# 5. 查看当前状态
terraform show
```

### 前提条件

- Terraform >= 1.9.0
- 阿里云 RAM 账号（AccessKey + SecretKey）
- 环境变量：`ALICLOUD_ACCESS_KEY`、`ALICLOUD_SECRET_KEY`
- [可选] `ALICLOUD_REGION`（默认 `cn-hangzhou`）

### 变量配置

编辑 `terraform.tfvars`（⚠️ 敏感文件，勿提交到 Git）：

```hcl
region       = "cn-hangzhou"
environment  = "production"
cluster_name = "m5-prod-cluster"

# 节点池规模
system_node_count      = 2
application_node_count = 4
data_node_count        = 3

# 数据库规格
db_instance_class     = "rds.pg.c2.2xlarge"
db_storage            = 500
redis_instance_class  = "redis.master.large"
```

## 相关文档

- [infra/README.md](../README.md) — 基础设施模块总览
- [infra/k8s/](../k8s/) — Kubernetes 集群编排
- [infra/docker/](../docker/) — Docker Compose 配置
- [docs/deployment-guide.md](../../docs/deployment-guide.md) — 完整部署指南
- [docs/operations/](../../docs/operations/) — 运维操作手册
- [docs/operations/deployment-guide.md](../../docs/operations/deployment-guide.md) — 生产部署手册
- [scripts/](../../scripts/) — 自动化运维脚本
- [DEPLOY-README.md](../../DEPLOY-README.md) — 部署总览
- [COMPOSE-DEPLOY-RUNBOOK.md](../../COMPOSE-DEPLOY-RUNBOOK.md) — Docker Compose 部署手册

## Overview (EN)

This directory contains **Terraform Infrastructure-as-Code** for managing the M5 Platform's Alibaba Cloud (Aliyun) production environment.

**Managed Resources:**
- VPC, subnets, NAT Gateway, security groups
- ACK (Alibaba Cloud Kubernetes) managed cluster with system/application/data node pools
- SLB load balancer, OSS object storage, ACR container registry
- RDS PostgreSQL (primary-replica) and Redis cache

**Deploy Scripts:**
- `deploy.sh` — Standard plan→apply workflow
- `deploy-full.sh` — Full infrastructure deployment
- `import-existing.sh` — Import existing cloud resources into Terraform state

**Key Variables:**
- Region: `cn-hangzhou` | Cluster: `m5-prod-cluster` | 2 system + 4 app + 3 data nodes
- RDS PostgreSQL 15.0 | Redis 5.0

---

**文档版本**: v1.0.0 | **最后更新**: 2026-07-17 | **维护团队**: M5 Platform Team
