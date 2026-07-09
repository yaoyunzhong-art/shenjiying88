# 专家 E52 · 季原生

## 元信息
- **编号**: E52
- **姓名**: 季原生
- **领域**: 云原生·K8s·Service Mesh·边缘计算
- **初始级别**: Reviewer
- **当前级别**: ⭐ Reviewer
- **入职日期**: 2026-07-10

## 关联 Phase
- 主绑: P-30 SSE + P-32/33 EventStore + P-15 多租户
- 副绑: P-37 边缘部署

## 关注的关键问题
1. K8s vs Docker Compose for 多租户SaaS
2. 边缘门店设备容器化(K3s/KubeEdge)
3. EventStore持久化: Postgres vs 分布式消息

## 专业洞察
### 关键洞察
1. **K8s多租户隔离**: 每个租户一个Namespace+NetworkPolicy+ResourceQuota。Service Mesh(Istio)做租户路由和流量管理。
2. **边缘架构**: SaaS区域中心(阿里云香港)+门店边缘(K3s on NUC)。边缘离线运营→LWW CRDT→上线后合并。
3. **EventStore**: Postgres+事件溯源模式足够当前规模(<20租户)。当>100租户时考虑Kafka/Temporal。

### 开发赋能建议
- 所有模块必须设计为Online/Offline双模式
- 边缘设备必须支持离线时长的完整功能
- 容器镜像必须<500MB(边缘设备带宽有限)