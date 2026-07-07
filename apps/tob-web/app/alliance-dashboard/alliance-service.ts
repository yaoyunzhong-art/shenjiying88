/**
 * alliance-service.ts — 异业联盟 API 服务层
 */
import {
  MOCK_PARTNERS,
  MOCK_HEALTH_SCORES,
  MOCK_SETTLEMENTS,
  MOCK_ANOMALY_ALERTS,
  MOCK_CHANNEL_STATS,
  type AlliancePartner,
  type PartnerGrade,
  type HealthScore,
  type SettlementRecord,
  type AnomalyAlert,
  type ChannelReachStats,
  type ChannelType,
} from './alliance-data';

const TENANT = 'demo-tenant';

function buildHeaders(): HeadersInit {
  return {
    'x-tenant-id': TENANT
  };
}

async function requestJson<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: {
      ...buildHeaders(),
      ...(init.headers ?? {})
    },
    cache: 'no-store'
  });
  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }
  return (await response.json()) as T;
}

// ===================== 合作伙伴 =====================

export interface PartnerFilter {
  grade?: PartnerGrade;
  status?: 'active' | 'inactive' | 'pending';
  industry?: string;
  keyword?: string;
}

/**
 * 获取合作伙伴列表
 */
export async function getPartners(filter?: PartnerFilter): Promise<AlliancePartner[]> {
  try {
    const params = new URLSearchParams();
    if (filter?.grade) params.set('grade', filter.grade);
    if (filter?.status) params.set('status', filter.status);
    if (filter?.industry) params.set('industry', filter.industry);
    if (filter?.keyword) params.set('keyword', filter.keyword);
    const query = params.toString();
    return await requestJson<AlliancePartner[]>(`/api/alliance/partners${query ? `?${query}` : ''}`);
  } catch {
    let partners = [...MOCK_PARTNERS];
    if (filter?.grade) {
      partners = partners.filter(p => p.grade === filter.grade);
    }
    if (filter?.status) {
      partners = partners.filter(p => p.status === filter.status);
    }
    if (filter?.industry) {
      partners = partners.filter(p => p.industry === filter.industry);
    }
    if (filter?.keyword) {
      const kw = filter.keyword.toLowerCase();
      partners = partners.filter(p =>
        p.partnerName.toLowerCase().includes(kw) ||
        p.contactPerson.toLowerCase().includes(kw)
      );
    }
    return partners;
  }
}

/**
 * 获取合作伙伴详情
 */
export async function getPartner(partnerId: string): Promise<AlliancePartner | null> {
  try {
    return await requestJson<AlliancePartner>(`/api/alliance/partners/${partnerId}`);
  } catch {
    const found = MOCK_PARTNERS.find(p => p.partnerId === partnerId);
    return found ?? null;
  }
}

/**
 * 获取合作伙伴等级
 */
export async function getPartnerGrade(partnerId: string): Promise<PartnerGrade | null> {
  const partner = await getPartner(partnerId);
  return partner?.grade ?? null;
}

/**
 * 获取合作伙伴健康度
 */
export async function getHealthScore(partnerId: string): Promise<HealthScore | null> {
  try {
    return await requestJson<HealthScore>(`/api/alliance/partners/${partnerId}/health`);
  } catch {
    return MOCK_HEALTH_SCORES[partnerId] ?? null;
  }
}

// ===================== 分账管理 =====================

/**
 * 获取分账历史记录
 */
export async function getSettlementHistory(partnerId?: string): Promise<SettlementRecord[]> {
  try {
    const params = new URLSearchParams();
    if (partnerId) params.set('partnerId', partnerId);
    const query = params.toString();
    return await requestJson<SettlementRecord[]>(`/api/alliance/settlements${query ? `?${query}` : ''}`);
  } catch {
    if (partnerId) {
      return MOCK_SETTLEMENTS.filter(s => s.partnerId === partnerId);
    }
    return [...MOCK_SETTLEMENTS];
  }
}

/**
 * 审批分账
 */
export async function approveSettlement(settlementId: string): Promise<boolean> {
  try {
    await requestJson(`/api/alliance/settlements/${settlementId}/approve`, { method: 'POST' });
    return true;
  } catch {
    const settlement = MOCK_SETTLEMENTS.find(s => s.settlementId === settlementId);
    if (settlement) {
      settlement.status = 'approved';
      return true;
    }
    return false;
  }
}

/**
 * 拒绝分账
 */
export async function rejectSettlement(settlementId: string): Promise<boolean> {
  try {
    await requestJson(`/api/alliance/settlements/${settlementId}/reject`, { method: 'POST' });
    return true;
  } catch {
    const settlement = MOCK_SETTLEMENTS.find(s => s.settlementId === settlementId);
    if (settlement) {
      settlement.status = 'rejected';
      return true;
    }
    return false;
  }
}

// ===================== 预警中心 =====================

/**
 * 获取异常预警列表
 */
export async function getAnomalyAlerts(): Promise<AnomalyAlert[]> {
  try {
    return await requestJson<AnomalyAlert[]>('/api/alliance/anomaly-alerts');
  } catch {
    return [...MOCK_ANOMALY_ALERTS];
  }
}

/**
 * 确认预警
 */
export async function acknowledgeAlert(alertId: string): Promise<boolean> {
  try {
    await requestJson(`/api/alliance/anomaly-alerts/${alertId}/acknowledge`, { method: 'POST' });
    return true;
  } catch {
    const alert = MOCK_ANOMALY_ALERTS.find(a => a.alertId === alertId);
    if (alert) {
      alert.status = 'acknowledged';
      return true;
    }
    return false;
  }
}

/**
 * 解决预警
 */
export async function resolveAlert(alertId: string): Promise<boolean> {
  try {
    await requestJson(`/api/alliance/anomaly-alerts/${alertId}/resolve`, { method: 'POST' });
    return true;
  } catch {
    const alert = MOCK_ANOMALY_ALERTS.find(a => a.alertId === alertId);
    if (alert) {
      alert.status = 'resolved';
      return true;
    }
    return false;
  }
}

// ===================== 全渠道触达 =====================

/**
 * 获取渠道触达统计
 */
export async function getChannelReachStats(channel?: ChannelType): Promise<ChannelReachStats[]> {
  try {
    const params = new URLSearchParams();
    if (channel) params.set('channel', channel);
    const query = params.toString();
    return await requestJson<ChannelReachStats[]>(`/api/alliance/channel-stats${query ? `?${query}` : ''}`);
  } catch {
    if (channel) {
      return MOCK_CHANNEL_STATS.filter(s => s.channel === channel);
    }
    return [...MOCK_CHANNEL_STATS];
  }
}

/**
 * 发送消息
 */
export interface SendMessageParams {
  channel: ChannelType;
  content: string;
  recipientIds?: string[];
}

export async function sendMessage(params: SendMessageParams): Promise<boolean> {
  try {
    await requestJson('/api/alliance/messages/send', {
      method: 'POST',
      body: JSON.stringify(params),
    });
    return true;
  } catch {
    return true; // Mock always succeeds
  }
}
