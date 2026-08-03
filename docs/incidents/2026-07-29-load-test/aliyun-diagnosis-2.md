# 🚨 阿里云恢复状态报告 #2 · 2026-07-29 23:45

> **触发**: 大飞哥说"阿里云已经付费了"后立即验证
> **当前**: 2026-07-29 23:45 CST
> **状态**: 🟡 **3 域名短暂恢复 200 后，再次全挂 000**

---

## 1. 时间线

| 时间 | 状态 | 备注 |
|:---|:---|:---|
| 23:03 | 🚨 50 VU 压测事故 | 全栈 4 域名 000 |
| 23:30 | 大飞哥充值 | 阿里云 OpenAPI 卡死 |
| 23:42 | 3 域名短暂 200 | admin/store/tob.sportsant.net ✅ |
| 23:42 | api 200 but 503 | API pod 未完全就绪 |
| 23:43 | 4 域名再次全 000 | 网络层再次断开 |
| 23:45 | 持续 4 min 全 000 | 等待恢复 |

## 2. 当前状态（23:45）

### 2.1 4 域名
| 域名 | 23:42 | 23:45 | 状态 |
|:---|:---:|:---:|:---:|
| api.sportsant.net | 200 (但 503) | **000** | 🚨 |
| admin.sportsant.net | 200 | **000** | 🚨 |
| store.sportsant.net | 200 | **000** | 🚨 |
| tob.sportsant.net | 200 | **000** | 🚨 |

### 2.2 K8s API
- 47.98.47.157:6443/healthz: HTTP 000 (0.4s 超时)

### 2.3 业务数据 (23:42 短暂)
- store.sportsant.net: "神机营电竞乐园 · 旗舰店" 业务数据正常
- tob.sportsant.net: "ToB Admin Dashboard" 5 Open Alerts, 2 Critical
- 说明：K8s 集群内部 + Web Pod 正常，**只是网络层/入口层故障**

## 3. 推断

1. **23:42 短暂恢复 200** = 阿里云充值后 SLB 解锁
2. **23:43 再次 000** = 可能 WAF 再次检测到异常流量触发锁定
3. **关键观察**：我的 macOS curl 请求**也可能被 WAF 视为异常**

## 4. 再次核查项（大飞哥）

1. **阿里云账户余额**：
   - 当前余额 ≥ ? 元
   - 建议 ≥ 10000 元（防止后续流量触发账单预警）

2. **SLB 状态**：
   - 充值后是否真正解锁（不只 FinancialLocked，还有其他锁定状态吗？）

3. **NLB 状态**：
   - 23:30 诊断：Inactive + 0 listener
   - 充值后是否自动恢复 Active + 自动重建 listener？
   - 如果没有，需要手动恢复

4. **WAF 状态**：
   - 是否触发了新的 CC 攻击防护规则？
   - 是否需要临时关闭 WAF？

5. **安全告警**：
   - 阿里云控制台 → 安全告警 → 是否有"流量异常"告警？
   - 23:30 之后的流量

## 5. 我本地能立即做的

1. ✅ 已写 aliyun-prod-status.sh 诊断脚本
2. ✅ 已写 restore-nlb-listeners.sh 恢复剧本
3. ✅ 已写 post-recovery-cutover.sh 放量剧本
4. ✅ 已写 aliyun-check-connection.sh 幂等连接检查
5. ⏳ 等待大飞哥充更多余额 + 解除 WAF
6. ⏳ 5min 后再 curl 验证是否恢复

## 6. 立即验证（每 30s）

```bash
for d in api admin store tob; do
  r=$(curl -s -o /dev/null -w "%{http_code} %{time_total}s" --max-time 5 "https://$d.sportsant.net/" 2>&1)
  echo "$d: $r"
done
```

如果 5 min 内仍 000，建议：
1. 大飞哥在阿里云控制台手工 unlock
2. 或 kubectl 通过内网 (10.0.1.33:6443) 操作

---

**大飞哥行动项（紧急）**：
1. ⏳ 阿里云控制台 → 余额 + SLB + NLB + WAF 状态核查
2. ⏳ 余额不够则继续充值（建议 ≥ 10000）
3. ⏳ 通知我恢复后立即跑放量剧本

我已 commit 完整诊断 + 恢复剧本：
- `docs/incidents/2026-07-29-load-test/aliyun-diagnosis.md`
- `scripts/aliyun-prod-status.sh`
- `scripts/restore-nlb-listeners.sh`
- `scripts/post-recovery-cutover.sh`
- `scripts/aliyun-check-connection.sh`
