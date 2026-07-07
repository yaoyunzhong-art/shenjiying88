'use client';

import React, { useEffect, useState } from 'react';
import { PageShell } from '@m5/ui';
import {
  MOCK_TOURNAMENTS,
  LEVEL_TABS,
  getStatusLabel,
  getStatusColor,
  getTimeUntilStart,
  formatDatetime,
  type Tournament,
  type LeaderboardEntry,
} from './tournament-data';
import {
  getTournaments,
  getLeaderboard,
  joinTournament,
  submitScore,
} from './tournament-service';

export default function TournamentPage() {
  const [activeLevel, setActiveLevel] = useState<number>(1);
  const [tournaments, setTournaments] = useState<Tournament[]>(MOCK_TOURNAMENTS);
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [scoreInput, setScoreInput] = useState<string>('');
  const [joinLoading, setJoinLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);

  useEffect(() => {
    getTournaments(activeLevel).then(setTournaments);
  }, [activeLevel]);

  useEffect(() => {
    if (selectedTournament) {
      getLeaderboard(selectedTournament.tournamentId).then(setLeaderboard);
    }
  }, [selectedTournament]);

  const handleJoin = async (tournament: Tournament) => {
    setJoinLoading(true);
    const result = await joinTournament(tournament.tournamentId);
    setJoinLoading(false);
    if (result.success) {
      setTournaments(prev =>
        prev.map(t =>
          t.tournamentId === tournament.tournamentId
            ? { ...t, participantCount: t.participantCount + 1 }
            : t
        )
      );
    }
  };

  const handleSubmitScore = async () => {
    if (!selectedTournament || !scoreInput) return;
    const score = parseInt(scoreInput, 10);
    if (isNaN(score) || score < 50 || score > 150) return;

    setSubmitLoading(true);
    const result = await submitScore(selectedTournament.tournamentId, score);
    setSubmitLoading(false);
    if (result.success) {
      setScoreInput('');
      getLeaderboard(selectedTournament.tournamentId).then(setLeaderboard);
    }
  };

  const renderTournamentCard = (tournament: Tournament) => {
    const isCityOrWorld = tournament.level >= 4;
    const canJoin = tournament.status === 'registration';
    const canSubmit = tournament.status === 'ongoing';

    return (
      <div
        key={tournament.tournamentId}
        style={{
          background: 'rgba(15,23,42,0.8)',
          border: `1px solid ${getStatusColor(tournament.status)}33`,
          borderRadius: 12,
          padding: 20,
          cursor: 'pointer',
          transition: 'all 0.2s',
        }}
        onClick={() => setSelectedTournament(tournament)}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 600, color: '#f8fafc', margin: '0 0 4px' }}>
              {tournament.name}
            </h3>
            <span style={{
              padding: '2px 8px',
              fontSize: 11,
              borderRadius: 4,
              background: `${getStatusColor(tournament.status)}22`,
              color: getStatusColor(tournament.status),
              fontWeight: 500,
            }}>
              {getStatusLabel(tournament.status)}
            </span>
          </div>
          <div style={{
            padding: '4px 10px',
            fontSize: 12,
            fontWeight: 600,
            borderRadius: 6,
            background: tournament.level >= 6
              ? 'linear-gradient(135deg, #f59e0b, #d97706)'
              : tournament.level >= 4
                ? 'linear-gradient(135deg, #8b5cf6, #7c3aed)'
                : 'linear-gradient(135deg, #3b82f6, #60a5fa)',
            color: '#fff',
          }}>
            {tournament.levelName}
          </div>
        </div>

        <p style={{ fontSize: 13, color: '#94a3b8', margin: '0 0 12px' }}>
          {tournament.description}
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 12 }}>
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: 18, fontWeight: 700, color: '#f8fafc', margin: '0 0 2px' }}>
              ¥{tournament.prizePool.toLocaleString()}
            </p>
            <p style={{ fontSize: 11, color: '#64748b', margin: 0 }}>奖池</p>
          </div>
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: 18, fontWeight: 700, color: '#f8fafc', margin: '0 0 2px' }}>
              {tournament.participantCount}/{tournament.maxParticipants}
            </p>
            <p style={{ fontSize: 11, color: '#64748b', margin: 0 }}>参赛人数</p>
          </div>
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: 14, fontWeight: 600, color: '#60a5fa', margin: '0 0 2px' }}>
              {getTimeUntilStart(tournament.startTime)}
            </p>
            <p style={{ fontSize: 11, color: '#64748b', margin: 0 }}>距开赛</p>
          </div>
        </div>

        {isCityOrWorld && tournament.progressStages && (
          <div style={{ marginBottom: 12 }}>
            {tournament.progressStages.map((stage, i) => (
              <div key={i} style={{ marginBottom: 6 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                  <span style={{ fontSize: 11, color: '#94a3b8' }}>{stage.stage}</span>
                  <span style={{ fontSize: 11, color: '#60a5fa' }}>
                    {stage.qualified}/{stage.total}
                  </span>
                </div>
                <div style={{ height: 4, background: 'rgba(148,163,184,0.15)', borderRadius: 2 }}>
                  <div
                    style={{
                      width: `${(stage.qualified / stage.total) * 100}%`,
                      height: '100%',
                      background: 'linear-gradient(90deg, #8b5cf6, #a78bfa)',
                      borderRadius: 2,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', gap: 8 }}>
          {canJoin && (
            <button
              onClick={e => {
                e.stopPropagation();
                handleJoin(tournament);
              }}
              disabled={joinLoading}
              style={{
                flex: 1,
                padding: '8px 16px',
                fontSize: 12,
                fontWeight: 600,
                borderRadius: 6,
                background: 'linear-gradient(135deg, #22c55e, #16a34a)',
                color: '#fff',
                border: 'none',
                cursor: joinLoading ? 'not-allowed' : 'pointer',
                opacity: joinLoading ? 0.6 : 1,
              }}
            >
              {joinLoading ? '报名中...' : '立即报名'}
            </button>
          )}
          {canSubmit && (
            <button
              onClick={e => {
                e.stopPropagation();
                setSelectedTournament(tournament);
              }}
              style={{
                flex: 1,
                padding: '8px 16px',
                fontSize: 12,
                fontWeight: 600,
                borderRadius: 6,
                background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                color: '#fff',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              提交成绩
            </button>
          )}
        </div>
      </div>
    );
  };

  const renderLeaderboard = () => (
    <div
      style={{
        background: 'rgba(30,41,59,0.9)',
        border: '1px solid rgba(148,163,184,0.12)',
        borderRadius: 12,
        padding: 24,
      }}
    >
      <h2 style={{ fontSize: 16, fontWeight: 600, color: '#f8fafc', margin: '0 0 16px' }}>
        排行榜
      </h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {leaderboard.map(entry => (
          <div
            key={entry.rank}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '10px 14px',
              background: entry.rank <= 3
                ? `rgba(${
                    entry.rank === 1 ? '234,179,8' : entry.rank === 2 ? '148,163,184' : '180,83,9'
                  },0.1)`
                : 'rgba(15,23,42,0.6)',
              borderRadius: 8,
              border: entry.rank <= 3
                ? `1px solid rgba(${
                    entry.rank === 1 ? '234,179,8' : entry.rank === 2 ? '148,163,184' : '180,83,9'
                  },0.3)`
                : '1px solid rgba(148,163,184,0.1)',
            }}
          >
            <span style={{
              width: 28,
              height: 28,
              borderRadius: '50%',
              background: entry.rank === 1
                ? 'linear-gradient(135deg, #eab308, #fbbf24)'
                : entry.rank === 2
                  ? 'linear-gradient(135deg, #94a3b8, #cbd5e1)'
                  : entry.rank === 3
                    ? 'linear-gradient(135deg, #b45309, #d97706)'
                    : 'rgba(148,163,184,0.1)',
              color: entry.rank <= 3 ? '#0f172a' : '#94a3b8',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 12,
              fontWeight: 700,
            }}>
              {entry.rank}
            </span>
            <span style={{ flex: 1, fontSize: 14, color: '#e2e8f0', fontWeight: 500 }}>
              {entry.playerName}
            </span>
            {entry.handicap !== undefined && (
              <span style={{
                padding: '2px 8px',
                fontSize: 10,
                borderRadius: 4,
                background: 'rgba(139,92,246,0.15)',
                color: '#a78bfa',
              }}>
                差点{entry.handicap}
              </span>
            )}
            <span style={{ fontSize: 16, fontWeight: 700, color: '#f8fafc' }}>
              {entry.score}
            </span>
            <span style={{ fontSize: 11, color: '#64748b' }}>杆</span>
          </div>
        ))}
        {leaderboard.length === 0 && (
          <div style={{ textAlign: 'center', padding: 20, color: '#64748b' }}>
            暂无排行榜数据
          </div>
        )}
      </div>
    </div>
  );

  const renderScoreSubmit = () => (
    <div
      style={{
        background: 'rgba(30,41,59,0.9)',
        border: '1px solid rgba(148,163,184,0.12)',
        borderRadius: 12,
        padding: 24,
        marginTop: 16,
      }}
    >
      <h2 style={{ fontSize: 16, fontWeight: 600, color: '#f8fafc', margin: '0 0 16px' }}>
        提交成绩
      </h2>
      <div style={{ display: 'flex', gap: 12 }}>
        <input
          type="number"
          value={scoreInput}
          onChange={e => setScoreInput(e.target.value)}
          placeholder="输入成绩(杆数)"
          min={50}
          max={150}
          style={{
            flex: 1,
            padding: '10px 14px',
            fontSize: 14,
            borderRadius: 6,
            border: '1px solid rgba(148,163,184,0.2)',
            background: 'rgba(15,23,42,0.8)',
            color: '#f8fafc',
            outline: 'none',
          }}
        />
        <button
          onClick={handleSubmitScore}
          disabled={submitLoading || !scoreInput}
          style={{
            padding: '10px 20px',
            fontSize: 14,
            fontWeight: 600,
            borderRadius: 6,
            background: submitLoading
              ? 'rgba(148,163,184,0.2)'
              : 'linear-gradient(135deg, #3b82f6, #2563eb)',
            color: '#fff',
            border: 'none',
            cursor: submitLoading || !scoreInput ? 'not-allowed' : 'pointer',
            opacity: submitLoading ? 0.6 : 1,
          }}
        >
          {submitLoading ? '提交中...' : '提交'}
        </button>
      </div>
    </div>
  );

  return (
    <PageShell title="赛事中心" description="参与赛事，赢取奖池">
      {/* Level Tabs */}
      <div
        style={{
          display: 'flex',
          gap: 8,
          marginBottom: 24,
          overflowX: 'auto',
          paddingBottom: 8,
        }}
      >
        {LEVEL_TABS.map(tab => (
          <button
            key={tab.level}
            onClick={() => setActiveLevel(tab.level)}
            style={{
              padding: '8px 16px',
              fontSize: 13,
              fontWeight: activeLevel === tab.level ? 600 : 400,
              borderRadius: 6,
              background: activeLevel === tab.level
                ? 'rgba(59,130,246,0.15)'
                : 'transparent',
              color: activeLevel === tab.level ? '#60a5fa' : '#94a3b8',
              border: 'none',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.2s',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 24, alignItems: 'flex-start' }}>
        {/* Tournament List */}
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
            {tournaments.map(renderTournamentCard)}
          </div>
          {tournaments.length === 0 && (
            <div style={{ textAlign: 'center', padding: 40, color: '#64748b' }}>
              暂无赛事
            </div>
          )}
        </div>

        {/* Sidebar */}
        {selectedTournament && (
          <div style={{ position: 'sticky', top: 24 }}>
            {/* Tournament Detail */}
            <div
              style={{
                background: 'rgba(30,41,59,0.9)',
                border: '1px solid rgba(148,163,184,0.12)',
                borderRadius: 12,
                padding: 24,
                marginBottom: 16,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <h2 style={{ fontSize: 16, fontWeight: 600, color: '#f8fafc', margin: 0 }}>
                  {selectedTournament.name}
                </h2>
                <button
                  onClick={() => setSelectedTournament(null)}
                  style={{
                    padding: '4px 8px',
                    fontSize: 12,
                    borderRadius: 4,
                    background: 'rgba(148,163,184,0.1)',
                    color: '#94a3b8',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  关闭
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, marginBottom: 16 }}>
                <div>
                  <p style={{ fontSize: 11, color: '#64748b', margin: '0 0 2px' }}>时间</p>
                  <p style={{ fontSize: 13, color: '#e2e8f0', margin: 0 }}>
                    {formatDatetime(selectedTournament.startTime)}
                  </p>
                </div>
                <div>
                  <p style={{ fontSize: 11, color: '#64748b', margin: '0 0 2px' }}>奖池</p>
                  <p style={{ fontSize: 13, color: '#22c55e', fontWeight: 600, margin: 0 }}>
                    ¥{selectedTournament.prizePool.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p style={{ fontSize: 11, color: '#64748b', margin: '0 0 2px' }}>参赛人数</p>
                  <p style={{ fontSize: 13, color: '#e2e8f0', margin: 0 }}>
                    {selectedTournament.participantCount}/{selectedTournament.maxParticipants}
                  </p>
                </div>
                <div>
                  <p style={{ fontSize: 11, color: '#64748b', margin: '0 0 2px' }}>状态</p>
                  <p style={{ fontSize: 13, color: getStatusColor(selectedTournament.status), margin: 0 }}>
                    {getStatusLabel(selectedTournament.status)}
                  </p>
                </div>
              </div>

              <div style={{ marginBottom: 12 }}>
                <p style={{ fontSize: 11, color: '#64748b', margin: '0 0 4px' }}>规则</p>
                <p style={{ fontSize: 13, color: '#94a3b8', margin: 0 }}>{selectedTournament.rules}</p>
              </div>

              {selectedTournament.status === 'ongoing' && renderScoreSubmit()}
            </div>

            {/* Leaderboard */}
            {renderLeaderboard()}
          </div>
        )}
      </div>
    </PageShell>
  );
}
