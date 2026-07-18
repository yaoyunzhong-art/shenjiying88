# 2026-07-19 · PLAN-REV-C2 VRT 原型验收记录

> 目标: 验证 `VRT` 视觉验收原型已搭建并可本地实跑
> 页面: `storefront /cashier` + `storefront /checkout`
> 设备: `desktop` + `tablet`
> 验收方式: 基线生成 + 当前截图 + pixelmatch diff 报告
> 结论: `✅ 通过`

---

## 验收链路

1. 安装 `pixelmatch` 与 `pngjs` 依赖
2. 配置 `scripts/vrt/vrt.config.json`
3. 执行 `VRT_BASE_URL=http://127.0.0.1:3000 pnpm vrt:baseline`
4. 生成 `cashier / checkout` 的 `desktop / tablet` 基线截图
5. 执行 `VRT_BASE_URL=http://127.0.0.1:3000 pnpm vrt:test`
6. 生成当前截图、diff 图片和 `report.html`
7. 确认 `4` 组页面/设备对比全部通过

---

## 验收结果

| 检查项 | 结果 | 说明 |
|--------|:----:|------|
| VRT 配置存在 | ✅ | `scripts/vrt/vrt.config.json` 已落地 |
| 基线脚本可跑 | ✅ | 成功生成 `4` 张基线截图 |
| 当前截图脚本可跑 | ✅ | 成功生成 `4` 张当前截图 |
| diff 对比可跑 | ✅ | `pixelmatch` 对 `4` 组图片输出结果 |
| HTML 报告可生成 | ✅ | `scripts/vrt/diffs/report.html` 已生成 |
| 试点页面稳定 | ✅ | `cashier / checkout` 在 `desktop / tablet` 全部 `0.00% diff` |

---

## 自动化证据

- 配置文件: [vrt.config.json](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/scripts/vrt/vrt.config.json)
- 快照脚本: [snapshot.ts](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/scripts/vrt/snapshot.ts)
- 对比脚本: [compare.ts](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/scripts/vrt/compare.ts)
- 报告入口: `scripts/vrt/diffs/report.html`

- 执行命令 1:

```bash
VRT_BASE_URL=http://127.0.0.1:3000 pnpm vrt:baseline
```

- 执行结果 1:

```text
✅ [desktop] storefront-cashier → storefront-cashier__desktop.png
✅ [tablet] storefront-cashier → storefront-cashier__tablet.png
✅ [desktop] storefront-checkout → storefront-checkout__desktop.png
✅ [tablet] storefront-checkout → storefront-checkout__tablet.png
总计: 4 | 通过: 4 | 失败: 0
```

- 执行命令 2:

```bash
VRT_BASE_URL=http://127.0.0.1:3000 pnpm vrt:test
```

- 执行结果 2:

```text
✅ [desktop] storefront-cashier: 0.00% diff
✅ [tablet] storefront-cashier: 0.00% diff
✅ [desktop] storefront-checkout: 0.00% diff
✅ [tablet] storefront-checkout: 0.00% diff
总计: 4 | 通过: 4 | 失败: 0 | 基线缺失: 0
```

---

## 当前产物

- 基线截图:
  - `scripts/vrt/baseline/storefront-cashier__desktop.png`
  - `scripts/vrt/baseline/storefront-cashier__tablet.png`
  - `scripts/vrt/baseline/storefront-checkout__desktop.png`
  - `scripts/vrt/baseline/storefront-checkout__tablet.png`
- 当前截图:
  - `scripts/vrt/screenshots/storefront-cashier__desktop.png`
  - `scripts/vrt/screenshots/storefront-cashier__tablet.png`
  - `scripts/vrt/screenshots/storefront-checkout__desktop.png`
  - `scripts/vrt/screenshots/storefront-checkout__tablet.png`
- Diff 报告:
  - `scripts/vrt/diffs/report.html`

---

## 补充说明

- 当前 `C2` 先按周排期中的降级策略收口为 `2` 个关键页面试点，已经足够满足“原型已搭建并可复跑”的验收目标
- 下一步只需在 `vrt.config.json` 继续扩页，无需推倒当前框架

---

## 结论

- `PLAN-REV-C2`: `✅ 完成`
- `G3` 退回条件: `B1 + C1 + C2` 已形成 `3/3` 证据面
- 下一优先级: `PLAN-REV-C3`
