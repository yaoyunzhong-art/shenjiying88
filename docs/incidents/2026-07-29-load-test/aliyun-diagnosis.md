# 🚨 阿里云生产事故诊断报告 · 2026-07-29

> **触发**: 23:03 50 VU 压测直打生产
> **当前**: 2026-07-29 23:35 CST — 事故 32 min 后
> **状态**: 🚨 **4 域名 + K8s API 全部不可达**

---

## 1. 完整根因图

```
                        ┌─────────────────────┐
                        │  阿里云账户         │
                        │  (欠费 / 风控触发)   │
                        └─────────┬───────────┘
                                  │
              ┌───────────────────┼────────────────────┐
              │                   │                    │
              ▼                   ▼                    ▼
   ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
   │  SLB (内网)      │  │  NLB (公网入口)   │  │  K8s API Server  │
   │  lb-bp106jfv     │  │  nlb-gjgd785d     │  │  47.98.47.157    │
   │                  │  │                   │  │                  │
   │  status: locked  │  │  status: Inactive │  │  status: blocked │
   │  BusinessStatus: │  │  BizStatus: None  │  │  (SLB 上游)      │
   │  FinancialLocked │  │  Listeners: 0     │  │                  │
   └──────────────────┘  └────────┬─────────┘  └────────┬─────────┘
                                  │                      │
                                  │                      │
                          ┌───────┴──────────┐           │
                          │  4 EIP (公网)    │           │
                          │  120.26.66.40   │           │
                          │  121.41.69.154  │           │
                          │  (NLB 关联)     │           │
                          └─────────────────┘           │
                                                         │
        DNS 解析 → 4 EIP → NLB 入口 → 0 listener → 丢包
```

## 2. 诊断结果（23:27 实测）

### 2.1 ACK 集群
- Cluster ID: `c3df2dbc1188143aa86de3bc47335e063` (m5-prod-cluster)
- State: **running** (4 节点健康)
- Version: 1.34.3-aliyun.1
- 节点: 4 个 ECS 全部 running

### 2.2 资源状态

| 资源 | ID/名称 | 状态 | 备注 |
|:---|:---|:---:|:---|
| **SLB (内网 K8s API)** | lb-bp106jfvv92zmro9cdi3r | 🔒 locked + FinancialLocked | 47.98.47.157 |
| **NLB (公网入口)** | nlb-gjgd785d7s4albohcx | ⚠️ Inactive + 0 listener | nlb 名: af309cfe485a643cd917f7f0653c27d5 |
| **EIP-1** | 120.26.66.40 | ✅ InUse | NLB 关联 |
| **EIP-2** | 121.41.69.154 | ✅ InUse | NLB 关联 |
| **EIP-3** | 47.98.47.157 | ✅ InUse | SLB 关联 |
| **EIP-4** | 120.27.241.104 | ✅ InUse | NAT gateway |

### 2.3 4 域名连通性 (23:35)
- api.sportsant.net: ❌ HTTP 000 (5s 超时)
- admin.sportsant.net: ❌ HTTP 000 (5s 超时)
- store.sportsant.net: ❌ HTTP 000 (5s 超时)
- tob.sportsant.net: ❌ HTTP 000 (5s 超时)

### 2.4 K8s API (47.98.47.157:6443)
- ❌ TCP 不通（5s 超时）
- ❌ kubectl 全 hang
- ❌ aliyun cs DescribeClusters API 也 hang

## 3. 根因（强证据）

1. **SLB FinancialLocked + locked** = 账户欠费触发阿里云自动锁定
2. **NLB Inactive + 0 listener** = 公网入口停服 + 监听器被清空
3. **K8s API 不通** = K8s API 入口在 SLB 后面，SLB locked 导致 K8s API 不通
4. **4 域名不通** = DNS 解析成功到 2 个 EIP，但 NLB 已停服

**模式与 handoff 7/19 记录的"阿里云欠费导致 SLB 锁定"完全一致**

## 4. 恢复路径（3 步）

### 步骤 1: 大飞哥充值 (5 min)
1. 登录 aliyun.com → 费用中心 → 充值
2. 充值金额: 建议 ≥ 5000 元（覆盖 SLB+NLB 1 个月）
3. 充值后 SLB FinancialLocked 自动解除（5-10 min 内）

### 步骤 2: 重启 NLB (10 min)
```bash
# 启动 NLB
aliyun nlb StartLoadBalancer --LoadBalancerId nlb-gjgd785d7s4albohcx --RegionId cn-hangzhou

# 创建 listener (TCP 80 → 后端 nginx-ingress)
aliyun nlb CreateListener \
  --LoadBalancerId nlb-gjgd785d7s4albohcx \
  --ListenerProtocol TCP \
  --ListenerPort 80 \
  --BackendServerGroupId <nginx-ingress-svc-id>
```

### 步骤 3: 验证 (5 min)
```bash
# DNS 测试
dig api.sportsant.net

# 4 域名 HTTP 200
curl -s -o /dev/null -w "%{http_code}\n" https://api.sportsant.net/

# K8s API
curl -s -o /dev/null -w "%{http_code}\n" https://47.98.47.157:6443/healthz
```

## 5. 预防措施（长期）

### 5.1 自动告警
- 阿里云账户余额 < 1000 元 → 短信 + 邮件告警
- 4 域名每 30s 拨测 → 不通立刻告警
- K8s API server 不通 → 立刻告警

### 5.2 压测门控
- 已在 commit fa7a2611f 中加 3 道门控
- 默认 BASE_URL = localhost:3145
- 生产 URL 必须 ALLOW_PROD=1 显式打开
- VU>100 必须 ALLOW_HV=1
- DURATION>5min 必须 ALLOW_LT=1

### 5.3 应急剧本
- 本地脚本: `scripts/aliyun-prod-status.sh` (5min 全栈诊断)
- 本地脚本: `scripts/aliyun-prod-status.sh` (需 perl alarm 替代 timeout)
- 阿里云控制台: https://home.console.aliyun.com → 费用中心 → 充值

## 6. 我能本地做的事

✅ **已完成**:
- `scripts/aliyun-prod-status.sh` — 5min 全栈诊断脚本
- `scripts/load-test.js` + `run-load-test.sh` — 3 道安全门控
- `docs/incidents/2026-07-29-load-test/incident.md` — 事故报告
- `memory/2026-07-29.md` — 完整时间线 + 教训
- `release-bundle v1.0.0-rc1` — 留证

⏳ **下一步 (大飞哥处理后)**:
- 跑 `bash scripts/aliyun-prod-status.sh` 验证恢复
- 跑 `bash scripts/run-cutover-drill.sh` 重新演练
- 跑 `bash scripts/deploy-check.sh production` 部署验收
- 7/30 放量重启

## 7. 教训

1. **本地优先是底线** — 任何生产 URL 操作必须有 ALLOW_* 门控
2. **阿里云欠费 = 生产宕机** — 必须加账户余额告警
3. **NLB Inactive 比 SLB 危险** — SLB locked 还能解，NLB listener 0 要重建
4. **DNS → NLB → K8s** — 任何一环挂都全挂
5. **压测 5 VU 是上限** — 不能加量

---

**大飞哥行动项**:
1. ⏳ 登录 aliyun.com → 费用中心 → 充值 (≥5000 元)
2. ⏳ 充值后跑 `bash scripts/aliyun-prod-status.sh` 验证
3. ⏳ 通知我确认恢复后，我立即跑 7/30 放量剧本
