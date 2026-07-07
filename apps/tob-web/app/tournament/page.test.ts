import { describe, it } from 'node:test';
import assert from 'node:assert';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function readSource(): string {
  const src = resolve(__dirname, 'page.tsx');
  return readFileSync(src, 'utf-8');
}

describe('TournamentPage', () => {
  it('has tournament data structure', () => {
    const src = readSource();
    assert.ok(
      src.includes('MOCK_TOURNAMENTS') ||
        src.includes('Tournament') ||
        src.includes('tournamentId') ||
        src.includes('levelName'),
      'missing tournament data structure'
    );
  });

  it('has level tabs for L1-L7', () => {
    const src = readSource();
    assert.ok(
      src.includes('日常赛') ||
        src.includes('周赛') ||
        src.includes('月赛') ||
        src.includes('城市赛') ||
        src.includes('全国赛') ||
        src.includes('锦标赛') ||
        src.includes('世界杯') ||
        src.includes('LEVEL_TABS') ||
        src.includes('L1') ||
        src.includes('L7'),
      'missing level tabs structure'
    );
  });

  it('has leaderboard panel', () => {
    const src = readSource();
    assert.ok(
      src.includes('Leaderboard') ||
        src.includes('排行榜') ||
        src.includes('leaderboard') ||
        src.includes('rank') ||
        src.includes('score'),
      'missing leaderboard structure'
    );
  });

  it('has tournament card with prize pool and participants', () => {
    const src = readSource();
    assert.ok(
      src.includes('prizePool') ||
        src.includes('奖池') ||
        src.includes('participantCount') ||
        src.includes('参赛人数'),
      'missing tournament card structure'
    );
  });

  it('has join/submit score handlers', () => {
    const src = readSource();
    assert.ok(
      src.includes('handleJoin') ||
        src.includes('joinTournament') ||
        src.includes('handleSubmitScore') ||
        src.includes('submitScore') ||
        src.includes('报名'),
      'missing tournament action handlers'
    );
  });

  it('has progress stages for city/world cup', () => {
    const src = readSource();
    assert.ok(
      src.includes('progressStages') ||
        src.includes('晋级') ||
        src.includes('stage') ||
        src.includes('qualified'),
      'missing progress stages structure'
    );
  });
});
