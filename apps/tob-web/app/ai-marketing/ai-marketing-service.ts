import {
  MOCK_CAMPAIGNS,
  MOCK_AB_EXPERIMENTS,
  MOCK_SEGMENTS,
  MOCK_ROI_METRICS,
  type Campaign,
  type CopyVariant,
  type ABExperiment,
  type MemberSegment,
  type ROIMetrics,
} from './ai-marketing-data';

// Campaign Management
export async function getCampaigns(): Promise<Campaign[]> {
  try {
    const res = await fetch('/api/ai-marketing/campaigns');
    if (!res.ok) throw new Error('Failed to fetch');
    return await res.json();
  } catch {
    return MOCK_CAMPAIGNS;
  }
}

export async function getCampaign(id: string): Promise<Campaign | null> {
  try {
    const res = await fetch(`/api/ai-marketing/campaigns/${id}`);
    if (!res.ok) throw new Error('Failed to fetch');
    return await res.json();
  } catch {
    return MOCK_CAMPAIGNS.find(c => c.id === id) ?? null;
  }
}

export async function createCampaign(data: Partial<Campaign>): Promise<Campaign> {
  try {
    const res = await fetch('/api/ai-marketing/campaigns', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create');
    return await res.json();
  } catch {
    const newCampaign: Campaign = {
      id: `C${Date.now()}`,
      name: data.name ?? '新活动',
      status: 'draft',
      roi: 0,
      reachCount: 0,
      createdAt: new Date().toISOString(),
      description: data.description ?? '',
    };
    return newCampaign;
  }
}

export async function pauseCampaign(id: string): Promise<Campaign | null> {
  try {
    const res = await fetch(`/api/ai-marketing/campaigns/${id}/pause`, {
      method: 'POST',
    });
    if (!res.ok) throw new Error('Failed to pause');
    return await res.json();
  } catch {
    const campaign = MOCK_CAMPAIGNS.find(c => c.id === id);
    if (!campaign) return null;
    return { ...campaign, status: 'paused' };
  }
}

// Copy Variants
export async function getCopyVariants(campaignId: string): Promise<CopyVariant[]> {
  try {
    const res = await fetch(`/api/ai-marketing/campaigns/${campaignId}/variants`);
    if (!res.ok) throw new Error('Failed to fetch');
    return await res.json();
  } catch {
    const experiments = MOCK_AB_EXPERIMENTS.filter(e => e.campaignId === campaignId);
    return experiments.flatMap(e => e.variants);
  }
}

// AI Copy Generation
export async function generateCopy(brief: string): Promise<{ title: string; body: string; cta: string }> {
  try {
    const res = await fetch('/api/ai-marketing/generate-copy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ brief }),
    });
    if (!res.ok) throw new Error('Failed to generate');
    return await res.json();
  } catch {
    return {
      title: `限时特惠 - ${brief.substring(0, 10)}`,
      body: `好消息！${brief}相关商品正在优惠中，错过不再有！`,
      cta: '立即查看',
    };
  }
}

// A/B Testing
export async function runABTest(
  campaignId: string,
  variants: Partial<CopyVariant>[]
): Promise<ABExperiment> {
  try {
    const res = await fetch('/api/ai-marketing/ab-tests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ campaignId, variants }),
    });
    if (!res.ok) throw new Error('Failed to create');
    return await res.json();
  } catch {
    const experiment: ABExperiment = {
      id: `AB${Date.now()}`,
      campaignId,
      name: `A/B测试-${Date.now()}`,
      variants: variants.map((v, i) => ({
        id: `V${Date.now()}${i}`,
        campaignId,
        title: v.title ?? '',
        body: v.body ?? '',
        cta: v.cta ?? '',
        variant: ('ABCDEFGHIJKLMNOPQRSTUVWXYZ'[i] as CopyVariant['variant']),
      })),
      lift: 0,
      confidence: 0,
      status: 'draft',
      startDate: new Date().toISOString(),
    };
    return experiment;
  }
}

export async function getABResults(experimentId: string): Promise<ABExperiment | null> {
  try {
    const res = await fetch(`/api/ai-marketing/ab-tests/${experimentId}`);
    if (!res.ok) throw new Error('Failed to fetch');
    return await res.json();
  } catch {
    return MOCK_AB_EXPERIMENTS.find(e => e.id === experimentId) ?? null;
  }
}

// Member Segments
export async function getSegments(): Promise<MemberSegment[]> {
  try {
    const res = await fetch('/api/ai-marketing/segments');
    if (!res.ok) throw new Error('Failed to fetch');
    return await res.json();
  } catch {
    return MOCK_SEGMENTS;
  }
}

// Optimal Timing
export async function getOptimalTiming(memberId: string): Promise<{ hour: number; dayOfWeek: string }> {
  try {
    const res = await fetch(`/api/ai-marketing/members/${memberId}/optimal-timing`);
    if (!res.ok) throw new Error('Failed to fetch');
    return await res.json();
  } catch {
    return { hour: 19, dayOfWeek: '周末' };
  }
}

// ROI Metrics
export async function getCampaignROI(campaignId: string): Promise<ROIMetrics | null> {
  try {
    const res = await fetch(`/api/ai-marketing/campaigns/${campaignId}/roi`);
    if (!res.ok) throw new Error('Failed to fetch');
    return await res.json();
  } catch {
    return MOCK_ROI_METRICS.find(m => m.campaignId === campaignId) ?? null;
  }
}
