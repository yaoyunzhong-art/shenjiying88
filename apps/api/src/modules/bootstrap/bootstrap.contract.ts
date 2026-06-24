import type {
  BootstrapFoundationMetadataContract,
  FoundationModuleKey,
  RegionalLoginPolicyContract
} from '@m5/types'

export function toBootstrapFoundationMetadata(
  dependency:
    | {
        dependsOn?: FoundationModuleKey[]
        handoffContracts?: string[]
      }
    | null
    | undefined
): BootstrapFoundationMetadataContract {
  return {
    foundationDependencies: dependency?.dependsOn ?? [],
    foundationContracts: dependency?.handoffContracts ?? []
  }
}

export function toRegionalLoginPolicyContract(
  defaultLoginPath: string,
  ssoEnabled: boolean
): RegionalLoginPolicyContract {
  return {
    defaultLoginPath,
    ssoEnabled
  }
}
