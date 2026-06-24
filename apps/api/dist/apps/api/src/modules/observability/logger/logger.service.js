"use strict";
/**
 * Structured Logger Service (pino)
 *
 * 替代 console.log/warn,提供:
 *   - JSON 格式化输出 (生产) / pino-pretty (开发)
 *   - 子 logger (child bindings) 支持 traceId / requestId / tenantId 上下文
 *   - 级别可调 (LOG_LEVEL env: trace|debug|info|warn|error|fatal)
 *   - 高性能 (pino 同步路径, ~5x 比 console 快)
 *
 * 用法:
 *   constructor(@Inject(LoggerService) private readonly logger: LoggerService) {}
 *   this.logger.info({ orderId, tenantId }, 'order created')
 *   this.logger.child({ tenantId: 't-001' }).warn('payment timeout')
 */
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var LoggerService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoggerService = exports.LOGGER_DESTINATION = exports.LOGGER_CONFIG = void 0;
const common_1 = require("@nestjs/common");
const pino_1 = __importDefault(require("pino"));
exports.LOGGER_CONFIG = Symbol.for('m5.logger.config');
const DEFAULT_CONFIG = {
    level: process.env.LOG_LEVEL ?? 'info',
    pretty: process.env.NODE_ENV !== 'production',
    redactPaths: [
        'req.headers.authorization',
        'req.headers.cookie',
        '*.password',
        '*.secret',
        '*.token',
    ],
    serviceName: process.env.SERVICE_NAME ?? 'm5-api',
};
/** 测试用:注入自定义 stream (避免污染 stdout) */
exports.LOGGER_DESTINATION = Symbol.for('m5.logger.destination');
let LoggerService = LoggerService_1 = class LoggerService {
    root;
    config;
    constructor(config, destination) {
        this.config = { ...DEFAULT_CONFIG, ...config };
        const redact = this.config.redactPaths.length > 0
            ? { paths: this.config.redactPaths, censor: '[REDACTED]' }
            : undefined;
        this.root = (0, pino_1.default)({
            level: this.config.level,
            base: { service: this.config.serviceName, env: process.env.NODE_ENV ?? 'development' },
            timestamp: pino_1.default.stdTimeFunctions.isoTime,
            redact,
            transport: this.config.pretty && !destination
                ? {
                    target: 'pino-pretty',
                    options: {
                        colorize: true,
                        translateTime: 'SYS:standard',
                        ignore: 'pid,hostname,service,env',
                    },
                }
                : undefined,
        }, destination);
    }
    /**
     * 获取带上下文的子 logger (traceId / requestId / tenantId)
     * 同一子 logger 的所有日志都自动带上 bindings
     */
    child(bindings) {
        const child = Object.create(LoggerService_1.prototype);
        // 直接绑定到 pino 的 child logger,避免再创建 wrapper
        child.root = this.root.child(bindings);
        child.config = this.config;
        return child;
    }
    info(obj, msg) {
        this.root.info(obj, msg);
    }
    warn(obj, msg) {
        this.root.warn(obj, msg);
    }
    error(obj, msg) {
        this.root.error(obj, msg);
    }
    debug(obj, msg) {
        this.root.debug(obj, msg);
    }
    trace(obj, msg) {
        this.root.trace(obj, msg);
    }
    fatal(obj, msg) {
        this.root.fatal(obj, msg);
    }
    /** 测试用:获取底层 pino logger */
    raw() {
        return this.root;
    }
};
exports.LoggerService = LoggerService;
exports.LoggerService = LoggerService = LoggerService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Optional)()),
    __param(0, (0, common_1.Inject)(exports.LOGGER_CONFIG)),
    __param(1, (0, common_1.Optional)()),
    __param(1, (0, common_1.Inject)(exports.LOGGER_DESTINATION)),
    __metadata("design:paramtypes", [Object, Object])
], LoggerService);
//# sourceMappingURL=logger.service.js.map