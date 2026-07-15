# 容器编排策略

> 分类: DevOps | 标签: K8s, Docker, 容器编排, Kubernetes | 适用: DevOps, SRE

## 概述

容器编排(Container Orchestration）是管理容器化应用部署、扩缩容、网络和存储的技术实践。Kubernetes(K8s）已成为容器编排的事实标准，它提供了声明式配置、服务发现、负载均衡、自动扩缩和自愈能力。Shenjiying88系统从V16版本开始从Docker Compose(单机部署）迁移到K8s集群，以支持多租户场景下的弹性扩缩和资源隔离。

根据CNCF 2025年年度调查，96%的组织在生产环境中使用Kubernetes，平均每个集群管理约25个微服务。K8s的学习曲线虽陡峭，但它带来的自动化能力可以显著降低运维负担——Shenjiying88部署到K8s后，版本回滚时间从15分钟降至2分钟，节点的自动扩缩使资源利用率提升了40%。

## 核心原则

- **原则1: 声明式配置(Declarative Configuration）**: 所有K8s资源(Deployment、Service、ConfigMap、Secret）通过YAML声明式定义，存储在Git仓库中，通过GitOps(ArgoCD）自动同步到集群。每次修改通过PR提交，Review后自动部署。手动 `kubectl apply` 不被允许，确保集群配置始终与Git一致。
- **原则2: 资源限制与请求**: 每个容器必须设置 `resources.requests`(最小保证）和 `resources.limits`(上限）。Shenjiying88的规范是：`requests` 为基准值(`cpu: 500m, memory: 512Mi`），`limits` 为峰值(`cpu: 1, memory: 1024Mi`）。这保证了调度器为新Pod分配足够资源，同时限制单个Pod不占用过多集群资源。
- **原则3: 健康检查探针**: 每个Pod配置Liveness Probe(存活检测——定期检查进程是否活着，失败则重启容器）和Readiness Probe(就绪检测——检查服务是否可接收流量，失败则从Service Endpoint中移除）。Shenjiying88的审计服务使用HTTP Get探针：Liveness监测 `/healthz`，Readiness监测 `/readyz`。
- **原则4: Pod反亲和性(Pod Anti-Affinity）**: 同一微服务的多个Pod调度到不同节点上，提高可用性。如果集群只有一个节点，备选策略是使用 `topologyKey: kubernetes.io/hostname` 的preferred反亲和性(尽量但非强制）。这避免了单节点故障导致整个服务不可用。
- **原则5: 水平自动扩缩(HPA）**: 基于CPU使用率(目标50%）和自定义指标(如QPS）自动调整Pod副本数。最小副本2(高可用），最大副本10。HPA配置了冷却时间(`scaleDown: 300s, scaleUp: 120s`）避免Pod频繁扩缩。Shenjiying88的审计计算密集型任务在高峰期会触发HPA自动扩容。

## 实践案例（基于shenjiying88项目）

- **案例1: Audit Service的K8s部署配置**: `deployment-audit.yaml` 包含：replicas:3(最小保证）、`strategy: RollingUpdate`(maxSurge:1, maxUnavailable:0）、容器指定 `image: registry.shenjiying88.com/audit-service:v1.2.3`(不可变Tag）、资源限制(requests: cpu 500m memory 512Mi；limits: cpu 1 memory 1Gi）、环境和Secret通过 `envFrom: configMapRef` 和 `secretRef` 注入。

- **案例2: 使用ArgoCD实现GitOps部署**: Shenjiying88的Git仓库 `gitops/` 目录存储所有K8s资源配置。ArgoCD实时监控Git仓库，检测到变更后自动同步到K8s集群。部署策略使用ArgoCD的Sync Waves确保顺序：先部署ConfigMap和Secret → 再部署数据库StatefulSet → 再部署业务Deployment。部署失败时自动回滚到上一个同步状态。

## 反模式警示

- **反模式1: 使用 `latest` 镜像Tag**: `image: my-service:latest` 导致不可重现的部署——不同节点上运行的镜像版本可能不同，回滚时不知道"上一版"的镜像是什么。Shenjiying88强制使用Git SHA作为镜像Tag：`image: my-service:abc123def`。

- **反模式2: 在Pod内运行多个容器(非Sidecar场景）**: 将一个Web服务器和一个后台任务放到同一个Pod中。Pod是调度和扩缩容的原子单位，这两个容器应该分别在自己的Deployment中管理，以便独立扩缩。仅应当使用Sidecar模式(如日志收集器、服务网格代理）作为例外。

## 参考文献

- CNCF (2025) "Annual Survey Report 2025"
- Kubernetes Documentation (2025) "Production Best Practices"
- ArgoCD Documentation (2025) "Declarative GitOps for Kubernetes"
