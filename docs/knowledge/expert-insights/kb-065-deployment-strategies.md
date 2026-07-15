# 部署策略（蓝绿/滚动/金丝雀）

> 分类: DevOps | 标签: 部署策略, 蓝绿部署, 金丝雀, 滚动更新 | 适用: DevOps, SRE

## 概述

部署策略决定了新版本代码如何替换旧版本代码。一个好的部署策略应该做到：零停机(用户无感知）、快速回滚(发现问题时迅速恢复）和风险可控(较小范围暴露新版本）。Shenjiying88系统根据不同场景选择不同的部署策略——正常的功能更新使用滚动更新(Rolling Update），重大变更或数据库迁移使用蓝绿部署(Blue-Green），高风险变更使用金丝雀发布(Canary Release）。

根据Google DORA的报告，采用先进部署策略(金丝雀、蓝绿）的团队，部署失败率比使用简单策略(替换式部署）的团队低5倍。Shenjiying88的CI/CD流水线支持三种部署策略的自由切换，开发者只需在部署请求中指定策略类型即可。

## 核心原则

- **原则1: 不可变部署(Immutable Deployment）**: 每次部署创建全新的基础设施实例(新Pod、新容器），不原地升级已运行的实例。这保证了回滚可以通过切换流量到旧实例完成，而无需考虑"实例状态被升级污染"。Shenjiying88的K8s Deployment始终使用RollingUpdate或Blue-Green策略，从未使用 `kubectl set image` 原地更新。
- **原则2: 蓝绿部署(Blue-Green）**: 维护两个完全相同的环境(Blue=当前版本，Green=新版本）。部署时，在Green环境启动新版本，运行完整的集成测试和健康检查。测试通过后，切换负载均衡器流量从Blue到Green。如果有问题，立即切回Blue。Shenjiying88的Blue-Green部署用于数据库Schema变更的场景——Green环境的数据库迁移完成后仍保留Blue环境的数据库，回滚时可快速切换。
- **原则3: 金丝雀发布(Canary Release）**: 新版本先部署到一小部分生产实例(5%流量）。监控错误率、延迟和业务指标。如果指标正常，逐步扩展金丝雀比例(10%→25%→50%→100%）。每个阶段持续观察5-15分钟。任何阶段的指标异常触发自动回滚。Shenjiying88的金丝雀发布使用Nginx的weighted upstream或Istio的流量分流。
- **原则4: 滚动更新(Rolling Update）**: 逐步替换Pod实例(一次替换1-2个Pod）。K8s默认策略——`maxSurge: 25%`(允许超出目标副本数25%）、`maxUnavailable: 25%`(允许25%的Pod不可用）。滚动更新适合快速迭代的正常功能更新。Shenjiying88的常规服务使用滚动更新，配置了Pod Disruption Budget(PBD）保证最小可用副本数。
- **原则5: 自动化回滚**: 部署失败或部署后健康检查失败时，CI/CD自动触发回滚。回滚策略也需要测试——Shenjiying88在staging环境中测试回滚流程，确保回滚脚本正确执行。关键服务(用户认证、审计任务队列）的回滚时间要求<2分钟。

## 实践案例（基于shenjiying88项目）

- **案例1: 审计服务蓝绿部署流程**: (1) CI构建新版本镜像(标签: `v2.1.0`）； (2) DevOps在ArgoCD中选择"Blue-Green Deploy"，ArgoCD在Green环境创建新的Deployment和Service； (3) Green环境通过健康检查(`/healthz`返回200）和集成测试(自动运行的HTTP测试套件）验证； (4) 验证通过后，ArgoCD更新Ingress路由，将流量从Blue Service切换到Green Service； (5) 监控5分钟确认无异常后，ArgoCD清理Blue环境。部署总耗时约3分钟。

- **案例2: 金丝雀发布示例**: 审计报告服务重大重构后：第一波(5%流量，监控15分钟，检查错误率和P99延迟）→ 第二波(25%流量，监控10分钟）→ 第三波(50%流量，监控10分钟）→ 全量发布。每个阶段自动收集金丝雀组和基线组的指标对比，设置差异告警(错误率差异>0.1%或P99延迟差异>50ms触发回滚）。开发者通过Grafana仪表盘实时观察金丝雀效果。

## 反模式警示

- **反模式1: 使用 `latest` Tag + 重启**: `docker-compose pull && docker-compose up -d --force-recreate` 的方式是典型的生产环境噩梦——无法追踪哪个版本在运行、无法回滚到特定版本、回滚时不清楚"上一版本"的镜像是什么。始终使用不可变镜像Tag。

- **反模式2: 数据库变更与应用部署同时进行**: 新版本的代码需要新的数据库Schema，但迁移脚本失败导致新版本和旧版本都无法正常工作。正确的做法是分步：先执行数据库迁移(向前兼容），待确认迁移成功后再部署新版本代码。Shenjiying88对需要数据库迁移的部署强制使用蓝绿策略。

## 参考文献

- Google DORA (2025) "2025 Accelerate State of DevOps Report"
- Kubernetes Documentation (2025) "Deployment Strategies"
- Martin Fowler (2024) "BlueGreenDeployment" — martinfowler.com/bliki
