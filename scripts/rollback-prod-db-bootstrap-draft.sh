#!/usr/bin/env bash

set -euo pipefail

EXECUTE=false

PHASE_B_FKS=(
  "TaxPolicyConfig_marketProfileId_fkey"
  "SocialChannelConfig_marketProfileId_fkey"
  "EmailChannelConfig_marketProfileId_fkey"
  "PortalSite_storeId_fkey"
  "PortalSite_brandId_fkey"
  "PortalSite_tenantId_fkey"
  "PortalSite_marketProfileId_fkey"
  "RegionalConfigOverride_storeId_fkey"
  "RegionalConfigOverride_brandId_fkey"
  "RegionalConfigOverride_tenantId_fkey"
  "RegionalConfigOverride_regionalConfigId_fkey"
  "RegionalConfigOverride_marketProfileId_fkey"
  "RegionalConfig_marketProfileId_fkey"
)

PHASE_A_FKS=(
  "User_tenantId_fkey"
  "Store_defaultMarketProfileId_fkey"
  "Store_brandId_fkey"
  "Store_tenantId_fkey"
  "Brand_defaultMarketProfileId_fkey"
  "Brand_tenantId_fkey"
  "Tenant_defaultMarketProfileId_fkey"
)

FOUNDATION_FKS=(
  "AiExecutionRecord_promptTemplateId_fkey"
  "AiExecutionRecord_modelConfigId_fkey"
  "AiPromptTemplate_modelConfigId_fkey"
  "RestoreRun_backupSnapshotId_fkey"
  "QuotaLedger_rateLimitPolicyId_fkey"
  "EdgeSyncTask_eventId_fkey"
  "EdgeSyncTask_edgeNodeId_fkey"
  "NotificationDispatch_templateId_fkey"
  "WebhookDelivery_eventId_fkey"
  "WebhookDelivery_subscriptionId_fkey"
  "ConfigRevision_configEntryId_fkey"
  "OrganizationMembership_organizationNodeId_fkey"
  "OrganizationMembership_identityAccountId_fkey"
  "OrganizationNode_parentId_fkey"
)

PHASE_D_TABLES=(
  "\"inspection_task\""
  "\"marketing_push_decision_log\""
  "\"LytConnection\""
  "\"AuditLog\""
  "\"MemberOperationsExecutionReceipt\""
  "\"MemberOperationsTask\""
)

PHASE_C_TABLES=(
  "\"LytPaymentSnapshot\""
  "\"LytOrderSnapshot\""
  "\"LytMemberSnapshot\""
  "\"MemberProfileExtension\""
  "\"MemberProfile\""
)

PHASE_B_TABLES=(
  "\"TaxPolicyConfig\""
  "\"SocialChannelConfig\""
  "\"EmailChannelConfig\""
  "\"PortalSite\""
  "\"RegionalConfigOverride\""
  "\"RegionalConfig\""
)

PHASE_A_TABLES=(
  "\"User\""
  "\"Store\""
  "\"Brand\""
  "\"Tenant\""
  "\"MarketProfile\""
)

FOUNDATION_WAVE2_TABLES=(
  "\"AiExecutionRecord\""
  "\"AiPromptTemplate\""
  "\"RestoreRun\""
  "\"QuotaLedger\""
  "\"EdgeSyncTask\""
  "\"NotificationDispatch\""
  "\"WebhookDelivery\""
  "\"ConfigRevision\""
  "\"OrganizationMembership\""
)

FOUNDATION_WAVE1_TABLES=(
  "\"ConfigAuditLog\""
  "\"ConfigInstance\""
  "\"AiModelConfig\""
  "\"PiiPolicy\""
  "\"BackupSnapshot\""
  "\"FeatureFlag\""
  "\"RateLimitPolicy\""
  "\"OpenPlatformApp\""
  "\"FileAsset\""
  "\"EdgeNode\""
  "\"NotificationTemplate\""
  "\"WebhookSubscription\""
  "\"DomainEvent\""
  "\"CertificateAsset\""
  "\"SecretAsset\""
  "\"ConfigEntry\""
  "\"FoundationAlertAcknowledgement\""
  "\"GovernanceApproval\""
  "\"AccessPolicy\""
  "\"OrganizationNode\""
  "\"IdentityAccount\""
)

REMAINING_ENUMS=(
  "\"ConfigInheritanceMode\""
  "\"PortalChannel\""
  "\"PortalAudience\""
  "\"PortalScopeType\""
)

FOUNDATION_ENUMS=(
  "\"AiExecutionStatus\""
  "\"AiProvider\""
  "\"PiiLevel\""
  "\"RestoreStatus\""
  "\"BackupStatus\""
  "\"FoundationAlertAcknowledgementStatus\""
  "\"ApprovalStatus\""
  "\"RolloutStrategy\""
  "\"FeatureFlagStatus\""
  "\"QuotaPeriod\""
  "\"OpenPlatformAppType\""
  "\"FileAssetKind\""
  "\"EdgeSyncDirection\""
  "\"EdgeNodeStatus\""
  "\"NotificationStatus\""
  "\"NotificationChannelType\""
  "\"WebhookDeliveryStatus\""
  "\"EventStatus\""
  "\"CertificateFormat\""
  "\"SecretProvider\""
  "\"SecretKind\""
  "\"ConfigValueType\""
  "\"PolicyEffect\""
  "\"OrganizationNodeType\""
  "\"IdentitySubjectType\""
  "\"FoundationScopeType\""
)

usage() {
  cat <<'EOF'
Usage:
  scripts/rollback-prod-db-bootstrap-draft.sh [--execute]

Default behavior is dry-run and only prints rollback SQL.
Use --execute only in an approved production rollback window.
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --execute)
      EXECUTE=true
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown argument: $1" >&2
      usage >&2
      exit 1
      ;;
  esac
done

if [[ "$EXECUTE" == true && -z "${DATABASE_URL:-}" ]]; then
  echo "DATABASE_URL is required when using --execute" >&2
  exit 1
fi

emit() {
  local sql="$1"
  if [[ "$EXECUTE" == true ]]; then
    psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -c "$sql"
  else
    printf '%s\n' "$sql"
  fi
}

drop_constraints() {
  local table="$1"
  shift
  local constraint
  for constraint in "$@"; do
    emit "ALTER TABLE IF EXISTS \"$table\" DROP CONSTRAINT IF EXISTS \"$constraint\";"
  done
}

drop_tables() {
  local table
  for table in "$@"; do
    emit "DROP TABLE IF EXISTS $table;"
  done
}

drop_types() {
  local type_name
  for type_name in "$@"; do
    emit "DROP TYPE IF EXISTS $type_name;"
  done
}

echo "-- Rollback plan mode: $([[ "$EXECUTE" == true ]] && echo execute || echo dry-run)"

drop_constraints "RegionalConfig" \
  "RegionalConfig_marketProfileId_fkey"
drop_constraints "RegionalConfigOverride" \
  "RegionalConfigOverride_marketProfileId_fkey" \
  "RegionalConfigOverride_regionalConfigId_fkey" \
  "RegionalConfigOverride_tenantId_fkey" \
  "RegionalConfigOverride_brandId_fkey" \
  "RegionalConfigOverride_storeId_fkey"
drop_constraints "PortalSite" \
  "PortalSite_marketProfileId_fkey" \
  "PortalSite_tenantId_fkey" \
  "PortalSite_brandId_fkey" \
  "PortalSite_storeId_fkey"
drop_constraints "EmailChannelConfig" \
  "EmailChannelConfig_marketProfileId_fkey"
drop_constraints "SocialChannelConfig" \
  "SocialChannelConfig_marketProfileId_fkey"
drop_constraints "TaxPolicyConfig" \
  "TaxPolicyConfig_marketProfileId_fkey"

drop_constraints "User" "${PHASE_A_FKS[@]:0:1}"
drop_constraints "Store" "${PHASE_A_FKS[@]:1:3}"
drop_constraints "Brand" "${PHASE_A_FKS[@]:4:2}"
drop_constraints "Tenant" "${PHASE_A_FKS[@]:6:1}"

drop_constraints "AiExecutionRecord" "${FOUNDATION_FKS[@]:0:2}"
drop_constraints "AiPromptTemplate" "${FOUNDATION_FKS[@]:2:1}"
drop_constraints "RestoreRun" "${FOUNDATION_FKS[@]:3:1}"
drop_constraints "QuotaLedger" "${FOUNDATION_FKS[@]:4:1}"
drop_constraints "EdgeSyncTask" "${FOUNDATION_FKS[@]:5:2}"
drop_constraints "NotificationDispatch" "${FOUNDATION_FKS[@]:7:1}"
drop_constraints "WebhookDelivery" "${FOUNDATION_FKS[@]:8:2}"
drop_constraints "ConfigRevision" "${FOUNDATION_FKS[@]:10:1}"
drop_constraints "OrganizationMembership" "${FOUNDATION_FKS[@]:11:2}"
drop_constraints "OrganizationNode" "${FOUNDATION_FKS[@]:13:1}"

drop_tables "${PHASE_D_TABLES[@]}"
drop_tables "${PHASE_C_TABLES[@]}"
drop_tables "${PHASE_B_TABLES[@]}"
drop_tables "${PHASE_A_TABLES[@]}"
drop_tables "${FOUNDATION_WAVE2_TABLES[@]}"
drop_tables "${FOUNDATION_WAVE1_TABLES[@]}"

drop_types "${REMAINING_ENUMS[@]}"
drop_types "${FOUNDATION_ENUMS[@]}"

echo "-- Rollback plan complete."
