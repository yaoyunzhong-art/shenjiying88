# ⚡ 性能基线 (Performance Baseline)

> Last updated:
> 2026-07-21 02:40 +08:00

## 概述

| 项目 | 值 |
|------|-----|
| 测量工具 | Lighthouse (Headless Chrome) |
| 测量环境 | Local Dev (macOS) |
| 网络节流 | 无 (Provided) |
| CPU节流 | 无 |
| 目标 | LCP < 2000ms (G4 审计条件) |

## admin-web — 运营管理后台 — 首页

| 指标 | 值 | 阈值 | 状态 |
|------|-----|------|------|
| **LCP** (Largest Contentful Paint) | 待测量 | ≤2000ms | ⏳ 基线待建立 |
| **FCP** (First Contentful Paint) | 待测量 | ≤3000ms | ⏳ 基线待建立 |
| **TTI** (Time to Interactive) | 待测量 | ≤5000ms | ⏳ 基线待建立 |
| **SI** (Speed Index) | 待测量 | ≤5000ms | ⏳ 基线待建立 |
| **TBT** (Total Blocking Time) | 待测量 | ≤500ms | ⏳ 基线待建立 |
| **CLS** (Cumulative Layout Shift) | 待测量 | ≤0.1 | ⏳ 基线待建立 |

**Performance Score:** 待测量/100

## storefront-web — 用户端 — 首页

| 指标 | 值 | 阈值 | 状态 |
|------|-----|------|------|
| **LCP** (Largest Contentful Paint) | 待测量 | ≤2000ms | ⏳ 基线待建立 |
| **FCP** (First Contentful Paint) | 待测量 | ≤3000ms | ⏳ 基线待建立 |
| **TTI** (Time to Interactive) | 待测量 | ≤5000ms | ⏳ 基线待建立 |
| **SI** (Speed Index) | 待测量 | ≤5000ms | ⏳ 基线待建立 |
| **TBT** (Total Blocking Time) | 待测量 | ≤500ms | ⏳ 基线待建立 |
| **CLS** (Cumulative Layout Shift) | 待测量 | ≤0.1 | ⏳ 基线待建立 |

**Performance Score:** 待测量/100

---

## 基线结论

| 条目 | 状态 |
|------|------|
| G4 LCP门禁 (`lcp < 2000ms`) | ⏳ 有待运行测量 |
| 测量工具 | Lighthouse Performance preset |
| 测量日期 | 2026-07-21 |

> ⚠️ **注意**: 此为本地开发环境基线，生产环境指标可能因 CDN/GZIP/缓存/机器配置 等差异而不同。
> 生产基线应在 CI/CD Pipeline 中通过 `lighthouse-ci` 或类似工具在 staging/production 环境建立。

## 历史基线

| 日期 | admin-web LCP | storefront-web LCP |
|------|------|------|
| 2026-07-21 | ⏳ 待运行 `scripts/performance-baseline.sh` | ⏳ 待运行 `scripts/performance-baseline.sh` |

---

*此文件由 `scripts/performance-baseline.sh` 自动生成*
