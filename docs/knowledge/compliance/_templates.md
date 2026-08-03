# WP-COMPLIANCE 模板库

> 用途: 统一 `PR/DEV/BLK/RB/周报` 的最小可复制口径
> 关联: `docs/operations/r19-compliance-report-mechanism.md`、`docs/operations/r19-compliance-gate.md`

---

## 1) PR 合规字段模板

```yaml
6-8_refs:
  - BS-0000
compliance_statement:
  - BS-0000: 已理解 / 已实现 / 待验证
validator: 树哥
validated_at: YYYY-MM-DD
deviation_ids:
  - DEV-0000
rollback_id: RB-WP-XX-000
evidence_links:
  - docs/knowledge/acceptance/YYYY-MM-DD-wp-xx-acceptance.md
blocker_id: BLK-LYT-000
```

---

## 2) 偏离单（DEV）模板

```yaml
id: DEV-0001
severity: P0
title: 偏离标题
description: 偏离描述
bsRefs:
  - BS-0000
status: open
createdAt: YYYY-MM-DD
closedAt: null
blocker: true
assignedTo: null
targetCloseDate: null
resolution: null
```

---

## 3) 外部阻塞单（BLK）模板

```yaml
blocker_id: BLK-LYT-001
title: 缺少 LYT 电玩城真实接口文件
status: open
impact_work_packages:
  - WP-01B
  - WP-04B
current_facts:
  - 未拿到真实请求/响应字段
  - 未拿到签名算法
  - 未拿到错误码表
  - 未拿到 Webhook/轮询契约
allowed_to_continue:
  - 适配器接口壳
  - Mock/Real 插槽
  - 配置模型
  - 错误包装与超时降级
forbidden_to_claim_done:
  - 真实协议联调
  - 真实字段映射
  - 真实回调验收
external_owner: 待指定
internal_owner: 树哥
escalation_sla: 48h 无进展升级给大飞哥拍板催办
unblock_criteria:
  - 获得接口文件
  - 获得示例报文
  - 获得签名/错误码/回调说明
```

---

## 4) 回滚单（RB）模板

```yaml
rollback_id: RB-WP-00-001
work_package: WP-00
trigger_conditions:
  - 5xx 持续 5 分钟
  - 核心链路 smoke 失败
  - 关键业务状态错账/错单
rollback_types:
  - 代码回滚
  - 配置回滚
  - 数据补偿
  - 发布回滚
executor: 树哥
steps:
  - "[命令或脚本]"
post_verify:
  - Pod / 进程状态
  - 健康检查
  - 关键业务 smoke
  - 核心页面 HTTP 200 / 真实链路恢复
max_recovery_time: 15 分钟内恢复到上一个稳态
```

---

## 5) Sprint 周报模板（口径）

```yaml
sprint: Sprint-N
range: YYYY-MM-DD ~ YYYY-MM-DD
sources:
  - .trae/compliance/deviation-registry.json
  - .trae/compliance/bs-catalog.json
  - .trae/compliance/coverage-matrix.json
metrics:
  coverage_rate: 已覆盖BS数 / 308
  pass_rate: 已验证通过BS数 / 已覆盖BS数
  deviation_rate: 偏离项数 / 308
  closure_cycle_days: 平均闭环天数(分P0/P1/P2)
top_blockers:
  - BLK-LYT-001
top_p0_deviations:
  - DEV-0001
```

