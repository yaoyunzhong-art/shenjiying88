/**
 * 🐜 自动: [workbench] [C] 角色测试编写
 *
 * 完整工作台 controller 测试（正例 + 反例 + 边界 + 8 角色视角 + 权限边界）
 *
 * 8 角色:
 * 👔店长(STORE_MANAGER) 🛒前台(CASHIER) 👥HR(TENANT_ADMIN) 🔧安监(SECURITY_ADMIN/SUPER_ADMIN)
 * 🎮导玩员(GUIDE) 🎯运行专员(OPERATIONS) 🤝团建(TEAM_BUILDING 无映射) 📢营销(MARKETING 无映射)
 *
 * 覆盖:
 * - 角色 → 端点装饰器元数据验证 (@RequireRoles)
 * - 角色能力权限边界 (谁有/没有特定能力)
 * - 角色渠道分配 (PC vs PAD)
 * - read 端点和 action 端点的角色划分
 * - secret-rotation 角色限制 (SUPER_ADMIN + SECURITY_ADMIN)
 *
 * 注意: channel 使用 ClientChannel 枚举值: PC, PAD (全大写)
 */
import 'reflect-metadata';
//# sourceMappingURL=workbench.controller.test.d.ts.map