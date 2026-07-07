import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
import {
  NationalTournamentService,
  ChampionshipTournamentService,
  WorldCupTournamentService,
  WaitTimeEstimator,
  BusyIndexCalculator,
  TicketIdempotency,
  resetL5L7StoresForTests,
  testExports
} from './tournament-l5-l7.service'
import { TournamentStatus } from './tournament.entity'

describe('Tournament L5-L7 Services', () => {
  let nationalService: NationalTournamentService
  let championshipService: ChampionshipTournamentService
  let worldCupService: WorldCupTournamentService
  let waitTimeEstimator: WaitTimeEstimator
  let busyIndexCalculator: BusyIndexCalculator
  let ticketIdempotency: TicketIdempotency

  beforeEach(() => {
    resetL5L7StoresForTests()
    nationalService = new NationalTournamentService()
    championshipService = new ChampionshipTournamentService()
    worldCupService = new WorldCupTournamentService()
    waitTimeEstimator = new WaitTimeEstimator()
    busyIndexCalculator = new BusyIndexCalculator()
    ticketIdempotency = new TicketIdempotency()
  })

  // ═══════════════════════════════════════════════════════════════════
  // NationalTournament：全国赛（L5）
  // ═══════════════════════════════════════════════════════════════════

  describe('NationalTournament（全国赛）', () => {
    const createOpenTournament = () => {
      const tournament = nationalService.createNational({
        tenantId: 'tenant-1',
        name: '全国赛 2025',
        maxParticipants: 64
      })
      tournament.status = TournamentStatus.Open
      return tournament
    }

    it('should create a national tournament', () => {
      const tournament = nationalService.createNational({
        tenantId: 'tenant-1',
        name: '全国赛 2025',
        maxParticipants: 64
      })

      expect(tournament.id).toMatch(/^national-/)
      expect(tournament.name).toBe('全国赛 2025')
      expect(tournament.maxParticipants).toBe(64)
      expect(tournament.currentParticipants).toBe(0)
      expect(tournament.status).toBe(TournamentStatus.Draft)
    })

    it('should seed players and run bracket', () => {
      const tournament = createOpenTournament()

      for (let i = 1; i <= 4; i++) {
        nationalService.register(`member-${i}`, tournament.id)
      }

      const seedings = nationalService.seedPlayers(tournament.id)
      expect(seedings).toHaveLength(4)
      expect(seedings[0].rank).toBe(1)

      const matches = nationalService.runBracket(tournament.id)
      expect(matches.length).toBeGreaterThan(0)
    })

    it('should declare champion after final match', () => {
      const tournament = createOpenTournament()
      nationalService.register('member-1', tournament.id)

      const finalMatch = {
        id: 'final-match-1',
        tournamentId: tournament.id,
        round: 3,
        bracketPosition: 0,
        player1Id: 'member-1',
        player2Id: 'member-2',
        winnerId: 'member-1',
        score1: 2,
        score2: 0,
        status: 'COMPLETED',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      testExports.matchStore.set('final-match-1', finalMatch as any)

      const { champion, tournament: result } = nationalService.declareChampion(
        tournament.id,
        'member-1'
      )

      expect(result.status).toBe(TournamentStatus.Completed)
      expect(champion.rank).toBe(1)
    })

    it('should throw error when no final match completed', () => {
      const tournament = nationalService.createNational({
        tenantId: 'tenant-1',
        name: '全国赛 2025',
        maxParticipants: 8
      })

      expect(() => nationalService.declareChampion(tournament.id, 'member-999')).toThrow(
        'No final match completed'
      )
    })
  })

  // ═══════════════════════════════════════════════════════════════════
  // ChampionshipTournament：锦标赛（L6）
  // ═══════════════════════════════════════════════════════════════════

  describe('ChampionshipTournament（锦标赛）', () => {
    it('should create a championship tournament', () => {
      const championship = championshipService.createChampionship({
        tenantId: 'tenant-1',
        name: '世界锦标赛 2025',
        prizePool: 100000
      })

      expect(championship.id).toMatch(/^championship-/)
      expect(championship.name).toBe('世界锦标赛 2025')
      expect(championship.prizePool).toBe(100000)
      expect(championship.isInvitationOnly).toBe(false)
    })

    it('should invite and accept/reject invitations', () => {
      const championship = championshipService.createChampionship({
        tenantId: 'tenant-1',
        name: '邀请赛 2025'
      })

      championshipService.invitePlayers(championship.id, ['member-1', 'member-2'])

      const accepted = championshipService.acceptInvitation(championship.id, 'member-1')
      expect(accepted.acceptedMembers).toContain('member-1')

      const rejected = championshipService.rejectInvitation(championship.id, 'member-2')
      expect(rejected.rejectedMembers).toContain('member-2')
    })

    it('should get prize pool', () => {
      const championship = championshipService.createChampionship({
        tenantId: 'tenant-1',
        name: '邀请赛 2025',
        prizePool: 50000
      })

      const prizePool = championshipService.getPrizePool(championship.id)
      expect(prizePool).toBe(50000)
    })

    it('should throw error for uninvited member', () => {
      const championship = championshipService.createChampionship({
        tenantId: 'tenant-1',
        name: '邀请赛 2025'
      })

      expect(() => championshipService.acceptInvitation(championship.id, 'member-999')).toThrow(
        'Member has not been invited'
      )
    })
  })

  // ═══════════════════════════════════════════════════════════════════
  // WorldCupTournament：世界杯（L7）
  // ═══════════════════════════════════════════════════════════════════

  describe('WorldCupTournament（世界杯）', () => {
    it('should create a world cup tournament', () => {
      const worldCup = worldCupService.createWorldCup({
        tenantId: 'tenant-1',
        name: '世界杯 2026'
      })

      expect(worldCup.id).toMatch(/^worldcup-/)
      expect(worldCup.name).toBe('世界杯 2026')
      expect(worldCup.status).toBe(TournamentStatus.Draft)
      expect(worldCup.nationalTeams).toHaveLength(0)
    })

    it('should register national teams and qualify', () => {
      const worldCup = worldCupService.createWorldCup({
        tenantId: 'tenant-1',
        name: '世界杯 2026'
      })

      for (let i = 1; i <= 20; i++) {
        worldCupService.registerNationalTeam(
          worldCup.id,
          `team-${i}`,
          `Country ${i}`,
          [`p${i}-1`, `p${i}-2`],
          `p${i}-1`
        )
      }

      const qualified = worldCupService.qualifyWorldCup(worldCup.id)
      expect(qualified).toHaveLength(16)
    })

    it('should award world champion', () => {
      const worldCup = worldCupService.createWorldCup({
        tenantId: 'tenant-1',
        name: '世界杯 2026'
      })

      worldCupService.registerNationalTeam(
        worldCup.id,
        'team-cn',
        'China',
        ['player-1', 'player-2'],
        'player-1'
      )
      worldCupService.qualifyWorldCup(worldCup.id)

      const result = worldCupService.awardWorldChampion(worldCup.id, 'team-cn')

      expect(result.championTeamId).toBe('team-cn')
      expect(result.status).toBe(TournamentStatus.Completed)
    })

    it('should throw error for non-qualified team', () => {
      const worldCup = worldCupService.createWorldCup({
        tenantId: 'tenant-1',
        name: '世界杯 2026'
      })

      worldCupService.registerNationalTeam(
        worldCup.id,
        'team-1',
        'Country 1',
        ['p1', 'p2'],
        'p1'
      )
      worldCupService.registerNationalTeam(
        worldCup.id,
        'team-2',
        'Country 2',
        ['p3', 'p4'],
        'p3'
      )
      worldCupService.qualifyWorldCup(worldCup.id)

      expect(() => worldCupService.awardWorldChampion(worldCup.id, 'team-999')).toThrow(
        'Team did not qualify for World Cup'
      )
    })
  })

  // ═══════════════════════════════════════════════════════════════════
  // WaitTimeEstimator：等待时间预估（P1-3）
  // ═══════════════════════════════════════════════════════════════════

  describe('WaitTimeEstimator（等待时间预估）', () => {
    it('should estimate wait time for member', () => {
      const estimate = waitTimeEstimator.estimateWait('member-1', 'tournament-1')

      expect(estimate.memberId).toBe('member-1')
      expect(estimate.tournamentId).toBe('tournament-1')
      expect(estimate.estimatedWaitMinutes).toBeGreaterThanOrEqual(0)
    })

    it('should get estimated start time for tournament', () => {
      const startTime = waitTimeEstimator.getEstimatedStartTime('tournament-1')

      expect(startTime).toBeDefined()
      expect(new Date(startTime)).toBeInstanceOf(Date)
    })

    it('should return zero wait for no matches', () => {
      const estimate = waitTimeEstimator.estimateWait('member-1', 'tournament-1')

      expect(estimate.estimatedWaitMinutes).toBe(0)
      expect(estimate.currentRound).toBe(0)
    })
  })

  // ═══════════════════════════════════════════════════════════════════
  // BusyIndexCalculator：繁忙指数（P2-3）
  // ═══════════════════════════════════════════════════════════════════

  describe('BusyIndexCalculator（繁忙指数）', () => {
    it('should calculate busy index', () => {
      const busyIndex = busyIndexCalculator.calculate('tournament-1')

      expect(busyIndex.tournamentId).toBe('tournament-1')
      expect(busyIndex.index).toBeGreaterThanOrEqual(0)
      expect(busyIndex.index).toBeLessThanOrEqual(100)
    })

    it('should identify high load state', () => {
      const isHighLoad = busyIndexCalculator.isHighLoad('tournament-1')
      expect(typeof isHighLoad).toBe('boolean')
    })
  })

  // ═══════════════════════════════════════════════════════════════════
  // TicketIdempotency：取号幂等性（P2-9）
  // ═══════════════════════════════════════════════════════════════════

  describe('TicketIdempotency（取号幂等性）', () => {
    it('should issue ticket to member', () => {
      const ticket = ticketIdempotency.issueTicket('tournament-1', 'member-1')

      expect(ticket.tournamentId).toBe('tournament-1')
      expect(ticket.memberId).toBe('member-1')
      expect(ticket.ticketNumber).toMatch(/^TKT-\d+$/)
    })

    it('should return same ticket for idempotent call', () => {
      const ticket1 = ticketIdempotency.issueTicket('tournament-1', 'member-1')
      const ticket2 = ticketIdempotency.issueTicket('tournament-1', 'member-1')

      expect(ticket1.ticketNumber).toBe(ticket2.ticketNumber)
    })

    it('should issue different tickets for different members', () => {
      const ticket1 = ticketIdempotency.issueTicket('tournament-1', 'member-1')
      const ticket2 = ticketIdempotency.issueTicket('tournament-1', 'member-2')

      expect(ticket1.ticketNumber).not.toBe(ticket2.ticketNumber)
    })

    it('should get ticket for member', () => {
      ticketIdempotency.issueTicket('tournament-1', 'member-1')
      const ticket = ticketIdempotency.getTicket('tournament-1', 'member-1')

      expect(ticket).toBeDefined()
      expect(ticket!.ticketNumber).toMatch(/^TKT-\d+$/)
    })

    it('should return undefined for non-existent ticket', () => {
      const ticket = ticketIdempotency.getTicket('tournament-1', 'member-999')
      expect(ticket).toBeUndefined()
    })
  })
})
