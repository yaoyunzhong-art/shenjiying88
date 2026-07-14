# 🔐 安全扫描报告

> 扫描时间: 2026-07-14 23:00:11 CST
> 项目: shenjiying88 (V17)
> 扫描模式: full
> 脚本: scripts/security-scan.sh

---

## 📊 汇总

| 检查项 | 结果 | 数量 |
|--------|:----:|:----:|
| 硬编码密码 | 🟢 | 0 |
| 硬编码Token | 🟢 | 0 |
| 依赖危急漏洞 | 🟢 | 0 |
| 依赖高危漏洞 | 🟢 | 0 |
| **总体风险** | **🔴 低危** | **退出码: 0** |

---

## 1️⃣ 密钥泄漏检查

> 扫描范围: apps/api/src/ — 排除 test/spec/mock/example

| 文件位置 | 内容(脱敏) | 状态 |
|----------|-----------|:----:|
无发现 🟢

---

## 2️⃣ Token硬编码检查

> 扫描范围: apps/ — 排除 test/spec

| 文件位置 | 内容(脱敏) | 状态 |
|----------|-----------|:----:|
无发现 🟢

---

## 3️⃣ 依赖审计

> 命令: pnpm audit --audit-level=high

  | ├─────────────────────┼───────────────── |\n  | │ Package             │ git-clone                                              │ |\n  | ├─────────────────────┼───────────────── |\n  | │ Vulnerable versions │ <=0.2.0                                                │ |\n  | ├─────────────────────┼───────────────── |\n  | │ Patched versions    │ <0.0.0                                                 │ |\n  | ├─────────────────────┼───────────────── |\n  | │ Paths               │ apps__miniapp>@tarojs/cli>download-git-repo>git-clone  │ |\n  | ├─────────────────────┼───────────────── |\n  | │ More info           │ https://github.com/advisories/GHSA-8jmw-wjr8-2x66      │ |\n  | └─────────────────────┴───────────────── |\n  | ┌─────────────────────┬───────────────── |\n  | │ high                │ http-cache-semantics vulnerable to Regular Expression  │ |\n  | │                     │ Denial of Service                                      │ |\n  | ├─────────────────────┼───────────────── |\n  | │ Package             │ http-cache-semantics                                   │ |\n  | ├─────────────────────┼───────────────── |\n  | │ Vulnerable versions │ <4.1.1                                                 │ |\n  | ├─────────────────────┼───────────────── |\n  | │ Patched versions    │ >=4.1.1                                                │ |\n  | ├─────────────────────┼───────────────── |\n  | │ Paths               │ apps__miniapp>@tarojs/cli>download-git-                │ |\n  | │                     │ repo>download>got>cacheable-request>http-cache-        │ |\n  | │                     │ semantics                                              │ |\n  | ├─────────────────────┼───────────────── |\n  | │ More info           │ https://github.com/advisories/GHSA-rc47-6667-2j5j      │ |\n  | └─────────────────────┴───────────────── |\n  | ┌─────────────────────┬───────────────── |\n  | │ high                │ kangax html-minifier REDoS vulnerability               │ |\n  | ├─────────────────────┼───────────────── |\n

---

## 🚦 闸门判定

| 条件 | 状态 | 说明 |
|------|:----:|------|
| 硬编码密码 > 0 | 🟢 | 🚫 硬阻断 — 必须修复后才能合并 |
| 硬编码Token > 0 | 🟢 | 🚫 硬阻断 — 必须修复后才能合并 |
| 依赖危急漏洞 > 0 | 🟢 | 🚫 硬阻断 — 必须修复后才能合并 |
| 依赖高危漏洞 > 0 | 🟢 | ⚠️ 建议修复 |
| **出口** | **🔴 低危 (退出码 0)** | |

> 🐜 [V17: security-gates] · 安全门硬阻断pipeline

