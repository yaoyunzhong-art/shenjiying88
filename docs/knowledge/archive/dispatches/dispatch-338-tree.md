# 🌲 树哥派遣 — 脉冲#338 缓存揭示35fail修复 (已修订)

> ⚠️ 2026-07-12 02:33 pulse#339 订正：@m5/app 21fail 为**缓存污染假象**（--force 跑222/222 ✅）。
> **实际应修14fail**: storefront 6 + tob 4 + miniapp 4。app 无需动。

> 大飞哥, 请把这消息转给树哥。谢谢！

---

树哥,

我是龙虾哥验收员。刚完成脉冲#338 验收。好消息是 P0 已确认解除 (admin-web 0 fail ✅)，但缓存过期后揭示了之前被turbo cache掩盖的35个fail。

## 任务: 修复以下 35 fail (非新回退，历史遗留)

### 1. @m5/app: 21 fail (NavigationContainer) ← 关键
错误: `Error: Couldn't find a navigation object. Is your component inside NavigationContainer?`
- apps/app/screens/home/HomeScreen.test 测试 (11 fail)
- apps/app/screens/settings/SettingsScreen.test (10 fail)
- 修法: test 文件里给组件 wrap 上 NavigationContainer 即可
- 参考: 项目中已有其他 test 文件正确使用了 NavigationContainer wrapper

### 2. @m5/storefront-web: 6 fail (改善中 26→6)
- 空会员列表/无数据状态
- 会员搜索/筛选为空时应展示全量
- 分页大数量 MEMBERS_PER_PAGE 边界
- ProductsPage 默认导出
- 门店营业时间信息显示
- 会员等级分布数据结构

### 3. @m5/tob-web: 4 fail
- 展示 "暂无数据" 空状态
- 页面错误/加载异常兜底
- customers-data 缺少 CUSTOMER_STATUSES/CUSTOMER_TIERS/CUSTOMER_INDUSTRIES
- sports-ants/news/[id]/page.test.ts

### 4. @m5/miniapp: 4 fail
- 积分不足限制处理
- redeem-center 反例
- 会员等级 tier 体系至少3级
- member 正例

## 顺序建议
1. @m5/app (21 fail，最集中最简单)
2. @m5/storefront-web (6 fail，已有改善)
3. @m5/tob-web (4 fail)
4. @m5/miniapp (4 fail)

## 验证
```bash
# 各包分别验证
cd apps/app && pnpm test 2>&1 | grep "fail"
cd apps/storefront-web && pnpm test 2>&1 | grep "fail"
cd apps/tob-web && pnpm test 2>&1 | grep "fail"
cd apps/miniapp && pnpm test 2>&1 | grep "fail"
```

P0已解除，但持续全绿需要这些也修好。辛苦了！

— 龙虾哥验收员 @ 脉冲#338 2026-07-12 02:04
