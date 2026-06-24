/**
 * Cashier Simulator Test
 *
 * 模拟收银系统的场景覆盖：
 * - 订单创建与状态流转 (CREATED → PENDING_PAYMENT → PAID → CLOSED)
 * - 支付生命周期 (PENDING → SUCCEEDED/FAILED)
 * - 订单金额计算 (computeCashierOrderTotal)
 * - 支付回调处理 (cashier.payment-succeeded / cashier.payment-failed)
 * - 订单关闭原因 (PAYMENT_TIMEOUT / FULL_REFUND / MANUAL_CANCEL)
 * - 多商品订单
 * - 边界场景 (空订单、0 数量、超大金额)
 *
 * 8 角色视角覆盖：
 *  👔店长 - 收银汇总&订单审核
 *  🛒前台 - 创建订单&收款
 *  👥HR - 员工收银统计
 *  🔧安监 - 支付合规审计
 *  🎮导玩员 - 游戏币购买订单
 *  🎯运行专员 - 订单异常处理&关单
 *  🤝团建 - 团建套餐订单
 *  📢营销 - 优惠券&盲盒订单
 */
export {};
//# sourceMappingURL=cashier.simulator.test.d.ts.map