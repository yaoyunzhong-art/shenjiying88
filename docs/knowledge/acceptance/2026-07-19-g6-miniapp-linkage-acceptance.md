# 2026-07-19 G6 Miniapp 联动验收

> 结论: `🟢 通过（联动入口、导航烟测、浏览器 PNG 证据已闭环）`

## 本次补齐范围

1. `miniapp` 路由表补入 `redeem-center`
2. 首页补 `G6 联动入口`
3. 会员页补 `会员权益联动`
4. 导航烟测覆盖 `sales-tools / redeem-center / customer-service`
5. 浏览器证据壳页与 PNG 落盘闭环

## 页面与入口

| 模块 | 状态 | 说明 |
|------|:----:|------|
| 路由注册 | ✅ | `sales-tools / redeem-center / customer-service` 已纳入页面表 |
| 首页联动入口 | ✅ | 首页可一跳进入导购工具、客服工作台 |
| 会员页联动入口 | ✅ | 会员页可一跳进入积分兑换、客服工作台 |
| 游客拦截 | ✅ | 未登录进入联动页会回退并提示先登录 |

## 浏览器证据

- [g6-miniapp-browser-index.png](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/docs/knowledge/acceptance/assets/g6-miniapp-browser-index.png)
- [g6-miniapp-browser-member.png](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/docs/knowledge/acceptance/assets/g6-miniapp-browser-member.png)
- [g6-miniapp-browser-roles.png](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/docs/knowledge/acceptance/assets/g6-miniapp-browser-roles.png)

## 代码证据

- 路由表: [app.config.ts](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/apps/miniapp/src/app.config.ts)
- 首页入口: [index.tsx](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/apps/miniapp/src/pages/index/index.tsx)
- 会员页入口: [index.tsx](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/apps/miniapp/src/pages/member/index.tsx)
- 导航烟测: [page-navigation.test.ts](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/apps/miniapp/src/page-navigation.test.ts)
- 浏览器壳页: [2026-07-19-g6-miniapp-browser-evidence.html](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/docs/knowledge/acceptance/2026-07-19-g6-miniapp-browser-evidence.html)
- 截图脚本: [g6-browser-capture.ts](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/scripts/g6-browser-capture.ts)

## 验收判断

- `G6` 已不再是“联动链待补”，而是“入口、路由、烟测、浏览器证据已闭环”。
- 后续仅需在真实业务接线扩展时沿用现有入口与验收模板，不影响本轮复签结论。
