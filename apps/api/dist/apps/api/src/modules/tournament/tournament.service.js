"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TournamentService = void 0;
const node_crypto_1 = require("node:crypto");
const common_1 = require("@nestjs/common");
const tournament_entity_1 = require("./tournament.entity");
// ── In-memory stores ──
const tournamentStore = new Map();
const matchStore = new Map();
const rankingStore = new Map();
const teamRegistrationStore = new Map();
let TournamentService = class TournamentService {
    // ═══════════════════════════════════════════════════════════════════
    // Tournament CRUD
    // ═══════════════════════════════════════════════════════════════════
    createTournament(input) {
        const now = new Date().toISOString();
        const tournament = {
            id: `tournament-${(0, node_crypto_1.randomUUID)()}`,
            tenantId: input.tenantId,
            brandId: input.brandId,
            storeId: input.storeId,
            name: input.name,
            description: input.description,
            type: input.type,
            gameName: input.gameName,
            startDate: input.startDate,
            endDate: input.endDate,
            maxParticipants: input.maxParticipants,
            currentParticipants: 0,
            status: tournament_entity_1.TournamentStatus.Draft,
            rules: input.rules ?? {},
            prizes: input.prizes ?? {},
            bannerImage: input.bannerImage,
            createdAt: now,
            updatedAt: now
        };
        tournamentStore.set(tournament.id, tournament);
        return tournament;
    }
    updateTournament(tournamentId, tenantId, input) {
        const tournament = this.requireTournament(tournamentId, tenantId);
        if (input.name !== undefined)
            tournament.name = input.name;
        if (input.description !== undefined)
            tournament.description = input.description;
        if (input.type !== undefined)
            tournament.type = input.type;
        if (input.gameName !== undefined)
            tournament.gameName = input.gameName;
        if (input.startDate !== undefined)
            tournament.startDate = input.startDate;
        if (input.endDate !== undefined)
            tournament.endDate = input.endDate;
        if (input.maxParticipants !== undefined)
            tournament.maxParticipants = input.maxParticipants;
        if (input.rules !== undefined)
            tournament.rules = input.rules;
        if (input.prizes !== undefined)
            tournament.prizes = input.prizes;
        if (input.bannerImage !== undefined)
            tournament.bannerImage = input.bannerImage;
        tournament.updatedAt = new Date().toISOString();
        tournamentStore.set(tournamentId, tournament);
        return tournament;
    }
    getTournament(tournamentId, tenantId) {
        const tournament = tournamentStore.get(tournamentId);
        if (!tournament || tournament.tenantId !== tenantId)
            return undefined;
        return tournament;
    }
    listTournaments(tenantId, filter) {
        return Array.from(tournamentStore.values())
            .filter((t) => t.tenantId === tenantId)
            .filter((t) => (filter?.status ? t.status === filter.status : true))
            .filter((t) => (filter?.type ? t.type === filter.type : true))
            .filter((t) => (filter?.storeId ? t.storeId === filter.storeId : true))
            .filter((t) => (filter?.brandId ? t.brandId === filter.brandId : true))
            .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    }
    // ═══════════════════════════════════════════════════════════════════
    // Status transitions
    // ═══════════════════════════════════════════════════════════════════
    updateTournamentStatus(tournamentId, status, tenantId) {
        const tournament = this.requireTournament(tournamentId, tenantId);
        this.assertValidTournamentStatusTransition(tournament.status, status);
        tournament.status = status;
        tournament.updatedAt = new Date().toISOString();
        tournamentStore.set(tournamentId, tournament);
        return tournament;
    }
    // ═══════════════════════════════════════════════════════════════════
    // Participant registration
    // ═══════════════════════════════════════════════════════════════════
    registerParticipant(tournamentId, memberId, tenantId) {
        const tournament = this.requireTournament(tournamentId, tenantId);
        if (tournament.status !== tournament_entity_1.TournamentStatus.Open) {
            throw new Error('Tournament is not open for registration');
        }
        if (tournament.currentParticipants >= tournament.maxParticipants) {
            throw new Error('Tournament has reached maximum participants');
        }
        // Check if already registered (via ranking store as participant list)
        const existing = Array.from(rankingStore.values()).find((r) => r.tournamentId === tournamentId && r.memberId === memberId);
        if (existing) {
            throw new Error('Participant already registered');
        }
        tournament.currentParticipants += 1;
        tournament.updatedAt = new Date().toISOString();
        tournamentStore.set(tournamentId, tournament);
        // Create initial ranking entry
        const ranking = {
            id: `ranking-${(0, node_crypto_1.randomUUID)()}`,
            tournamentId,
            memberId,
            rank: 0,
            points: 0,
            wins: 0,
            losses: 0,
            draws: 0,
            updatedAt: new Date().toISOString()
        };
        rankingStore.set(ranking.id, ranking);
        return tournament;
    }
    registerTeam(input, tenantId) {
        const tournament = this.requireTournament(input.tournamentId, tenantId);
        if (tournament.status !== tournament_entity_1.TournamentStatus.Open) {
            throw new Error('Tournament is not open for registration');
        }
        const now = new Date().toISOString();
        const registration = {
            id: `teamreg-${(0, node_crypto_1.randomUUID)()}`,
            tournamentId: input.tournamentId,
            teamName: input.teamName,
            captainId: input.captainId,
            memberIds: input.memberIds,
            status: tournament_entity_1.TeamRegistrationStatus.Pending,
            createdAt: now,
            updatedAt: now
        };
        teamRegistrationStore.set(registration.id, registration);
        return registration;
    }
    approveTeam(teamRegId, tenantId) {
        const reg = teamRegistrationStore.get(teamRegId);
        if (!reg)
            throw new Error(`Team registration not found: ${teamRegId}`);
        // Verify tournament belongs to tenant
        this.requireTournament(reg.tournamentId, tenantId);
        reg.status = tournament_entity_1.TeamRegistrationStatus.Approved;
        reg.updatedAt = new Date().toISOString();
        teamRegistrationStore.set(teamRegId, reg);
        return reg;
    }
    rejectTeam(teamRegId, tenantId) {
        const reg = teamRegistrationStore.get(teamRegId);
        if (!reg)
            throw new Error(`Team registration not found: ${teamRegId}`);
        this.requireTournament(reg.tournamentId, tenantId);
        reg.status = tournament_entity_1.TeamRegistrationStatus.Rejected;
        reg.updatedAt = new Date().toISOString();
        teamRegistrationStore.set(teamRegId, reg);
        return reg;
    }
    listTeamRegistrations(tournamentId, tenantId) {
        this.requireTournament(tournamentId, tenantId);
        return Array.from(teamRegistrationStore.values())
            .filter((r) => r.tournamentId === tournamentId)
            .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    }
    // ═══════════════════════════════════════════════════════════════════
    // Bracket & Match management
    // ═══════════════════════════════════════════════════════════════════
    generateBracket(tournamentId, tenantId) {
        const tournament = this.requireTournament(tournamentId, tenantId);
        if (tournament.status !== tournament_entity_1.TournamentStatus.Open) {
            throw new Error('Bracket can only be generated when tournament is OPEN');
        }
        // Get all registered participants
        const participants = Array.from(rankingStore.values())
            .filter((r) => r.tournamentId === tournamentId)
            .map((r) => r.memberId);
        if (participants.length < 2) {
            throw new Error('Need at least 2 participants to generate a bracket');
        }
        const matches = [];
        const now = new Date().toISOString();
        if (tournament.type === tournament_entity_1.TournamentType.RoundRobin || tournament.type === tournament_entity_1.TournamentType.League) {
            // Round-robin: every participant plays every other
            let position = 0;
            for (let i = 0; i < participants.length; i++) {
                for (let j = i + 1; j < participants.length; j++) {
                    const match = {
                        id: `match-${(0, node_crypto_1.randomUUID)()}`,
                        tournamentId,
                        round: 1,
                        bracketPosition: position++,
                        player1Id: participants[i],
                        player2Id: participants[j],
                        score1: 0,
                        score2: 0,
                        status: tournament_entity_1.MatchStatus.Pending,
                        createdAt: now,
                        updatedAt: now
                    };
                    matches.push(match);
                    matchStore.set(match.id, match);
                }
            }
        }
        else {
            // Single/Double elimination: bracket-style pairing
            // Shuffle & pair adjacent participants
            const shuffled = this.shuffleArray([...participants]);
            // Calculate rounds: next power of 2
            const totalRounds = Math.ceil(Math.log2(shuffled.length));
            let currentRound = 1;
            let bracketSlot = 0;
            for (let i = 0; i < shuffled.length; i += 2) {
                const match = {
                    id: `match-${(0, node_crypto_1.randomUUID)()}`,
                    tournamentId,
                    round: currentRound,
                    bracketPosition: bracketSlot++,
                    player1Id: shuffled[i],
                    player2Id: shuffled[i + 1] ?? undefined, // bye
                    score1: 0,
                    score2: 0,
                    status: tournament_entity_1.MatchStatus.Pending,
                    createdAt: now,
                    updatedAt: now
                };
                matches.push(match);
                matchStore.set(match.id, match);
                // If it's a bye round, auto-advance
                if (!match.player2Id) {
                    match.winnerId = match.player1Id;
                    match.status = tournament_entity_1.MatchStatus.Completed;
                    match.playedAt = now;
                    matchStore.set(match.id, match);
                }
            }
            // Pre-create subsequent round placeholder matches for elimination brackets
            let bracketCount = Math.ceil(shuffled.length / 2);
            while (bracketCount > 1 && currentRound < totalRounds) {
                currentRound++;
                const nextRoundMatches = Math.floor(bracketCount / 2);
                for (let i = 0; i < nextRoundMatches; i++) {
                    const match = {
                        id: `match-${(0, node_crypto_1.randomUUID)()}`,
                        tournamentId,
                        round: currentRound,
                        bracketPosition: i,
                        player1Id: '', // TBD
                        player2Id: undefined,
                        score1: 0,
                        score2: 0,
                        status: tournament_entity_1.MatchStatus.Pending,
                        createdAt: now,
                        updatedAt: now
                    };
                    matches.push(match);
                    matchStore.set(match.id, match);
                }
                bracketCount = nextRoundMatches;
            }
        }
        // Transition tournament to ongoing
        tournament.status = tournament_entity_1.TournamentStatus.Ongoing;
        tournament.updatedAt = now;
        tournamentStore.set(tournamentId, tournament);
        return matches;
    }
    recordMatchResult(matchId, score1, score2, tenantId) {
        const match = matchStore.get(matchId);
        if (!match)
            throw new Error(`Match not found: ${matchId}`);
        // Verify tournament tenant
        this.requireTournament(match.tournamentId, tenantId);
        if (match.status === tournament_entity_1.MatchStatus.Completed) {
            throw new Error('Match already completed');
        }
        const now = new Date().toISOString();
        match.score1 = score1;
        match.score2 = score2;
        match.winnerId = score1 > score2 ? match.player1Id : match.player2Id;
        match.status = tournament_entity_1.MatchStatus.Completed;
        match.playedAt = now;
        match.updatedAt = now;
        matchStore.set(matchId, match);
        // Update rankings
        this.updateRankingAfterMatch(match);
        // Check if tournament is complete
        this.checkTournamentCompletion(match.tournamentId);
        return match;
    }
    setDisputed(matchId, tenantId) {
        const match = matchStore.get(matchId);
        if (!match)
            throw new Error(`Match not found: ${matchId}`);
        this.requireTournament(match.tournamentId, tenantId);
        match.status = tournament_entity_1.MatchStatus.Disputed;
        match.updatedAt = new Date().toISOString();
        matchStore.set(matchId, match);
        return match;
    }
    getMatch(matchId, tenantId) {
        const match = matchStore.get(matchId);
        if (!match)
            return undefined;
        // Verify tenant ownership via tournament
        const tournament = tournamentStore.get(match.tournamentId);
        if (!tournament || tournament.tenantId !== tenantId)
            return undefined;
        return match;
    }
    listMatches(tournamentId, tenantId, filter) {
        this.requireTournament(tournamentId, tenantId);
        return Array.from(matchStore.values())
            .filter((m) => m.tournamentId === tournamentId)
            .filter((m) => (filter?.round ? m.round === filter.round : true))
            .filter((m) => (filter?.status ? m.status === filter.status : true))
            .sort((a, b) => a.round - b.round || a.bracketPosition - b.bracketPosition);
    }
    getUpcomingMatches(memberId) {
        return Array.from(matchStore.values())
            .filter((m) => m.status === tournament_entity_1.MatchStatus.Pending &&
            (m.player1Id === memberId || m.player2Id === memberId))
            .sort((a, b) => {
            if (a.scheduledAt && b.scheduledAt)
                return a.scheduledAt.localeCompare(b.scheduledAt);
            return a.createdAt.localeCompare(b.createdAt);
        });
    }
    getLiveMatches(storeId) {
        // Find tournaments for this store, then ongoing matches
        const storeTournamentIds = Array.from(tournamentStore.values())
            .filter((t) => t.storeId === storeId && t.status === tournament_entity_1.TournamentStatus.Ongoing)
            .map((t) => t.id);
        return Array.from(matchStore.values())
            .filter((m) => storeTournamentIds.includes(m.tournamentId) &&
            m.status === tournament_entity_1.MatchStatus.Ongoing)
            .sort((a, b) => a.round - b.round);
    }
    // ═══════════════════════════════════════════════════════════════════
    // Rankings
    // ═══════════════════════════════════════════════════════════════════
    getRankings(tournamentId, tenantId) {
        this.requireTournament(tournamentId, tenantId);
        return Array.from(rankingStore.values())
            .filter((r) => r.tournamentId === tournamentId)
            .sort((a, b) => b.points - a.points || b.wins - a.wins || a.losses - b.losses)
            .map((r, index) => ({ ...r, rank: index + 1 }));
    }
    updateRankingAfterMatch(match) {
        const winnerId = match.winnerId;
        const loserId = match.player1Id === winnerId ? match.player2Id : match.player1Id;
        if (winnerId) {
            this.updatePlayerRanking(match.tournamentId, winnerId, {
                points: 3,
                wins: 1,
                losses: 0,
                draws: 0
            });
        }
        if (loserId) {
            this.updatePlayerRanking(match.tournamentId, loserId, {
                points: 0,
                wins: 0,
                losses: 1,
                draws: 0
            });
        }
        // Handle draw (equal scores)
        if (!winnerId && match.score1 === match.score2) {
            this.updatePlayerRanking(match.tournamentId, match.player1Id, {
                points: 1,
                wins: 0,
                losses: 0,
                draws: 1
            });
            if (match.player2Id) {
                this.updatePlayerRanking(match.tournamentId, match.player2Id, {
                    points: 1,
                    wins: 0,
                    losses: 0,
                    draws: 1
                });
            }
        }
    }
    // ═══════════════════════════════════════════════════════════════════
    // Internals
    // ═══════════════════════════════════════════════════════════════════
    requireTournament(tournamentId, tenantId) {
        const tournament = tournamentStore.get(tournamentId);
        if (!tournament || tournament.tenantId !== tenantId) {
            throw new Error(`Tournament not found: ${tournamentId}`);
        }
        return tournament;
    }
    assertValidTournamentStatusTransition(from, to) {
        const validTransitions = {
            [tournament_entity_1.TournamentStatus.Draft]: [
                tournament_entity_1.TournamentStatus.Open,
                tournament_entity_1.TournamentStatus.Cancelled
            ],
            [tournament_entity_1.TournamentStatus.Open]: [
                tournament_entity_1.TournamentStatus.Ongoing,
                tournament_entity_1.TournamentStatus.Cancelled,
                tournament_entity_1.TournamentStatus.Draft
            ],
            [tournament_entity_1.TournamentStatus.Ongoing]: [
                tournament_entity_1.TournamentStatus.Completed,
                tournament_entity_1.TournamentStatus.Cancelled
            ],
            [tournament_entity_1.TournamentStatus.Completed]: [],
            [tournament_entity_1.TournamentStatus.Cancelled]: [tournament_entity_1.TournamentStatus.Draft]
        };
        if (!validTransitions[from].includes(to)) {
            throw new Error(`Invalid tournament status transition: ${from} → ${to}`);
        }
    }
    shuffleArray(array) {
        const result = [...array];
        for (let i = result.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [result[i], result[j]] = [result[j], result[i]];
        }
        return result;
    }
    updatePlayerRanking(tournamentId, memberId, delta) {
        let ranking = Array.from(rankingStore.values()).find((r) => r.tournamentId === tournamentId && r.memberId === memberId);
        if (!ranking) {
            ranking = {
                id: `ranking-${(0, node_crypto_1.randomUUID)()}`,
                tournamentId,
                memberId,
                rank: 0,
                points: 0,
                wins: 0,
                losses: 0,
                draws: 0,
                updatedAt: new Date().toISOString()
            };
        }
        ranking.points += delta.points;
        ranking.wins += delta.wins;
        ranking.losses += delta.losses;
        ranking.draws += delta.draws;
        ranking.updatedAt = new Date().toISOString();
        rankingStore.set(ranking.id, ranking);
    }
    checkTournamentCompletion(tournamentId) {
        const tournament = tournamentStore.get(tournamentId);
        if (!tournament || tournament.status !== tournament_entity_1.TournamentStatus.Ongoing)
            return;
        // For single/double elimination: check if final match is completed
        // For round robin: check if all matches are completed
        const tournamentMatches = Array.from(matchStore.values()).filter((m) => m.tournamentId === tournamentId);
        const allCompleted = tournamentMatches.every((m) => m.status === tournament_entity_1.MatchStatus.Completed);
        if (allCompleted && tournamentMatches.length > 0) {
            tournament.status = tournament_entity_1.TournamentStatus.Completed;
            tournament.updatedAt = new Date().toISOString();
            tournamentStore.set(tournamentId, tournament);
            // Finalize rankings
            const rankings = Array.from(rankingStore.values())
                .filter((r) => r.tournamentId === tournamentId)
                .sort((a, b) => b.points - a.points || b.wins - a.wins || a.losses - b.losses);
            rankings.forEach((r, index) => {
                r.rank = index + 1;
                rankingStore.set(r.id, r);
            });
        }
    }
    // ═══════════════════════════════════════════════════════════════════
    // Test helpers
    // ═══════════════════════════════════════════════════════════════════
    resetTournamentStoresForTests() {
        tournamentStore.clear();
        matchStore.clear();
        rankingStore.clear();
        teamRegistrationStore.clear();
    }
};
exports.TournamentService = TournamentService;
exports.TournamentService = TournamentService = __decorate([
    (0, common_1.Injectable)()
], TournamentService);
//# sourceMappingURL=tournament.service.js.map