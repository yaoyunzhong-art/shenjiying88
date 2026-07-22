# infra/k8s — Kubernetes 部署基础设施

## 模块概述

`infra/k8s` 是神机营 SaaS 的 Kubernetes 部署核心目录，基于 **Kustomize** 原生配置管理，完整覆盖生产环境的容器编排需求。该目录包含所有微服务的 Deployment、StatefulSet、ConfigMap、Ingress、网络策略、资源配额等 YAML 资源定义，并配有预检渲染工具链，支撑从开发到生产的灰度发布与割接流程。

主要功能：
- **多环境渲染**：通过 `kustomization.yaml` 编排全部资源 (namespace → 中间件 → 微服务 → 网络策略)，支持 `kubectl apply -k infra/k8s` 一键部署
- **割接预检体系**：`rendered-*` 系列目录 (rendered-public, rendered-cert-manager, rendered-release-preflight) 提供预检与临战演练的渲染产出物
- **模板化基础设施**：`templates/` 目录包含证书管理 (cert-manager)、Ingress 网关、DNS 记录、TLS 密钥等可配置模板，通过 `m5-*` 命名约定实现环境间复用
- **CI/CD 集成**：Kaniko 构建流水线 (kaniko-build-api.yaml, kaniko-build-frontends.yaml) 支持无 Docker Daemon 的安全镜像构建

## 技术栈

| 组件 | 用途 |
|------|------|
| Kubernetes 1.28+ | 容器编排平台 |
| Kustomize | 原生 YAML 配置管理 (kustomization.yaml) |
| cert-manager | TLS 证书自动签发 (Let's Encrypt / 阿里云 DNS-01) |
| Kaniko | 无特权容器镜像构建 |
| PostgreSQL StatefulSet | 主数据库有状态部署 |
| Redis Deployment | 缓存层 (含 Session / Rate Limit) |
| RabbitMQ Deployment | 异步消息队列 |
| MinIO Deployment | S3 兼容对象存储 |
| Ingress-NGINX | 网关层流量路由 |
| NetworkPolicy | 零信任网络隔离 |
| PodDisruptionBudget | 高可用调度策略 |
| ResourceQuota | 命名空间资源限额 |

## 快速开始

```bash
# 1. 部署全部资源 (从项目根目录)
kubectl apply -k infra/k8s/

# 2. 仅部署到指定命名空间 (已在 kustomization.yaml 中声明 namespace: m5)
kubectl apply -k infra/k8s/ --namespace=m5

# 3. 预检渲染 (dry-run，不实际提交)
kustomize build infra/k8s/ > rendered-preview.yaml
kubectl apply --dry-run=client -f rendered-preview.yaml

# 4. 使用模板渲染自定义环境
cd infra/k8s/
export K8S_ENV=staging
bash render.sh  # 根据 templates/ 生成 customized yaml
```

## 目录结构

```
infra/k8s/
├── kustomization.yaml          # Kustomize 入口，编排全部资源
├── namespace.yaml              # 命名空间 m5
├── configmap.yaml              # 全局配置
├── secret.yaml                 # 敏感凭据
├── postgres-statefulset.yaml   # PostgreSQL 有状态部署
├── redis-deployment.yaml       # Redis 缓存
├── rabbitmq-deployment.yaml    # 消息队列
├── minio-deployment.yaml       # 对象存储
├── api-deployment.yaml         # API 微服务
├── admin-deployment.yaml       # 管理后台
├── storefront-deployment.yaml  # 前端商城
├── tob-deployment.yaml         # TOB 业务服务
├── ingress.yaml                # 网关路由
├── network-policy.yaml         # 网络策略
├── pod-disruption-budget.yaml  # 调度预算
├── resource-quota.yaml         # 资源限额
├── kaniko-build-api.yaml       # API Kaniko CI
├── kaniko-build-frontends.yaml # 前端 Kaniko CI
├── monitoring-stack.yaml       # 监控堆栈 (Prometheus + Grafana)
├── templates/                  # 证书/Ingress/DNS 模板
│   ├── m5-cert-manager-*.template.yaml
│   ├── m5-ingress-public.template.yaml
│   └── m5-*.env.example
├── rendered-*/                 # 割接预检/渲染产物
├── cutover-bundles/            # 割接打包文件
├── cutover-logs/               # 割接操作日志
└── backups/                    # YAML 备份
```

## 圈梁检查点清单

- [ ] `kustomize build` 无输出错误，所有 template 变量正确替换
- [ ] `kubectl apply --dry-run=server` 验证通过，无 schema 冲突
- [ ] 所有 Service/Deployment 的 selector/label 与 kustomization.yaml 的 label 层匹配
- [ ] NetworkPolicy 的 podSelector / ingress 规则覆盖所有暴露端口
- [ ] cert-manager 的 ClusterIssuer 配置正确 (对应 DNS-01 或 HTTP-01)
- [ ] ResourceQuota 与 PodDisruptionBudget 的数值在实际集群容量之内
- [ ] ConfigMap/Secret 的 mountPath 与 deployment 中的 volumeMounts 一致
- [ ] rendered-release-preflight 目录保持最新，反映当前 kustomization 状态
- [ ] Kaniko 构建配置的 registry/dockerfile 路径与 CI 流水线一致
- [ ] 割接前执行 rendered-public-apply-drill 演练，确认全程无手动干预
