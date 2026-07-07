# Pulse-Nightly-10: 跨模块 E2E 扩展 28→31 链 (2026-07-08)

> 凌晨测试第3段 · L3 跨模块 E2E 扩展 + 复盘改进 + 进化赋能

---

## 测试时间
- 03:30 - 05:30 CST, 2026-07-08
- Pulse-Nightly-10 (凌晨第10次脉冲)

## 新增跨模块 E2E 链 (3 链, 62 subtests)

### 链29: IoT → Edge AI → Realtime → Lineage (20 subtests)
- **路径**: IoT 设备数据 → Edge AI 推理 → Realtime 协同文档 → Lineage 血缘追踪
- **覆盖模块**: apps/api (IoT/Edge/Realtime/Lineage)
- **设计模式**: 物联网数据管道 + 实时协同 + 血缘审计
- **关键测试**:
  - Phase 1: IoT 设备数据采集（正例·反例·边界）
  - Phase 2: Edge AI 推理（正常·异常检测·极值输入）
  - Phase 3: Realtime 协同文档（CRUD·重复创建拒绝）
  - Phase 4: Lineage 数据血缘（追踪·影响分析·异常检测）
  - Phase 5: IoT→Edge→Realtime→Lineage 全链路集成
  - ✅ 边缘推理异常检测触发告警链路

### 链30: MultiRegion → Health → AutoRollback (22 subtests)
- **路径**: 多云区域路由 → 故障切换 → 健康检查 → 自动回滚部署
- **覆盖模块**: apps/api (MultiRegion/Health/HealthDashboard/AutoRollback)
- **设计模式**: 多云容灾 + 混沌工程 + 健康监测 + 自动回滚
- **关键测试**:
  - Phase 1: 多云区域路由（切换·恢复·503全故障）
  - Phase 2: 健康检查（单区域·全区域·趋势记录）
  - Phase 3: 自动回滚（健康部署·失败回滚·幂等性）
  - Phase 4: 全链路集成（故障→切换→部署→恢复）
  - ✅ 手动触发主从切换验证

### 链31: Content → BrandCustom → I18n → Multimedia (20 subtests)
- **路径**: 内容创建 → 品牌模板 → 多语言翻译 → 多媒体嵌入 → 内容发布
- **覆盖模块**: apps/api (Content/BrandCustom/I18n/Multimedia)
- **设计模式**: 全链路内容运营 + 品牌定制 + 国际化 + 多媒体适配
- **关键测试**:
  - Phase 1: 内容管理 CRUD + 版本控制
  - Phase 2: 品牌定制模板
  - Phase 3: 国际化多语言翻译（占位符保留·不支持locale警告）
  - Phase 4: 多媒体资源处理（上传·适配·超大文件拒绝）
  - Phase 5: 全链路发布（创建→模板→翻译→媒体→发布）
  - ✅ 占位符保持不变验证
  - ✅ 引用不存在的多媒体资源标记警告

## 复盘发现

### 测试环境稳定性
- 15/16 pnpm 任务缓存命中 (93.75%)
- 仅 @m5/api 实际执行（6.25%）
- 非api包持续全绿（连续10+脉冲）

### @m5/api 全量回归问题
- `full-regression.test.ts` 34 项模块检测全部显示"失败"但模块实际测试通过
- 根因: Vitest 4 移除 `test.poolOptions`，报告器代码未更新
- 影响: 测试报告 34 个红色失败标记但实际模块均通过（false positive）

### 内联 domain 模拟 vs 真实模块集成
- 链29-31 采用自包含 inline domain 模拟层
- 原因: IoT/Edge/Realtime/Lineage 等模块的 service 类型复杂且依赖多，直接导入会导致 MODULE_NOT_FOUND
- 影响: 无法通过真实 Nest TestingModule 验证模块间通信
- 改进方向: 为这些模块创建 `buildCrossModuleTestApp` 兼容包装器

## 新角色视角
- **IoT Operator** (链29): 设备管理、传感器数据监控
- **SRE/DevOps** (链30): 区域容灾、健康监测、部署回滚
- **Content Manager** (链31): 内容创建、品牌模板、多语言翻译

## 新债务
- P1-021: 链29-31 使用内联 domain 而非真实 NestJS 模块
- P1-022: @m5/api full-regression.test.ts 34 false positive (Vitest 4 兼容)
- P1-023: 内容运营链缺少审核工作流覆盖

## 持续债务
- P0-007: @m5/api timeout (30+脉冲)
- P0-009: @m5/api TSC 73 errors

## 知识沉淀
- IoT 数据管道的 E2E 测试设计模式: 数据采集 → Edge 推理 → 协同 → 血缘 → 告警
- 多云容灾测试设计模式: 区域路由 → 故障注入 → 健康监测 → 自动切回 → 部署回滚
- 内容运营测试设计模式: 创建 → 品牌模板 → 国际化 → 多媒体 → 发布 + 版本控制
- 使用 inline domain 模拟的三个原则: 1) 统一 reset 函数 2) 按 Phase 分组 3) 正例·反例·边界三元组
