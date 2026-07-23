# Sprint-0 · WP-COMPLIANCE 执行包

> 工作包: `WP-COMPLIANCE`
> 对应 BS: `BS-0233`, `BS-0248`, `BS-0250`, `BS-0261`, `BS-0262`
> 优先级: `P0`
> 关联总表: `docs/knowledge/2026-07-23-6-8-development-master-backlog-v2.md`

---

## Kickoff

### 目标

- 把《规划6-8》从“文档约束”变成“开发门禁”。
- 在 Sprint-0 内落地最小可执行的合规闭环:
  - 任务准入
  - `6-8_refs` 约束
  - 偏离单 `DEV`
  - 阻塞单 `BLK`
  - 周报数据源
  - 验收证据目录

### 本包范围

- 建立 `BS` 覆盖台账的最小数据结构
- 建立 `DEV/BLK/RB` 编号规则
- 建立 PR 合规字段模板
- 建立 Sprint 周报模板与数据源路径
- 建立工作包验收文档落点规则

### 不在本包范围

- 不做业务模块功能开发
- 不做 CI 平台深度插件开发
- 不做生产发布动作

### 入场条件

- 已确认 `v2` 为当前唯一执行口径
- 已确认 `LYT` 接口文件缺失是外部阻塞事实
- 已确认后续所有工作包都要挂 `6-8_refs`

### 退出标准

- 存在一套可直接复制使用的 `DEV/BLK/RB` 模板
- 存在一套 Sprint 周报模板
- 存在一套工作包验收落点规则
- `WP-00/02A/02B` 可直接引用本包规则开工

### 风险

- 若只写文档不接入执行流, 会退化成“纸面合规”
- 若 `DEV/BLK` 不编号, 后续周报无法自动统计

### 证据要求

- 文档路径
- 模板路径
- 示例编号
- 至少 1 份后续工作包引用样例

### 回滚口径

- 文档型回滚: 恢复上一版规则文件
- 流程型回滚: 若规则过重阻塞正常开发, 由大飞哥拍板降级为“记录但不拦截”

---

## Tasks

### T1 准入规则

- 定义每个工作包开工前必须具备:
  - kickoff
  - tasks
  - checklist
  - acceptance card
  - reading signoff
  - `R17 47项自检`

### T2 编号规则

- 定义 `DEV-xxxx` 偏离单
- 定义 `BLK-LYT-xxx` 外部阻塞单
- 定义 `RB-WP-xx-xxx` 回滚单

### T3 PR 字段

- 固化以下字段:
  - `6-8_refs`
  - `compliance_statement`
  - `validator`
  - `validated_at`
  - `deviation_ids`
  - `rollback_id`
  - `evidence_links`
  - `blocker_id`

### T4 周报机制

- 固化周报数据源:
  - `.trae/compliance/bs-catalog.json`
  - `.trae/compliance/deviation-registry.json`
  - `.trae/compliance/coverage-matrix.json`
- 固化周报指标:
  - 覆盖率
  - 通过率
  - 偏离率
  - 闭环时效

### T5 验收目录

- 固化验收文档落点:
  - `docs/knowledge/acceptance/<date>-<wp>-acceptance.md`

---

## Checklist

- [ ] `BS/DEV/BLK/RB` 编号规范已定稿
- [ ] PR 合规字段模板已定稿
- [ ] 周报数据源路径已定稿
- [ ] 验收文档目录规范已定稿
- [ ] 至少一个后续工作包已能直接复用本包模板
- [ ] 已同步给龙虾哥并确认采用
