"use strict";
/**
 * 🐜 自动: [tournament] [D] entity 测试
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = __importStar(require("node:test"));
const tournament_entity_1 = require("./tournament.entity");
(0, node_test_1.describe)('Tournament Entity Types', () => {
    (0, node_test_1.describe)('TournamentType', () => {
        (0, node_test_1.default)('should define all tournament types', () => {
            strict_1.default.equal(tournament_entity_1.TournamentType.SingleElimination, 'SINGLE_ELIMINATION');
            strict_1.default.equal(tournament_entity_1.TournamentType.DoubleElimination, 'DOUBLE_ELIMINATION');
            strict_1.default.equal(tournament_entity_1.TournamentType.RoundRobin, 'ROUND_ROBIN');
            strict_1.default.equal(tournament_entity_1.TournamentType.League, 'LEAGUE');
        });
        (0, node_test_1.default)('should have 4 types', () => {
            strict_1.default.equal(Object.keys(tournament_entity_1.TournamentType).length, 4);
        });
    });
    (0, node_test_1.describe)('TournamentStatus', () => {
        (0, node_test_1.default)('should define all statuses', () => {
            strict_1.default.equal(tournament_entity_1.TournamentStatus.Draft, 'DRAFT');
            strict_1.default.equal(tournament_entity_1.TournamentStatus.Open, 'OPEN');
            strict_1.default.equal(tournament_entity_1.TournamentStatus.Ongoing, 'ONGOING');
            strict_1.default.equal(tournament_entity_1.TournamentStatus.Completed, 'COMPLETED');
            strict_1.default.equal(tournament_entity_1.TournamentStatus.Cancelled, 'CANCELLED');
        });
        (0, node_test_1.default)('should have 5 statuses', () => {
            strict_1.default.equal(Object.keys(tournament_entity_1.TournamentStatus).length, 5);
        });
    });
    (0, node_test_1.describe)('MatchStatus', () => {
        (0, node_test_1.default)('should define all match statuses', () => {
            strict_1.default.equal(tournament_entity_1.MatchStatus.Pending, 'PENDING');
            strict_1.default.equal(tournament_entity_1.MatchStatus.Ongoing, 'ONGOING');
            strict_1.default.equal(tournament_entity_1.MatchStatus.Completed, 'COMPLETED');
            strict_1.default.equal(tournament_entity_1.MatchStatus.Disputed, 'DISPUTED');
        });
        (0, node_test_1.default)('should have 4 statuses', () => {
            strict_1.default.equal(Object.keys(tournament_entity_1.MatchStatus).length, 4);
        });
    });
    (0, node_test_1.describe)('TeamRegistrationStatus', () => {
        (0, node_test_1.default)('should define all team registration statuses', () => {
            strict_1.default.equal(tournament_entity_1.TeamRegistrationStatus.Pending, 'PENDING');
            strict_1.default.equal(tournament_entity_1.TeamRegistrationStatus.Approved, 'APPROVED');
            strict_1.default.equal(tournament_entity_1.TeamRegistrationStatus.Rejected, 'REJECTED');
        });
        (0, node_test_1.default)('should have 3 statuses', () => {
            strict_1.default.equal(Object.keys(tournament_entity_1.TeamRegistrationStatus).length, 3);
        });
    });
});
//# sourceMappingURL=tournament.entity.test.js.map