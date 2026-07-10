import sys

path = sys.argv[1]
with open(path, 'r', encoding='utf-8') as f:
    s = f.read()

# 在 TEST_ROLE_CONTEXTS 字典尾部插入测试用 token 别名
# 这些别名映射到对应的角色 context, 满足 permission.role.test.ts 用的
# 'Bearer store-manager-token' / 'front-desk-token' / 'safety-token' / 等
alias_block = """  // Phase-FP P0 测试用的 token 别名 (permission.role.test.ts 期望)
  'store-manager-token': {
    userId: 'user_sm',
    tenantId: 'tenant-demo',
    storeId: 'store-001',
    roles: ['STORE_MANAGER'],
    permissions: ['store:read', 'store:update', 'inventory:*', 'order:*', 'staff:*', 'schedule:*', 'product:read', 'report:read'],
  },
  'front-desk-token': {
    userId: 'user_cashier',
    tenantId: 'tenant-demo',
    storeId: 'store-001',
    roles: ['CASHIER'],
    permissions: ['order:create', 'order:read', 'order:update', 'payment:create', 'member:read', 'product:read'],
  },
  'safety-token': {
    userId: 'user_sec',
    tenantId: 'tenant-demo',
    roles: ['SECURITY'],
    permissions: ['audit:read', 'store:read', 'user:read', 'role:read', 'report:read', 'inventory:read'],
  },
  'guide-token': {
    userId: 'user_guide',
    tenantId: 'tenant-demo',
    storeId: 'store-001',
    roles: ['SALES_GUIDE'],
    permissions: ['member:read', 'order:create', 'product:read'],
  },
  'ops-token': {
    userId: 'user_ops',
    tenantId: 'tenant-demo',
    roles: ['TENANT_ADMIN'],
    permissions: ['tenant:*', 'config:*', 'monitor:*', 'report:*'],
  },
  'team-building-token': {
    userId: 'user_team',
    tenantId: 'tenant-demo',
    storeId: 'store-001',
    roles: ['STORE_MANAGER'],
    permissions: ['member:*', 'campaign:*', 'coupon:*'],
  },
  'marketing-token': {
    userId: 'user_mkt',
    tenantId: 'tenant-demo',
    roles: ['MARKETING'],
    permissions: ['campaign:*', 'coupon:*', 'member:read', 'report:read'],
  },
  'any-token': {
    userId: 'user_001',
    tenantId: 'tenant-demo',
    brandId: 'brand_001',
    storeId: 'store_001',
    roles: ['TENANT_ADMIN'],
    permissions: ['tenant:*', 'brand:*', 'store:*', 'member:*', 'order:*', 'campaign:*', 'coupon:*', 'product:*', 'config:*', 'user:*', 'role:*', 'report:*'],
  },
"""

# 把 alias_block 插入到 TEST_ROLE_CONTEXTS 字典的 'admin-token': { 之后第一个 '},' 之后
# 简单做法: 找到 'admin-token': { 块结束的 '},' 然后插入
marker = """  'admin-token': { // 兼容老测试: admin-token = tenantAdmin
    userId: 'user_001',
    tenantId: 'tenant-demo',
    brandId: 'brand_001',
    storeId: 'store_001',
    roles: ['TENANT_ADMIN'],
    permissions: ['tenant:*', 'brand:*', 'store:*', 'member:*', 'order:*', 'campaign:*', 'coupon:*', 'product:*', 'config:*', 'user:*', 'role:*', 'report:*'],
  },"""

if marker in s:
    s = s.replace(marker, marker + '\n' + alias_block)
    print('Inserted after admin-token block')
else:
    print('admin-token marker NOT FOUND, trying fallback insertion before closing }')
    # 退而求其次: 在 TEST_ROLE_CONTEXTS 字典尾 '}' 前插入
    fallback_marker = "  marketing: {\n    userId: 'user_mkt',\n    tenantId: 'tenant-demo',\n    roles: ['MARKETING'],\n    permissions: ['campaign:*', 'coupon:*', 'member:read', 'report:read'],\n  },\n}"
    if fallback_marker in s:
        s = s.replace(fallback_marker, "  marketing: {\n    userId: 'user_mkt',\n    tenantId: 'tenant-demo',\n    roles: ['MARKETING'],\n    permissions: ['campaign:*', 'coupon:*', 'member:read', 'report:read'],\n  },\n" + alias_block + "}")
        print('Inserted via fallback')
    else:
        print('Fallback marker also NOT FOUND')

with open(path, 'w', encoding='utf-8') as f:
    f.write(s)
