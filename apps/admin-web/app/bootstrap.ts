import {
  ApiClient,
  createFoundationBootstrapWiringMeta,
  createFoundationGovernanceReadModelLoader,
  getDefaultApiBaseUrl,
  loadFoundationConsumerDescriptor,
  type FoundationGovernanceReadModel
} from '@m5/sdk';
import {
  foundationSupportedClients,
  getFoundationAppBootstrapWiring,
  type AppBootstrapWiring,
  type FoundationConsumerDescriptor,
  type RoleWorkbenchContract,
  type TenantContextContract,
  type WorkbenchBootstrapResponse
} from '@m5/types';
import { fallbackWorkbenchConsumerDescriptor, fallbackWorkbenchMap, fallbackRoleWorkbenches } from './workbench-data';

export const adminWebBootstrap = getFoundationAppBootstrapWiring('admin-web');

const fallbackTenantContext: TenantContextContract = {
  tenantId: 'tenant-demo',
  brandId: 'brand-demo',
  storeId: 'store-001',
  marketCode: 'cn-mainland'
};

export interface AdminWorkbenchConsumerSnapshot {
  deliveryMode: 'api' | 'fallback';
  wiring: AppBootstrapWiring;
  consumerDescriptor: FoundationConsumerDescriptor;
  workbenches: RoleWorkbenchContract[];
  tenantContext: TenantContextContract;
  supportedClients: readonly string[];
  foundationDependencies: string[];
  foundationContracts: string[];
  scope: {
    resolver: string;
    revalidateOn: string[];
    mismatchStrategy: string;
  };
  degradation: {
    featureFlagFallback: string;
    desensitizationMode: string;
    cacheableCapabilities: string[];
  };
  challenge: {
    enforcement: string;
    notes: string[];
  };
  governance: AdminGovernanceReadModel;
}

export type AdminGovernanceReadModel = FoundationGovernanceReadModel;

function createWorkbenchClient() {
  return new ApiClient({
    baseUrl: getDefaultApiBaseUrl(),
    tenantId: 'tenant-demo',
    brandId: 'brand-demo',
    storeId: 'store-001',
    marketCode: 'cn-mainland'
  });
}

async function loadWorkbenchBootstrap(): Promise<WorkbenchBootstrapResponse | null> {
  try {
    return await createWorkbenchClient().getWorkbenchBootstrap({ cache: 'no-store' });
  } catch {
    return null;
  }
}

async function loadWorkbenchConsumerDescriptor(): Promise<FoundationConsumerDescriptor | null> {
  return loadFoundationConsumerDescriptor(createWorkbenchClient(), 'workbench');
}

export const loadAdminGovernanceReadModel: () => Promise<AdminGovernanceReadModel> =
  createFoundationGovernanceReadModelLoader(createWorkbenchClient);

export async function getAdminWorkbenchConsumerSnapshot(): Promise<AdminWorkbenchConsumerSnapshot> {
  const [bootstrap, governance, consumerDescriptor] = await Promise.all([
    loadWorkbenchBootstrap(),
    loadAdminGovernanceReadModel(),
    loadWorkbenchConsumerDescriptor()
  ]);
  const wiringMeta = createFoundationBootstrapWiringMeta(adminWebBootstrap);

  return {
    deliveryMode: bootstrap ? 'api' : 'fallback',
    wiring: adminWebBootstrap,
    consumerDescriptor: consumerDescriptor ?? fallbackWorkbenchConsumerDescriptor,
    workbenches: bootstrap?.workbenches ?? fallbackRoleWorkbenches,
    tenantContext: bootstrap?.tenantContext ?? fallbackTenantContext,
    supportedClients: bootstrap?.supportedClients ?? foundationSupportedClients,
    foundationDependencies: bootstrap?.foundationDependencies ?? [],
    foundationContracts: bootstrap?.foundationContracts ?? [],
    ...wiringMeta,
    governance
  };
}

export async function getRoleWorkbenches(): Promise<RoleWorkbenchContract[]> {
  const snapshot = await getAdminWorkbenchConsumerSnapshot();
  return snapshot.workbenches;
}

export function normalizeWorkbenchRoleKey(role: string): string {
  return role.trim().toLowerCase().replace(/-/g, '_');
}

export async function getRoleWorkbench(role: string): Promise<RoleWorkbenchContract | undefined> {
  const workbenches = await getRoleWorkbenches();
  const normalizedRole = normalizeWorkbenchRoleKey(role);
  return (
    workbenches.find((item) => normalizeWorkbenchRoleKey(item.role) === normalizedRole)
    ?? fallbackWorkbenchMap[normalizedRole]
  );
}
