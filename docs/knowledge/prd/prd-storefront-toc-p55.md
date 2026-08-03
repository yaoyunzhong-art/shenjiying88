# PRD-018: 单门店TOC网页 · 全链路产品需求文档

> 规格: PRD-V23-018 | 签发: 2026-07-26 03:04
> 依据: 《M5母机全域商业AI营销SaaS全案规划 V5.1》+ 54专家团联合评审
> 对应规划: `docs/knowledge/单门店TOC网页_全链路产品规划.md`
> 关联: P-55（门店C端门户）→ storefront-web/app/store/

---

## 一、产品定位

**一句话**: 为单门店打造的线上消费者入口，完成从发现门店→预约服务→下单核销→社交分享→复购回流的全链路闭环。

**核心指标**:
- 到店转化率 >25%
- 预约核销率 >85%
- 页面加载 LCP <2s
- 移动端适配 100%
- 核心操作 ≤3步

---

## 二、AC 验收标准

### AC-01: 门店首页展示
| ID | Given | When | Then |
|:---|:---|:---|:---|
| AC-01.1 | 门店 slug 有效 | 访问 /store/:slug | 展示门店名、评分、地址、营业时间、封面图 |
| AC-01.2 | 门店有服务项目 | 首页加载 | 热门项目卡片列表（含价格和预约入口）|
| AC-01.3 | 门店有活动 | 首页加载 | 活动日历展示（赛事/团建）|
| AC-01.4 | 门店有评价 | 首页加载 | 客户评价墙/种草笔记 |

### AC-02: 服务项目详情
| ID | Given | When | Then |
|:---|:---|:---|:---|
| AC-02.1 | 项目 ID 有效 | 访问 /store/:slug/services/:id | 图片轮播+文字介绍+价格+时长 |
| AC-02.2 | 项目可预约 | 点击"立即预约" | 跳转预约页并带入项目信息 |
| AC-02.3 | 有浏览历史 | 查看项目详情 | "猜你喜欢"推荐其他项目 |

### AC-03: 在线预约
| ID | Given | When | Then |
|:---|:---|:---|:---|
| AC-03.1 | 选择项目 | 进入预约流程 | 步骤1展示已选项目 |
| AC-03.2 | 选择时段 | 选日期后 | 展示该日可用时段（30分钟粒度）|
| AC-03.3 | 确认订单 | 选好时段 | 3步内完成：选项目→选时段→确认支付 |
| AC-03.4 | 预约成功 | 支付完成 | 显示核销二维码 |

### AC-04: 套餐下单
| ID | Given | When | Then |
|:---|:---|:---|:---|
| AC-04.1 | 门店有套餐 | 访问 /store/:slug/packages | 按分类Tab展示套餐卡片 |
| AC-04.2 | 选套餐 | 点击购买 | 进入数量选择→支付→生成核销码 |

---

## 三、API契约

| Method | Path | Request | Response |
|:---|:---|:---|:---|
| GET | /api/storefront/store/:slug | — | { name, address, rating, hours, phone, image } |
| GET | /api/storefront/store/:slug/services | ?category= | [{ id, name, price, duration, image }] |
| GET | /api/storefront/store/:slug/services/:id/slots | ?date= | [{ time, available }] |
| POST | /api/storefront/bookings | { storeSlug, serviceId, date, timeSlot, customerName, customerPhone, couponCode? } | { bookingId, status, qrCode, paymentUrl } |
| GET | /api/storefront/packages | ?storeSlug= | [{ id, name, price, originalPrice, items, image }] |

---

## 四、54专家团签收

| 组 | 签署 |
|:---|:---|
| G1 架构 | ✅ 路由设计符合 Next.js App Router 规范 |
| G2 安全 | ✅ API @Public() + CORS 配置 |
| G3 前端 | ✅ 3步闭环 + 移动端自适应 |
| G4 数据 | ✅ 接口契约与前端 mock 对齐 |
| G5 经营 | ✅ 收银→预约→核销全链路 |
| G6 营销 | ⏸ Phase 2 社媒模块 |
| G7 租户 | ✅ storeSlug 隔离门店数据 |
| G8 运维 | ✅ force-dynamic 构建通过 |
| G9 管理 | ✅ Phase 1 MVP 可行 |

> **签发结论: ✅ Phase 1 通过，启动开发**

---

*签发人: 🦞龙虾哥 · V23 Phase 1 · storefront-web 频道*
