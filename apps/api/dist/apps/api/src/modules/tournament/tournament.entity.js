"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TeamRegistrationStatus = exports.MatchStatus = exports.TournamentStatus = exports.TournamentType = void 0;
// ── Tournament ──
var TournamentType;
(function (TournamentType) {
    TournamentType["SingleElimination"] = "SINGLE_ELIMINATION";
    TournamentType["DoubleElimination"] = "DOUBLE_ELIMINATION";
    TournamentType["RoundRobin"] = "ROUND_ROBIN";
    TournamentType["League"] = "LEAGUE";
})(TournamentType || (exports.TournamentType = TournamentType = {}));
var TournamentStatus;
(function (TournamentStatus) {
    TournamentStatus["Draft"] = "DRAFT";
    TournamentStatus["Open"] = "OPEN";
    TournamentStatus["Ongoing"] = "ONGOING";
    TournamentStatus["Completed"] = "COMPLETED";
    TournamentStatus["Cancelled"] = "CANCELLED";
})(TournamentStatus || (exports.TournamentStatus = TournamentStatus = {}));
// ── Match ──
var MatchStatus;
(function (MatchStatus) {
    MatchStatus["Pending"] = "PENDING";
    MatchStatus["Ongoing"] = "ONGOING";
    MatchStatus["Completed"] = "COMPLETED";
    MatchStatus["Disputed"] = "DISPUTED";
})(MatchStatus || (exports.MatchStatus = MatchStatus = {}));
// ── TeamRegistration ──
var TeamRegistrationStatus;
(function (TeamRegistrationStatus) {
    TeamRegistrationStatus["Pending"] = "PENDING";
    TeamRegistrationStatus["Approved"] = "APPROVED";
    TeamRegistrationStatus["Rejected"] = "REJECTED";
})(TeamRegistrationStatus || (exports.TeamRegistrationStatus = TeamRegistrationStatus = {}));
//# sourceMappingURL=tournament.entity.js.map