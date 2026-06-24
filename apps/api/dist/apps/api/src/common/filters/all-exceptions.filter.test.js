"use strict";
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
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = require("node:test");
const all_exceptions_filter_1 = require("./all-exceptions.filter");
(0, node_test_1.describe)('AllExceptionsFilter', () => {
    const mockRecordRequestFailure = node_test_1.mock.fn();
    const mockRequestGovernanceService = {
        recordRequestFailure: mockRecordRequestFailure,
    };
    let filter;
    (0, node_test_1.beforeEach)(() => {
        mockRecordRequestFailure.mock.resetCalls();
        filter = new all_exceptions_filter_1.AllExceptionsFilter(mockRequestGovernanceService);
    });
    function createHttpHost(opts) {
        const response = {
            status: node_test_1.mock.fn(() => response),
            json: node_test_1.mock.fn(() => response),
        };
        return {
            getType: () => 'http',
            switchToHttp: () => ({
                getRequest: () => opts?.request ?? {},
                getResponse: () => response,
            }),
            _response: response,
        };
    }
    (0, node_test_1.test)('should ignore non-HTTP hosts', () => {
        const host = { getType: () => 'rpc' };
        strict_1.default.doesNotThrow(() => filter.catch(new Error('boom'), host));
        strict_1.default.equal(mockRecordRequestFailure.mock.callCount(), 0);
    });
    (0, node_test_1.test)('should return 500 and error message for plain Error', () => {
        const host = createHttpHost();
        filter.catch(new Error('boom'), host);
        const res = host._response;
        strict_1.default.equal(res.status.mock.calls[0]?.arguments[0], 500);
        const jsonArg = res.json.mock.calls[0]?.arguments[0];
        strict_1.default.equal(jsonArg.success, false);
        strict_1.default.equal(jsonArg.message, 'boom');
        strict_1.default.equal(jsonArg.data, null);
    });
    (0, node_test_1.test)('should return the HttpException status and message', async () => {
        const { HttpException } = await Promise.resolve().then(() => __importStar(require('@nestjs/common')));
        const host = createHttpHost();
        filter.catch(new HttpException('not found', 404), host);
        const res = host._response;
        strict_1.default.equal(res.status.mock.calls[0]?.arguments[0], 404);
        const jsonArg = res.json.mock.calls[0]?.arguments[0];
        strict_1.default.equal(jsonArg.success, false);
        strict_1.default.equal(jsonArg.message, 'not found');
    });
    (0, node_test_1.test)('should return 500 for non-Error exceptions', () => {
        const host = createHttpHost();
        filter.catch('string exception', host);
        const res = host._response;
        strict_1.default.equal(res.status.mock.calls[0]?.arguments[0], 500);
        const jsonArg = res.json.mock.calls[0]?.arguments[0];
        strict_1.default.equal(jsonArg.message, 'Internal server error');
    });
    (0, node_test_1.test)('should call recordRequestFailure with correct args', () => {
        const host = createHttpHost({ request: { method: 'GET', url: '/test' } });
        filter.catch(new Error('boom'), host);
        strict_1.default.equal(mockRecordRequestFailure.mock.callCount(), 1);
        const args = mockRecordRequestFailure.mock.calls[0]?.arguments;
        strict_1.default.equal(args[0], host.switchToHttp().getRequest());
        strict_1.default.equal(args[1], 500);
        strict_1.default.equal(args[2], 'boom');
        strict_1.default.equal(args[3], 'Error');
    });
    (0, node_test_1.test)('should include a timestamp in the response body', () => {
        const before = new Date().toISOString();
        const host = createHttpHost();
        filter.catch(new Error('boom'), host);
        const res = host._response;
        const call = res.json.mock.calls[0]?.arguments[0];
        strict_1.default.ok(typeof call.timestamp === 'string');
        strict_1.default.ok(new Date(call.timestamp).getTime() >= new Date(before).getTime());
    });
});
//# sourceMappingURL=all-exceptions.filter.test.js.map