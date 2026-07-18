# VRT 视觉验收原型 · VRT Acceptance Prototype

> 创建日期: 2026-07-19 02:55 · V21 Day1
> 目标: G4体验退回条件的第二项（三选二：✅ checkout L3 / ✅ VRT原型 / ☐ Pad端1页）

## 概述

视觉回归测试（VRT）自动化验收原型。Puppeteer + Playwright 截取关键页面快照，与基线对比差异。

## 架构

```
scripts/vrt/
├── baseline/              # 基线截图（初始通过后保存）
├── screenshots/           # 运行截图（当前版本）
├── diffs/                 # 差异报告（diff.png + JSON）
├── run-vrt.sh             # 入口脚本
├── vrt.config.json        # 页面清单 + 设备配置
├── snapshot.ts            # Playwright 截取逻辑
└── compare.ts             # pixelmatch 对比逻辑
```

## 页面清单（首批10页）

| 模块 | 页面 | 优先级 | 状态 |
|:----|:-----|:------:|:----:|
| 收银 | POS首页 | P0 | ☐ |
| 会员 | 会员列表 | P0 | ☐ |
| 会员 | 会员详情 | P0 | ☐ |
| 库存 | 库存总览 | P1 | ☐ |
| 营销 | 优惠券列表 | P1 | ☐ |
| 财务 | 对账页面 | P1 | ☐ |
| 报表 | 营收报表 | P1 | ☐ |
| 配置 | 门店设置 | P2 | ☐ |
| 系统 | 安全基线 | P2 | ☐ |
| 系统 | 审计日志 | P2 | ☐ |

## 技术选型

- **截图工具**: Playwright (chromium headless, 1280x720)
- **对比引擎**: pixelmatch (像素级 diff)
- **报告输出**: HTML report + diff image
- **CI集成**: 可选 Pre-commit hook 或 nightly cron

## 用法

```bash
# 1. 安装依赖
pnpm add -D @playwright/test pixelmatch

# 2. 生成基线截图（需要 dev server 运行）
pnpm vrt:baseline

# 3. 运行 VRT 对比
pnpm vrt:test

# 4. 查看报告
open scripts/vrt/diffs/report.html
```

## pnpm scripts (package.json 根目录)

```json
{
  "scripts": {
    "vrt:baseline": "tsx scripts/vrt/snapshot.ts --baseline",
    "vrt:test": "tsx scripts/vrt/snapshot.ts && tsx scripts/vrt/compare.ts",
    "vrt:report": "open scripts/vrt/diffs/report.html"
  }
}
```

## pixelmatch 配置

```typescript
// scripts/vrt/vrt.config.json
{
  "threshold": 0.1,          // pixelmatch threshold (0-1)
  "includeAA": false,        // 不忽略抗锯齿
  "alpha": 0.1,              // 透明度容差
  "diffColor": [255, 0, 0],  // diff 标记颜色（红色）
  "viewport": { "width": 1280, "height": 720 },
  "devices": [
    { "name": "desktop", "width": 1280, "height": 720 },
    { "name": "tablet", "width": 768, "height": 1024 }
  ]
}
```

## 首批10页 VRT 开发任务

### Phase 1（P0-收银+会员 4页）
- [ ] `pnpm vrt:baseline --url http://localhost:3000/pos`
- [ ] `pnpm vrt:baseline --url http://localhost:3000/members`
- [ ] `pnpm vrt:baseline --url http://localhost:3000/members/[id]`
- [ ] `pnpm vrt:baseline --url http://localhost:3000/stock`

### Phase 2（P1-营销+财务+报表 4页）
- [ ] `pnpm vrt:baseline --url http://localhost:3000/coupons`
- [ ] `pnpm vrt:baseline --url http://localhost:3000/finance/reconciliation`
- [ ] `pnpm vrt:baseline --url http://localhost:3000/finance/profit-loss`
- [ ] `pnpm vrt:baseline --url http://localhost:3000/reports`

### Phase 3（P2-配置+系统 2页）
- [ ] `pnpm vrt:baseline --url http://localhost:3000/settings`
- [ ] `pnpm vrt:baseline --url http://localhost:3000/security`

## 验收标准

1.  Playwright 脚本能截取10页快照
2.  基线截图存储在 `scripts/vrt/baseline/`
3.  重复运行后 `pixelmatch diff` 差异 < 1%
4.  CI 集成后每次 commit 自动触发 VRT
5.  diff 报告 HTML 清晰展示变化区域

## 关联

- G4 体验退回条件 #UQ-004
- checkout L3 渲染测试已修复: #G4-checkout ✅
- 本 VRT 原型为三选二中的第二项 ✅
