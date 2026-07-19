# P-50 V2 竞争监控管道 — 完成报告

## 完成时间
2026-07-19 15:53 CST

## 圈梁指令验收

| # | 指令 | 状态 |
|---|------|------|
| ① | TSC通过 | ✅ 0 errors |
| ② | 测试存在(0 fail·无skip) | ✅ 43 tests, 43 pass, 0 fail, 0 skip |
| ③ | 圈梁表更新 | ✅ 本文件 |
| ④ | PRD标记 | ✅ 已标记 |
| ⑤ | 知识赋能 | ✅ 见下文 |

## 交付物清单

### 创建的文件
1. **`monitor-collector.service.ts`** — 竞争数据采集服务 (mock实现，接口可替换)
   - `collectPriceChanges` — 价格异动
   - `collectNewActivities` — 新活动
   - `collectPromotions` — 新优惠
   - `collectRatingChanges` — 评分变化
   - `collectEquipmentChanges` — 设备异动 (新增)
   - `collectPolicyChanges` — 政策变更 (新增)
   - `incrementalScan()` — 增量扫描
   - `fullScan()` — 全量扫描
   - `deduplicate()` — 告警去重 (同天同竞品同类型仅留最新)
   - `generateTrend()` — 7天走势图数据

2. **`monitor-scheduler.ts`** — 定时调度
   - `@Cron('0 */2 * * *')` — 每2小时增量扫描
   - `@Cron('0 4 * * *')` — 每天04:00全量扫描

3. **`monitor-collector.service.test.ts`** — 19个测试用例
   - 6种告警类型 × 严重度
   - 去重逻辑 (正例+反例+边界)
   - 增量/全量模式
   - 时间排序
   - 空城市/空列表边界

### 修改的文件
4. **`intelligence.entity.ts`** — 新增类型
   - `CompetitorAlertType` (增加 `equipment_change`, `policy_change`)
   - `AlertSeverity`, `ScanMode`
   - `TrendPoint`, `MonitorScanResult`
   - `CompetitorAlert` (增加 `scanMode`, `deduped`)

5. **`intelligence.service.ts`** — 新增实时采集方法
   - `monitorCollector()` — 实时采集(异步)
   - `getLatestScanResult()` — 最新结果
   - `triggerIncrementalScan()` — 手动增量
   - `triggerFullScan()` — 手动全量

6. **`intelligence.controller.ts`** — 新增API端点
   - `GET /intelligence/monitor/summary` — 监控摘要
   - `POST /intelligence/monitor/scan/incremental` — 触发增量
   - `POST /intelligence/monitor/scan/full` — 触发全量

7. **`intelligence.module.ts`** — 注册新服务+ScheduleModule

8. **`intelligence.service.test.ts`** — 新增8个实时采集测试

### 修改的前端
9. **`apps/admin-web/app/intelligence/monitor/page.tsx`**
   - 6种监控类型筛选 (含设备异动、政策变更)
   - 数据新鲜度指示器
   - 自动刷新(30s)
   - 周异动走势图
   - 告警去重标记
   - API对接（实时数据源）

## 知识赋能

### 架构模式
```
用户请求 → Controller → IntelligenceService.monitorCollector()
                          └→ MonitorCollectorService.incrementalScan() [或 fullScan]
                              ├→ collectPriceChanges()
                              ├→ collectNewActivities()
                              ├→ collectPromotions()
                              ├→ collectRatingChanges()
                              ├→ collectEquipmentChanges()
                              └→ collectPolicyChanges()
                          └→ MonitorCollectorService.deduplicate()
                          └→ MonitorCollectorService.generateTrend()

定时触发 → MonitorScheduler.handleIncrementalScan() [每2h]
         → MonitorScheduler.handleFullScan() [每天04:00]
```

### 去重策略
- 时间桶: 天粒度 (`Math.floor(timestamp/86400000)`)
- 去重键: `{storeName}|{type}|{timeBucket}`
- 结果: 同键多记录中保留 `detectedAt` 最新的
- 旧记录标记 `deduped: true` (前端可灰显)

### 扩展路径
将 `collectXxx()` 方法内的 mock 逻辑替换为 HTTP 请求:
```typescript
// 替换方案示例
async collectPriceChanges(city?: string): Promise<CompetitorAlert[]> {
  const response = await fetch(`https://api.competitor-tracker.com/prices?city=${city}`)
  return response.json()
}
```
