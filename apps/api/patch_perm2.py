import sys

path = sys.argv[1]
with open(path, 'r', encoding='utf-8') as f:
    s = f.read()

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

# 插入到 marketing 字段之后, 字典结束 '}' 之前
marker = "  marketing: {\n    userId: 'user_mkt',\n    tenantId: 'tenant-demo',\n    roles: ['MARKETING'],\n    permissions: ['campaign:*', 'coupon:*', 'member:read', 'report:read'],\n  },\n}"

if marker in s:
    s = s.replace(marker, "  marketing: {\n    userId: 'user_mkt',\n    tenantId: 'tenant-demo',\n    roles: ['MARKETING'],\n    permissions: ['campaign:*', 'coupon:*', 'member:read', 'report:read'],\n  },\n" + alias_block + "}")
    print('OK: inserted after marketing block')
else:
    # 试不同缩进
    print('marketing marker NOT FOUND, trying with flexible whitespace')

with open(path, 'w', encoding='utf-8') as f:
    f.write(s)
