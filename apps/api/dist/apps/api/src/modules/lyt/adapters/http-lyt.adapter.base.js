"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HttpLytAdapterBase = exports.LytAdapterHttpError = void 0;
const node_crypto_1 = require("node:crypto");
class LytAdapterHttpError extends Error {
    adapterName;
    adapterMode;
    path;
    code;
    status;
    requestId;
    retryable;
    constructor(input) {
        super(input.message, input.cause ? { cause: input.cause } : undefined);
        this.name = 'LytAdapterHttpError';
        this.adapterName = input.adapterName;
        this.adapterMode = input.adapterMode;
        this.path = input.path;
        this.code = input.code;
        this.requestId = input.requestId;
        this.retryable = input.retryable;
        this.status = input.status;
    }
}
exports.LytAdapterHttpError = LytAdapterHttpError;
class HttpLytAdapterBase {
    adapterName;
    adapterMode;
    baseUrl;
    signingSecret;
    timeoutMs;
    maxRetries;
    errorCodeMap;
    constructor(config) {
        this.adapterName = config.adapterName;
        this.adapterMode = config.adapterMode;
        this.baseUrl = config.baseUrl;
        this.signingSecret = config.signingSecret;
        this.timeoutMs = config.timeoutMs;
        this.maxRetries = config.maxRetries;
        this.errorCodeMap = config.errorCodeMap ?? {};
    }
    async request(path, init) {
        const method = init?.method ?? 'GET';
        const body = init?.body;
        const requestId = (0, node_crypto_1.randomUUID)();
        let lastError = null;
        for (let attempt = 0; attempt <= this.maxRetries; attempt += 1) {
            const timestamp = new Date().toISOString();
            const signature = this.signRequest(method, path, timestamp, body);
            try {
                const response = await fetch(`${this.baseUrl}${path}`, {
                    ...init,
                    signal: AbortSignal.timeout(this.timeoutMs),
                    headers: {
                        'content-type': 'application/json',
                        'x-lyt-mode': this.adapterMode,
                        'x-lyt-request-id': requestId,
                        'x-lyt-request-timestamp': timestamp,
                        'x-lyt-signature': signature,
                        'x-lyt-retry-attempt': String(attempt),
                        ...(init?.headers ?? {})
                    }
                });
                if (!response.ok) {
                    const payload = await this.parseResponsePayload(response);
                    const retryable = this.isRetryableStatus(response.status);
                    lastError = new LytAdapterHttpError({
                        adapterName: this.adapterName,
                        adapterMode: this.adapterMode,
                        path,
                        code: this.extractErrorCode(payload, response.status),
                        requestId,
                        retryable,
                        status: response.status,
                        message: this.extractErrorMessage(payload, response.status)
                    });
                    if (retryable && attempt < this.maxRetries) {
                        continue;
                    }
                    throw lastError;
                }
                return this.parseResponsePayload(response);
            }
            catch (error) {
                if (error instanceof LytAdapterHttpError) {
                    throw error;
                }
                const mappedError = new LytAdapterHttpError({
                    adapterName: this.adapterName,
                    adapterMode: this.adapterMode,
                    path,
                    code: this.resolveTransportErrorCode(error),
                    requestId,
                    retryable: true,
                    message: this.resolveTransportErrorMessage(error),
                    cause: error
                });
                lastError = mappedError;
                if (attempt < this.maxRetries) {
                    continue;
                }
            }
        }
        throw (lastError ??
            new LytAdapterHttpError({
                adapterName: this.adapterName,
                adapterMode: this.adapterMode,
                path,
                code: 'LYT_UNKNOWN',
                requestId: (0, node_crypto_1.randomUUID)(),
                retryable: false,
                message: `${this.adapterName} request exhausted without response`
            }));
    }
    signRequest(method, path, timestamp, body) {
        return (0, node_crypto_1.createHash)('sha256')
            .update([this.adapterMode, method.toUpperCase(), path, timestamp, body ?? '', this.signingSecret].join(':'))
            .digest('hex');
    }
    isRetryableStatus(status) {
        return status === 408 || status === 429 || status >= 500;
    }
    async parseResponsePayload(response) {
        const text = await response.text();
        if (!text) {
            return {};
        }
        try {
            return JSON.parse(text);
        }
        catch {
            return { message: text };
        }
    }
    extractErrorCode(payload, status) {
        if (payload && typeof payload === 'object' && 'code' in payload && typeof payload.code === 'string') {
            return this.errorCodeMap[payload.code] ?? payload.code;
        }
        return `LYT_HTTP_${status}`;
    }
    extractErrorMessage(payload, status) {
        if (payload && typeof payload === 'object') {
            if ('message' in payload && typeof payload.message === 'string') {
                return payload.message;
            }
            if ('error' in payload && typeof payload.error === 'string') {
                return payload.error;
            }
        }
        return `${this.adapterName} request failed with status ${status}`;
    }
    resolveTransportErrorCode(error) {
        if (error instanceof Error && error.name === 'TimeoutError') {
            return 'LYT_TIMEOUT';
        }
        return 'LYT_TRANSPORT_ERROR';
    }
    resolveTransportErrorMessage(error) {
        if (error instanceof Error && error.name === 'TimeoutError') {
            return `${this.adapterName} request timed out`;
        }
        if (error instanceof Error && error.message) {
            return error.message;
        }
        return `${this.adapterName} request failed before receiving response`;
    }
}
exports.HttpLytAdapterBase = HttpLytAdapterBase;
//# sourceMappingURL=http-lyt.adapter.base.js.map