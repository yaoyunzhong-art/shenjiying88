"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SandboxLytAdapter = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const vendor_lyt_contract_1 = require("../vendor-lyt.contract");
const lyt_adapter_config_1 = require("../lyt-adapter.config");
const http_lyt_adapter_base_1 = require("./http-lyt.adapter.base");
let SandboxLytAdapter = class SandboxLytAdapter extends http_lyt_adapter_base_1.HttpLytAdapterBase {
    constructor(configService) {
        const config = (0, lyt_adapter_config_1.resolveLytHttpAdapterConfig)('sandbox', configService);
        super({
            adapterName: 'SandboxLytAdapter',
            adapterMode: 'sandbox',
            baseUrl: config.baseUrl,
            signingSecret: config.signingSecret,
            timeoutMs: config.timeoutMs,
            maxRetries: config.maxRetries,
            errorCodeMap: vendor_lyt_contract_1.LYT_VENDOR_ERROR_CODE_MAP
        });
    }
    async getMember(memberId) {
        const payload = await this.request(`/members/${memberId}`);
        return (0, vendor_lyt_contract_1.toLytMemberProfileFromVendor)(payload);
    }
    async createOrder(payload) {
        const result = await this.request('/orders', {
            method: 'POST',
            body: JSON.stringify((0, vendor_lyt_contract_1.toVendorCreateOrderPayload)(payload))
        });
        return (0, vendor_lyt_contract_1.toLytOrderResultFromVendor)(result);
    }
    async applyDiscount(orderId, couponCode) {
        const result = await this.request(`/orders/${orderId}/discounts`, {
            method: 'POST',
            body: JSON.stringify((0, vendor_lyt_contract_1.toVendorDiscountApplyPayload)(couponCode))
        });
        return (0, vendor_lyt_contract_1.toDiscountResultFromVendor)(result);
    }
    async syncGateEvent(storeId, passCode) {
        const result = await this.request(`/stores/${storeId}/gate-events`, {
            method: 'POST',
            body: JSON.stringify((0, vendor_lyt_contract_1.toVendorGateEventRequestPayload)(passCode))
        });
        return (0, vendor_lyt_contract_1.toGateEventResultFromVendor)(result);
    }
    async getDeviceStatus(deviceId) {
        const payload = await this.request(`/devices/${deviceId}/status`);
        return (0, vendor_lyt_contract_1.toDeviceStatusFromVendor)(payload);
    }
};
exports.SandboxLytAdapter = SandboxLytAdapter;
exports.SandboxLytAdapter = SandboxLytAdapter = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], SandboxLytAdapter);
//# sourceMappingURL=sandbox-lyt.adapter.js.map