'use client'

import React, { useState } from 'react'
import { Heartbeat } from '../openapi-portal/components/Heartbeat'

// 角色定义
const ROLES = [
  {
    id: 'platform_admin',
    name: 'Owner',
    nameZh: '超级管理员',
    description: '平台最高权限，拥有所有操作权限',
    permissionCount: 50,
    keyPermissions: ['tenant:*', 'brand:*', 'store:*', 'member:*', 'order:*', 'finance:*', 'report:*', 'config:*', 'audit:*', 'compliance:*'],
    color: '#ef4444',
    level: 'Platform',
  },
  {
    id: 'tenant_admin',
    name: 'Admin',
    nameZh: '企业管理员',
    description: '租户管理员，拥有租户下所有权限',
    permissionCount: 28,
    keyPermissions: ['tenant:*', 'brand:*', 'store:*', 'member:*', 'order:*', 'product:*'],
    color: '#f59e0b',
    level: 'Tenant',
  },
  {
    id: 'store_manager',
    name: 'Manager',
    nameZh: '店长',
    description: '门店管理员，管理门店日常运营',
    permissionCount: 12,
    keyPermissions: ['store:read', 'store:update', 'member:read', 'order:*', 'inventory:read', 'inventory:update'],
    color: '#22c55e',
    level: 'Store',
  },
  {
    id: 'cashier',
    name: 'Staff',
    nameZh: '收银员',
    description: '收银员，负责收银和订单处理',
    permissionCount: 5,
    keyPermissions: ['order:create', 'order:read', 'payment:execute'],
    color: '#3b82f6',
    level: 'Store',
  },
  {
    id: 'member',
    name: 'Guest',
    nameZh: '会员',
    description: '普通会员，仅限个人数据操作',
    permissionCount: 4,
    keyPermissions: ['member:read', 'member:update', 'order:create', 'coupon:redeem'],
    color: '#8b5cf6',
    level: 'Self',
  },
]

// 权限模块定义
const PERMISSION_MODULES = [
  {
    module: '用户管理',
    moduleKey: 'member',
    permissions: [
      { key: 'member:read', name: '查看会员', description: '查看会员基本信息和积分' },
      { key: 'member:update', name: '更新会员', description: '修改会员基本信息和设置' },
      { key: 'member:delete', name: '删除会员', description: '删除会员账户和关联数据' },
      { key: 'member:*', name: '会员管理', description: '会员全部操作权限' },
    ],
  },
  {
    module: '订单管理',
    moduleKey: 'order',
    permissions: [
      { key: 'order:read', name: '查看订单', description: '查看订单详情和状态' },
      { key: 'order:create', name: '创建订单', description: '创建新订单' },
      { key: 'order:update', name: '更新订单', description: '修改订单信息' },
      { key: 'order:delete', name: '删除订单', description: '删除订单记录' },
      { key: 'order:*', name: '订单管理', description: '订单全部操作权限' },
    ],
  },
  {
    module: '积分管理',
    moduleKey: 'points',
    permissions: [
      { key: 'points:read', name: '查看积分', description: '查看会员积分余额' },
      { key: 'points:update', name: '调整积分', description: '增减会员积分' },
      { key: 'points:expire', name: '积分过期', description: '执行积分过期操作' },
      { key: 'points:*', name: '积分管理', description: '积分全部操作权限' },
    ],
  },
  {
    module: '优惠券管理',
    moduleKey: 'coupon',
    permissions: [
      { key: 'coupon:read', name: '查看优惠券', description: '查看优惠券信息' },
      { key: 'coupon:create', name: '创建优惠券', description: '创建优惠券活动' },
      { key: 'coupon:update', name: '更新优惠券', description: '修改优惠券规则' },
      { key: 'coupon:delete', name: '删除优惠券', description: '删除优惠券活动' },
      { key: 'coupon:redeem', name: '核销优惠券', description: '核销使用优惠券' },
      { key: 'coupon:*', name: '优惠券管理', description: '优惠券全部操作权限' },
    ],
  },
  {
    module: '支付管理',
    moduleKey: 'payment',
    permissions: [
      { key: 'payment:read', name: '查看支付', description: '查看支付记录' },
      { key: 'payment:execute', name: '执行支付', description: '执行支付操作' },
      { key: 'payment:refund', name: '退款操作', description: '执行退款操作' },
      { key: 'payment:*', name: '支付管理', description: '支付全部操作权限' },
    ],
  },
  {
    module: '库存管理',
    moduleKey: 'inventory',
    permissions: [
      { key: 'inventory:read', name: '查看库存', description: '查看库存数量' },
      { key: 'inventory:update', name: '调整库存', description: '增减库存数量' },
      { key: 'inventory:transfer', name: '调拨库存', description: '跨门店调拨库存' },
      { key: 'inventory:*', name: '库存管理', description: '库存全部操作权限' },
    ],
  },
  {
    module: '报表管理',
    moduleKey: 'report',
    permissions: [
      { key: 'report:read', name: '查看报表', description: '查看统计报表' },
      { key: 'report:export', name: '导出报表', description: '导出报表数据' },
      { key: 'report:*', name: '报表管理', description: '报表全部操作权限' },
    ],
  },
  {
    module: '系统配置',
    moduleKey: 'config',
    permissions: [
      { key: 'config:read', name: '查看配置', description: '查看系统配置' },
      { key: 'config:update', name: '更新配置', description: '修改系统配置' },
      { key: 'config:*', name: '配置管理', description: '配置全部操作权限' },
    ],
  },
  {
    module: '审计管理',
    moduleKey: 'audit',
    permissions: [
      { key: 'audit:read', name: '查看审计', description: '查看审计日志' },
      { key: 'audit:export', name: '导出审计', description: '导出审计日志' },
      { key: 'audit:*', name: '审计管理', description: '审计全部操作权限' },
    ],
  },
  {
    module: '合规管理',
    moduleKey: 'compliance',
    permissions: [
      { key: 'compliance:read', name: '查看合规', description: '查看合规数据' },
      { key: 'compliance:gdpr', name: 'GDPR 操作', description: '执行 GDPR 数据操作' },
      { key: 'compliance:dsr', name: 'DSR 处理', description: '处理数据主体请求' },
      { key: 'compliance:*', name: '合规管理', description: '合规全部操作权限' },
    ],
  },
  {
    module: '分账管理',
    moduleKey: 'settlement',
    permissions: [
      { key: 'settlement:read', name: '查看分账', description: '查看分账记录' },
      { key: 'settlement:create', name: '创建分账', description: '发起分账操作' },
      { key: 'settlement:approve', name: '审批分账', description: '审批分账请求' },
      { key: 'settlement:*', name: '分账管理', description: '分账全部操作权限' },
    ],
  },
]

// 角色卡片组件
function RoleCard({ role }: { role: typeof ROLES[0] }) {
  return (
    <div
      style={{
        background: 'rgba(15,23,42,0.8)',
        border: '1px solid rgba(148,163,184,0.12)',
        borderRadius: 12,
        padding: 20,
        transition: 'all 0.2s',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <div
          style={{
            width: 48,
            height: 48,
            background: `linear-gradient(135deg, ${role.color}, ${role.color}88)`,
            borderRadius: 12,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 20,
            fontWeight: 700,
            color: '#fff',
          }}
        >
          {role.name.charAt(0)}
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, color: '#f8fafc', margin: 0 }}>{role.name}</h3>
            <span
              style={{
                fontSize: 10,
                padding: '2px 6px',
                borderRadius: 4,
                background: `${role.color}22`,
                color: role.color,
                fontWeight: 500,
              }}
            >
              {role.level}
            </span>
          </div>
          <p style={{ fontSize: 12, color: '#64748b', margin: '4px 0 0' }}>{role.nameZh}</p>
        </div>
      </div>

      <p style={{ fontSize: 12, color: '#94a3b8', margin: '0 0 12px', lineHeight: 1.5 }}>
        {role.description}
      </p>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <span style={{ fontSize: 12, color: '#64748b' }}>{role.permissionCount} 项权限</span>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {role.keyPermissions.slice(0, 4).map((perm) => (
          <span
            key={perm}
            style={{
              fontSize: 10,
              padding: '3px 8px',
              borderRadius: 4,
              background: 'rgba(148,163,184,0.1)',
              color: '#94a3b8',
            }}
          >
            {perm}
          </span>
        ))}
        {role.keyPermissions.length > 4 && (
          <span
            style={{
              fontSize: 10,
              padding: '3px 8px',
              borderRadius: 4,
              background: 'rgba(59,130,246,0.2)',
              color: '#60a5fa',
            }}
          >
            +{role.keyPermissions.length - 4}
          </span>
        )}
      </div>
    </div>
  )
}

// 权限模块组件
function PermissionModule({ module }: { module: typeof PERMISSION_MODULES[0] }) {
  return (
    <div
      style={{
        background: 'rgba(15,23,42,0.6)',
        border: '1px solid rgba(148,163,184,0.08)',
        borderRadius: 10,
        padding: 16,
      }}
    >
      <h4
        style={{
          fontSize: 14,
          fontWeight: 600,
          color: '#f8fafc',
          margin: '0 0 12px',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <span style={{ color: '#60a5fa' }}>{module.moduleKey}:*</span>
        {module.module}
      </h4>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {module.permissions.map((perm) => (
          <div
            key={perm.key}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              gap: 12,
              padding: '8px 12px',
              background: 'rgba(0,0,0,0.2)',
              borderRadius: 6,
            }}
          >
            <div>
              <span style={{ fontSize: 12, color: '#e2e8f0', fontFamily: 'monospace' }}>{perm.key}</span>
              <span style={{ fontSize: 12, color: '#60a5fa', marginLeft: 8 }}>{perm.name}</span>
            </div>
            <span style={{ fontSize: 11, color: '#64748b', textAlign: 'right', flexShrink: 0 }}>
              {perm.description}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// 角色分配表单组件
function RoleAssignmentForm() {
  const [userId, setUserId] = useState('')
  const [role, setRole] = useState('store_manager')
  const [tenant, setTenant] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
    setTimeout(() => {
      setSubmitted(false)
      setUserId('')
      setTenant('')
    }, 2000)
  }

  return (
    <div
      style={{
        background: 'rgba(15,23,42,0.8)',
        border: '1px solid rgba(148,163,184,0.12)',
        borderRadius: 12,
        padding: 24,
      }}
    >
      <h3 style={{ fontSize: 16, fontWeight: 600, color: '#f8fafc', margin: '0 0 20px' }}>
        角色分配
      </h3>

      {submitted ? (
        <div
          style={{
            textAlign: 'center',
            padding: 24,
            background: 'rgba(34,197,94,0.1)',
            borderRadius: 8,
            border: '1px solid rgba(34,197,94,0.2)',
          }}
        >
          <div style={{ fontSize: 32, marginBottom: 8 }}>✅</div>
          <p style={{ fontSize: 14, color: '#22c55e', margin: 0 }}>角色分配成功</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
            <div>
              <label
                style={{
                  fontSize: 12,
                  color: '#94a3b8',
                  display: 'block',
                  marginBottom: 6,
                }}
              >
                用户ID
              </label>
              <input
                type="text"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                placeholder="user-001"
                required
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  fontSize: 13,
                  borderRadius: 6,
                  border: '1px solid rgba(148,163,184,0.2)',
                  background: 'rgba(15,23,42,0.9)',
                  color: '#e2e8f0',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div>
              <label
                style={{
                  fontSize: 12,
                  color: '#94a3b8',
                  display: 'block',
                  marginBottom: 6,
                }}
              >
                角色
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  fontSize: 13,
                  borderRadius: 6,
                  border: '1px solid rgba(148,163,184,0.2)',
                  background: 'rgba(15,23,42,0.9)',
                  color: '#e2e8f0',
                  outline: 'none',
                  cursor: 'pointer',
                  boxSizing: 'border-box',
                }}
              >
                {ROLES.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name} ({r.nameZh})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                style={{
                  fontSize: 12,
                  color: '#94a3b8',
                  display: 'block',
                  marginBottom: 6,
                }}
              >
                租户（可选）
              </label>
              <input
                type="text"
                value={tenant}
                onChange={(e) => setTenant(e.target.value)}
                placeholder="tenant-A"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  fontSize: 13,
                  borderRadius: 6,
                  border: '1px solid rgba(148,163,184,0.2)',
                  background: 'rgba(15,23,42,0.9)',
                  color: '#e2e8f0',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>
          </div>

          <button
            type="submit"
            style={{
              marginTop: 20,
              padding: '10px 24px',
              fontSize: 13,
              fontWeight: 600,
              borderRadius: 6,
              background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
              color: '#fff',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            分配角色
          </button>
        </form>
      )}
    </div>
  )
}

// 主页面组件
export default function RBACAdminPage() {
  return (
    <div className="min-h-screen bg-[#0f172a] text-white">
      {/* 顶部导航 */}
      <header
        style={{
          borderBottom: '1px solid rgba(148,163,184,0.1)',
          padding: '16px 32px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'rgba(15,23,42,0.95)',
          position: 'sticky',
          top: 0,
          zIndex: 100,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              width: 36,
              height: 36,
              background: 'linear-gradient(135deg, #8b5cf6, #a78bfa)',
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 18,
              fontWeight: 700,
              color: '#fff',
            }}
          >
            RBAC
          </div>
          <h1 style={{ fontSize: 18, fontWeight: 600, color: '#f8fafc', margin: 0 }}>
            RBAC 权限管理中心
          </h1>
        </div>
        <div style={{ display: 'flex', gap: 24 }}>
          <a href="#roles" style={{ fontSize: 13, color: '#94a3b8', textDecoration: 'none' }}>
            角色矩阵
          </a>
          <a href="#permissions" style={{ fontSize: 13, color: '#94a3b8', textDecoration: 'none' }}>
            权限说明
          </a>
          <a href="#assignment" style={{ fontSize: 13, color: '#94a3b8', textDecoration: 'none' }}>
            角色分配
          </a>
        </div>
      </header>

      <main style={{ maxWidth: 1400, margin: '0 auto', padding: '0 32px' }}>
        {/* 角色权限矩阵卡片 */}
        <section id="roles" style={{ paddingTop: 32 }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, color: '#f8fafc', margin: '0 0 20px' }}>
            角色权限矩阵
          </h2>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(5, 1fr)',
              gap: 16,
            }}
          >
            {ROLES.map((role) => (
              <RoleCard key={role.id} role={role} />
            ))}
          </div>
        </section>

        {/* 权限列表 */}
        <section id="permissions" style={{ paddingTop: 40 }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, color: '#f8fafc', margin: '0 0 20px' }}>
            权限说明
          </h2>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: 16,
            }}
          >
            {PERMISSION_MODULES.map((module) => (
              <PermissionModule key={module.module} module={module} />
            ))}
          </div>
        </section>

        {/* 角色分配表单 */}
        <section id="assignment" style={{ paddingTop: 40, paddingBottom: 60 }}>
          <RoleAssignmentForm />
        </section>
      </main>

      {/* 底部 HEARTBEAT */}
      <div style={{ textAlign: 'center', padding: '20px 0', borderTop: '1px solid rgba(148,163,184,0.1)' }}>
        <Heartbeat id="HEARTBEAT-68" />
      </div>
    </div>
  )
}
