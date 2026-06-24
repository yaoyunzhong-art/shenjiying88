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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HealthService = void 0;
const promises_1 = require("node:fs/promises");
const node_net_1 = require("node:net");
const node_os_1 = __importDefault(require("node:os"));
const domain_1 = require("@m5/domain");
const common_1 = require("@nestjs/common");
const health_entity_1 = require("./health.entity");
const lyt_service_1 = require("../lyt/lyt.service");
const prisma_service_1 = require("../../prisma/prisma.service");
/** 服务启动时间戳 (模块级别) */
const BOOT_TIME_MS = Date.now();
const REDIS_PROBE_TIMEOUT_MS = 1500;
let HealthService = class HealthService {
    lytService;
    prismaService;
    constructor(lytService, prismaService) {
        this.lytService = lytService;
        this.prismaService = prismaService;
    }
    /**
     * 执行完整健康检查
     * 返回所有依赖组件的状态
     */
    async check(context) {
        const verbose = context?.verbose ?? false;
        const components = await this.collectComponentHealths(verbose);
        const uptimeSeconds = Math.floor((Date.now() - BOOT_TIME_MS) / 1000);
        const sampleMember = verbose ? await this.getSampleMember() : undefined;
        return (0, health_entity_1.toHealthCheckResult)(components, {
            uptimeSeconds,
            version: this.getVersion(),
            lytMode: this.getLytMode(context),
            sampleMember
        });
    }
    /**
     * 快速连通性检查 — 仅返回 OK / DEGRADED
     */
    async ping() {
        return {
            alive: true,
            timestamp: new Date().toISOString()
        };
    }
    /**
     * 检查指定组件是否可用
     */
    async checkComponent(name) {
        const start = Date.now();
        try {
            const detail = await this.probeComponent(name);
            return {
                name,
                status: health_entity_1.HealthStatus.Ok,
                latencyMs: Date.now() - start,
                detail
            };
        }
        catch (err) {
            return {
                name,
                status: health_entity_1.HealthStatus.Unavailable,
                latencyMs: Date.now() - start,
                detail: {
                    error: err instanceof Error ? err.message : 'Unknown error'
                }
            };
        }
    }
    /**
     * 收集所有依赖组件的健康状态
     */
    async collectComponentHealths(verbose) {
        const names = verbose
            ? ['database', 'redis', 'lyt-adapter', 'memory', 'disk']
            : ['database', 'lyt-adapter'];
        const results = await Promise.allSettled(names.map((name) => this.checkComponent(name)));
        return results.map((r, idx) => r.status === 'fulfilled'
            ? r.value
            : {
                name: names[idx],
                status: health_entity_1.HealthStatus.Unavailable,
                latencyMs: 0,
                detail: { error: 'unexpected component check failure' }
            });
    }
    /**
     * 探测单个组件
     */
    async probeComponent(name) {
        switch (name) {
            case 'database':
                return this.probeDatabase();
            case 'redis':
                return this.probeRedis();
            case 'lyt-adapter':
                return this.probeLytAdapter();
            case 'memory':
                return this.probeMemory();
            case 'disk':
                return this.probeDisk();
            default:
                throw new Error(`Unknown component: ${name}`);
        }
    }
    async probeDatabase() {
        await this.prismaService.$queryRaw `SELECT 1`;
        return {
            connected: true,
            provider: 'prisma',
            dialect: 'postgresql'
        };
    }
    async probeRedis() {
        const host = process.env.REDIS_HOST?.trim() || 'localhost';
        const port = parsePort(process.env.REDIS_PORT, 6379);
        const response = await this.pingRedis(host, port);
        return {
            connected: response === 'PONG',
            host,
            port,
            response
        };
    }
    async probeLytAdapter() {
        const bootstrap = this.lytService.getBootstrap();
        return {
            mode: this.getLytMode(),
            adapter: bootstrap.adapter,
            foundationDependencies: bootstrap.foundationDependencies,
            foundationContracts: bootstrap.foundationContracts,
            available: true
        };
    }
    async probeMemory() {
        const totalBytes = node_os_1.default.totalmem();
        const freeBytes = node_os_1.default.freemem();
        const usedBytes = totalBytes - freeBytes;
        return {
            totalMB: bytesToMb(totalBytes),
            usedMB: bytesToMb(usedBytes),
            freeMB: bytesToMb(freeBytes),
            usagePercent: usagePercent(usedBytes, totalBytes)
        };
    }
    async probeDisk() {
        const stats = await (0, promises_1.statfs)(process.cwd());
        const totalBytes = stats.bsize * stats.blocks;
        const freeBytes = stats.bsize * stats.bfree;
        const usedBytes = totalBytes - freeBytes;
        return {
            totalGB: bytesToGb(totalBytes),
            usedGB: bytesToGb(usedBytes),
            freeGB: bytesToGb(freeBytes),
            usagePercent: usagePercent(usedBytes, totalBytes)
        };
    }
    /**
     * 获取当前版本号
     */
    getVersion() {
        try {
            // eslint-disable-next-line @typescript-eslint/no-require-imports
            const pkg = require('../../../../package.json');
            return pkg.version ?? '0.0.0';
        }
        catch {
            return '0.0.0';
        }
    }
    getLytMode(context) {
        if (context?.scope?.scopeType === domain_1.FoundationScopeType.Platform) {
            return 'platform-mock';
        }
        return 'mock';
    }
    async getSampleMember() {
        try {
            return await this.lytService.getAdapter().getMember('seed-member-001');
        }
        catch {
            return null;
        }
    }
    async pingRedis(host, port) {
        return new Promise((resolve, reject) => {
            const socket = this.createSocket();
            let settled = false;
            const finish = (callback) => {
                if (settled) {
                    return;
                }
                settled = true;
                clearTimeout(timeout);
                socket.removeAllListeners();
                socket.destroy();
                callback();
            };
            const timeout = setTimeout(() => {
                finish(() => reject(new Error(`Redis probe timeout after ${REDIS_PROBE_TIMEOUT_MS}ms`)));
            }, REDIS_PROBE_TIMEOUT_MS);
            socket.once('error', (error) => {
                finish(() => reject(error));
            });
            socket.once('data', (chunk) => {
                const payload = chunk.toString('utf8').trim();
                const response = payload.startsWith('+') ? payload.slice(1) : payload;
                if (response !== 'PONG') {
                    finish(() => reject(new Error(`Unexpected Redis probe response: ${payload}`)));
                    return;
                }
                finish(() => resolve(response));
            });
            socket.connect(port, host, () => {
                socket.write('*1\r\n$4\r\nPING\r\n');
            });
        });
    }
    createSocket() {
        return new node_net_1.Socket();
    }
};
exports.HealthService = HealthService;
exports.HealthService = HealthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [lyt_service_1.LytService,
        prisma_service_1.PrismaService])
], HealthService);
function parsePort(value, fallback) {
    const parsed = Number(value);
    return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}
function bytesToMb(bytes) {
    return roundTo(bytes / 1024 / 1024, 2);
}
function bytesToGb(bytes) {
    return roundTo(bytes / 1024 / 1024 / 1024, 2);
}
function usagePercent(used, total) {
    if (total <= 0) {
        return 0;
    }
    return roundTo((used / total) * 100, 2);
}
function roundTo(value, precision) {
    const factor = 10 ** precision;
    return Math.round(value * factor) / factor;
}
//# sourceMappingURL=health.service.js.map