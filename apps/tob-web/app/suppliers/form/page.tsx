/**
 * suppliers/form/page.tsx — 新增供应商表单页路由
 * 角色视角: 👔品牌运营 / 💳采购经理
 *
 * TODO: 编辑模式: 从 params 获取 id → fetch 详情 → 传递给 SupplierFormPage
 *   例: /suppliers/form?id=SP001 → isEdit=true + initialValues
 */
import React from 'react';
import { SupplierFormPage } from './components/SupplierFormPage';

export default function SupplierCreatePage() {
  return <SupplierFormPage />;
}
