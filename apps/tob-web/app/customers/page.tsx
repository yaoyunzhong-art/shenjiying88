import CustomersClient from './customers-client';
import { loadCustomersSnapshot } from '../customers-data';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function CustomersPage() {
  const snapshot = await loadCustomersSnapshot();
  const sourceEvidence = {
    deliveryMode: snapshot.deliveryMode,
    controlPlaneSource:
      snapshot.deliveryMode === 'api'
        ? 'loadCustomersSnapshot -> api/crm/customers + api/crm/stats'
        : 'loadCustomersSnapshot -> MOCK_CUSTOMERS mapped fallback',
    businessDataSource:
      snapshot.deliveryMode === 'api'
        ? 'CRM customer list and stats upstream API responses'
        : 'mapped local enterprise customer samples',
    refreshPath: 'CustomersPage -> loadCustomersSnapshot',
    generatedAt: snapshot.generatedAt,
    note:
      snapshot.deliveryMode === 'api'
        ? '当前页面直接消费 CRM 列表/统计服务端快照。'
        : '当前页面已回退到本地企业客户映射样本，不可作为闭环复签证据。',
  } as const;

  return (
    <div style={{ color: '#e2e8f0' }}>
      <div
        style={{
          margin: '24px 32px 0',
          padding: 12,
          borderRadius: 12,
          border: '1px solid rgba(148,163,184,0.2)',
          background: 'rgba(15,23,42,0.45)',
          color: '#cbd5e1',
          fontSize: 12,
          lineHeight: 1.7,
        }}
      >
        <div>
          Delivery {sourceEvidence.deliveryMode} · 控制面来源: {sourceEvidence.controlPlaneSource}
        </div>
        <div>
          业务数据: {sourceEvidence.businessDataSource} · 刷新路径: {sourceEvidence.refreshPath}
        </div>
        <div>
          generatedAt: {sourceEvidence.generatedAt} · {sourceEvidence.note}
        </div>
      </div>
      <CustomersClient snapshot={snapshot} />
    </div>
  );
}
