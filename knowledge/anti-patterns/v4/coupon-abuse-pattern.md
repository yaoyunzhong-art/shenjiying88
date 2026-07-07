# Coupon Abuse Pattern (优惠券滥用反模式)

> **版本**: v4 · **创建**: 2026-06-28 · **来源**: Phase-42 T172

优惠券是营销利器, 但若不防滥用, 将侵蚀利润。

## 5 反模式

### 1. 刷券 (Coupon Farming)
- **症状**: 同一用户短时间内多次领券
- **原因**: 无频控或频控窗口过大
- **修复**: `FrequencyCapService.checkCap()` 1/7d 默认窗口

### 2. 频控绕过 (Cap Bypass)
- **症状**: 用户通过换 campaign 重复领券
- **原因**: 频控按 campaign 隔离而非按用户
- **修复**: `couponAdapter.countInWindow()` 跨 campaign 共享频控记录

### 3. 预算透支 (Budget Overrun)
- **症状**: 月末预算突然耗尽
- **原因**: 无月预算 cap 或 cap 太高
- **修复**: `monthlyBudget()` 检查 10000/campaign/月

### 4. 渠道滥用 (Channel Spam)
- **症状**: 用户同时收到 IN_APP + WECHAT + SMS 三渠道触达
- **原因**: 多渠道独立触达, 无协调
- **修复**: `ChannelRouter` 按优先级单渠道触达

### 5. 退单套利 (Refund Arbitrage)
- **症状**: 用户领券 → 下单 → 退单 → 再次领券
- **原因**: 退单后优惠券仍可重新领取
- **修复**: 退单时标记券为"已使用", 阻止重领

## 5 清单

- [ ] 频控 1/7d 强制 (跨 campaign 共享)
- [ ] 月预算 cap 10000/campaign
- [ ] 多渠道优先级单触达 (避免骚扰)
- [ ] 退单即标记券失效
- [ ] 异常领取监控 (单日 > 5 次告警)

> 🦞 "优惠券 = 用户增长引擎, 滥用 = 利润黑洞"