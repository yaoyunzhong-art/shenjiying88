# DR-018 · SLO + Error Budget (Google SRE Workbook)

## 状态
已接受 (2026-06-26, Pulse-93)

## 背景
没有 SLO 的监控是"被动响应",不知道系统离 SLA 还差多少;没有 Error Budget 无法做 release 决策。

## 决策
1. **4 类 SLI**: availability / latency_p99 / latency_p95 / error_rate
2. **4 个默认 SLO** (API): 99.9% / P99 500ms / P95 200ms / 错误率 0.1%
3. **Error Budget**: monthly budget = 1 - SLO target
4. **Burn Rate 阈值** (Google SRE):
   - 1h burn rate > 14.4 → P0 (2% budget in 1h)
   - 6h burn rate > 6 → P1 (5% budget in 6h)
   - 24h burn rate > 3 → P2 (10% budget in 24h)
5. **Chaos Engineering**: 7 preset (cpu/memory/latency/partition/crash/exception) 验证告警链

## 后果
- ✅ 业务方与工程方对齐可用性目标 (99.9% = 43min/月 downtime)
- ✅ Burn rate 告警在 budget 耗尽前发现
- ✅ Chaos 演练验证告警 + runbook 有效性
- ⚠️ Burn rate 阈值需根据历史数据微调
- ⚠️ SLO 不能太严 (目标过高 → 永过不了) 也不能太松

## 替代方案
- 单一 SLI (e.g. 只看可用性): 漏报 latency
- 商业 SLO 平台 (Nobl9/Datadog SLO): 成本高
- 选择: 自研 SLO + Error Budget (Google SRE)
