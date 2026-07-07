# 🌲 树哥trae 派发 Brief V6 · Phase-36~40 + Phase-41~44

> **派发时间**: 2026-06-27 22:50 CST (1h 冲刺 Part 7)
> **派发人**: 🦞 龙虾哥 (后台 22h 大脑级)
> **执行人**: 🌲 树哥trae (前台 8h 双手)
> **版本**: V6 · 跨 P1+P2 双阶段派发
> **总估时**: P1 14d + P2 7d = **21 天**

---

## 一、当前进度盘点

### 树哥trae 今日成果 (截至 22:48)
- **79 commits** | **+50,858 / -2,832 行代码** (.ts/.tsx)
- **生产代码**: 20,547 行 (业务)
- **测试代码**: 30,311 行 (质量)
- **测试/生产比**: 1.48:1 (健康)
- **D-controller spec 补全**: 11 模块 (cashier/ai-review/portal/time-series...)

### Phase 完成度
| Phase | 状态 | 关键节点 |
|-------|------|----------|
| Phase-35 收银台 | 95% | T164 SSE + T165 retro |
| Phase-36 会员 | 95% | T166-1/2/3 配置中心 |
| Phase-37~40 | 待开工 | 库存/财务/报表/推荐 |

---

## 二、Phase-36 优先收官 (D+1 ~ D+3)

### 🌲 树哥trae 优先任务 (等 T166-1 后端就绪)

**T166-1-2: admin-web 配置界面** (1.5h)
- 新增文件: `apps/admin-web/app/member/config/page.tsx`
- 5 档等级阈值编辑器
- 积分比例滑块 (Earn/Redeem)
- 提交到 MemberConfigService API
- E2E: 修改后立即生效

**T166-1-3: 等级进度展示组件** (1h)
- 新增组件: `packages/ui/src/MemberLevelProgress.tsx`
- 显示当前等级 + 下一等级差距
- 渐变动画 + 积分图标
- 单元测试 5 断言

---

## 三、Phase-37 库存 (D+4 ~ D+5, 2d)

### T167 后端 (admin-web)

**T167-1 inventory-list.tsx** (3h)
- 列表 + 搜索 + 筛选 + 分页
- 库存预警 (红色徽章, < 阈值)
- SKU / 名称 / 分类 / 库存数
- 批量操作 (上架/下架)

**T167-2 inventory-detail.tsx** (2h)
- 详情页 + 编辑表单
- 库存流水 (最近 100 条)
- 关联订单 (用到该 SKU 的订单)
- 预警设置 (低库存阈值)

**T167-3 inventory-adjust.tsx** (1h)
- 库存调整弹窗 (+/-/盘亏)
- 原因选择 (入库/退货/损耗/调整)
- E2E: 调整后实时同步

---

## 四、Phase-38 财务 (D+6 ~ D+7, 2d)

### T168 后端 (admin-web)

**T168-1 finance-dashboard.tsx** (3h)
- 4 大指标卡片 (GMV/退款/手续费/净利润)
- 趋势图 (近 30 天)
- 异常预警 (退款率 > 5%)
- 快捷入口 (对账/报表/凭证)

**T168-2 reconciliation-list.tsx** (2h)
- 对账列表 (按日期)
- 差异标注 (系统 vs 第三方)
- 一键对账 (确认无误)
- 异常标记 (待人工处理)

**T168-3 invoice-list.tsx** (1h)
- 发票列表 + 申请
- 状态机 (待开/已开/作废)
- PDF 下载链接

---

## 五、Phase-39 报表 (D+8 ~ D+9, 2d)

### T169 后端 (admin-web)

**T169-1 reports-overview.tsx** (3h)
- 4 大报表入口 (销售/会员/库存/财务)
- 自定义日期范围
- 导出 CSV/Excel/PDF

**T169-2 sales-report.tsx** (2h)
- 销售明细 (订单列表)
- 按 SKU/会员/渠道分组
- 趋势分析 (同比/环比)
- ECharts 图表 (line + bar)

**T169-3 member-report.tsx** (1h)
- 会员增长 (新注册/活跃)
- 等级分布 (饼图)
- 复购率
- 留存率 (Cohort)

---

## 六、Phase-40 推荐 (D+10 ~ D+11, 2d)

### T170 后端 (admin-web)

**T170-1 recommendation-engine.tsx** (3h)
- 推荐列表 + 筛选 + 排序
- 关联规则配置 (购买 A → 推荐 B)
- 效果统计 (CTR / CVR)
- 手动调整权重

**T170-2 ab-test-dashboard.tsx** (2h)
- A/B 流量分配
- 实验对比 (转化率)
- 显著性检验 (p-value)
- 灰度发布 (5%/25%/50%/100%)

**T170-3 personalization-rules.tsx** (1h)
- 个性化规则配置
- 会员等级 → 推荐品类
- 购买历史 → 推荐 SKU

---

## 七、Phase-41~44 P2 智能化前端 (D+12 ~ D+18, 7d)

### T171 AI 客服前端 (D+12 ~ D+13)

**T171-1 chat-window.tsx** (4h)
- 流式输出 (SSE)
- 多轮对话 (context 保留)
- 打字指示器
- 文件上传 (图片)
- 转人工按钮

**T171-2 faq-search.tsx** (2h)
- FAQ 知识库检索
- 自动补全
- 命中率统计

### T172 营销前端 (D+14)

**T172-1 rfm-segmentation.tsx** (3h)
- 8 段客户群可视化 (饼图)
- 客户列表 + 标签
- 一键推送营销活动

**T172-2 coupon-distribution.tsx** (2h)
- 优惠券模板编辑
- 目标人群筛选
- 发送渠道选择

### T173 数据分析前端 (D+15 ~ D+16)

**T173-1 dashboard-builder.tsx** (4h)
- 拖拽式仪表盘编辑
- 图表组件库 (KPI/折线/柱状/饼图/漏斗)
- 数据源配置 (PostgreSQL/ClickHouse)
- 保存 + 分享

**T173-2 cohort-analysis.tsx** (3h)
- Cohort 矩阵可视化
- 时间窗口切换 (日/周/月)
- 行业 benchmark 对比

### T174 开放 API 门户 (D+17 ~ D+18)

**T174-1 api-keys.tsx** (3h)
- API Key 创建/撤销/限流
- 使用统计 (调用次数)
- 复制 + 一次性展示

**T174-2 webhooks.tsx** (3h)
- Webhook 订阅配置
- 事件类型选择 (11 类)
- HMAC 密钥生成
- 重试日志查看

**T174-3 api-docs.tsx** (2h)
- OpenAPI 文档展示
- 沙箱测试 (Try it out)
- SDK 下载 (TS/Java/Python)

---

## 八、合计交付

### 代码量预估

| Phase | 文件 | 生产代码 | 测试代码 |
|-------|------|----------|----------|
| Phase-36 收尾 | 2 | 200 行 | 80 行 |
| Phase-37 库存 | 3 | 1,200 行 | 400 行 |
| Phase-38 财务 | 3 | 1,000 行 | 350 行 |
| Phase-39 报表 | 3 | 1,300 行 | 450 行 |
| Phase-40 推荐 | 3 | 1,100 行 | 380 行 |
| Phase-41 AI 客服 | 2 | 800 行 | 280 行 |
| Phase-42 营销 | 2 | 700 行 | 250 行 |
| Phase-43 分析 | 2 | 1,500 行 | 500 行 |
| Phase-44 开放 API | 3 | 1,400 行 | 480 行 |
| **总计** | **23** | **~9,200 行** | **~3,170 行** |

### 时间分配

| 阶段 | 天数 | 文件 | 代码行 |
|------|------|------|--------|
| Phase-36 收尾 | 0.5d | 2 | 280 行 |
| Phase-37~40 P1 收官 | 8d | 12 | 6,180 行 |
| Phase-41~44 P2 | 7d | 9 | 5,910 行 |
| **总计** | **15.5d** | **23** | **~12,370 行** |

---

## 九、反模式预检

开工前必查反模式库 v4 (20 文件):

- [x] tsx-decorator-pitfall (NestJS 装饰器顺序)
- [x] async-try-catch-pattern (异步错误处理)
- [x] markpaid-idempotency (幂等性)
- [x] residual-pending-state (残留状态)
- [x] concurrency-safety (并发安全)
- [x] event-bus-design (事件总线)
- [x] api-design (API 规范)
- [x] api-versioning (版本管理)
- [x] performance-optimization (性能)
- [x] security-defense (安全 OWASP)
- [x] observability (可观测性)
- [x] feature-flags (灰度发布)
- [x] test-pyramid (测试金字塔)
- [x] error-handling (错误处理)
- [x] db-index (数据库索引)
- [x] data-migration (数据迁移)
- [x] dead-test-code (死代码清理)
- [x] esm-cwd-tsx-loader (cwd)
- [x] naming-consistency (命名一致)
- [x] cron-wipe-phase34 (cron 防御)

---

## 十、提交格式

```
🐜 [Phase-XX] TNNN 任务标题 (X.Xh)

实施:
- 文件列表
- 行数统计
- 测试覆盖

反模式命中:
- v4 库 N 项匹配

R-06 防御: 原子提交 + HEARTBEAT
```

---

## 十一、依赖关系

```
T164 (Phase-35 SSE) ✅
  ↓
T166-1 (Phase-36 配置) ✅ 95%
  ↓
T167 (Phase-37 库存) ← 派发中
  ↓
T168 (Phase-38 财务)
  ↓
T169 (Phase-39 报表)
  ↓
T170 (Phase-40 推荐) ← P1 收官
  ↓
T171 (Phase-41 AI 客服) ← P2 启动
  ↓
T172~T174 ← P2 完成
```

---

> 🦞 **"P1 业务深耕 + P2 智能化 = SaaS v4.0 完整前端 + 后端 = 神机营迈向 IPO"**
> 🌲 **"树哥trae 一天 48,026 行 = 21 天完成 P1+P2 全部前端"** 🏆