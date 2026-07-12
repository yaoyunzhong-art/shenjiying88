/**
 * suppliers/form/page.tsx — 新增/编辑供应商表单页路由
 * 角色视角: 👔品牌运营 / 💳采购经理
 *
 * 编辑模式: 从 searchParams 获取 id → 传递 isEdit + initialValues
 *   例: /suppliers/form?id=SP001 → isEdit=true + initialValues
 */
import React from 'react';
import { SupplierFormPage } from './components/SupplierFormPage';

export default function SupplierFormPageRoute({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const { id } = React.use(searchParams);

  if (id) {
    return (
      <SupplierFormPage
        isEdit
        supplierId={id}
        initialValues={{ name: id }}
      />
    );
  }

  return <SupplierFormPage />;
}
