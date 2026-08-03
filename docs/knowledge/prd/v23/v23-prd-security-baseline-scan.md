# V23-PRD-03: 安全基线扫描集成 — Security Baseline Scan

> 版本: v1.0 · 签发人: 树哥
> 日期: 2026-07-21 · 状态: 🟢 已签发
> 圈梁: G3-C1

- **名称**: 安全基线扫描集成
- **用途**: 集成 npm audit + OWASP ZAP 安全基线扫描，自动检测生产环境依赖漏洞与常见 Web 安全风险
- **输出**: `scripts/security-baseline-scan.sh` + CI pipeline stage
- **圈梁状态**: 代码✅ 测试✅ 审计✅ PRD新建
- **日期**: 2026-07-21
- **作用**: G3-C1 安全基线合规

## 完成定义

1. npm audit 扫描作为 CI 前置阶段，阻断高危漏洞依赖
2. OWASP ZAP 被动扫描覆盖登录/API 端点，输出基线报告
3. 扫描结果归档至 `security-report/` 目录
