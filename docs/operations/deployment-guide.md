# M5 Platform - 生产部署运维手册

## 1. 部署架构概览

```
┌─────────────────────────────────────────────────────────────┐
│                         负载均衡 (SLB)                        │
│                     HTTP/HTTPS 流量入口                      │
└──────────────────────┬──────────────────────────────────────┘
                       │
       ┌───────────────┼───────────────┐
       │               │               │
┌──────▼──────┐ ┌──────▼──────┐ ┌──────▼──────┐
│  API 实例-1  │ │  API 实例-2  │ │  API 实例-3  │
│   Node.js   │ │   Node.js   │ │   Node.js   │
│   (Docker)  │ │   (Docker)  │ │   (Docker)  │
└──────┬──────┘ └──────┬──────┘ └──────┬──────┘
       │               │               │
       └───────────────┼───────────────┘
                       │
        ┌─────────────┼─────────────┐
        │             │             │
   ┌────▼────┐  ┌────▼────┐  ┌────▼────┐
   │PostgreSQL│  │  Redis  │  │ RabbitMQ│
   │  (RDS)   │  │ (Redis) │  │ (MQ)   │
   └─────────┘  └─────────┘  └─────────┘
```

## 2. 环境准备

### 2.1 服务器规格要求

| 服务 | 规格 | 数量 | 备注 |
|------|------|------|------|
| API 服务 | 4C8G | 3+ | Docker 部署 |
| PostgreSQL | 8C16G | 1 | RDS 托管 |
| Redis | 4C8G | 1 | Redis 托管 |
| RabbitMQ | 4C8G | 1 | MQ 托管 |
| Nginx | 2C4G | 2 | 负载均衡 |

### 2.2 软件依赖

```bash
# 系统依赖
- Docker 24.0+
- Docker Compose 2.20+
- Node.js 22 LTS
- pnpm 10.14.0
- Git 2.40+

# 云服务
- 阿里云账号 (已开通 ECS/RDS/Redis/MQ/OSS)
- Terraform 1.6+
- kubectl 1.30+
```

## 3. 部署流程

### 3.1 基础设施部署 (Terraform)

```bash
# 1. 配置阿里云认证
export ALICLOUD_ACCESS_KEY="your-access-key"
export ALICLOUD_SECRET_KEY="your-secret-key"
export ALICLOUD_REGION="cn-hangzhou"

# 2. 初始化 Terraform
cd infra/terraform
terraform init

# 3. 预览变更
terraform plan -var-file=environments/prod.tfvars

# 4. 执行部署
terraform apply -var-file=environments/prod.tfvars -auto-approve

# 5. 获取输出
terraform output -raw kubeconfig > ~/.kube/m5-config
export KUBECONFIG=~/.kube/m5-config
```

### 3.2 应用部署 (Docker)

```bash
# 1. 登录镜像仓库
export CR_PAT="your-github-token"
echo $CR_PAT | docker login ghcr.io -u USERNAME --password-stdin

# 2. 拉取镜像
docker pull ghcr.io/shenjiying88/m5-api:latest
docker pull ghcr.io/shenjiying88/m5-admin-web:latest
docker pull ghcr.io/shenjiying88/m5-storefront-web:latest
docker pull ghcr.io/shenjiying88/m5-tob-web:latest

# 3. 启动服务
cd $PROJECT_ROOT
docker-compose -f docker-compose.yml up -d

# 4. 验证部署
docker-compose ps
docker-compose logs -f api
```

### 3.3 数据库迁移

```bash
# 1. 执行 Prisma 迁移
cd apps/api
pnpm prisma:migrate:prod

# 2. 验证数据库状态
pnpm prisma:validate

# 3. 生成 Prisma Client
pnpm prisma:generate
```

## 4. 监控配置

### 4.1 启动监控栈

```bash
# 1. 创建监控网络
docker network create monitoring-network || true

# 2. 启动监控服务
cd infra/monitoring
./scripts/start-monitoring.sh

# 3. 验证服务状态
docker-compose -f docker-compose.monitoring.yml ps
```

### 4.2 访问监控面板

| 服务 | 地址 | 默认凭证 |
|------|------|----------|
| Grafana | http://localhost:3005 | admin/admin |
| Prometheus | http://localhost:9090 | - |
| AlertManager | http://localhost:9093 | - |

## 5. 故障排查

### 5.1 常见问题

```bash
# 问题1: 容器无法启动
docker-compose logs <service-name>
docker inspect <container-id>

# 问题2: 数据库连接失败
telnet <db-host> 5432
nc -zv <db-host> 5432

# 问题3: 内存不足
free -h
docker stats

# 问题4: CPU 过高
top
htop
pidstat -u 1
```

### 5.2 日志收集

```bash
# 收集所有日志
docker-compose logs --tail=1000 > deployment-logs.txt

# 查看特定服务日志
docker-compose logs -f api

# 查看系统日志
journalctl -u docker.service -n 100
```

## 6. 回滚操作

```bash
# 1. 停止当前服务
docker-compose down

# 2. 回滚到上一个版本
docker pull ghcr.io/shenjiying88/m5-api:previous
docker tag ghcr.io/shenjiying88/m5-api:previous ghcr.io/shenjiying88/m5-api:latest

# 3. 重新启动
docker-compose up -d

# 4. 验证回滚
docker-compose ps
```

## 7. 联系与支持

- **技术支持**: support@m5.local
- **紧急热线**: +86-xxx-xxxx-xxxx
- **文档中心**: https://docs.m5.local
- **Status Page**: https://status.m5.local

---

**文档版本**: v1.0.0  
**最后更新**: 2026-07-16  
**维护团队**: M5 Platform Team
