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
exports.LytAdapterRegistry = void 0;
const common_1 = require("@nestjs/common");
const mock_lyt_adapter_1 = require("./adapters/mock-lyt.adapter");
const real_lyt_adapter_1 = require("./adapters/real-lyt.adapter");
const sandbox_lyt_adapter_1 = require("./adapters/sandbox-lyt.adapter");
let LytAdapterRegistry = class LytAdapterRegistry {
    mockAdapter;
    sandboxAdapter;
    realAdapter;
    constructor(mockAdapter, sandboxAdapter, realAdapter) {
        this.mockAdapter = mockAdapter;
        this.sandboxAdapter = sandboxAdapter;
        this.realAdapter = realAdapter;
    }
    listAvailableAdapters() {
        return [this.mockAdapter, this.sandboxAdapter, this.realAdapter].map((adapter) => ({
            adapterName: adapter.adapterName,
            adapterMode: adapter.adapterMode
        }));
    }
    resolveAdapterSelection(connection) {
        if (connection.source === 'fallback' ||
            connection.authMode === 'mock-token' ||
            connection.endpoint.startsWith('mock://')) {
            return {
                adapterName: this.mockAdapter.adapterName,
                adapterMode: this.mockAdapter.adapterMode,
                reason: 'connection uses mock endpoint or fallback configuration'
            };
        }
        if (connection.authMode.includes('sandbox') ||
            connection.endpoint.includes('sandbox') ||
            connection.endpoint.includes('staging')) {
            return {
                adapterName: this.sandboxAdapter.adapterName,
                adapterMode: this.sandboxAdapter.adapterMode,
                reason: 'connection is marked as sandbox/staging for rehearsal'
            };
        }
        return {
            adapterName: this.realAdapter.adapterName,
            adapterMode: this.realAdapter.adapterMode,
            reason: 'connection points to non-mock production-style endpoint'
        };
    }
    getAdapterForConnection(connection) {
        const selection = this.resolveAdapterSelection(connection);
        switch (selection.adapterMode) {
            case 'sandbox':
                return this.sandboxAdapter;
            case 'real':
                return this.realAdapter;
            case 'mock':
            default:
                return this.mockAdapter;
        }
    }
    getDefaultAdapter() {
        return this.mockAdapter;
    }
};
exports.LytAdapterRegistry = LytAdapterRegistry;
exports.LytAdapterRegistry = LytAdapterRegistry = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [mock_lyt_adapter_1.MockLytAdapter,
        sandbox_lyt_adapter_1.SandboxLytAdapter,
        real_lyt_adapter_1.RealLytAdapter])
], LytAdapterRegistry);
//# sourceMappingURL=lyt-adapter.registry.js.map