# 反模式库 v4 · k8s-manifest (K8s 部署清单)

> **创建时间**: 2026-06-27 22:54 CST (1h 冲刺 Part 8)
> **分类**: DevOps · 容器编排
> **目标读者**: DevOps + SRE

---

## 1. K8s 部署核心对象

```
Deployment (无状态)
  ↓
Service ClusterIP (内部负载均衡)
  ↓
Ingress (外部 HTTPS 入口)
  ↓
ConfigMap + Secret (配置)
  ↓
HPA (水平扩缩)
  ↓
PVC (持久化存储)
```

---

## 2. ❌ 反模式 1: 单 Deployment 无副本

```yaml
# BAD: replicas=1 单点故障
apiVersion: apps/v1
kind: Deployment
metadata:
  name: api
spec:
  replicas: 1  # 挂了 = 全挂
```

**问题**:
- 节点宕机 = 服务挂
- 滚动更新需要 down time

### ✅ 最佳实践: 多副本 + 反亲和

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: api
spec:
  replicas: 3
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
  selector:
    matchLabels:
      app: api
  template:
    metadata:
      labels:
        app: api
    spec:
      affinity:
        podAntiAffinity:
          preferredDuringSchedulingIgnoredDuringExecution:
            - weight: 100
              podAffinityTerm:
                topologyKey: kubernetes.io/hostname
                labelSelector:
                  matchLabels:
                    app: api
      containers:
        - name: api
          image: shenjiying88/api:v1.0.0
```

---

## 3. ❌ 反模式 2: 没有资源限制

```yaml
# BAD: 无 resources,容器可以吃光主机
containers:
  - name: api
    image: shenjiying88/api:v1.0.0
```

**问题**:
- 一个 OOM 容器拖垮节点
- K8s 调度无法计算资源

### ✅ 最佳实践: requests + limits

```yaml
containers:
  - name: api
    image: shenjiying88/api:v1.0.0
    resources:
      requests:
        cpu: 100m       # 100 millicpu = 0.1 核
        memory: 256Mi   # 启动/调度基准
      limits:
        cpu: 1000m      # 最多 1 核
        memory: 1Gi     # OOM 阈值
```

**经验值**:
- API 服务: 100m-1000m CPU, 256Mi-1Gi Mem
- 数据库: 500m-2000m CPU, 1Gi-4Gi Mem
- 队列 worker: 50m-500m CPU, 128Mi-512Mi Mem

---

## 4. ❌ 反模式 3: 密钥硬编码 ConfigMap

```yaml
# BAD: 数据库密码明文
apiVersion: v1
kind: ConfigMap
metadata:
  name: api-config
data:
  DATABASE_URL: "postgresql://user:secret123@db:5432/app"
  JWT_SECRET: "supersecretjwtkey"
```

**问题**:
- 密钥泄露 = 全部泄露
- 审计困难

### ✅ 最佳实践: Secret + KMS

```yaml
# 1. 创建 Secret (K8s 或 external-secrets)
apiVersion: v1
kind: Secret
metadata:
  name: api-secrets
type: Opaque
stringData:
  DATABASE_URL: "postgresql://user:$(DB_PASSWORD)@db:5432/app"
  JWT_SECRET: "$(JWT_SECRET)"

---
# 2. Deployment 引用
envFrom:
  - secretRef:
      name: api-secrets
```

**更优: external-secrets + Vault**
```yaml
apiVersion: external-secrets.io/v1beta1
kind: ExternalSecret
metadata:
  name: api-secrets
spec:
  secretStoreRef:
    name: vault-backend
    kind: ClusterSecretStore
  target:
    name: api-secrets
  data:
    - secretKey: DATABASE_URL
      remoteRef:
        key: secret/data/api
        property: database_url
```

---

## 5. ❌ 反模式 4: 没有健康检查

```yaml
# BAD: 无 probe,应用挂掉也不知道
containers:
  - name: api
    image: shenjiying88/api:v1.0.0
```

### ✅ 最佳实践: liveness + readiness + startup

```yaml
containers:
  - name: api
    image: shenjiying88/api:v1.0.0
    ports:
      - containerPort: 3000
    startupProbe:  # 应用启动慢
      httpGet:
        path: /health
        port: 3000
      initialDelaySeconds: 10
      periodSeconds: 5
      failureThreshold: 30  # 启动最多 150s
    livenessProbe:  # 进程是否还活着
      httpGet:
        path: /health
        port: 3000
      periodSeconds: 10
      timeoutSeconds: 3
      failureThreshold: 3
    readinessProbe:  # 是否能接流量
      httpGet:
        path: /ready
        port: 3000
      periodSeconds: 5
      timeoutSeconds: 2
      failureThreshold: 2
```

**3 种 Probe 区别**:
- **startup**: 启动慢的应用,一次性
- **liveness**: 失败 = 重启 Pod
- **readiness**: 失败 = 摘流量 (不重启)

---

## 6. ❌ 反模式 5: 滚动更新 maxUnavailable=100%

```yaml
# BAD: 更新时所有副本同时替换 = 短暂不可用
strategy:
  rollingUpdate:
    maxUnavailable: 100%
    maxSurge: 0
```

### ✅ 最佳实践: 蓝绿/金丝雀

```yaml
strategy:
  type: RollingUpdate
  rollingUpdate:
    maxUnavailable: 0    # 不减少可用副本
    maxSurge: 1          # 每次最多 1 个新副本
    # 加 readiness 控制:新副本就绪后才继续
```

**更高级: Argo Rollouts 金丝雀**
```yaml
apiVersion: argoproj.io/v1alpha1
kind: Rollout
metadata:
  name: api
spec:
  replicas: 10
  strategy:
    canary:
      steps:
        - setWeight: 5      # 5% 流量
        - pause: { duration: 10m }  # 观察 10 分钟
        - setWeight: 25
        - pause: { duration: 10m }
        - setWeight: 50
        - pause: { duration: 10m }
        - setWeight: 100
```

---

## 7. ❌ 反模式 6: 没有 PDB

```yaml
# BAD: 没有 PodDisruptionBudget,自愿驱逐时可能同时挂掉所有副本
```

### ✅ 最佳实践: PDB 保证最低可用

```yaml
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: api-pdb
spec:
  minAvailable: 2  # 至少 2 个副本可用 (10 个中)
  selector:
    matchLabels:
      app: api
```

---

## 8. ❌ 反模式 7: 没有 HPA

```yaml
# BAD: 固定 replicas=3,大促期间被打爆
spec:
  replicas: 3
```

### ✅ 最佳实践: HPA 基于 CPU/内存/自定义指标

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: api-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: api
  minReplicas: 3
  maxReplicas: 20
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70
    - type: Pods
      pods:
        metric:
          name: http_requests_per_second
        target:
          type: AverageValue
          averageValue: "1000"
```

**业务经验**:
- 日常: 3-5 副本
- 大促: 10-20 副本
- 凌晨: 1-2 副本 (CronHPA 缩容)

---

## 9. ❌ 反模式 8: Service ClusterIP 不当

```yaml
# BAD: NodePort 暴露到公网
apiVersion: v1
kind: Service
metadata:
  name: api
spec:
  type: NodePort
  ports:
    - port: 3000
      nodePort: 30080
```

### ✅ 最佳实践: ClusterIP + Ingress

```yaml
# 1. Service ClusterIP (内部)
apiVersion: v1
kind: Service
metadata:
  name: api
spec:
  type: ClusterIP
  selector:
    app: api
  ports:
    - port: 80
      targetPort: 3000

---
# 2. Ingress (外部 HTTPS)
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: api-ingress
  annotations:
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
spec:
  tls:
    - hosts:
        - api.shenjiying88.com
      secretName: api-tls
  rules:
    - host: api.shenjiying88.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: api
                port:
                  number: 80
```

---

## 10. ❌ 反模式 9: 没有 NetworkPolicy

```yaml
# BAD: 默认所有 Pod 可互相访问,横向渗透风险
```

### ✅ 最佳实践: 默认拒绝 + 白名单

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: api-netpol
spec:
  podSelector:
    matchLabels:
      app: api
  policyTypes:
    - Ingress
    - Egress
  ingress:
    - from:
        - podSelector:
            matchLabels:
              app: nginx-ingress
      ports:
        - port: 3000
  egress:
    - to:
        - podSelector:
            matchLabels:
              app: postgres
      ports:
        - port: 5432
    - to:
        - podSelector:
            matchLabels:
              app: redis
      ports:
        - port: 6379
    # DNS
    - ports:
        - port: 53
          protocol: UDP
```

---

## 11. ❌ 反模式 10: 没有 graceful shutdown

```yaml
# BAD: 进程被 SIGKILL,请求被截断
containers:
  - name: api
    image: shenjiying88/api:v1.0.0
```

**问题**:
- K8s 滚动更新时,旧 Pod 被杀,正在处理的请求 502
- 长连接断开

### ✅ 最佳实践: preStop + terminationGracePeriodSeconds

```yaml
containers:
  - name: api
    image: shenjiying88/api:v1.0.0
    lifecycle:
      preStop:
        exec:
          command: ["/bin/sh", "-c", "sleep 15"]  # 等待 15s,让 LB 摘流量
    terminationGracePeriodSeconds: 30
```

**应用层配合**:
```typescript
// main.ts (NestJS)
app.enableShutdownHooks()  // 监听 SIGTERM
// 收到信号后:
// 1. 停止接收新请求 (readiness 失败)
// 2. 完成正在处理的请求 (最多 30s)
// 3. 关闭数据库连接
// 4. 进程退出
```

---

## 12. 神机营标准 Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: shenjiying88-api
  namespace: shenjiying88
  labels:
    app: api
    version: v1
spec:
  replicas: 3
  revisionHistoryLimit: 5
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxUnavailable: 0
      maxSurge: 1
  selector:
    matchLabels:
      app: api
  template:
    metadata:
      labels:
        app: api
        version: v1
      annotations:
        prometheus.io/scrape: "true"
        prometheus.io/port: "9090"
    spec:
      affinity:
        podAntiAffinity:
          preferredDuringSchedulingIgnoredDuringExecution:
            - weight: 100
              podAffinityTerm:
                topologyKey: kubernetes.io/hostname
                labelSelector:
                  matchLabels:
                    app: api
      securityContext:
        runAsNonRoot: true
        runAsUser: 1001
        fsGroup: 1001
      containers:
        - name: api
          image: shenjiying88/api:v1.0.0
          imagePullPolicy: IfNotPresent
          ports:
            - name: http
              containerPort: 3000
            - name: metrics
              containerPort: 9090
          envFrom:
            - configMapRef:
                name: api-config
            - secretRef:
                name: api-secrets
          resources:
            requests: { cpu: 100m, memory: 256Mi }
            limits:   { cpu: 1000m, memory: 1Gi }
          startupProbe:
            httpGet: { path: /health, port: http }
            initialDelaySeconds: 10
            periodSeconds: 5
            failureThreshold: 30
          livenessProbe:
            httpGet: { path: /health, port: http }
            periodSeconds: 10
            timeoutSeconds: 3
            failureThreshold: 3
          readinessProbe:
            httpGet: { path: /ready, port: http }
            periodSeconds: 5
            timeoutSeconds: 2
            failureThreshold: 2
          lifecycle:
            preStop:
              exec:
                command: ["/bin/sh", "-c", "sleep 15"]
          terminationGracePeriodSeconds: 30
          securityContext:
            allowPrivilegeEscalation: false
            readOnlyRootFilesystem: true
            capabilities:
              drop: ["ALL"]
          volumeMounts:
            - name: tmp
              mountPath: /tmp
      volumes:
        - name: tmp
          emptyDir: {}
```

---

## 13. 关联反模式

- [docker-deploy.md](docker-deploy.md): 镜像构建
- [security-defense.md](security-defense.md): K8s 安全
- [observability.md](observability.md): Prometheus 监控

---

> 🦞 **"K8s 部署清单 = 副本 + 资源 + 健康 + 安全 + 网络 = 生产级"**
> **"默认拒绝 + 最小权限 + 健康检查 + 优雅终止 = SRE 黄金法则"**