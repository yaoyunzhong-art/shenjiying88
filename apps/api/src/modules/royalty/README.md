# 分润模块 (Royalty)

## 用途
品牌/项目级分润引擎。支持分润规则 CRUD（固定金额/比例/阶梯配置）、分润计算、结算回流与分润明细查询。支撑联名项目、品牌合作等场景的自动分账与经营利益分配。

## 关键端点
| 路由 | 说明 |
|------|------|
| `POST/GET /royalty/rules` | 分润规则 CRUD |
| `PATCH /royalty/rules/:ruleId` | 更新分润规则 |
| `DELETE /royalty/rules/:ruleId` | 删除分润规则 |
| `POST /royalty/calculate` | 分润计算 |
| `GET /royalty/calculations` | 分润计算结果查询 |
| `POST /royalty/settle` | 分润结算回流 |

## 测试位置
`apps/api/src/modules/royalty/` — **4** 个测试文件：控制器单测（`.test.ts`）、服务单测（`.test.ts`）、角色扩展测试（`.role-extended.test.ts`）、圈梁测试（`.ringbeam.test.ts`）。
