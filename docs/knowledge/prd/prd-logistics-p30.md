# PRD-010: SSE后勤管理 — Logistics (P-30)

> 版本: v1.0 · 签发人: 🦞 龙虾哥 · 对接专家: E25 后勤
> 发布日期: 2026-07-13 · 状态: 🟢 已签发
> 关联Phase: P-30

## 1. 业务背景

店A每日需要后勤保障：设备巡检、清洁排班、维修工单。当前无系统，用纸质记录。

## 2. 功能需求

| RQ | 标题 | 优先级 | 验收标准 |
|:---|:-----|:------:|:---------|
| RQ-30-01 | 设备巡检 | P0 | 创建巡检计划→按时提醒→记录巡检结果 |
| RQ-30-02 | 清洁排班 | P0 | 排班表→分配清洁区域→考勤 |
| RQ-30-03 | 维修工单 | P0 | 上报故障→派单→维修→验收 |
| RQ-30-04 | 物料申领 | P1 | 后勤物料(纸巾/清洁剂)→申领→审批→出库 |

## 3. 验收卡

| AC | 场景 | 预期 |
|:---|:-----|:-----|
| AC-30-01 | 创建巡检任务(每日18:00, 设备A) | 任务创建成功, 到点提醒 |
| AC-30-02 | 记录巡检结果(设备A=正常) | 记录保存, 展示"已巡检" |
| AC-30-03 | 报修(机器B不转)→派单给维修工C | 工单创建→维修工收到通知 |
| AC-30-04 | 维修完成→验收 | 工单状态=已完成 |

## 4. 数据模型

```typescript
interface MaintenanceTask {
  id: string;
  type: 'inspection' | 'clean' | 'repair';
  assignee: string;
  schedule: string;       // cron表达式
  area: string;
  status: 'pending' | 'done' | 'skipped';
  result?: string;
  createdAt: Date;
}

interface RepairOrder {
  id: string;
  equipment: string;
  issue: string;
  reporter: string;
  assignee: string;
  status: 'open' | 'in_progress' | 'done' | 'verified';
  verifiedAt?: Date;
}
```
