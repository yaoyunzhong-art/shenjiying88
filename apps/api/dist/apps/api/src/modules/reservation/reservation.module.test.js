"use strict";
/**
 * 🐜 自动: [reservation] [A] module.test 补全
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
(0, node_test_1.describe)('ReservationModule', () => {
    (0, node_test_1.default)('should be defined', () => {
        const { ReservationModule } = require('./reservation.module');
        const mod = new ReservationModule();
        strict_1.default.ok(mod instanceof ReservationModule);
    });
    (0, node_test_1.default)('should have correct module metadata', () => {
        const { ReservationModule } = require('./reservation.module');
        const { ReservationController } = require('./reservation.controller');
        const { ReservationService } = require('./reservation.service');
        const controllers = Reflect.getMetadata('controllers', ReservationModule);
        const providers = Reflect.getMetadata('providers', ReservationModule);
        const exports = Reflect.getMetadata('exports', ReservationModule);
        strict_1.default.ok(controllers);
        strict_1.default.ok(providers);
        strict_1.default.ok(exports);
        strict_1.default.ok(controllers.includes(ReservationController));
        strict_1.default.ok(providers.includes(ReservationService));
        strict_1.default.ok(exports.includes(ReservationService));
    });
});
//# sourceMappingURL=reservation.module.test.js.map