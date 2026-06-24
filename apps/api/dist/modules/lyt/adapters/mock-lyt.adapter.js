"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MockLytAdapter = void 0;
const common_1 = require("@nestjs/common");
let MockLytAdapter = class MockLytAdapter {
    async getMember(memberId) {
        return { memberId, nickname: 'Mock Member', levelName: 'SVIP Seed' };
    }
    async createOrder(payload) {
        const totalAmount = payload.items.reduce((sum, item) => sum + item.quantity * item.price, 0);
        return { orderId: `mock-${Date.now()}`, totalAmount, status: 'CREATED' };
    }
    async applyDiscount(orderId, couponCode) {
        return { orderId, couponCode };
    }
    async syncGateEvent(storeId, passCode) {
        void passCode;
        return { accepted: true, storeId };
    }
    async getDeviceStatus(deviceId) {
        return { deviceId, status: 'ONLINE' };
    }
};
exports.MockLytAdapter = MockLytAdapter;
exports.MockLytAdapter = MockLytAdapter = __decorate([
    (0, common_1.Injectable)()
], MockLytAdapter);
//# sourceMappingURL=mock-lyt.adapter.js.map