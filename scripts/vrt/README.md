# 视觉回归测试 (VRT)

> 基于 Playwright + pixelmatch 的视觉回归测试工具链，用于自动对比基线截图与当前版本快照，检测 UI 视觉效果的变化。

---

## 📂 目录结构

```
scripts/vrt/
├── README.md                  # 本文件 — 模块概述
├── run-vrt.sh                 # VRT 运行入口脚本
├── snapshot.ts                # 页面截取工具（生成基线 / 快照）
├── compare.ts                 # 图片对比工具（输出差异报告）
├── vrt.config.json            # VRT 配置文件
├── baseline/                  # 基线截图（黄金版本）
│   ├── storefront-cashier__desktop.png
│   ├── storefront-cashier__tablet.png
│   ├── storefront-checkout__desktop.png
│   └── storefront-checkout__tablet.png
├── screenshots/               # 当前版本截图
│   ├── storefront-cashier__desktop.png
│   ├── storefront-cashier__tablet.png
│   ├── storefront-checkout__desktop.png
│   └── storefront-checkout__tablet.png
└── diffs/                     # 对比差异报告
    ├── report.html
    ├── storefront-cashier__desktop.png
    ├── storefront-cashier__tablet.png
    ├── storefront-checkout__desktop.png
    └── storefront-checkout__tablet.png
```

---

## 🚀 快速开始

### 前置依赖

```bash
# 安装必要依赖
pnpm add -D @playwright/test pixelmatch canvas
```

### 运行流程

```bash
# 第1步: 更新基线截图（当 UI 变更确认无误时）
tsx scripts/vrt/snapshot.ts --baseline

# 第2步: 截取当前版本快照
tsx scripts/vrt/snapshot.ts

# 第3步: 对比并生成差异报告
tsx scripts/vrt/compare.ts

# 或者一键运行（仅对比，不更新基线）
bash scripts/vrt/run-vrt.sh
```

### 查看报告

对比完成后，打开 `scripts/vrt/diffs/report.html` 查看可视化差异报告。

---

## 🧠 核心功能

### 1. 多设备覆盖

支持 **desktop** (1280×720) 和 **tablet** (768×1024) 两种视口尺寸，确保 UI 在主流设备上的视觉一致性。

### 2. 基线管理

- `--baseline` 模式：生成/更新基线截图，标记为"黄金版本"
- 普通模式：截取当前版本，与基线进行像素级对比

### 3. 像素级差异检测

使用 `pixelmatch` 算法进行逐像素对比，支持：
- 可配置阈值 (`threshold: 0.1`)
- 反走样忽略 (`includeAA: false`)
- 差异区域红色高亮标记

### 4. 自动报告生成

对比完成后输出 HTML 报告，直观展示：
- 基线 / 当前 / 差异三栏对比
- 每个页面的通过/失败状态
- 差异像素数与百分比

### 5. 配置化

通过 `vrt.config.json` 灵活配置：

```json
{
  "threshold": 0.1,            // 像素差异容忍度
  "devices": ["desktop", "tablet"],
  "pages": [
    { "name": "storefront-cashier", "url": "/cashier", "priority": "P0" },
    { "name": "storefront-checkout", "url": "/checkout", "priority": "P0" }
  ]
}
```

---

## ⚠️ 注意事项

1. **基线更新时机** — 仅在 UI 变更是期望结果时更新基线，避免因基线过时导致误报
2. **重试机制** — 截图操作对网络波动敏感，如遇截图失败请重试 1~2 次
3. **灰度差异** — 字体渲染、抗锯齿在不同操作系统下可能存在微小差异，建议同一环境下运行对比
4. **设备覆盖** — 当前仅覆盖 desktop 和 tablet 两种设备，如需新增移动端视口请在 `vrt.config.json` 中添加
5. **CI 集成** — 建议将 VRT 集成到 CI 流程，在 PR 合并前自动触发对比，拦截异常视觉变更
6. **报告清理** — `diffs/` 目录在每次 `compare.ts` 运行时会被覆盖重建，无需手动清理
