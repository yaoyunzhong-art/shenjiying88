'use client';
import { useSnapshotRefresh } from '../../components/use-snapshot-refresh'

import type { CSSProperties } from 'react';
import { useCallback, useMemo, useState, useTransition } from 'react';

import { Dialog, FormField, FormSubmitFeedback, PageShell, SubmitButton, WorkspaceBreadcrumb } from '@m5/ui';

import type { MemberCard } from '../../members-data';
import type { MemberCardsPageSnapshot } from './member-cards-data';

interface IssueCardFormData {
  memberId: string;
  memberName: string;
  cardType: 'physical' | 'virtual' | 'digital';
}

interface ActionFeedback {
  isSubmitting: boolean;
  errorMessage?: string;
  successMessage?: string;
}

export default function MemberCardsClient({ snapshot }: { snapshot: MemberCardsPageSnapshot }) {
    const { isRefreshing, handleRefresh } = useSnapshotRefresh();
  const [cards, setCards] = useState<MemberCard[]>(snapshot.cards);
  const [searchTerm, setSearchTerm] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState<IssueCardFormData>({ memberId: '', memberName: '', cardType: 'virtual' });
  const [submitState, setSubmitState] = useState<ActionFeedback>({ isSubmitting: false });

  

  const filteredCards = useMemo(
    () => cards.filter((item) => [item.cardNumber, item.memberName, item.cardType].join(' ').toLowerCase().includes(searchTerm.toLowerCase())),
    [cards, searchTerm]
  );

  const handleIssueCard = useCallback(async () => {
    setSubmitState({ isSubmitting: true });
    await new Promise((resolve) => setTimeout(resolve, 200));
    if (!formData.memberId.trim() || !formData.memberName.trim()) {
      setSubmitState({ isSubmitting: false, errorMessage: '会员 ID 和持卡人姓名不能为空。' });
      return;
    }
    const suffix = String(Date.now()).slice(-5);
    setCards((prev) => [
      ...prev,
      {
        id: `mc-${suffix}`,
        memberId: formData.memberId,
        memberName: formData.memberName,
        cardNumber: `VIP-${suffix}`,
        cardType: formData.cardType,
        status: 'active',
        issuedAt: new Date().toISOString().slice(0, 10),
        activatedAt: null,
        expiresAt: null,
        balance: 0,
        pointsMultiplier: 1,
        designatedStore: null,
        linkedWechat: false,
        notes: '',
      },
    ]);
    setDialogOpen(false);
    setFormData({ memberId: '', memberName: '', cardType: 'virtual' });
    setSubmitState({ isSubmitting: false, successMessage: `会员卡 VIP-${suffix} 已完成演示发行。` });
  }, [formData]);

  return (
    <div style={{ maxWidth: 1080, margin: '0 auto', padding: 32 }}>
      <WorkspaceBreadcrumb workspaceLabel="会员管理" workspaceHref="/members" detailLabel="会员卡" />
      <PageShell title="会员卡管理" subtitle="查看卡片状态、余额和持卡人信息，并演示新卡发行链路。">
        {submitState.isSubmitting || submitState.errorMessage || submitState.successMessage ? (
          <div style={{ marginBottom: 16 }}>
            <FormSubmitFeedback state={submitState} />
          </div>
        ) : null}
        <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
          <input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="搜索卡号、持卡人或类型" style={{ ...inputStyle(false), maxWidth: 320 }} />
          <SubmitButton variant="secondary" onClick={handleRefresh} loading={isRefreshing}>{isRefreshing ? '刷新中...' : '刷新快照'}</SubmitButton>
          <SubmitButton variant="primary" onClick={() => setDialogOpen(true)}>发行新卡</SubmitButton>
        </div>
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thStyle}>卡号</th>
              <th style={thStyle}>持卡人</th>
              <th style={thStyle}>类型</th>
              <th style={thStyle}>状态</th>
              <th style={thStyle}>余额</th>
            </tr>
          </thead>
          <tbody>
            {filteredCards.map((item) => (
              <tr key={item.id}>
                <td style={tdStyle}>{item.cardNumber}</td>
                <td style={tdStyle}>{item.memberName}</td>
                <td style={tdStyle}>{item.cardType}</td>
                <td style={tdStyle}>{item.status}</td>
                <td style={tdStyle}>{item.balance.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {dialogOpen ? (
          <Dialog open onClose={() => setDialogOpen(false)} title="发行新会员卡">
            <div style={{ display: 'grid', gap: 16, minWidth: 420 }}>
              <FormField label="会员 ID"><input value={formData.memberId} onChange={(event) => setFormData((prev) => ({ ...prev, memberId: event.target.value }))} style={inputStyle(false)} /></FormField>
              <FormField label="持卡人姓名"><input value={formData.memberName} onChange={(event) => setFormData((prev) => ({ ...prev, memberName: event.target.value }))} style={inputStyle(false)} /></FormField>
              <FormField label="卡片类型">
                <select value={formData.cardType} onChange={(event) => setFormData((prev) => ({ ...prev, cardType: event.target.value as IssueCardFormData['cardType'] }))} style={{ ...inputStyle(false), minHeight: 40 }}>
                  <option value="virtual">虚拟卡</option>
                  <option value="physical">实体卡</option>
                  <option value="digital">数字卡</option>
                </select>
              </FormField>
            </div>
            <div style={actionStyle}>
              <SubmitButton variant="secondary" onClick={() => setDialogOpen(false)}>取消</SubmitButton>
              <SubmitButton variant="primary" onClick={() => void handleIssueCard()} loading={submitState.isSubmitting}>确认发行</SubmitButton>
            </div>
          </Dialog>
        ) : null}
      </PageShell>
    </div>
  );
}

const tableStyle: CSSProperties = { width: '100%', borderCollapse: 'collapse' };
const thStyle: CSSProperties = { textAlign: 'left', padding: '10px 12px', color: '#94a3b8', fontSize: 12, borderBottom: '1px solid rgba(148, 163, 184, 0.18)' };
const tdStyle: CSSProperties = { padding: '12px', color: '#e2e8f0', fontSize: 13, borderBottom: '1px solid rgba(148, 163, 184, 0.08)' };
const actionStyle: CSSProperties = { display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 16 };
function inputStyle(hasError: boolean): CSSProperties { return { width: '100%', padding: '10px 14px', borderRadius: 10, border: `1px solid ${hasError ? '#ef4444' : 'rgba(148, 163, 184, 0.2)'}`, background: 'rgba(15, 23, 42, 0.4)', color: '#f8fafc', fontSize: 14, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }; }
