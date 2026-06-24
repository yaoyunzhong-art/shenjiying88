import type { BootstrapFoundationMetadataContract, FoundationModuleKey, RegionalLoginPolicyContract } from '@m5/types';
export declare function toBootstrapFoundationMetadata(dependency: {
    dependsOn?: FoundationModuleKey[];
    handoffContracts?: string[];
} | null | undefined): BootstrapFoundationMetadataContract;
export declare function toRegionalLoginPolicyContract(defaultLoginPath: string, ssoEnabled: boolean): RegionalLoginPolicyContract;
//# sourceMappingURL=bootstrap.contract.d.ts.map