# M5 Platform V17+V18 灰度发布计划

> **版本**: v1.0.0  
> **更新日期**: 2026-07-16  
> **发布范围**: V17 (7模块) + V18 (6模块)  
> **发布策略**: 金丝雀灰度发布

---

## 1. 发布概览

### 1.1 发布目标

| 目标项 | 目标值 | 验收标准 |
|--------|--------|----------|
| 发布周期 | 14天 | 从灰度开始到全量发布完成 |
| 故障恢复时间 | < 5分钟 | 发现问题后回滚时间 |
| 用户影响范围 | < 1% | 灰度期间受影响用户比例 |
| 发布成功率 | 100% | 无重大故障完成发布 |

### 1.2 发布模块清单

```
┌─────────────────────────────────────────────────────────────────────┐
│                         灰度发布阶段规划                              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Phase 1: 基础设施层 (Days 1-2)                                     │
│  ├── [P-53] 基础设施                                               │
│  ├── 监控栈部署 (Prometheus/Grafana/Loki)                           │
│  └── 验证目标: 基础设施100%可用                                      │
│                                                                     │
│  Phase 2: 基础服务层 (Days 3-4)                                     │
│  ├── [P-31] 多租户架构                                             │
│  ├── 数据库迁移                                                      │
│  └── 验证目标: 租户隔离100%正常                                       │
│                                                                     │
│  Phase 3: 核心业务层 (Days 5-8)                                     │
│  ├── [P-30] 物流模块 (Days 5-6)                                    │
│  ├── [P-48] 营销券系统 (Days 7-8)                                  │
│  └── 验证目标: 核心业务流程100%通过                                  │
│                                                                     │
│  Phase 4: 增值服务层 (Days 9-10)                                    │
│  ├── [P-49] SEO/GEO系统                                            │
│  ├── [P-54] 自动化测试                                              │
│  └── [P-55] 性能优化                                                 │
│                                                                     │
│  Phase 5: 数据智能层 (Days 11-14)                                  │
│  ├── [P-64] 数据API网关 (Day 11)                                   │
│  ├── [P-60] 数据智能与BI (Day 12)                                  │
│  ├── [P-61] 用户画像中心 (Day 13)                                  │
│  └── [P-62~65] 剩余模块 (Day 14)                                    │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 2. 灰度策略

### 2.1 流量分配策略

| 阶段 | 时间 | 流量比例 | 验证目标 | 回滚条件 |
|------|------|----------|----------|----------|
| 金丝雀 | Day 1 | 1% | 核心链路可用 | 错误率 > 1% |
| 小流量 | Day 2-3 | 5% | 功能正常 | 错误率 > 0.5% |
| 中流量 | Day 4-7 | 20% | 性能达标 | P95 > 500ms |
| 大流量 | Day 8-10 | 50% | 稳定性验证 | 任何P0故障 |
| 全量 | Day 11-14 | 100% | 完整验收 | 任意故障 |

### 2.2 灰度维度

```yaml
# 灰度分流策略
灰度规则:
  # 用户维度
  user_based:
    - 规则: 内部员工
      匹配: email 包含 @m5-platform.com
      流量: 100%
    - 规则: VIP 用户
      匹配: user.vip == true
      流量: 10%
    - 规则: 普通用户
      匹配: user.type == 'normal'
      流量: 按比例逐步放开
      
  # 地域维度
  region_based:
    - 规则: 杭州
      匹配: region == 'cn-hangzhou'
      流量: 100%  # 阿里云机房就近
    - 规则: 上海
      匹配: region == 'cn-shanghai'
      流量: 50%
    - 规则: 北京
      匹配: region == 'cn-beijing'
      流量: 20%
      
  # 设备维度
  device_based:
    - 规则: iOS
      匹配: device.os == 'iOS'
      流量: 100%
    - 规则: Android
      匹配: device.os == 'Android'
      流量: 80%
    - 规则: Web
      匹配: device.type == 'web'
      流量: 100%
      
  # 业务维度
  business_based:
    - 规则: 测试门店
      匹配: store.type == 'test'
      流量: 100%
    - 规则: 试点门店
      匹配: store.type == 'pilot'
      流量: 50%
    - 规则: 普通门店
      匹配: store.type == 'normal'
      流量: 按阶段放开
```

---

## 3. 发布流程

### 3.1 发布前准备

```bash
#!/bin/bash
# release-pre-check.sh
# 发布前检查脚本

echo "=== M5 Platform 发布前检查 ==="

# 1. 代码检查
echo "[1/10] 代码检查..."
git pull origin main
git checkout -b release/v17-v18-$(date +%Y%m%d)

# 2. 版本号确认
echo "[2/10] 版本号确认..."
cat package.json | grep version
read -p "版本号是否正确? (y/n): " confirm

# 3. 依赖检查
echo "[3/10] 依赖检查..."
pnpm install --frozen-lockfile
pnpm audit --audit-level=high

# 4. 单元测试
echo "[4/10] 单元测试..."
pnpm test -- --coverage --coverageThreshold='{"global":{"branches":80}}'

# 5. 集成测试
echo "[5/10] 集成测试..."
pnpm test:integration

# 6. E2E 测试
echo "[6/10] E2E 测试..."
pnpm test:e2e:ci

# 7. 构建检查
echo "[7/10] 构建检查..."
pnpm build

# 8. 镜像构建
echo "[8/10] 镜像构建..."
docker build -t m5-platform:${VERSION} .
docker tag m5-platform:${VERSION} registry.cn-hangzhou.aliyuncs.com/m5-platform/prod:${VERSION}

# 9. 安全扫描
echo "[9/10] 安全扫描..."
trivy image registry.cn-hangzhou.aliyuncs.com/m5-platform/prod:${VERSION}

# 10. 推送镜像
echo "[10/10] 推送镜像..."
docker push registry.cn-hangzhou.aliyuncs.com/m5-platform/prod:${VERSION}

echo "=== 发布前检查完成 ==="
echo "镜像版本: ${VERSION}"
echo "下一步: 执行灰度发布"
```

### 3.2 发布执行

```bash
#!/bin/bash
# canary-deploy.sh <phase> <traffic_percentage>
# 灰度发布执行脚本

PHASE=$1  # canary, small, medium, large, full
TRAFFIC=$2  # 1, 5, 20, 50, 100
VERSION=${3:-$(date +%Y%m%d-%H%M%S)}

echo "=== M5 Platform 灰度发布 ==="
echo "阶段: ${PHASE}"
echo "流量: ${TRAFFIC}%"
echo "版本: ${VERSION}"

# 更新 Deployment
kubectl set image deployment/m5-platform \
  m5-platform=registry.cn-hangzhou.aliyuncs.com/m5-platform/prod:${VERSION} \
  -n m5-platform

# 配置流量分割
case $PHASE in
  canary)
    # 1% 流量 - 内部员工
    kubectl apply -f - <<EOF
apiVersion: networking.istio.io/v1beta1
kind: VirtualService
metadata:
  name: m5-platform
  namespace: m5-platform
spec:
  hosts:
    - m5-platform.com
  http:
    - match:
        - headers:
            x-internal-user:
              exact: "true"
      route:
        - destination:
            host: m5-platform
            subset: v${VERSION}
    - route:
        - destination:
            host: m5-platform
            subset: stable
EOF
    ;;
    
  small)
    # 5% 流量 - VIP 用户
    cat > /tmp/traffic-split.yaml <<EOF
apiVersion: networking.istio.io/v1beta1
kind: VirtualService
metadata:
  name: m5-platform
  namespace: m5-platform
spec:
  hosts:
    - m5-platform.com
  http:
    - match:
        - headers:
            x-user-vip:
              exact: "true"
      route:
        - destination:
            host: m5-platform
            subset: v${VERSION}
    - route:
        - destination:
            host: m5-platform
            subset: stable
      mirror:
        host: m5-platform
        subset: v${VERSION}
      mirrorPercentage:
        value: 5.0
EOF
    kubectl apply -f /tmp/traffic-split.yaml
    ;;
    
  medium)
    # 20% 流量 - 按地域灰度
    cat > /tmp/traffic-split.yaml <<EOF
apiVersion: networking.istio.io/v1beta1
kind: VirtualService
metadata:
  name: m5-platform
  namespace: m5-platform
spec:
  hosts:
    - m5-platform.com
  http:
    - match:
        - headers:
            x-region:
              exact: "cn-hangzhou"
      route:
        - destination:
            host: m5-platform
            subset: v${VERSION}
          weight: 100
        - destination:
            host: m5-platform
            subset: stable
          weight: 0
    - route:
        - destination:
            host: m5-platform
            subset: v${VERSION}
          weight: 20
        - destination:
            host: m5-platform
            subset: stable
          weight: 80
EOF
    kubectl apply -f /tmp/traffic-split.yaml
    ;;
    
  large)
    # 50% 流量
    cat > /tmp/traffic-split.yaml <<EOF
apiVersion: networking.istio.io/v1beta1
kind: VirtualService
metadata:
  name: m5-platform
  namespace: m5-platform
spec:
  hosts:
    - m5-platform.com
  http:
    - route:
        - destination:
            host: m5-platform
            subset: v${VERSION}
          weight: 50
        - destination:
            host: m5-platform
            subset: stable
          weight: 50
EOF
    kubectl apply -f /tmp/traffic-split.yaml
    ;;
    
  full)
    # 100% 流量 - 全量发布
    cat > /tmp/traffic-split.yaml <<EOF
apiVersion: networking.istio.io/v1beta1
kind: VirtualService
metadata:
  name: m5-platform
  namespace: m5-platform
spec:
  hosts:
    - m5-platform.com
  http:
    - route:
        - destination:
            host: m5-platform
            subset: v${VERSION}
          weight: 100
EOF
    kubectl apply -f /tmp/traffic-split.yaml
    
    # 更新稳定版本
    kubectl set image deployment/m5-platform-stable \
      m5-platform=registry.cn-hangzhou.aliyuncs.com/m5-platform/prod:${VERSION} \
      -n $NAMESPACE
    ;;
esac

# 验证流量分配
echo "验证流量分配..."
kubectl get virtualservice m5-platform -n m5-platform -o yaml | grep -A 20 "route:"

echo "=== 灰度发布完成 ==="
echo "阶段: ${PHASE}"
echo "流量: ${TRAFFIC}%"
echo "版本: ${VERSION}"
