"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toBootstrapFoundationMetadata = toBootstrapFoundationMetadata;
exports.toRegionalLoginPolicyContract = toRegionalLoginPolicyContract;
function toBootstrapFoundationMetadata(dependency) {
    return {
        foundationDependencies: dependency?.dependsOn ?? [],
        foundationContracts: dependency?.handoffContracts ?? []
    };
}
function toRegionalLoginPolicyContract(defaultLoginPath, ssoEnabled) {
    return {
        defaultLoginPath,
        ssoEnabled
    };
}
//# sourceMappingURL=bootstrap.contract.js.map