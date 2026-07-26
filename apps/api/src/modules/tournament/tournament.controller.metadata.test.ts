import 'reflect-metadata'
import { describe, it } from 'vitest'
import assert from 'node:assert/strict'
import { TournamentController } from './tournament.controller'

describe('TournamentController metadata', () => {
  it('controller should keep tournaments path', () => {
    assert.equal(Reflect.getMetadata('path', TournamentController), 'tournaments')
  })

  it('routes should keep REST metadata', () => {
    const cases = [
      [TournamentController.prototype.createTournament, 1, '/'],
      [TournamentController.prototype.listTournaments, 0, '/'],
      [TournamentController.prototype.getTournament, 0, ':tournamentId'],
      [TournamentController.prototype.updateTournament, 4, ':tournamentId'],
      [TournamentController.prototype.updateTournamentStatus, 4, ':tournamentId/status'],
      [TournamentController.prototype.registerParticipant, 1, ':tournamentId/register'],
      [TournamentController.prototype.registerTeam, 1, ':tournamentId/teams'],
      [TournamentController.prototype.approveTeam, 4, ':tournamentId/teams/approve'],
      [TournamentController.prototype.rejectTeam, 4, ':tournamentId/teams/reject'],
      [TournamentController.prototype.generateBracket, 1, ':tournamentId/bracket/generate'],
      [TournamentController.prototype.listMatches, 0, ':tournamentId/matches'],
      [TournamentController.prototype.getMatch, 0, 'matches/:matchId'],
      [TournamentController.prototype.recordMatchResult, 4, 'matches/:matchId/result'],
      [TournamentController.prototype.setDisputed, 4, 'matches/:matchId/dispute'],
      [TournamentController.prototype.getRankings, 0, ':tournamentId/rankings'],
      [TournamentController.prototype.getUpcomingMatches, 0, 'members/:memberId/upcoming'],
      [TournamentController.prototype.getLiveMatches, 0, 'stores/:storeId/live'],
    ] as const

    cases.forEach(([handler, method, path]) => {
      assert.equal(Reflect.getMetadata('method', handler), method)
      assert.equal(Reflect.getMetadata('path', handler), path)
    })
  })
})
