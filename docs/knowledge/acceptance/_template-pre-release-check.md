# 发布前检查模板

> 每次发布前按此清单逐一确认
> 通过后归档为 `YYYY-MM-DD-release-readiness-card.md`

## 1. 代码检查

- [ ] `pnpm build` 全量通过（api + storefront-web + admin-web + sdk）
- [ ] `pnpm lint` 无新增 error/warning
- [ ] `pnpm test` 全量通过
- [ ] 无 `TODO` / `FIXME` / `HACK` 阻塞性注释
- [ ] 无 `console.log` 残留（允许 `console.error`）
- [ ] 无 hardcode mock 数据（`defaultCart`、`VALID_COUPONS`、`Mock` 前缀等）

## 2. 交易主链 Smoke

- [ ] 收银 → 结算 → 订单 → 支付 四步走通
- [ ] 优惠券验证正常
- [ ] 退款发起 + 状态回写正常
- [ ] H5 支付二维码渲染正常
- [ ] 支付超时/失败态展示正确
- [ ] 财务流水有数据

## 3. 安全基线

- [ ] 生产环境 `simulateMode` 门禁关闭（`ENABLE_MOCK_PAYMENT_GATEWAY` 未设置或为 false）
- [ ] 无 `payment_channel_not_configured` 生产告警
- [ ] 所有 API 端点有 `@UseGuards(TenantGuard)`
- [ ] SDK ApiError 正确透传后端 i18nKey/code

## 4. 发布前配置

- [ ] K8S secret `acr-regcred` 使用邮箱全名而非 userId
- [ ] 生产 environment 变量与 .env 对照正确
- [ ] DB migration 已确认（`prisma migrate status`）
- [ ] 回滚方案就绪（`rollback-*.sql` 或 git revert 计划）

## 5. 证据留存

- [ ] Smoke 截图/browser 证据存档
- [ ] 测试报告存档
- [ ] 状态板 `master-status-board.md` 已更新
- [ ] 事故结案卡（如有）已归档

## 结论

- 发布条件: `___`
- 发布时间计划: `___`
- 负责人确认: `___`
