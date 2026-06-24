"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SvipService = void 0;
const node_crypto_1 = require("node:crypto");
const common_1 = require("@nestjs/common");
const svip_entity_1 = require("./svip.entity");
/** 降级缓冲期 (天) */
const DOWNGRADE_GRACE_PERIOD_DAYS = 30;
const tierStore = new Map();
const memberStore = new Map();
const benefitStore = new Map();
let SvipService = class SvipService {
    // ── 等级管理 ───────────────────────────────────────────
    /**
     * 初始化租户默认等级
     */
    initDefaultTiers(tenantContext) {
        const existing = this.listTiers(tenantContext.tenantId);
        if (existing.length > 0)
            return existing;
        const defaults = (0, svip_entity_1.buildDefaultSvipTiers)(tenantContext);
        for (const tier of defaults) {
            tierStore.set(tier.id, tier);
        }
        return defaults;
    }
    /**
     * 获取等级列表
     */
    listTiers(tenantId) {
        return Array.from(tierStore.values())
            .filter((t) => t.tenantContext.tenantId === tenantId)
            .sort((a, b) => a.level - b.level);
    }
    /**
     * 获取单个等级
     */
    getTier(tierId, tenantId) {
        const tier = tierStore.get(tierId);
        if (!tier || tier.tenantContext.tenantId !== tenantId)
            return undefined;
        return tier;
    }
    /**
     * 按等级数值查找
     */
    getTierByLevel(level, tenantId) {
        return this.listTiers(tenantId).find((t) => t.level === level);
    }
    /**
     * 创建 / 更新等级
     */
    upsertTier(tenantContext, dto) {
        const now = new Date().toISOString();
        const id = dto.id ?? `svip-tier-${(0, node_crypto_1.randomUUID)()}`;
        const existing = tierStore.get(id);
        const tier = {
            id,
            tenantContext,
            name: dto.name,
            level: dto.level,
            minSpendAmount: dto.minSpendAmount,
            minPoints: dto.minPoints,
            benefits: dto.benefits,
            icon: dto.icon,
            color: dto.color,
            createdAt: existing?.createdAt ?? now
        };
        tierStore.set(id, tier);
        return tier;
    }
    // ── 会员管理 ───────────────────────────────────────────
    /**
     * 创建 SVIP 会员
     */
    createMember(tenantContext, dto) {
        const tier = this.getTier(dto.tierId, tenantContext.tenantId);
        if (!tier) {
            throw new Error(`SvipTier not found: ${dto.tierId}`);
        }
        // 检查是否已存在
        const existing = this.findMemberByMemberId(dto.memberId, tenantContext.tenantId);
        if (existing && existing.status !== svip_entity_1.SvipMemberStatus.Expired) {
            throw new Error(`Member ${dto.memberId} already has an active SVIP membership`);
        }
        const now = new Date().toISOString();
        const svipMember = {
            id: `svip-member-${(0, node_crypto_1.randomUUID)()}`,
            tenantContext,
            brandId: dto.brandId ?? tenantContext.brandId,
            storeId: dto.storeId,
            memberId: dto.memberId,
            tierId: tier.id,
            tierName: tier.name,
            tierLevel: tier.level,
            totalSpend: dto.totalSpend,
            currentPoints: dto.currentPoints,
            joinedAt: dto.joinedAt ?? now,
            expiresAt: dto.expiresAt,
            status: svip_entity_1.SvipMemberStatus.Active,
            autoRenew: dto.autoRenew ?? false,
            createdAt: now,
            updatedAt: now
        };
        memberStore.set(svipMember.id, svipMember);
        return svipMember;
    }
    /**
     * 获取会员 SVIP 信息
     */
    getMemberTier(memberId, tenantId) {
        return this.findMemberByMemberId(memberId, tenantId);
    }
    /**
     * 列出所有 SVIP 会员
     */
    listMembers(tenantId, filters) {
        return Array.from(memberStore.values()).filter((m) => {
            if (m.tenantContext.tenantId !== tenantId)
                return false;
            if (filters?.status && m.status !== filters.status)
                return false;
            if (filters?.tierLevel && m.tierLevel !== filters.tierLevel)
                return false;
            if (filters?.brandId && m.brandId !== filters.brandId)
                return false;
            if (filters?.storeId && m.storeId !== filters.storeId)
                return false;
            return true;
        });
    }
    /**
     * 根据 memberId 查找 SVIP 会员
     */
    findMemberByMemberId(memberId, tenantId) {
        return Array.from(memberStore.values()).find((m) => m.tenantContext.tenantId === tenantId && m.memberId === memberId);
    }
    /**
     * 自动判定等级: 根据 totalSpend + points
     */
    calculateTier(totalSpend, points) {
        return (0, svip_entity_1.computeSvipTierLevel)(totalSpend, points);
    }
    /**
     * 升级 SVIP 等级
     */
    upgradeTier(tenantContext, dto) {
        const member = this.findMemberByMemberId(dto.memberId, tenantContext.tenantId);
        if (!member) {
            throw new Error(`SvipMember not found: ${dto.memberId}`);
        }
        if (member.status !== svip_entity_1.SvipMemberStatus.Active) {
            throw new Error(`SvipMember is not active: ${dto.memberId} (status=${member.status})`);
        }
        const targetLevel = dto.targetTierLevel ??
            (0, svip_entity_1.computeSvipTierLevel)(dto.totalSpend ?? member.totalSpend, dto.currentPoints ?? member.currentPoints);
        if (targetLevel <= member.tierLevel) {
            throw new Error(`Cannot upgrade: target level ${targetLevel} is not higher than current level ${member.tierLevel}`);
        }
        const tier = this.getTierByLevel(targetLevel, tenantContext.tenantId);
        if (!tier) {
            throw new Error(`SvipTier not found for level: ${targetLevel}`);
        }
        const now = new Date().toISOString();
        member.tierId = tier.id;
        member.tierName = tier.name;
        member.tierLevel = tier.level;
        if (dto.totalSpend !== undefined)
            member.totalSpend = dto.totalSpend;
        if (dto.currentPoints !== undefined)
            member.currentPoints = dto.currentPoints;
        member.updatedAt = now;
        memberStore.set(member.id, member);
        return member;
    }
    /**
     * 降级 SVIP 等级
     */
    downgradeTier(tenantContext, dto) {
        const member = this.findMemberByMemberId(dto.memberId, tenantContext.tenantId);
        if (!member) {
            throw new Error(`SvipMember not found: ${dto.memberId}`);
        }
        if (member.status !== svip_entity_1.SvipMemberStatus.Active) {
            throw new Error(`SvipMember is not active: ${dto.memberId} (status=${member.status})`);
        }
        const targetLevel = dto.targetTierLevel ??
            (0, svip_entity_1.computeSvipTierLevel)(dto.totalSpend ?? member.totalSpend, dto.currentPoints ?? member.currentPoints);
        if (targetLevel >= member.tierLevel) {
            throw new Error(`Cannot downgrade: target level ${targetLevel} is not lower than current level ${member.tierLevel}`);
        }
        const tier = this.getTierByLevel(targetLevel, tenantContext.tenantId);
        if (!tier) {
            throw new Error(`SvipTier not found for level: ${targetLevel}`);
        }
        const now = new Date().toISOString();
        member.tierId = tier.id;
        member.tierName = tier.name;
        member.tierLevel = tier.level;
        if (dto.totalSpend !== undefined)
            member.totalSpend = dto.totalSpend;
        if (dto.currentPoints !== undefined)
            member.currentPoints = dto.currentPoints;
        member.updatedAt = now;
        memberStore.set(member.id, member);
        return member;
    }
    /**
     * 到期降级: expiresAt 到期 → 降级并保留 30 天缓冲期
     */
    checkAndDowngradeExpired(tenantId) {
        const now = new Date();
        const results = [];
        const activeMembers = this.listMembers(tenantId, { status: svip_entity_1.SvipMemberStatus.Active });
        for (const member of activeMembers) {
            const expiresDate = new Date(member.expiresAt);
            if (now >= expiresDate) {
                // 计算缓冲期截止时间
                const graceEndDate = new Date(expiresDate.getTime() + DOWNGRADE_GRACE_PERIOD_DAYS * 24 * 60 * 60 * 1000);
                if (now >= graceEndDate) {
                    // 超过缓冲期, 彻底过期
                    member.status = svip_entity_1.SvipMemberStatus.Expired;
                }
                else {
                    // 缓冲期内: 降一级
                    const newLevel = Math.max(1, member.tierLevel - 1);
                    if (newLevel < member.tierLevel) {
                        const lowerTier = this.getTierByLevel(newLevel, tenantId);
                        if (lowerTier) {
                            member.tierId = lowerTier.id;
                            member.tierName = lowerTier.name;
                            member.tierLevel = lowerTier.level;
                        }
                    }
                    // 延长 expiresAt 30 天
                    const newExpires = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
                    member.expiresAt = newExpires.toISOString();
                }
                member.updatedAt = now.toISOString();
                memberStore.set(member.id, member);
                results.push(member);
            }
        }
        return results;
    }
    /**
     * 冻结 SVIP 会员
     */
    freezeMember(memberId, tenantId) {
        const member = this.findMemberByMemberId(memberId, tenantId);
        if (!member) {
            throw new Error(`SvipMember not found: ${memberId}`);
        }
        if (member.status === svip_entity_1.SvipMemberStatus.Frozen) {
            throw new Error(`SvipMember is already frozen: ${memberId}`);
        }
        member.status = svip_entity_1.SvipMemberStatus.Frozen;
        member.updatedAt = new Date().toISOString();
        memberStore.set(member.id, member);
        return member;
    }
    /**
     * 解冻 SVIP 会员
     */
    unfreezeMember(memberId, tenantId) {
        const member = this.findMemberByMemberId(memberId, tenantId);
        if (!member) {
            throw new Error(`SvipMember not found: ${memberId}`);
        }
        if (member.status !== svip_entity_1.SvipMemberStatus.Frozen) {
            throw new Error(`SvipMember is not frozen: ${memberId}`);
        }
        member.status = svip_entity_1.SvipMemberStatus.Active;
        member.updatedAt = new Date().toISOString();
        memberStore.set(member.id, member);
        return member;
    }
    // ── 权益管理 ───────────────────────────────────────────
    /**
     * 获取等级权益列表
     */
    listBenefits(tierId) {
        return Array.from(benefitStore.values()).filter((b) => b.tierId === tierId && b.isActive);
    }
    /**
     * 创建权益
     */
    createBenefit(dto) {
        const benefit = {
            id: dto.id ?? `svip-benefit-${(0, node_crypto_1.randomUUID)()}`,
            tierId: dto.tierId,
            benefitType: dto.benefitType,
            benefitValue: dto.benefitValue,
            description: dto.description,
            isActive: dto.isActive ?? true
        };
        benefitStore.set(benefit.id, benefit);
        return benefit;
    }
    /**
     * 更新权益
     */
    updateBenefit(benefitId, dto) {
        const existing = benefitStore.get(benefitId);
        if (!existing) {
            throw new Error(`SvipBenefit not found: ${benefitId}`);
        }
        if (dto.benefitType !== undefined)
            existing.benefitType = dto.benefitType;
        if (dto.benefitValue !== undefined)
            existing.benefitValue = dto.benefitValue;
        if (dto.description !== undefined)
            existing.description = dto.description;
        if (dto.isActive !== undefined)
            existing.isActive = dto.isActive;
        benefitStore.set(benefitId, existing);
        return existing;
    }
    /**
     * 使用权益
     */
    useBenefit(memberId, benefitType, tenantId) {
        const member = this.findMemberByMemberId(memberId, tenantId);
        if (!member || member.status !== svip_entity_1.SvipMemberStatus.Active) {
            return {
                success: false,
                message: `Member ${memberId} is not an active SVIP member`
            };
        }
        // 获取当前等级的所有权益
        const tier = this.getTier(member.tierId, tenantId);
        if (!tier) {
            return {
                success: false,
                message: `SvipTier not found: ${member.tierId}`
            };
        }
        // 检查该等级是否有此权益类型
        const hasBenefit = tier.benefits.some((b) => {
            // 权益映射: discount_XX → discount
            if (benefitType === svip_entity_1.SvipBenefitType.Discount)
                return b.startsWith('discount_');
            if (benefitType === svip_entity_1.SvipBenefitType.FreeUpgrade)
                return b === 'free_upgrade';
            if (benefitType === svip_entity_1.SvipBenefitType.PriorityQueue)
                return b === 'priority_queue';
            if (benefitType === svip_entity_1.SvipBenefitType.VipRoom)
                return b === 'vip_room';
            if (benefitType === svip_entity_1.SvipBenefitType.ExclusiveEvent)
                return b === 'exclusive_event';
            return false;
        });
        if (!hasBenefit) {
            return {
                success: false,
                member,
                message: `Current tier ${tier.name} does not have benefit type: ${benefitType}`
            };
        }
        // 获取具体的 benefit 记录
        const activeBenefits = this.listBenefits(member.tierId);
        const matchedBenefit = activeBenefits.find((b) => b.benefitType === benefitType);
        return {
            success: true,
            benefit: matchedBenefit,
            member,
            message: `Benefit ${benefitType} used successfully for member ${memberId}`
        };
    }
    /**
     * 与 loyalty 模块联动: 积分达阈值自动升 SVIP
     * 此方法由 loyalty 模块在积分结算后调用
     */
    checkAndAutoUpgrade(tenantContext, memberId, totalSpend, currentPoints) {
        const existingMember = this.findMemberByMemberId(memberId, tenantContext.tenantId);
        if (!existingMember) {
            // 尚未成为 SVIP: 检查是否达到 Level1 阈值
            const computedLevel = (0, svip_entity_1.computeSvipTierLevel)(totalSpend, currentPoints);
            // 仅当实际满足 Level1 阈值时才自动创建
            const meetsLevel1 = totalSpend >= svip_entity_1.SVIP_TIER_THRESHOLDS[svip_entity_1.SvipTierLevel.Level1].minSpendAmount
                && currentPoints >= svip_entity_1.SVIP_TIER_THRESHOLDS[svip_entity_1.SvipTierLevel.Level1].minPoints;
            if (meetsLevel1 && computedLevel >= svip_entity_1.SvipTierLevel.Level1) {
                // 自动创建 SVIP 会员
                const tier = this.getTierByLevel(computedLevel, tenantContext.tenantId);
                if (!tier)
                    return { upgraded: false, reason: 'Tier not found' };
                const now = new Date().toISOString();
                const expiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
                const svipMember = {
                    id: `svip-member-${(0, node_crypto_1.randomUUID)()}`,
                    tenantContext,
                    memberId,
                    tierId: tier.id,
                    tierName: tier.name,
                    tierLevel: tier.level,
                    totalSpend,
                    currentPoints,
                    joinedAt: now,
                    expiresAt,
                    status: svip_entity_1.SvipMemberStatus.Active,
                    autoRenew: false,
                    createdAt: now,
                    updatedAt: now
                };
                memberStore.set(svipMember.id, svipMember);
                return { upgraded: true, newLevel: computedLevel, reason: 'Auto-enrolled via points threshold' };
            }
            return { upgraded: false, reason: 'Below Level1 threshold' };
        }
        // 已是 SVIP: 检查是否可升级
        if ((0, svip_entity_1.canUpgradeSvipTier)(existingMember.tierLevel, totalSpend, currentPoints)) {
            const newLevel = (0, svip_entity_1.computeSvipTierLevel)(totalSpend, currentPoints);
            const tier = this.getTierByLevel(newLevel, tenantContext.tenantId);
            if (!tier)
                return { upgraded: false, reason: 'Target tier not found' };
            existingMember.tierId = tier.id;
            existingMember.tierName = tier.name;
            existingMember.tierLevel = tier.level;
            existingMember.totalSpend = totalSpend;
            existingMember.currentPoints = currentPoints;
            existingMember.updatedAt = new Date().toISOString();
            memberStore.set(existingMember.id, existingMember);
            return {
                upgraded: true,
                newLevel,
                reason: `Auto-upgraded from level ${existingMember.tierLevel} to ${newLevel}`
            };
        }
        // 检查是否需要降级
        const computedLevel = (0, svip_entity_1.computeSvipTierLevel)(totalSpend, currentPoints);
        if (computedLevel < existingMember.tierLevel) {
            const tier = this.getTierByLevel(computedLevel, tenantContext.tenantId);
            if (tier) {
                existingMember.tierId = tier.id;
                existingMember.tierName = tier.name;
                existingMember.tierLevel = tier.level;
                existingMember.totalSpend = totalSpend;
                existingMember.currentPoints = currentPoints;
                existingMember.updatedAt = new Date().toISOString();
                memberStore.set(existingMember.id, existingMember);
                return {
                    upgraded: false,
                    newLevel: computedLevel,
                    reason: `Auto-downgraded from level ${existingMember.tierLevel} to ${computedLevel} due to decreased spend/points`
                };
            }
        }
        return { upgraded: false, reason: 'No change needed' };
    }
    // ── 辅助方法 ───────────────────────────────────────────
    /**
     * 获取会员可用的权益列表
     */
    getMemberAvailableBenefits(memberId, tenantId) {
        const member = this.findMemberByMemberId(memberId, tenantId);
        if (!member || member.status !== svip_entity_1.SvipMemberStatus.Active)
            return null;
        return {
            benefits: this.listBenefits(member.tierId),
            tierLevel: member.tierLevel,
            tierName: member.tierName
        };
    }
    /**
     * 清除所有数据 (仅测试用)
     */
    resetSvipStoresForTests() {
        tierStore.clear();
        memberStore.clear();
        benefitStore.clear();
    }
};
exports.SvipService = SvipService;
exports.SvipService = SvipService = __decorate([
    (0, common_1.Injectable)()
], SvipService);
//# sourceMappingURL=svip.service.js.map