# V23 审计 · G4 营销体验组
> 日期: 2026-07-20 · 评审专家: E7孙体验 + E?? 
> 版本: V23 v1.2

## 总体评级
🟡 **有条件通过**

## 评审意见

### 1️⃣ 三态全覆盖大幅降低用户困惑，但 "页面存在 ≠ 体验优秀"

V23 roadmap 宣布 admin-web 264 页面三态全覆盖（加载态/空态/错误态），storefront 和 RN 同样全覆盖。这是自 V18 G4 因加载速度问题被退回以来，前端体验最大的进步。

**G4 团队检查后确认以下成果：**

- ✅ admin-web 所有页面不再出现白屏、loading 无限旋转或未处理的 API 错误
- ✅ skeleton loading 已覆盖大多数列表页面
- ✅ CRUD 页面统一了错误反馈模式（Toast/Snackbar）
- ✅ storefront 促销模块 4670 行测试验证了渲染正确性

**但三态全覆盖只是"基础线"——而不是"体验线"：**

```
用户体验金字塔（基于 V23 现状评估）：
                🟢
              🟡 性能
            🟡 交互
          🟡 导航
        ✅ 功能完整
      ✅ 可视化
    ✅ 三态覆盖   ← 我们现在在这里
  ✅ 数据正确
✅ 可访问
```

三态全覆盖使页面"可用"，但距离"好用"还有差距：
- **骨架屏颗粒度粗**：列表页面统一用矩形块（skeleton），没有根据内容类型差异化（卡片用卡片形 skeleton，表格用行形 skeleton，详情页用块形 skeleton）
- **错误态无操作建议**："出错了，请重试" vs "网络连接失败，请检查网络设置后点击重新加载"——后者比前者对用户更友好
- **空态无引导**："暂无数据" vs "暂无优惠券数据，马上去创建一张"——后者引导用户下一步操作

**建议改进方向：**

| 模块 | 当前 | 目标 |
|:-----|:-----|:-----|
| skeleton | 统一矩形块 | 内容自适应的 skeleton shape |
| 错误态 | 通用"请重试" | 有上下文 + 操作建议的错误提示 |
| 空态 | "暂无数据" | 有引导 CTAs 的空状态 |

### 2️⃣ 页面加载速度是 G4 核心关切，V23 不设"性能箍"是遗留风险

V18 时 G4 因加载速度问题退回。V23 roadmap 在第九节（专家评审意见）中简单提了"CDN/静态缓存优先"作为关注点，但**整个 roadmap 没有设置任何性能相关的 MUST-PASS 门禁**。

**对比分析：**

| 维度 | V23 是否定义 | 具体内容 |
|:-----|:-----------:|:---------|
| 🔴基建箍 | ✅ P0 | CI/Docker/Build |
| 🧪E2E箍 | ✅ P1 | 50条E2E链 |
| ⏱️性能箍 | ❌ 缺失 | 无定义 |

**G4 认为**，在 V22 已经达到 admin-web 264 页、storefront 171 页的情况下，没有性能度量是一颗定时炸弹：

- **BFF层可能成为瓶颈**：当前架构中，storefront-web 通过 BFF（Next.js 或 API Route）获取数据。264 个 admin-web 页面 + 171 个 storefront 页面同时活跃时，如果没有缓存策略，单次页面渲染可能需要请求 10+ 个 API 端点
- **搜索结果页无缓存**：Promotions 页面的搜索筛选功能（`page.tsx` 含搜索逻辑）每次请求都直接查询数据库，没有 CDN 或 Redis 缓存层
- **移动端页面体积可能过大**：RN 应用加载 webview 页面时，未优化的 JavaScript bundle 体积会拖慢首屏渲染

**G4 要求**：在 V23 Phase 2（7/27→30）中补充性能基线：

| 指标 | 目标 | 测量方式 |
|:-----|:----:|:---------|
| 首屏渲染（FCP） | < 1.5s | Lighthouse + Web Vitals |
| API 响应（P95） | < 500ms | 服务器端日志 + Prometheus |
| 页面首次交互（TTI） | < 3s | Lighthouse |
| 移动端 bundle 体积 | < 200KB | `next-bundle-analyzer` 或 `webpack-bundle-analyzer` |

### 3️⃣ CDN/缓存策略的缺失是 V23 最显著的体验 gap

V23 在第九节（G4 关注点）写了"CDN/静态缓存优先"，但 roadmap 的整个 Phase 计划中 **没有安排任何 CDN 或缓存任务**：

- Phase 0（7/20→23）：CI/Docker/nginx/SSL/圈梁表/PRD/知识注入 —— 没有 CDN
- Phase 1（7/24→26）：P-47/P-30 领域交付 —— 没有 CDN
- Phase 2（7/27→30）：CI push/docker-compose/E2E/Prometheus/real API —— 没有 CDN

**V18 G4 退回的核心原因之一**就是页面加载速度，而 CDN 是提升静态资源加载速度最实惠的手段。

**G4 评审认为需要明确的 CDN 策略：**

| 层 | 策略 | 缓存的资源 | V23 排期 |
|:---|:-----|:----------|:--------:|
| nginx 层 | 静态文件缓存 | CSS/JS/fonts → max-age 7d | Phase 0 🟡 未配置 |
| CDN 层 | Cloudflare/阿里云 CDN | 图片/静态资源 → 全球加速 | Phase 2 ❌ 未列入 |
| API 层 | Redis 缓存 | 促销列表/会员信息/门店信息 | Phase 2 🟡 未明确 |
| 页面层 | ISR/SSG | storefront 促销页/品牌页 | ❌ 未评估（取决于 BFF 类型） |

**最低要求**：在 nginx 阶段就配置好静态资源的 cache-control（`immutable` 和 `max-age`），至少让浏览器缓存生效。

### 4️⃣ 移动端适配缺乏专项评审

V23 提到"storefront/RN 全覆盖"但未说明移动端适配的具体质量度量。RN 应用和 webview 的体验与桌面端有本质差异：

- **触摸交互**：桌面 hover 状态在移动端不存在，需要转化为 tap 交互
- **屏幕尺寸**：admin-web 的表格布局在 320px 宽的手机上无法展示（表格列太多）
- **手势**: 滑动、长按、双指缩放等移动端手势是否支持？
- **网络变化**: 移动端网络不稳定（WiFi↔蜂窝切换），页面是否支持 offline fallback？

**建议**：V23 至少补充以下移动端验收标准：

| 维度 | 标准 |
|:-----|:------|
| 视口适配 | 所有 storefront 页面在 320px-768px 宽度无水平滚动 |
| 触摸目标 | 所有交互元素 ≥ 44px × 44px (Apple HIG) |
| 网络降级 | 网络切换时页面不崩溃，显示离线模式提示 |
| 手势 | 列表页滑动删除、轮播图片滑动切换 |

## 关注点

### 🟡 Promotions 和 Budget 页面仍使用 mock 数据

V22 凌晨的审计记录（G4 晨间简报）明确指出：
- Promotions 页面 957 行代码全部硬编码 mock 数据（`STORE_NAMES`, `PROMOTION_TITLES`）
- Budget 页面 668 行代码全部 enum + useState，无 API 调用

**V23 roadmap 没有安排 "mock→真实 API" 的迁移任务**。这些前端页面虽然经过了测试（Promotions 69 tests / Budget 83 tests），但测试也是基于 mock 数据——测试通过仅证明"mock 环境中的渲染正确"，不证明"真实数据环境中的渲染正确"。

**强烈建议**：在 Phase 2（7/27→30）中将以下四项列为 P1 任务：
1. Promotions 列表页 → 接入 `GET /api/promotions` 
2. Budget 页面 → 创建 `GET/POST /api/finance/budget`
3. Campaign-rules 页面 → 接入规则引擎 API
4. 对应测试从 mock 数据切换到 MSW（Mock Service Worker）

### 🟡 BFF 架构未定义，SSR vs CSR vs ISR 决策未做

storefront-web 的渲染策略（SSR/CSR/ISR）直接影响用户体验和 SEO。V23 未做明确的渲染架构决策：

- **SSR（服务端渲染）**：首屏快、SEO 好，但服务器负载高
- **CSR（客户端渲染）**：构建简单、CDN 友好，但首屏延迟高
- **ISR（增量静态生成）**：兼顾首屏速度和动态性，但需要 Next.js 支持

**针对 shenjiying88 的场景**：

| 页面类型 | 推荐策略 | 理由 |
|:---------|:--------:|:-----|
| 促销活动列表 | ISR (revalidate: 60s) | 内容变化不频繁 |
| 品牌首页 | SSG + ISR | 静态内容为主 |
| 会员中心 | SSR + CSR hybrid | 个性化数据多 |
| 搜索/筛选页面 | CSR | 参数多、缓存难 |
| 管理后台 (admin) | CSR (SPA) | 全 API 驱动 |

**建议**：在 V23 Phase 2 中明确 storefront-web 的渲染策略，至少定义清楚"哪些页面用 SSR、哪些用 CSR"。

### 🟢 E2E 链增加了端到端体验验证，但缺少"真实用户模拟"

当前的 50 条 E2E 链覆盖了业务场景（POS→Checkout→Payment→Refund），但 G4 关注用户的**端到端情感体验**未被量化：

- 注册→浏览→加购→下单→支付→确认：这条完整的"顾客旅程"有 E2E 测试吗？
- 从"发现促销"到"领取优惠券"到"下单使用"：这条营销转化链路有 E2E 吗？
- 用户从进入页面到完成操作花了多长时间？——这不是功能验证，是体验度量

**建议**：补充 2-3 条 "customer journey" E2E 链，模拟真实用户行为（含页面切换、表单填写、支付选择），并记录完成时间。

## 建议

### 1. 增加「⚡性能箍」—— 前端加载速度门禁

**内容**：

| 门禁 | 检查 | 权重 |
|:-----|:-----|:----:|
| FCP < 1.5s | Lighthouse CI | P1（建议级） |
| Lighthouse Performance > 80 | CI 中 `lhci autorun` | P1（建议级） |
| 首屏 JS bundle < 200KB | `bundlesize` 门禁 | P2 |
| API P95 < 500ms | Prometheus + 告警 | 🔴 P0（基建阶段配置） |

**实现路径**：
1. Phase 0：在 CI 中配置 Lighthouse CI（`lhci`） —— 只需一个 GitHub Action 和一个配置文件
2. Phase 1：跑 benchmark，确定性能基线
3. Phase 2：将基线从"记录"升级为"门禁"——Lighthouse 分数下降告警

### 2. nginx 缓存配置立即补充

当前 nginx `m5.ssl.conf` 已创建但没有缓存策略。G4 建议在 Phase 0 剩余时间内补充：

```nginx
# 静态资源缓存
location /_next/static/ {
    expires 365d;
    add_header Cache-Control "public, immutable";
}

location /assets/ {
    expires 30d;
    add_header Cache-Control "public";
}

# API 不缓存
location /api/ {
    add_header Cache-Control "no-store";
}

# 页面 HTML 短期缓存
location / {
    expires 1m;
    add_header Cache-Control "public, must-revalidate";
}
```

这不需要 CDN 厂商，仅 nginx 配置即可实现浏览器和代理缓存。成本为 0，收益明显。

### 3. 移动端最低适配标准（V23 Phase 2）

G4 建议在 Phase 2（7/27→30）中专门安排 1 天（7/28）做移动端适配检查：

1. 打开 storefront 所有页面在 375px 宽度下检查布局
2. 检查所有交互元素尺寸 ≥ 44px
3. 检查表格页面在移动端是否可滚动（水平 overflow）
4. 检查 RN webview 打开 storefront 页面是否正常
5. 记录结果到 `docs/knowledge/mobile-readiness-0728.md`

这不是一次性的——Phase 2 之后每新增页面都要过移动端验收。

---

**G4 最终评级: 🟡 有条件通过**

通过条件（Phase 1 结束前 7/26）：
1. nginx 配置中补充静态资源的 cache-control 策略
2. 确定 V23 的性能基线指标（FCP/TTI/API P95）并写入 roadmap 或圈梁表
3. Promotions 和 Budget 页面的 "mock→真实 API" 迁移排期列入 Phase 2

以上 3 项若不满足，G4 保留在 Phase 1 结束时升级为🔴退回的权利。

*🐜 G4 营销体验组 · V23 审计 · 2026-07-20 23:10 CST*
