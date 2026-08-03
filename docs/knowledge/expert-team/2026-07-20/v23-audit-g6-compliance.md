# V23 审计 · G6 合规+财务组
> 日期: 2026-07-20 · 评审专家: E36卫审计 + E6刘合规
> 版本: V23 v1.2

## 总体评级
🟡 **有条件通过**

圈梁7道箍体系完备，6道门签署机制已成制度性安排，安全扫描已实现每日自动化（今日扫描结果：0 硬编码密码 / 0 Token 泄漏 / 0 高危急漏洞）。安全基线 security-baseline-check.md 存在且常态化。

但 **安全基线 8/8 未完全确认**（当前检查报告覆盖率不足至 8 项标准），且 **财务对账闭环 P-38 仍为 85%**（非100%），Phase 截止线的"三件套"（TSC+测试+E2E）自动化保障尚缺实战验证。

**条件**: 需在 Phase 2 结束前（7/30）补全以下 3 项：
1. 安全基线 8/8 完整确认报告（当前仅涵盖 4 项扫描类检查）
2. P-38 财务对账达到 100%（含跨租户场景）
3. 合规自动化脚本将 Phase 截止线三件套检查固化进 CI

---

## 评审意见

### 1️⃣ 6道门签署机制——制度已成但执行率不可见

V23 圈梁明确了 G1~G6 六道门签署的5分钟审查原则，V23 roadmap §六 明确"Gate签署最多5分钟看摘要卡，超时不签自动上报大飞哥"。Gateway5 和 Gateway6 的事前签署文件（gate5-signoff.md / gate6-signoff.md）格式规范，检查项清晰。

**但**：
- 当前签署文件仅为"事前签署"模板，缺少**实际签署率统计**——各组是否按期签署？超时率如何？
- 6道门签署未在 CI 中固化——圈梁表 phase-to-module-mapping.md 虽已更新至 276 行，但签署状态为手工维护
- V18 教训明确——"8/8签署全部通过但安全仍有漏洞（后来V22发现PaymentGateway跨租户）"，说明签署仪式不等于安全

**建议**：在 CI 中嵌入 Gate 签署自动追踪，每日 22:00 L3 评分时输出"6道门签署执行率"指标。

### 2️⃣ Security Baseline 8/8——确认但需扩展检查范围

security-baseline-check.md 存在且每日自动化运行，最新报告 (security-scan-2026-07-20.md) 涵盖：
- 硬编码密码检查 ✅
- Token 硬编码检查 ✅
- 依赖审计（pnpm audit —audit-level=high）✅
- 安全扫描整体退出码 0 ✅

**但**：security-baseline-check.md 当前涵盖的检查项包括：
1. AuthGuard 覆盖率（⚠️ 基本覆盖，182个Controller依赖全局Guard宽松模式）
2. RateLimit 实现状态（✅ 完善实现）
3. PaymentGateway 跨租户检查（✅ 已修复）
4. 其他（自述文件 + POS 去 Mock + Permission 链）

这与"8项"标准尚不匹配——"Security baseline 8/8"的8项具体是哪8项？当前文档未明确定义完整的8项检查清单。V18 G2退回教训明确说"安全组签署不只看签署率，看实战扫描结果"，而当前扫描范围偏窄（未覆盖 infra 层 nginx/TLS/容器安全）。

**建议**：
1. 在 `docs/knowledge/security-baseline-check.md` 中明确定义 **8 项基线标准清单**（如：①硬编码密码 ②Token泄漏 ③依赖漏洞 ④AuthGuard覆盖 ⑤RateLimit ⑥跨租户隔离 ⑦TLS配置 ⑧审计日志完整性）
2. 每项标注状态🟢/🟡/🔴，实现真正的"8/8 可视化"

### 3️⃣ 财务对账闭环——P-38 85% 为唯一非100%的 Phase

V23 Phase 1（7/24→26）计划中，P-38 并未列为交付目标（P-47/P-30 已 100%）。Gate6 签注明确写"P-38 财务 85%，持续推进"。V23 roadmap §七 Phase 计划中 P-38 也未单独列出。

P-38 的跨租户场景已通过 tenant.service.ts 和 PaymentGateway TenantGuard 双重保障。但对账闭环（reconciliation）+ 利润中心（profit-center）+ 成本分析（cost-analysis）尚未达到 100%，"对账差异可追踪"虽有 amount-alignment 脚本但未自动化为 CI gate。

**建议**：P-38 的 15% 缺口应排入 V23 Phase 1.5（7/24-26 区间内），不拖入 Phase 2。

---

## 关注点

### 🔴 关注点1: Phase 截止线——自动化保障缺失

V23 圈梁原则 2 规定：
> Phase 截止 = TSC + 测试 + E2E 三件套通过

但当前这**三件套检查完全靠人工或独立运行**。没有 CI gate 或自动化脚本确保：
- TSC 零错误是 Phase 关卡的硬条件
- 测试 0 fail 无 skip
- E2E 链 100% 通过

G6 合规组应审查：圈梁表更新（🟢审计箍）是周更新制，但 Phase 截止应是**每日可验**的。如果 Phase 截止线没有 CI 级的自动熔断，V20 的"P-38最后一公里拖延"问题可能在 P-38 重现。

### 🟡 关注点2: 合规脚本+CI 集成度低

V23 圈梁执行细则 5（机制配套原则）明确要求：
> 任何新制度必须配套脚本+cron+检查点

当前合规脚本只有 security-scan.sh 和 check-permissions.sh。缺少：
- `check-phase-gate.sh` — 验证 Phase 三件套通过
- `check-gate-signoff-rate.sh` — 验证 6 道门签署执行率
- `check-8-security-baseline.sh` — 滚动验证 8 项基线

### 🟡 关注点3: 生产发布安全门——仍为 🔴

Gate6 签署中"生产发布 (CI→ACR→K8s)" 状态为 🔴，待大飞哥确认。G8 DNS/TLS 外部阻塞状态 🟡。这意味着 V23 Day1 指标中生产就绪 4 项（CI/Docker/Domain/SSL）仍为 0%。

合规角度看，**生产环境未就绪意味着安全假设无法在生产级环境中验证**——安全扫描在开发环境跑通 ≠ 生产环境安全。G6 应要求：在生产环境就绪前，至少完成安全扫描 + TLS 配置 + CI 自动扫描三道门。

---

## 建议

### 建议1: 明确定义安全基线8/8清单并每日可视化
```markdown
| # | 基线项 | 状态 | 最后验证 |
|:--:|:-------|:----:|:---------|
| ① | 无硬编码密码 | 🟢 | 2026-07-20 |
| ② | 无Token泄漏 | 🟢 | 2026-07-20 |
| ③ | 无高危急依赖漏洞 | 🟢 | 2026-07-20 |
| ④ | AuthGuard覆盖率≥80% | 🟡 | 2026-07-19 |
| ⑤ | RateLimit全部署 | 🟢 | 已知 |
| ⑥ | 跨租户隔离验证 | 🟢 | 已知 |
| ⑦ | TLS配置已生效 | 🔴 | 待基础设施 |
| ⑧ | 审计日志完整性 | 🟢 | 已知 |
```
将此清单集成到 CI PR gate 和每日 L3 评分中。

### 建议2: P-38 财务对账追加至 100% 的时间排期
- 在本周（7/20-24）内排入轨道B的 10h/日 功能时间
- 重点：reconciliation 联表增强 + 跨租户金额验证 + 回滚基线确认
- 完成后更新 gate6-signoff.md 中的签署条件

### 建议3: 新增 Phase 截止自动化检查脚本
```bash
# scripts/check-phase-gate.sh
# 每个 Phase 关卡检查三件套
# 1) npx tsc --noEmit -> exit code 0 = pass
# 2) pnpm test -- --passWithNoTests -> 0 failless
# 3) pnpm e2e -> all chains pass
# 输出: 🟢/🔴 + 不符合项清单
```
将此脚本嵌入 CI workflow 的每个 PR 检查步骤。

---

> 审计执行: 🐜 树哥 · 2026-07-20 23:10 CST
> 参考文献: V23 roadmap v1.2 · V18 G2退回教训 · security-baseline-check.md · security-scan-2026-07-20.md · gate5-signoff · gate6-signoff
