# DR-017 · Sentry + 自研 Error Fingerprint

## 状态
已接受 (2026-06-26, Pulse-91)

## 背景
异常捕获后,Sentry 自动 grouping 不一定符合业务需求 (相同错误不同用户 = 不同 group)。

## 决策
1. **Sentry 集成** captureException / captureMessage / startSession / endSession
2. **自定义 fingerprint**: [error, type, firstAppFrame] + 可选 message + custom parts
3. **路径归一化**: /Users/<name>/<proj>/app/foo.ts → /USER/app/foo.ts
4. **噪音归一化**: UUID/时间戳/hex 字面量归一化
5. **Release Health**: crash-free session / 用户比例 (24h 滑动窗口)

## 后果
- ✅ 相同异常不同变量值正确归为 1 组
- ✅ 不同环境 (dev/prod) 路径噪音自动消除
- ✅ crash-free rate 反映真实用户体验
- ⚠️ 自定义 fingerprint 需业务方参与设计
- ⚠️ 内存 mock 模式不持久化,生产必须接 Sentry SaaS

## 替代方案
- Sentry 默认 fingerprint: 简单但不够灵活
- 自研异常分类系统: 重,且无法复用 Sentry 生态
- 选择: Sentry + 自研补充
