# 证据字段标准

## 1. 目的

本标准用于统一 `54名行业与技术专家联合审计与规划方案 v2` 及其配套专项中的证据结构，解决以下问题：

1. 审计结论只有口头描述，没有统一字段
2. “已完成 / 已联调 / 已闭环”缺少可复核证据链
3. PRD、页面、接口、测试、验收、签字之间没有统一映射
4. mock、fallback、截图、口头确认等低可信材料被误当成正式证据

本标准是 `M0 基线锁定` 的前置工件之一。后续所有审计表、缺口清单、里程碑结论、复签纪要必须复用本标准。

## 2. 使用范围

- 《角色工作台能力矩阵》
- 《角色-权限-流程一致性审计表》
- 《TOB / TOC / 管理后台 对齐表》
- 《关键流程穿透审计表》
- 《高危权限缺口清单》
- 《审计底座差距清单》
- 《上线阻断清单》
- 阶段 `Kickoff / Mid / Retro`
- 复签结论与管理层汇报材料

## 3. 证据模型总原则

1. 每条结论必须可回溯到明确证据。
2. 每条证据必须标注来源、类型、可信度和采集时间。
3. 每条“完成”结论至少需要 `A + B` 级证据组合。
4. `C` 级证据只能辅助说明，不能单独支撑完成结论。
5. mock、fallback、演示态页面必须显式标识，不能并入闭环完成率。

## 4. 证据可信度分级

### 4.1 A 级证据

最高可信度，属于“源码或运行时事实”：

- 源码文件
- 配置文件
- 测试文件
- 测试执行结果
- 诊断结果
- 运行日志
- 接口响应记录
- 数据库结构或迁移文件
- 回放 / 导出 / 查询结果

### 4.2 B 级证据

中高可信度，属于“制度或需求依据”：

- PRD
- 需求卡
- RFC
- 路线图
- 模块设计文档
- 评审纪要
- Kickoff / Mid / Retro 文档
- 签字归档文档

### 4.3 C 级证据

辅助证据，不能单独作为完成判定：

- 口头描述
- 临时说明
- 未附源码的截图
- 聊天摘录
- 未落库的人工笔记

## 5. 统一证据字段

每条审计记录、缺口记录、完成记录至少包含以下字段：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `evidenceId` | 是 | 证据唯一编号 |
| `title` | 是 | 证据标题 |
| `domain` | 是 | 所属领域，如 `角色工作台`、`权限`、`交易`、`审计底座` |
| `scope` | 是 | 对应边界对象，如 `admin-web`、`api`、`tob-web` |
| `entityType` | 是 | 页面、接口、控制器、流程、角色、专项能力 |
| `entityName` | 是 | 具体对象名 |
| `claimType` | 是 | 支撑的结论类型 |
| `sourceType` | 是 | 源码、测试、PRD、需求卡、评审纪要、日志等 |
| `evidenceLevel` | 是 | `A` / `B` / `C` |
| `sourcePath` | 是 | 文件路径或证据来源 |
| `sourceRef` | 否 | 精确锚点，如函数、路由、段落、命令 |
| `capturedAt` | 是 | 采集时间 |
| `owner` | 是 | 证据责任人 |
| `status` | 是 | `有效` / `待复核` / `失效` |
| `summary` | 是 | 证据一句话摘要 |
| `riskNote` | 否 | 风险提示 |
| `relatedRequirement` | 否 | PRD / 需求编号 |
| `relatedRole` | 否 | 关联角色 |
| `relatedPermission` | 否 | 关联权限位 |
| `relatedTest` | 否 | 关联测试文件或命令 |
| `relatedSignoff` | 否 | 关联签字或评审记录 |

## 6. `claimType` 枚举

`claimType` 建议统一为以下枚举之一：

- `存在性`
- `已实现`
- `已联调`
- `已门禁`
- `已收口`
- `已测试`
- `已回归`
- `已验收`
- `已签字`
- `存在缺口`
- `存在风险`
- `需阻断`
- `需补证`

## 7. 标准记录模板

### 7.1 单条证据模板

```markdown
- evidenceId: EV-ROLE-0001
- title: 工作台目录角色清单
- domain: 角色工作台
- scope: admin-web
- entityType: 页面
- entityName: workbench page
- claimType: 存在性
- sourceType: 源码
- evidenceLevel: A
- sourcePath: apps/admin-web/app/workbench/page.tsx
- sourceRef: roleCategories
- capturedAt: 2026-07-26 12:00
- owner: 树哥
- status: 有效
- summary: 工作台目录明确列出 10 个角色工作台
- relatedRole: SUPER_ADMIN / TENANT_ADMIN / STORE_MANAGER ...
```

### 7.2 缺口记录模板

```markdown
- evidenceId: GAP-AUTH-0021
- title: 控制器缺少权限元数据
- domain: 权限
- scope: api
- entityType: 控制器
- entityName: SomeController
- claimType: 存在缺口
- sourceType: 源码
- evidenceLevel: A
- sourcePath: apps/api/src/modules/some/some.controller.ts
- sourceRef: class decorator
- capturedAt: 2026-07-26 12:10
- owner: 树哥
- status: 有效
- summary: 仅有 TenantGuard，缺少 RequireTenantScope 和 RequirePermissions
- relatedPermission: 待判定
- riskNote: 高危写接口裸露
```

### 7.3 完成记录模板

```markdown
- evidenceId: DONE-AUTH-0021
- title: 控制器权限收口完成
- domain: 权限
- scope: api
- entityType: 控制器
- entityName: SomeController
- claimType: 已收口
- sourceType: 源码 + 测试 + 回归
- evidenceLevel: A
- sourcePath:
  - apps/api/src/modules/some/some.controller.ts
  - apps/api/src/modules/some/some.controller.test.ts
- sourceRef:
  - RequireTenantScope / RequirePermissions
  - metadata test
- capturedAt: 2026-07-26 13:20
- owner: 树哥
- status: 有效
- summary: 已补 tenant scope、权限元数据和 metadata 测试，定向回归通过
- relatedPermission: foundation.governance.read / foundation.governance.write
- relatedTest: pnpm --dir apps/api exec vitest run ...
```

## 8. 完成结论判定规则

### 8.1 页面或功能“已完成”

必须至少满足：

1. `A 级` 源码证据
2. `A 级` 测试或诊断证据
3. `B 级` PRD/需求依据
4. 如涉及评审阶段，补充签字或阶段纪要

### 8.2 “已联调”

必须至少满足：

1. 页面真实调用 API，而非 mock / fallback
2. API 真实存在且返回符合契约
3. 至少 1 条运行证据或测试证据

### 8.3 “已闭环”

必须至少满足：

1. 入口存在
2. 门禁存在
3. API 存在
4. 流程走通
5. 测试存在
6. 风险已注明

### 8.4 “可复签”

必须至少满足：

1. `A + B` 级证据齐全
2. 所有阻断项状态明确
3. 相关签字字段完整
4. 无仅靠 `C` 级证据支撑的关键结论

## 9. mock / fallback / 演示态标记规则

凡遇到以下情况，必须强制加标记：

- `isMock = true`
- `isFallback = true`
- `isDemoOnly = true`
- `apiNotLanded = true`

并附说明：

- 不计入联调完成率
- 不计入闭环完成率
- 只能记入“现状存在性”，不能记入“完成”

## 10. 证据与需求映射规则

每条关键证据尽量回挂到以下任一来源：

1. PRD 编号
2. 需求卡编号
3. RFC
4. BS 编号
5. 里程碑 / Phase

推荐字段：

- `relatedRequirement`
- `relatedPhase`
- `relatedBS`

## 11. 证据与评审机制映射

证据必须能进入现有三阶段评审机制：

### Kickoff

- 输入证据：
  - PRD
  - RFC
  - 风险清单
  - 角色与边界冻结文档

### Mid

- 输入证据：
  - 当前源码
  - 差异清单
  - 测试结果
  - 阻断项

### Retro

- 输入证据：
  - 最终测试与验收结果
  - Lessons learned
  - 风险收口情况
  - 复签记录

## 12. 最低字段要求

### 12.1 页面审计表

至少包含：

- 页面路径
- 角色
- 权限门禁
- API 依赖
- PRD 映射
- 证据编号
- 当前状态
- 风险

### 12.2 API 审计表

至少包含：

- 控制器 / 路由
- 权限位
- Tenant Scope
- 测试落点
- 回归命令
- 证据编号
- 当前状态
- 风险

### 12.3 流程穿透表

至少包含：

- 流程名称
- 起点
- 终点
- 中间节点
- 页面/API/专项能力
- 证据链
- 是否存在断点

### 12.4 复签结论表

至少包含：

- 结论
- 证据编号列表
- 阻断项状态
- 风险接受情况
- 签字人
- 日期

## 13. 不合格证据判定

以下情况直接视为不合格：

1. 只写“已完成”，没有证据编号
2. 只有截图，没有源码或测试锚点
3. 只有口头说明，没有文件来源
4. mock 页面被写成“已联调”
5. fallback 数据被写成“真实完成”
6. 缺少采集时间和责任人
7. 结论与证据级别不匹配

## 14. 证据编号建议

统一建议格式：

```text
EV-域-序号
GAP-域-序号
DONE-域-序号
RISK-域-序号
SIGN-阶段-序号
```

例如：

- `EV-ROLE-0001`
- `GAP-AUTH-0021`
- `DONE-TOC-0012`
- `RISK-AUDIT-0003`
- `SIGN-M1-0001`

## 15. 下一步执行建议

1. 后续所有专家审计表模板先接入本字段标准
2. 已有《角色工作台能力矩阵》《三端对齐表》起草时必须带证据编号列
3. 高危缺口扫描结果必须按 `GAP-*` 编号归档
4. 完成项必须附 `DONE-*` 编号和回归命令
5. 复签结论必须附证据编号列表，不接受无编号结论

## 16. 关联文档

- [expert54-full-process-audit-plan.md](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/docs/knowledge/expert54-full-process-audit-plan.md)
- [role-master-dictionary.md](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/docs/knowledge/role-master-dictionary.md)
- [system-boundary-matrix.md](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/docs/knowledge/system-boundary-matrix.md)
- [e54-audit-foundation-implementation-plan.md](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/docs/knowledge/e54-audit-foundation-implementation-plan.md)
- [phase-review.md](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/docs/process/phase-review.md)
- [r18-requirement-dev-mapping.md](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/docs/operations/r18-requirement-dev-mapping.md)
