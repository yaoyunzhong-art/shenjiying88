import {
  MOCK_PROGRESS,
  MOCK_POINTS,
  MOCK_POINTS_RECORDS,
  MOCK_CROSS_STORE,
  type MemberProgress,
  type PointsSummary,
  type PointsRecord,
  type CrossStoreActivity,
} from './member-center-data';

export async function loadMemberProgress(
  memberId: string
): Promise<MemberProgress | null> {
  try {
    const res = await fetch(`/api/member/${memberId}/progress`);
    if (!res.ok) throw new Error('Failed to fetch');
    return await res.json();
  } catch {
    return MOCK_PROGRESS;
  }
}

export async function loadPointsSummary(
  memberId: string
): Promise<PointsSummary | null> {
  try {
    const res = await fetch(`/api/member/${memberId}/points`);
    if (!res.ok) throw new Error('Failed to fetch');
    return await res.json();
  } catch {
    return MOCK_POINTS;
  }
}

export async function loadPointsRecords(
  memberId: string,
  limit: number = 10
): Promise<PointsRecord[]> {
  try {
    const res = await fetch(`/api/member/${memberId}/points/records?limit=${limit}`);
    if (!res.ok) throw new Error('Failed to fetch');
    return await res.json();
  } catch {
    return MOCK_POINTS_RECORDS.slice(0, limit);
  }
}

export async function loadCrossStoreActivity(
  memberId: string
): Promise<CrossStoreActivity[]> {
  try {
    const res = await fetch(`/api/member/${memberId}/cross-store`);
    if (!res.ok) throw new Error('Failed to fetch');
    return await res.json();
  } catch {
    return MOCK_CROSS_STORE;
  }
}
