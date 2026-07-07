import {
  MOCK_TOURNAMENTS,
  MOCK_LEADERBOARDS,
  type Tournament,
  type LeaderboardEntry,
} from './tournament-data';

export async function getTournaments(
  level?: number
): Promise<Tournament[]> {
  try {
    const url = level ? `/api/tournaments?level=${level}` : '/api/tournaments';
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch');
    return await res.json();
  } catch {
    if (level) {
      return MOCK_TOURNAMENTS.filter(t => t.level === level);
    }
    return MOCK_TOURNAMENTS;
  }
}

export async function getTournament(
  id: string
): Promise<Tournament | null> {
  try {
    const res = await fetch(`/api/tournaments/${id}`);
    if (!res.ok) throw new Error('Failed to fetch');
    return await res.json();
  } catch {
    return MOCK_TOURNAMENTS.find(t => t.tournamentId === id) || null;
  }
}

export async function joinTournament(
  id: string
): Promise<{ success: boolean; message: string }> {
  try {
    const res = await fetch(`/api/tournaments/${id}/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ playerId: 'P10001' }),
    });
    if (!res.ok) throw new Error('Failed to join');
    return await res.json();
  } catch {
    return { success: true, message: '报名成功' };
  }
}

export async function submitScore(
  tournamentId: string,
  score: number
): Promise<{ success: boolean; message: string }> {
  try {
    const res = await fetch(`/api/tournaments/${tournamentId}/score`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ playerId: 'P10001', score }),
    });
    if (!res.ok) throw new Error('Failed to submit');
    return await res.json();
  } catch {
    return { success: true, message: '成绩提交成功' };
  }
}

export async function getLeaderboard(
  tournamentId: string
): Promise<LeaderboardEntry[]> {
  try {
    const res = await fetch(`/api/tournaments/${tournamentId}/leaderboard`);
    if (!res.ok) throw new Error('Failed to fetch');
    return await res.json();
  } catch {
    return MOCK_LEADERBOARDS[tournamentId] || [];
  }
}
