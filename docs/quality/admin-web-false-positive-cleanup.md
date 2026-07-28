# 🧹 Admin-Web 假阳归零计划

> 日期: 2026-07-29 01:20 CST
> 制定人: 龙虾哥
> 当前基线: ~363 假阳（含 ELIFECYCLE 已知问题）

---

## 一、现状

admin-web 项目在测试中存在大量"假阳"（False Positive）——这些测试在 CI 中报告为失败，但实际代码无功能性 Bug。

| 指标 | 数值 | 说明 |
|:-----|:---:|:-----|
| 假阳基线 | ~363 | 历史遗留，多轮无新增 |
| 连续稳态天数 | 13天+ | 07-16 起无新 fail 注入 |
| ELIFECYCLE | 部分 | 已知的测试框架生命周期问题 |
| 真实回归 | 0 | 无新代码引入的真实失败 |

---

## 二、假阳分类

### A类: 环境依赖型（~40%）
- 依赖 `window` / `document` / `localStorage` 的测试在 jsdom 环境不稳定
- 解决方案: `beforeEach` 中显式设置 mock 环境变量

### B类: 异步时序型（~30%）
- `waitFor` 超时、异步渲染未完成、Promise rejection 未被捕获
- 解决方案: 增加 `waitFor` timeout、补 `await`、用 `act()` 包裹状态变更

### C类: Mock 过期型（~20%）
- Mock 的数据结构与实际 API 返回值不匹配
- 解决方案: 统一 mock 管理，引入 `@m5/testing` 共享 mock 工具包

### D类: ELIFECYCLE（~10%）
- 测试文件中的 `beforeAll`/`afterAll` 未正确清理，跨测试文件状态污染
- 解决方案: 全局 `vitest.config` 配置 `clearMocks: true` + `restoreMocks: true`

---

## 三、清零路线

### Phase1: 诊断（1天，V24 Phase2）

```
1. 运行完整 admin-web 测试套件，收集所有失败的测试文件列表
2. 按 A/B/C/D 四类分类
3. 识别 Top 10 高影响文件（一个文件内有 10+ 假阳）
```

### Phase2: 批量修复（2天，V24 Phase3-4）

| 批次 | 目标 | 方法 |
|:---:|:-----|:-----|
| 第1批 | 修复 C类(mock过期) | 统一 mock → 预估消除 ~70 假阳 |
| 第2批 | 修复 A类(环境依赖) | 全局 beforeEach mock → 预估消除 ~130 假阳 |
| 第3批 | 修复 B类(异步时序) | waitFor/ac/await 补充 → 预估消除 ~100 假阳 |
| 第4批 | 修复 D类(ELIFECYCLE) | vitest config 全局配置 → 预估消除 ~30 假阳 |

### Phase3: 验证 + 守护（持续）

```
1. 每次 PR 必须通过 admin-web 测试，假阳新增即阻塞合并
2. 每周一次假阳基线扫描
3. 假阳 > 10 时自动触发修复 cron
```

---

## 四、快速见效项（今天可做）

1. **vitest 全局配置**：在 admin-web 的 vitest 配置中启用：
   ```typescript
   export default defineConfig({
     test: {
       clearMocks: true,
       restoreMocks: true,
       unstubEnvs: true,
       retry: 1,  // 允许重试 1 次减少偶发假阳
     }
   })
   ```
   预估立即消除 30-50 假阳。

2. **补充全局 beforeEach mock**：
   ```typescript
   // setup.ts
   beforeEach(() => {
     Object.defineProperty(window, 'localStorage', { value: mockLocalStorage })
     Object.defineProperty(window, 'matchMedia', { value: vi.fn() })
   })
   ```

---

## 五、里程碑

| 日期 | 目标假阳数 | 说明 |
|:-----|:---:|:-----|
| 07-29 (今天) | 363 → 320 | vitest config 优化 |
| 07-30 | 320 → 200 | C类 + A类批量修复 |
| 07-31 | 200 → 100 | B类异步修复 |
| 08-01 | 100 → 0 | D类 ELIFECYCLE 根除 |

---

*🦞 龙虾哥 · 2026-07-29 01:20 CST*
