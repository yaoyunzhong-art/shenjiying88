"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toTournamentContract = toTournamentContract;
exports.toMatchContract = toMatchContract;
exports.toRankingContract = toRankingContract;
exports.toTeamRegistrationContract = toTeamRegistrationContract;
exports.isTournamentOpenForRegistration = isTournamentOpenForRegistration;
exports.hasAvailableSlots = hasAvailableSlots;
exports.isDraw = isDraw;
/**
 * Convert internal Tournament to cross-module contract.
 */
function toTournamentContract(tournament) {
    return {
        id: tournament.id,
        tenantId: tournament.tenantId,
        brandId: tournament.brandId,
        storeId: tournament.storeId,
        name: tournament.name,
        description: tournament.description,
        type: tournament.type,
        gameName: tournament.gameName,
        startDate: tournament.startDate,
        endDate: tournament.endDate,
        maxParticipants: tournament.maxParticipants,
        currentParticipants: tournament.currentParticipants,
        status: tournament.status,
        bannerImage: tournament.bannerImage,
        createdAt: tournament.createdAt,
        updatedAt: tournament.updatedAt,
    };
}
/**
 * Convert internal Match to cross-module contract.
 */
function toMatchContract(match) {
    return {
        id: match.id,
        tournamentId: match.tournamentId,
        round: match.round,
        bracketPosition: match.bracketPosition,
        player1Id: match.player1Id,
        player2Id: match.player2Id,
        winnerId: match.winnerId,
        score1: match.score1,
        score2: match.score2,
        status: match.status,
        scheduledAt: match.scheduledAt,
        playedAt: match.playedAt,
        createdAt: match.createdAt,
    };
}
/**
 * Convert internal Ranking to cross-module contract.
 */
function toRankingContract(ranking) {
    return {
        tournamentId: ranking.tournamentId,
        memberId: ranking.memberId,
        rank: ranking.rank,
        points: ranking.points,
        wins: ranking.wins,
        losses: ranking.losses,
        draws: ranking.draws,
    };
}
/**
 * Convert internal TeamRegistration to cross-module contract.
 */
function toTeamRegistrationContract(reg) {
    return {
        id: reg.id,
        tournamentId: reg.tournamentId,
        teamName: reg.teamName,
        captainId: reg.captainId,
        memberCount: reg.memberIds.length,
        status: reg.status,
        createdAt: reg.createdAt,
    };
}
/**
 * Check if a tournament is currently accepting registrations.
 */
function isTournamentOpenForRegistration(status) {
    return status === 'OPEN';
}
/**
 * Check if a tournament has available slots.
 */
function hasAvailableSlots(currentParticipants, maxParticipants) {
    return currentParticipants < maxParticipants;
}
/**
 * Determine if a match result indicates a draw.
 */
function isDraw(score1, score2) {
    return score1 === score2;
}
//# sourceMappingURL=tournament.contract.js.map