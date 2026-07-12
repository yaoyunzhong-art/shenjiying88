-- P0-H3 修复: brand-level 老 owner_id 迁移
-- 老格式: brand-xxx (来自 tenantId.split('-')[0] 推导, 多租户撞名)
-- 新格式: ${tenantId}::brand-fallback (三级 fallback 隔离命名空间, 见 tenant-config.service.ts:648)
-- 触发条件: 老 owner_id='brand-xxx' 且与同行的 tenant_id 不一致 (即非品牌租户)
-- 豁免: tenant_id 以 'brand-' 开头 (品牌租户命名约定, 老 owner_id 与新 owner_idFor 一致)

BEGIN;

-- 1. 备份审计 (执行前记录受影响行数)
DO $$
DECLARE
  affected_rows INTEGER;
BEGIN
  SELECT COUNT(*) INTO affected_rows
  FROM "ConfigInstance"
  WHERE "level" = 'brand'
    AND "ownerId" LIKE 'brand-%'
    AND "ownerId" != "tenantId"
    AND "ownerId" NOT LIKE '%::%';
  RAISE NOTICE '[P0-H3 migration] Backup: % brand-level rows will be migrated', affected_rows;
END $$;

-- 2. 迁移 brand-level 老 owner_id
-- P0-H7 修复: 加 IS NOT NULL 守卫, 防 tenantId 为空时 UPDATE 静默跳过
UPDATE "ConfigInstance"
SET "ownerId" = "tenantId" || '::brand-fallback',
    "updatedAt" = NOW()
WHERE "level" = 'brand'
  AND "ownerId" LIKE 'brand-%'
  AND "ownerId" != "tenantId"                -- 排除品牌租户 (tenantId='brand-shenjiying' 同行)
  AND "ownerId" NOT LIKE '%::%'              -- 排除已迁移的 (新格式带 ::)
  AND "tenantId" IS NOT NULL                 -- P0-H7: NULL 守卫
  AND length("tenantId") > 0;                -- P0-H7: 空串守卫

-- 3. 验证迁移结果 (应返回 0)
DO $$
DECLARE
  remaining INTEGER;
BEGIN
  SELECT COUNT(*) INTO remaining
  FROM "ConfigInstance"
  WHERE "level" = 'brand'
    AND "ownerId" LIKE 'brand-%'
    AND "ownerId" != "tenantId"
    AND "ownerId" NOT LIKE '%::%';
  IF remaining > 0 THEN
    RAISE EXCEPTION '[P0-H3 migration] FAILED: % unmigrated brand-level rows remain', remaining;
  END IF;
  RAISE NOTICE '[P0-H3 migration] SUCCESS: All brand-level owner_id migrated to ${tenantId}::brand-fallback';
END $$;

COMMIT;
