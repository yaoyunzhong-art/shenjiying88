# Pulse-63 · P0-002 修复经验 (lessons-learned/pulse-63.md)

> 创建日期: 2026-06-25
> 来源: extract-knowledge.py 自动补全
> 周期: 2026-06-25
> 专家: E7(孙体验) + W5L3(测试 QA)

## Lesson 1: Test timeout 不一定是 active handle leak
- **根因**: app-journey.test.ts 跑出 66s timeout
- **误判**: 假设是 mock fetch Response stream lifetime 问题
- **真相**: 5 处 assertion 写错前缀 (`native-` vs `app-` / `NATIVE-` vs `APP-`),assert fail 后 Node 22.x test runner 不报 fail 而 hang file-level
- **改进**: 看到 timeout 先 bisect by describe block,定位真因后再 fix
- **关联专家**: E7(孙体验)

## Lesson 2: Node 22.x test runner 在 sync test fail 时的 hang 行为
- **现象**: `assert.ok(false)` 抛 AssertionError,但 file-level root test 的 `done()` callback 不被调用,触发 default 30s timeout
- **临时缓解**: `process.on('beforeExit', () => process.exit(0))`
- **正确做法**: 修复 assertion
- **改进**: W5L3 anti-pattern AP-1 记录 "test timeout ≠ active handle leak"
- **关联专家**: W5L3, E7

## Lesson 3: bisect by describe block 比 bisect by single test 高效
- **方法**: 用 `--test-name-pattern='describe1|describe2|...'` 跑多个 describe 子集
- **优势**: 快速定位哪个 describe 是元凶
- **应用**: Phase-17 调试时复用
- **关联专家**: W5L3

## 完整交付物
- 5 处 assertion 修复 (前缀 native-→app- / NATIVE-→APP- / x-m5-nonce→x-m5-ticket-code)
- app-journey 25/25 pass (567ms)
- 移除 `process.on('beforeExit')` hack
- W5L3-qa-verify.md 经验库激活

## 后续应用
- Phase-17 营销活动测试复用 assertion debugging by reverse-engineer 模式
- Phase-19 智能化引擎可基于 Node test runner hang 检测自动告警