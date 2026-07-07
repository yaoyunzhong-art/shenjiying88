import React from 'react';
import { loadCampaignRulesWorkspace } from '../../campaign-rules-view-model';
import { CampaignRuleDetailPresenter } from './detail-presenter';

interface CampaignRuleDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function CampaignRuleDetailPage({
  params,
}: CampaignRuleDetailPageProps) {
  const { id } = await params;
  const snapshot = await loadCampaignRulesWorkspace(
    { page: 1, pageSize: 100 },
    { cache: 'no-store' },
  );

  const rule = snapshot.workspace.rules.find((r) => r.id === id);

  return (
    <CampaignRuleDetailPresenter
      rule={rule ?? null}
      ruleId={id}
      deliveryMode={snapshot.deliveryMode}
    />
  );
}
