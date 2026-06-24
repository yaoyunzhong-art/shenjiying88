"use strict";
/**
 * 🦞 跨模块 E2E 验证 — 实体定义
 *
 * 跨模块验证关心的实体不是数据库持久化对象，
 * 而是各模块间流转的数据结构和契约快照。
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChainStatus = void 0;
exports.toValidationSummary = toValidationSummary;
exports.isAllVerified = isAllVerified;
exports.hasBrokenChain = hasBrokenChain;
/**
 * 跨模块链路状态枚举
 */
var ChainStatus;
(function (ChainStatus) {
    ChainStatus["Defined"] = "defined";
    ChainStatus["Validating"] = "validating";
    ChainStatus["Verified"] = "verified";
    ChainStatus["Broken"] = "broken";
})(ChainStatus || (exports.ChainStatus = ChainStatus = {}));
/**
 * 从链路列表构造验证摘要
 */
function toValidationSummary(chains) {
    const summary = { total: chains.length, defined: 0, validating: 0, verified: 0, broken: 0 };
    for (const chain of chains) {
        switch (chain.status) {
            case ChainStatus.Defined:
                summary.defined++;
                break;
            case ChainStatus.Validating:
                summary.validating++;
                break;
            case ChainStatus.Verified:
                summary.verified++;
                break;
            case ChainStatus.Broken:
                summary.broken++;
                break;
        }
    }
    return summary;
}
/**
 * 判断链路是否全部验证通过
 */
function isAllVerified(chains) {
    return chains.length > 0 && chains.every((c) => c.status === ChainStatus.Verified);
}
/**
 * 判断是否存在断开的链路
 */
function hasBrokenChain(chains) {
    return chains.some((c) => c.status === ChainStatus.Broken);
}
//# sourceMappingURL=cross-module.entity.js.map