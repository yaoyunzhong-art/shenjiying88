# 📚 每日研究日志 — 2026-07-19 (V21 Day1 · 周日)

> 四层浓缩日采 — 11:00批次
> 技术层 + 业务层 + 用户层 + 监督层

---

## 1️⃣ 技术层：多租户隔离 + Next.js测试模式

### 多租户隔离 (P-31相关)
来源: NestJS courses / Medium (2025)

**4种数据隔离策略对比:**
| 策略 | 隔离度 | 运维复杂度 | 适用场景 |
|:-----|:------:|:--------:|:---------|
| Shared Schema + tenant_id | 低 | 低 | 起步阶段 |
| Schema-per-tenant | 中 | 中 | 中等规模 |
| Database-per-tenant | 高 | 高 | 合规敏感 |
| PostgreSQL RLS | 高 | 中 | 推荐平衡方案 |

**8道护栏(fail-closed):**
1. Tenant Resolution：subdomain + JWT 双验证 → middleware 注入
2. TenantGuard：全局守卫，无tenant硬阻断
3. Service层强制tenantId参数（TypeScript约束）
4. Database RLS：PostgreSQL行级安全（最后防线）
5. Cache key 必须含 tenant 前缀
6. 后台Job必须包含 tenantId 在payload
7. 双租户交叉隔离测试（正向/反向）
8. 可观测性：每请求/DQL/cache 都tag tenantId

**对P-31的启示:**
- 我们目前使用 tenantStore（内存级）+ 路径参数验证
- 建议增加: TenantGuard 全局守卫 + RLS 策略 + 双租户交叉测试

### Next.js App Router测试模式
来源: Alvin Quach / Dev.to (2025)

**三分类测试策略:**
| 类型 | 工具 | 测试内容 |
|:-----|:-----|:---------|
| Unit | Vitest | 纯函数/工具 |
| Component | React Testing Library | Client Components |
| Integration | Playwright | Server Components + 全栈流 |

**核心观点:**
- Server Components 不做单元测试（从API测试+Playwright集成）
- Server Actions 提取业务逻辑为独立函数，只测逻辑
- 'use client' 组件mock重依赖，测交互而非渲染
- 迁移 Pages→App Router 时，纯函数测试不变

## 2️⃣ 业务层：行业竞争态势（来自现有知识库）

### 全球/中国市场规模
| 指标 | 数据 | 来源 |
|:----|:----|:----|
| 全球街机游戏中心市场(2025) | USD 140亿 | Grand View Research |
| 预计2033 | USD 317亿 (CAGR 11.1%) | GVR |
| 中国电玩城核心用户 | 25-34岁占47.3% | ZVZO |
| 单人单次消费 | ¥98 | ZVZO |
| 非游戏收入占比 | 11%→29% (2020→2025) | ZVZO |
| SaaS化渗透率 | <20% | 行业综合 |
| 全国大中型游艺厅/电玩城 | ~15,000家 | 行业综合 |

### 头部竞品对比
| 竞品 | 定价 | 定位 | 威胁 |
|:----|:----:|:-----|:----:|
| 广州数字驱动 | 免费+硬件 | 终身免费SAAS | ⚠️ 高 |
| 魔幻之城 | ¥200-500/月 | OTA/低代码 | 🔴 高 |
| 纳客收银 | ¥799买断 | 中小型店 | ⚠️ 中 |
| 油菜花科技 | SaaS年费+硬件 | 亲子/游艺全场景 | ⚠️ 中 |

### 国内TOP5连锁品牌
大玩家(400+)·星际传奇(400+)·风云再起(200+)·汤姆熊(200+)·环游嘉年华(150+)

### 下沉空间
T4城市SaaS渗透率仅8-18%，三线以下每百万人电玩城为一线1/5，未来5年至少3,000家新增空间

## 3️⃣ 用户层：CX关键指标
- **扫码到开玩≤3秒**是非做不可的基线体验
- 云化后设备利用率58%→79%（+21pp）
- 活跃会员比例<20%（改进空间巨大）
- 订阅制会员收入占比：22%（月卡模式可行）
- 种草到店转化率：18.6%（抖音/小红书基准）
- OTA推送限定皮肤+节日主题→月均游戏频次翻倍

## 4️⃣ 监督层：合规要求
- ISO27001 + 等保三级 + PCI-DSS 已是入场券
- 会员手机号+消费记录→敏感个人信息→加密+访问审计
- 未成年消费数据→重要数据→独立隔离+加密+年度审计
- GA/T 2380-2026 新规要求多租户隔离数据schema隔离
- 安全事件日志需留存≥1年

---

*🦞 龙虾哥 · 四层日采 · V21 Day1*
