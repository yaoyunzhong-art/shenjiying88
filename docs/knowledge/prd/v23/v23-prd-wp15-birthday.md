# V23 WP-15 PRD: 生日趴引擎

> P1 · 单段 · 无外部依赖

## 概述
自动识别会员生日，触发全链路营销：方案创建→自动推送→到店庆生→好友裂变→复购追踪。

## 需求拆解 (BS-0199~BS-0206)

| BS | 功能 | 要点 |
|:--|:--|:--|
| BS-0199 | 生日识别 | 从会员模块获取生日、标记近30天生日客户 |
| BS-0200 | 自动营销 | 生日前N天自动发送优惠券/活动推送 |
| BS-0201 | 方案配置 | 可配置不同等级的生日奖励方案 |
| BS-0202 | 推送触发 | 手动/自动触发生日推送 |
| BS-0203 | 裂变传播 | 到店庆生可带好友、好友享优惠 |
| BS-0204 | 好友追踪 | 记录好友邀请数、转化率 |
| BS-0205 | 消费追踪 | 生日当天/当周消费记录 |
| BS-0206 | 复购看板 | 月度复购率、均消、活跃方案数 |

## 数据结构
- `BirthdayPlan`: id, memberId, birthday, planDate, tier, rewardType, status
- `BirthdayReward`: id, planId, type, value, sentAt, claimedAt
- `BirthdayTracking`: id, planId, friendInvited, totalSpend, returnVisitDays
- `BirthdayDashboard`: monthlyBirthdays, activePlans, conversionRate, avgSpend, returnRate

## API端点
- 8个：POST/GET plans, trigger, claim, track, stats

## 验收标准
1. 生日创建与查询可正常返回
2. 推送触发不走样
3. 奖励领取可记录
4. 好友裂变可追踪
5. 看板数据聚合正确
