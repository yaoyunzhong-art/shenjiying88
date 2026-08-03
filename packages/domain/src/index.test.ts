import {
  describe,
  it,
} from 'node:test';
import assert from 'node:assert';

import {
  // Enums
  UserRole,
  ClientChannel,
  PortalAudience,
  PortalScopeType,
  PortalChannel,
  StorefrontSurface,
  CountryCode,
  LanguageCode,
  CurrencyCode,
  TaxMode,
  NetworkRegion,
  EmailProvider,
  SocialPlatform,
  FoundationScopeType,
  IdentitySubjectType,
  OrganizationNodeType,
  PolicyEffect,
  PolicySubjectType,
  PolicyConditionOperator,
  EventStatus,
  AiProvider,
  AiExecutionStatus,

  // Interfaces
  TenantScope,
  MarketProfile,
  StorePortal,
  TobPortal,
  StructuredValue,
  FoundationScope,
  IdentityAccount,
  OrganizationNode,
  AccessPolicy,
  DomainEvent,
  WebhookSubscription,
  AuditTrailRecord,
  AiModelConfig,
  AiPromptTemplate,
  AiExecutionRecord,
  SecretAsset,
  CertificateAsset,
  EdgeNode,
  EdgeSyncTask,
  FeatureFlag,
  BackupSnapshot,
  RestoreRun,
  PiiPolicy,
  NotificationTemplate,
  NotificationDispatch,
  RateLimitPolicy,
  QuotaLedger,
  FileAsset,
  OpenPlatformApp,
  ConfigValueType,
  SecretKind,
  SecretProvider,
  CertificateFormat,
  EdgeNodeStatus,
  EdgeSyncDirection,
  FeatureFlagStatus,
  RolloutStrategy,
  BackupStatus,
  RestoreStatus,
  PiiLevel,
  QuotaPeriod,
  NotificationChannelType,
  NotificationStatus,
  OpenPlatformAppType,
  FileAssetKind,
} from './index';

// ─── 1. Enum Integrity Tests ─────────────────────────────────────────

describe('Enum Integrity', () => {

  it('UserRole: all expected values are present and distinct', () => {
    const roles: UserRole[] = [
      UserRole.SuperAdmin,
      UserRole.TenantAdmin,
      UserRole.BrandManager,
      UserRole.StoreManager,
      UserRole.Guide,
      UserRole.Cashier,
      UserRole.Operations,
      UserRole.Finance,
      UserRole.Warehouse,
      UserRole.Coach,
    ];
    assert.strictEqual(roles.length, 10, 'Should have 10 roles');
    assert.strictEqual(new Set(roles).size, 10, 'All roles should be unique');
    roles.forEach((r) => {
      assert.ok(typeof r === 'string', `Role ${r} should be a string`);
    });
  });

  it('ClientChannel / PortalChannel / StorefrontSurface are non-overlapping beyond known shared channels', () => {
    const clientChannels = Object.values(ClientChannel) as string[];
    const portalChannels = Object.values(PortalChannel) as string[];
    const surfaces = Object.values(StorefrontSurface) as string[];

    // H5, MINIAPP, APP are intentionally shared across enums (channels usable as storefront surfaces)
    const knownSharedValues = new Set(['H5', 'MINIAPP', 'APP']);

    // Any StorefrontSurface value NOT in the known set must not appear in ClientChannel
    const clientSet = new Set(clientChannels);
    for (const s of surfaces) {
      if (!knownSharedValues.has(s)) {
        assert.ok(!clientSet.has(s), `StorefrontSurface "${s}" should not overlap with ClientChannel`);
      }
    }

    // Verify the known shared values actually exist in both enums
    const surfaceSet = new Set(surfaces);
    for (const v of knownSharedValues) {
      assert.ok(clientSet.has(v), `Known shared "${v}" should be in ClientChannel`);
      assert.ok(surfaceSet.has(v), `Known shared "${v}" should be in StorefrontSurface`);
    }

    // Store-specific surfaces should NOT be in PortalChannel (PC_CONSOLE, PAD_CONSOLE)
    const portalSet = new Set(portalChannels);
    assert.ok(!portalSet.has('OFFICIAL_SITE'), 'OFFICIAL_SITE is storefront-only');
  });

  it('CurrencyCode: all expected currency values exist', () => {
    const currencies: CurrencyCode[] = [CurrencyCode.Cny, CurrencyCode.Usd];
    assert.strictEqual(currencies.length, 2, 'Should have 2 currencies');
    assert.strictEqual(CurrencyCode.Cny, 'CNY');
    assert.strictEqual(CurrencyCode.Usd, 'USD');
    currencies.forEach((c) => assert.ok(c.length === 3, `Currency ${c} should be 3-char ISO`));
  });

  it('TaxMode: all expected tax modes exist and are distinct', () => {
    const modes: TaxMode[] = [TaxMode.Included, TaxMode.Excluded, TaxMode.Zero];
    assert.strictEqual(modes.length, 3, 'Should have 3 tax modes');
    assert.strictEqual(new Set(modes).size, 3, 'All tax modes must be unique');
    assert.strictEqual(TaxMode.Included, 'PRICES_INCLUDE_TAX');
    assert.strictEqual(TaxMode.Excluded, 'PRICES_EXCLUDE_TAX');
    assert.strictEqual(TaxMode.Zero, 'ZERO_TAX');
  });

  it('NetworkRegion: all expected regions exist', () => {
    const regions: NetworkRegion[] = [
      NetworkRegion.MainlandChina,
      NetworkRegion.NorthAmerica,
      NetworkRegion.Global,
    ];
    assert.strictEqual(regions.length, 3, 'Should have 3 regions');
    assert.strictEqual(new Set(regions).size, 3, 'All regions must be unique');
    assert.ok(regions.every((r) => typeof r === 'string' && r.length > 0));
  });
});

// ─── 2. Interface Snapshot Tests ─────────────────────────────────────

describe('Interface Snapshots', () => {

  it('MarketProfile: full construction with all required fields', () => {
    const profile: MarketProfile = {
      marketCode: 'CN-MAIN',
      marketName: '中国 Mainland',
      countryCode: CountryCode.China,
      locale: {
        defaultLanguage: LanguageCode.ZhCn,
        supportedLanguages: [LanguageCode.ZhCn, LanguageCode.EnUs],
      },
      timezone: { timezone: 'Asia/Shanghai' },
      currency: { currencyCode: CurrencyCode.Cny, symbol: '¥' },
      tax: { taxMode: TaxMode.Included, taxRate: 13, taxLabel: '增值税' },
      network: {
        networkRegion: NetworkRegion.MainlandChina,
        apiBaseUrl: 'https://api.cn.example.com',
        cdnBaseUrl: 'https://cdn.cn.example.com',
      },
      email: {
        provider: EmailProvider.AliyunDm,
        fromName: 'Example',
        fromAddress: 'noreply@example.cn',
      },
      social: {
        primaryPlatforms: [SocialPlatform.Wechat],
        supportPlatforms: [SocialPlatform.Wechat, SocialPlatform.Weibo],
      },
    };

    assert.strictEqual(profile.marketCode, 'CN-MAIN');
    assert.strictEqual(profile.countryCode, CountryCode.China);
    assert.strictEqual(profile.locale.defaultLanguage, LanguageCode.ZhCn);
    assert.strictEqual(profile.currency.currencyCode, CurrencyCode.Cny);
    assert.strictEqual(profile.tax.taxMode, TaxMode.Included);
    assert.strictEqual(profile.network.networkRegion, NetworkRegion.MainlandChina);
    assert.strictEqual(profile.email.provider, EmailProvider.AliyunDm);
    assert.ok(Array.isArray(profile.social.primaryPlatforms));
  });

  it('StorePortal: discriminated union (audience=ToC, scopeType=Store)', () => {
    const portal: StorePortal = {
      audience: PortalAudience.ToC,
      scopeType: PortalScopeType.Store,
      scopeCode: 'store-001',
      marketCode: 'CN-MAIN',
      channel: PortalChannel.MiniApp,
      name: '官方商城',
      supportedLanguages: [LanguageCode.ZhCn],
      tenantCode: 'T001',
      brandCode: 'B001',
      storeCode: 'S001',
      storeName: '北京旗舰店',
      supportedSurfaces: [StorefrontSurface.MiniApp, StorefrontSurface.H5],
    };

    assert.strictEqual(portal.audience, PortalAudience.ToC);
    assert.strictEqual(portal.scopeType, PortalScopeType.Store);
    assert.strictEqual(portal.tenantCode, 'T001');
    assert.strictEqual(portal.brandCode, 'B001');
    assert.strictEqual(portal.storeCode, 'S001');
    assert.strictEqual(portal.storeName, '北京旗舰店');
    assert.ok(portal.supportedSurfaces.length >= 2);
    // Verify StorePortal extends BasePortal fields are present
    assert.strictEqual(portal.marketCode, 'CN-MAIN');
    assert.strictEqual(portal.channel, PortalChannel.MiniApp);
  });

  it('TobPortal: discriminated union (audience=ToB)', () => {
    const portal: TobPortal = {
      audience: PortalAudience.ToB,
      scopeType: PortalScopeType.Tenant,
      scopeCode: 'tenant-001',
      marketCode: 'CN-MAIN',
      channel: PortalChannel.Web,
      name: '管理后台',
      supportedLanguages: [LanguageCode.ZhCn, LanguageCode.EnUs],
      tenantCode: 'T001',
      heroTitle: '智能零售平台',
      heroSubtitle: '一站式零售管理解决方案',
      solutionTags: ['零售', '智能', '全渠道'],
      loginEntry: {
        label: '登录',
        loginPath: '/auth/login',
        ssoEnabled: true,
      },
    };

    assert.strictEqual(portal.audience, PortalAudience.ToB);
    assert.strictEqual(portal.scopeType, PortalScopeType.Tenant);
    assert.strictEqual(portal.heroTitle, '智能零售平台');
    assert.ok(Array.isArray(portal.solutionTags));
    assert.strictEqual(portal.loginEntry.ssoEnabled, true);
  });

  it('AccessPolicy: PolicyEffect + PolicySubject + Condition structure', () => {
    const policy: AccessPolicy = {
      id: 'policy-001',
      name: 'Store Managers Write Orders',
      effect: PolicyEffect.Allow,
      scope: {
        scopeType: FoundationScopeType.Tenant,
        scopeId: 'T001',
      },
      subjects: [
        { subjectType: PolicySubjectType.Role, subjectId: 'role-store-manager' },
      ],
      actions: ['order:write', 'order:read'],
      resources: ['order:*'],
      conditions: [
        {
          field: 'order.storeId',
          operator: PolicyConditionOperator.Eq,
          value: 'S001',
        },
        {
          field: 'order.totalAmount',
          operator: PolicyConditionOperator.Lte,
          value: 100000,
        },
      ],
      dataScope: { storeIds: ['S001', 'S002'] },
    };

    assert.strictEqual(policy.effect, PolicyEffect.Allow);
    assert.strictEqual(policy.subjects.length, 1);
    assert.strictEqual(policy.subjects[0]!.subjectType, PolicySubjectType.Role);
    assert.strictEqual(policy.actions.length, 2);
    assert.strictEqual(policy.actions[0], 'order:write');
    assert.ok(Array.isArray(policy.resources));
    assert.strictEqual(policy.conditions!.length, 2);
    assert.strictEqual(policy.conditions![0]!.operator, PolicyConditionOperator.Eq);
    assert.strictEqual(policy.conditions![1]!.operator, PolicyConditionOperator.Lte);
    assert.deepStrictEqual(policy.conditions![0]!.value, 'S001');
    assert.deepStrictEqual(policy.conditions![1]!.value, 100000);
    assert.ok(policy.dataScope != null);
  });

  it('FoundationScope: different scope types have consistent structure', () => {
    const platform: FoundationScope = {
      scopeType: FoundationScopeType.Platform,
      scopeId: 'PLATFORM',
    };
    const tenant: FoundationScope = {
      scopeType: FoundationScopeType.Tenant,
      scopeId: 'T001',
    };
    const store: FoundationScope = {
      scopeType: FoundationScopeType.Store,
      scopeId: 'S001',
      tenantId: 'T001',
      brandId: 'B001',
      storeId: 'S001',
    };
    const market: FoundationScope = {
      scopeType: FoundationScopeType.Market,
      scopeId: 'CN-MAIN',
      marketCode: 'CN-MAIN',
    };

    assert.strictEqual(platform.scopeType, FoundationScopeType.Platform);
    assert.strictEqual(tenant.scopeType, FoundationScopeType.Tenant);
    assert.strictEqual(store.scopeType, FoundationScopeType.Store);
    assert.strictEqual(store.tenantId, 'T001');
    assert.strictEqual(store.brandId, 'B001');
    assert.strictEqual(market.scopeType, FoundationScopeType.Market);
    assert.strictEqual(market.marketCode, 'CN-MAIN');
  });
});

// ─── 3. Serialization / Deserialization Tests ────────────────────────

describe('Serialization / Deserialization', () => {

  it('JSON round-trip: MarketProfile serializes & deserializes consistently', () => {
    const original: MarketProfile = {
      marketCode: 'US-EAST',
      marketName: 'US Eastern',
      countryCode: CountryCode.UnitedStates,
      locale: {
        defaultLanguage: LanguageCode.EnUs,
        supportedLanguages: [LanguageCode.EnUs],
      },
      timezone: { timezone: 'America/New_York' },
      currency: { currencyCode: CurrencyCode.Usd, symbol: '$' },
      tax: {
        taxMode: TaxMode.Excluded,
        taxRate: 8.875,
        taxLabel: 'Sales Tax',
      },
      network: {
        networkRegion: NetworkRegion.NorthAmerica,
        apiBaseUrl: 'https://api.us.example.com',
        cdnBaseUrl: 'https://cdn.us.example.com',
        callbackBaseUrl: 'https://cb.us.example.com',
      },
      email: {
        provider: EmailProvider.SendGrid,
        fromName: 'Example US',
        fromAddress: 'noreply@example.us',
        replyTo: 'support@example.us',
      },
      social: {
        primaryPlatforms: [SocialPlatform.Instagram],
        supportPlatforms: [SocialPlatform.Facebook, SocialPlatform.X, SocialPlatform.Instagram],
      },
    };

    const json = JSON.stringify(original);
    const restored: MarketProfile = JSON.parse(json);

    assert.strictEqual(restored.marketCode, original.marketCode);
    assert.strictEqual(restored.countryCode, original.countryCode);
    assert.strictEqual(restored.currency.currencyCode, original.currency.currencyCode);
    assert.strictEqual(restored.tax.taxMode, original.tax.taxMode);
    assert.strictEqual(restored.tax.taxRate, original.tax.taxRate);
    assert.strictEqual(restored.network.apiBaseUrl, original.network.apiBaseUrl);
    assert.strictEqual(restored.network.callbackBaseUrl, original.network.callbackBaseUrl);
    assert.strictEqual(restored.email.replyTo, original.email.replyTo);
    assert.strictEqual(restored.social.supportPlatforms.length, original.social.supportPlatforms.length);
  });

  it('StructuredValue: recursive type compatibility with JSON', () => {
    const nested: StructuredValue = {
      name: 'test',
      count: 42,
      active: true,
      nothing: null,
      tags: ['a', 'b'],
      meta: {
        nested: {
          deep: [1, 2, { x: 3 }],
        },
      },
    };

    const json = JSON.stringify(nested);
    const restored = JSON.parse(json);

    assert.strictEqual(restored.name, 'test');
    assert.strictEqual(restored.count, 42);
    assert.strictEqual(restored.active, true);
    assert.strictEqual(restored.nothing, null);
    assert.deepStrictEqual(restored.tags, ['a', 'b']);
    assert.strictEqual(restored.meta.nested.deep[0], 1);
    assert.strictEqual(restored.meta.nested.deep[2].x, 3);
  });

  it('Optional fields: omit verification in JSON round-trip', () => {
    const full: FoundationScope = {
      scopeType: FoundationScopeType.Store,
      scopeId: 'S001',
      tenantId: 'T001',
      brandId: 'B001',
      storeId: 'S001',
      marketCode: 'CN-MAIN',
      portalCode: 'portal-001',
    };

    const minimal: FoundationScope = {
      scopeType: FoundationScopeType.Platform,
      scopeId: 'PLATFORM',
    };

    const fullJson = JSON.stringify(full);
    const minimalJson = JSON.stringify(minimal);

    const fullParsed = JSON.parse(fullJson);
    const minimalParsed = JSON.parse(minimalJson);

    // Full has all optional fields
    assert.strictEqual(fullParsed.tenantId, 'T001');
    assert.strictEqual(fullParsed.marketCode, 'CN-MAIN');

    // Minimal should NOT have optional fields in JSON
    assert.strictEqual(minimalParsed.tenantId, undefined);
    assert.strictEqual(minimalParsed.brandId, undefined);

    // Both should have required fields
    assert.strictEqual(minimalParsed.scopeType, FoundationScopeType.Platform);
    assert.strictEqual(minimalParsed.scopeId, 'PLATFORM');
  });

  it('Primitive compatibility: string/number/boolean/null across serialization', () => {
    const values: StructuredValue[] = ['hello', 42, true, null, ['a', 1, false]];
    const json = JSON.stringify(values);
    const restored = JSON.parse(json);

    assert.strictEqual(restored[0], 'hello');
    assert.strictEqual(restored[1], 42);
    assert.strictEqual(restored[2], true);
    assert.strictEqual(restored[3], null);
    assert.deepStrictEqual(restored[4], ['a', 1, false]);
  });
});

// ─── 4. Cross-Module Contract Tests ──────────────────────────────────

describe('Cross-Module Contracts', () => {

  it('TenantScope ↔ OrganizationNode ↔ IdentityAccount consistency', () => {
    const tenantScope: TenantScope = {
      tenantId: 'T001',
    };

    const orgNode: OrganizationNode = {
      id: 'org-001',
      nodeType: OrganizationNodeType.Tenant,
      code: 'tenant-t001',
      name: 'Example Corp',
      scope: {
        scopeType: FoundationScopeType.Tenant,
        scopeId: 'T001',
      },
    };

    const identity: IdentityAccount = {
      id: 'user-001',
      subjectType: IdentitySubjectType.TenantUser,
      displayName: '张三',
      status: 'ACTIVE',
      tenantScope,
      organizationIds: [orgNode.id],
      roleKeys: ['store-manager'],
    };

    // TenantScope consistency
    assert.strictEqual(identity.tenantScope!.tenantId, tenantScope.tenantId);
    // OrganizationNode referenced by identity
    assert.ok(identity.organizationIds.includes(orgNode.id));
    assert.strictEqual(orgNode.nodeType, OrganizationNodeType.Tenant);
    // Scope path: identity → organization → tenant
    assert.strictEqual(orgNode.scope.scopeType, FoundationScopeType.Tenant);
    assert.strictEqual(orgNode.scope.scopeId, tenantScope.tenantId);
  });

  it('DomainEvent ↔ WebhookSubscription ↔ AuditTrailRecord event chain', () => {
    const scope: FoundationScope = {
      scopeType: FoundationScopeType.Tenant,
      scopeId: 'T001',
    };

    // 1. Domain event is emitted
    const event: DomainEvent = {
      id: 'evt-001',
      eventType: 'order.created',
      aggregateType: 'Order',
      aggregateId: 'ord-001',
      scope,
      idempotencyKey: 'idk-20260114-001',
      status: EventStatus.Published,
      payload: { orderId: 'ord-001', amount: 9999 },
      occurredAt: '2026-01-14T00:00:00Z',
    };

    assert.strictEqual(event.eventType, 'order.created');
    assert.strictEqual(event.status, EventStatus.Published);

    // 2. Webhook subscription delivers it
    const webhook: WebhookSubscription = {
      id: 'wh-001',
      topic: 'order.created',
      scope,
      targetUrl: 'https://partner.example.com/webhooks/orders',
      secretRef: 'sec-wh-001',
      enabled: true,
      retryLimit: 3,
    };

    assert.strictEqual(webhook.topic, event.eventType);
    assert.deepStrictEqual(webhook.scope.scopeId, event.scope.scopeId);
    assert.strictEqual(webhook.enabled, true);
    assert.strictEqual(webhook.retryLimit, 3);

    // 3. Audit trail records the event chain
    const audit: AuditTrailRecord = {
      id: 'audit-001',
      action: 'order.created',
      actorId: 'user-001',
      actorType: IdentitySubjectType.TenantUser,
      scope,
      resourceType: 'Order',
      resourceId: event.aggregateId,
      sourceChannel: PortalChannel.Web,
      after: event.payload,
      occurredAt: event.occurredAt,
    };

    assert.strictEqual(audit.action, event.eventType);
    assert.strictEqual(audit.resourceType, event.aggregateType);
    assert.strictEqual(audit.resourceId, event.aggregateId);
    assert.deepStrictEqual(audit.after, event.payload);
    assert.strictEqual(audit.scope.scopeId, scope.scopeId);
  });

  it('AiModelConfig ↔ AiPromptTemplate ↔ AiExecutionRecord AI pipeline', () => {
    const scope: FoundationScope = {
      scopeType: FoundationScopeType.Tenant,
      scopeId: 'T001',
    };

    // 1. AI Model configuration
    const modelConfig: AiModelConfig = {
      id: 'ai-model-001',
      provider: AiProvider.OpenAI,
      model: 'gpt-4o',
      scope,
      maxInputTokens: 128000,
      maxOutputTokens: 4096,
      costQuotaId: 'quota-ai-001',
      safetyPolicyId: 'safety-pii-001',
    };

    assert.strictEqual(modelConfig.provider, AiProvider.OpenAI);
    assert.strictEqual(modelConfig.model, 'gpt-4o');
    assert.strictEqual(modelConfig.maxInputTokens, 128000);

    // 2. Prompt template references model config
    const prompt: AiPromptTemplate = {
      id: 'prompt-001',
      code: 'order-summary-gpt4o',
      modelConfigId: modelConfig.id,
      version: 1,
      prompt: 'Summarize the following order: {{orderPayload}}',
      variables: ['orderPayload'],
      outputSchema: { summary: 'string', keyPoints: ['string'] },
    };

    assert.strictEqual(prompt.modelConfigId, modelConfig.id);
    assert.strictEqual(prompt.variables.length, 1);
    assert.strictEqual(prompt.variables[0], 'orderPayload');
    // outputSchema is a schema descriptor (StructuredValue), not actual output
    assert.ok(prompt.outputSchema != null);
    assert.strictEqual(prompt.version, 1);

    // 3. Execution record ties them together
    const execution: AiExecutionRecord = {
      id: 'exec-001',
      modelConfigId: modelConfig.id,
      promptTemplateId: prompt.id,
      scope,
      status: AiExecutionStatus.Succeeded,
      input: { orderPayload: 'Order #12345: 3 items, $299.97' },
      output: {
        summary: '订单包含3件商品，总金额$299.97',
        keyPoints: ['3 items', '$299.97'],
      },
      tokenUsage: {
        promptTokens: 42,
        completionTokens: 18,
        totalTokens: 60,
      },
      escalatedToHuman: false,
      createdAt: '2026-01-14T00:00:00Z',
    };

    assert.strictEqual(execution.modelConfigId, modelConfig.id);
    assert.strictEqual(execution.promptTemplateId, prompt.id);
    assert.strictEqual(execution.status, AiExecutionStatus.Succeeded);
    assert.strictEqual(execution.escalatedToHuman, false);
    assert.strictEqual(execution.tokenUsage!.totalTokens, 60);
    assert.strictEqual(execution.tokenUsage!.promptTokens + execution.tokenUsage!.completionTokens, 60);
    // Verify execution output matches the schema shape from prompt template
    const executionOutput = execution.output as {
      summary?: unknown;
      keyPoints?: unknown;
    };
    assert.ok(typeof executionOutput.summary === 'string');
    assert.ok(Array.isArray(executionOutput.keyPoints));
  });

  it('SecretAsset ↔ CertificateAsset ↔ EdgeNode infrastructure assets', () => {
    const scope: FoundationScope = {
      scopeType: FoundationScopeType.Tenant,
      scopeId: 'T001',
    };

    // 1. Secret asset
    const secret: SecretAsset = {
      id: 'sec-001',
      key: 'prod/api/v1/key',
      kind: SecretKind.ApiKey,
      provider: SecretProvider.Database,
      scope,
      version: 3,
      reference: 'secret-ref/prod-api-key',
      rotatedAt: new Date().toISOString(),
      expiresAt: '2027-01-01T00:00:00Z',
      metadata: { environment: 'production' },
    };
    assert.strictEqual(secret.kind, SecretKind.ApiKey);
    assert.strictEqual(secret.version, 3);

    // 2. Certificate asset
    const cert: CertificateAsset = {
      id: 'cert-001',
      name: 'wildcard-m5-local',
      format: CertificateFormat.Pem,
      scope,
      domains: ['*.m5.local'],
      secretRef: secret.id,
      expiresAt: '2027-01-01T00:00:00Z',
      autoRenew: true,
    };
    assert.strictEqual(cert.format, CertificateFormat.Pem);
    assert.strictEqual(cert.autoRenew, true);
    assert.ok(new Date(cert.expiresAt) > new Date('2026-01-01T00:00:00Z'));

    // 3. Edge node references secrets
    const edgeNode: EdgeNode = {
      id: 'edge-001',
      code: 'cn-east-1',
      tenantId: 'T001',
      brandId: 'B001',
      status: EdgeNodeStatus.Online,
      lastSeenAt: new Date().toISOString(),
      capabilities: ['compute', 'cache'],
    };
    assert.strictEqual(edgeNode.status, EdgeNodeStatus.Online);
  });

  it('FeatureFlag ↔ BackupSnapshot ↔ RestoreRun disaster recovery chain', () => {
    const scope: FoundationScope = {
      scopeType: FoundationScopeType.Tenant,
      scopeId: 'T001',
    };

    // 1. Feature flag controls backup feature
    const flag: FeatureFlag = {
      id: 'flag-001',
      key: 'enable-auto-backup',
      name: 'Enable Auto Backup',
      status: FeatureFlagStatus.Active,
      scope,
      strategy: RolloutStrategy.All,
      enabled: true,
    };
    assert.strictEqual(flag.enabled, true);
    assert.strictEqual(flag.strategy, RolloutStrategy.All);
    assert.strictEqual(flag.status, FeatureFlagStatus.Active);

    // 2. Backup snapshot created
    const snapshot: BackupSnapshot = {
      id: 'bkp-001',
      resourceType: 'database',
      resourceId: 'tenant-demo-db',
      scope,
      status: BackupStatus.Succeeded,
      storageUri: 's3://m5-backups/daily/bkp-001',
      capturedAt: '2026-07-15T02:15:00Z',
      expiresAt: '2026-08-14T02:15:00Z',
    };
    assert.strictEqual(snapshot.status, BackupStatus.Succeeded);
    assert.strictEqual(snapshot.capturedAt, '2026-07-15T02:15:00Z');

    // 3. Restore run from backup
    const restoreRun: RestoreRun = {
      id: 'rest-001',
      backupSnapshotId: snapshot.id,
      scope,
      status: RestoreStatus.Succeeded,
      requestedBy: 'admin',
      targetEnvironment: 'staging',
      startedAt: '2026-07-15T03:00:00Z',
      finishedAt: '2026-07-15T03:12:00Z',
    };
    assert.strictEqual(restoreRun.backupSnapshotId, snapshot.id);
    assert.strictEqual(restoreRun.status, RestoreStatus.Succeeded);
    assert.ok(restoreRun.finishedAt! > restoreRun.startedAt!);
  });

  it('NotificationTemplate ↔ NotificationDispatch notification pipeline', () => {
    const scope: FoundationScope = {
      scopeType: FoundationScopeType.Tenant,
      scopeId: 'T001',
    };

    // 1. Template
    const template: NotificationTemplate = {
      id: 'tpl-001',
      code: 'order-confirmation',
      channel: NotificationChannelType.Sms,
      marketCode: 'CN-MAIN',
      locale: LanguageCode.ZhCn,
      bodyTemplate: '您的订单 {{orderNo}} 已确认，预计 {{deliveryDate}} 送达。',
      variables: ['orderNo', 'deliveryDate'],
    };
    assert.strictEqual(template.code, 'order-confirmation');
    assert.strictEqual(template.channel, NotificationChannelType.Sms);
    assert.ok(template.variables.includes('orderNo'));

    // 2. Dispatched notification
    const dispatch: NotificationDispatch = {
      id: 'disp-001',
      templateId: template.id,
      channel: NotificationChannelType.Sms,
      scope,
      recipient: '13800138001',
      payload: { rendered: '您的订单 ORD-001 已确认，预计 2026-07-20 送达。' },
      status: NotificationStatus.Sent,
      sentAt: '2026-07-15T10:00:00Z',
      scheduledAt: '2026-07-15T10:00:00Z',
    };
    assert.strictEqual(dispatch.templateId, template.id);
    assert.strictEqual(dispatch.status, NotificationStatus.Sent);
    assert.strictEqual(dispatch.channel, NotificationChannelType.Sms);
  });

  it('RateLimitPolicy ↔ QuotaLedger rate limiting data model', () => {
    const scope: FoundationScope = {
      scopeType: FoundationScopeType.Tenant,
      scopeId: 'T001',
    };

    const policy: RateLimitPolicy = {
      id: 'rl-001',
      code: 'api-rate-limit',
      scope,
      period: QuotaPeriod.Minute,
      limit: 1000,
      burstLimit: 2000,
      dimensionKeys: ['tenant', 'endpoint'],
    };
    assert.strictEqual(policy.limit, 1000);
    assert.strictEqual(policy.period, QuotaPeriod.Minute);

    const ledger: QuotaLedger = {
      id: 'ql-001',
      policyId: policy.id,
      subjectKey: 'tenant-demo',
      period: QuotaPeriod.Minute,
      consumed: 250,
      remaining: 750,
      resetAt: '2026-07-15T11:00:00Z',
    };
    assert.strictEqual(ledger.policyId, policy.id);
    assert.strictEqual(ledger.consumed, 250);
    assert.strictEqual(ledger.remaining, 750);
  });

  it('EdgeNodeStatus / EdgeSyncDirection / FileAssetKind enum integrity', () => {
    const statuses = Object.values(EdgeNodeStatus);
    assert.ok(statuses.includes(EdgeNodeStatus.Online));
    assert.ok(statuses.includes(EdgeNodeStatus.Offline));
    assert.ok(statuses.includes(EdgeNodeStatus.Degraded));
    assert.ok(statuses.includes(EdgeNodeStatus.Maintenance));

    const directions = Object.values(EdgeSyncDirection);
    assert.ok(directions.includes(EdgeSyncDirection.Upstream));
    assert.ok(directions.includes(EdgeSyncDirection.Downstream));
    assert.ok(directions.includes(EdgeSyncDirection.Bidirectional));

    const kinds = Object.values(FileAssetKind);
    assert.strictEqual(new Set(kinds).size, kinds.length);
  });

  it('PiiPolicy covers all required data governance fields', () => {
    const scope: FoundationScope = {
      scopeType: FoundationScopeType.Tenant,
      scopeId: 'T001',
    };

    const policy: PiiPolicy = {
      id: 'pii-001',
      fieldName: 'phone',
      piiLevel: PiiLevel.Restricted,
      scope,
      maskingStrategy: 'mask_middle_4',
      retentionDays: 365,
      purposeLimit: ['customer-support', 'delivery'],
    };
    assert.strictEqual(policy.piiLevel, PiiLevel.Restricted);
    assert.strictEqual(policy.retentionDays, 365);
    assert.strictEqual(policy.maskingStrategy, 'mask_middle_4');
  });

  it('OpenPlatformApp ↔ FileAsset ↔ EdgeSyncTask integration contract', () => {
    const scope: FoundationScope = {
      scopeType: FoundationScopeType.Tenant,
      scopeId: 'T001',
    };

    const app: OpenPlatformApp = {
      id: 'app-001',
      appType: OpenPlatformAppType.Internal,
      name: 'Internal Tool',
      appKey: 'app-key-001',
      scope,
      redirectUris: ['https://app.example.com/callback'],
      webhookTopics: ['order.created'],
      sandboxEnabled: false,
    };
    assert.strictEqual(app.name, 'Internal Tool');
    assert.strictEqual(app.appType, OpenPlatformAppType.Internal);

    const asset: FileAsset = {
      id: 'file-001',
      kind: FileAssetKind.Image,
      scope,
      bucket: 'm5-assets',
      objectKey: 'assets/logo.png',
      mimeType: 'image/png',
      size: 204800,
      checksum: 'md5-aabbcc',
      tags: ['logo', 'brand'],
    };
    assert.strictEqual(asset.kind, FileAssetKind.Image);
    assert.strictEqual(asset.mimeType, 'image/png');
    assert.strictEqual(asset.size, 204800);

    const syncTask: EdgeSyncTask = {
      id: 'sync-001',
      edgeNodeId: 'edge-001',
      direction: EdgeSyncDirection.Upstream,
      aggregateType: 'FileAsset',
      aggregateId: asset.id,
      status: EventStatus.Pending,
      payload: { action: 'sync_asset', assetId: asset.id },
      retryCount: 0,
    };
    assert.strictEqual(syncTask.direction, EdgeSyncDirection.Upstream);
    assert.strictEqual(syncTask.status, EventStatus.Pending);
  });
});
