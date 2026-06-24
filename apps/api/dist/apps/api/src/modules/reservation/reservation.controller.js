"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReservationController = void 0;
const common_1 = require("@nestjs/common");
const tenant_decorator_1 = require("../tenant/tenant.decorator");
const reservation_dto_1 = require("./reservation.dto");
const reservation_entity_1 = require("./reservation.entity");
const reservation_service_1 = require("./reservation.service");
let ReservationController = class ReservationController {
    reservationService;
    constructor(reservationService) {
        this.reservationService = reservationService;
    }
    createReservation(tenantContext, body) {
        return this.reservationService.create({
            tenantId: tenantContext.tenantId,
            type: body.type,
            resourceId: body.resourceId,
            resourceName: body.resourceName,
            userId: body.userId,
            userName: body.userName,
            startTime: body.startTime,
            endTime: body.endTime,
            duration: body.duration,
            price: body.price,
            deposit: body.deposit,
            remark: body.remark
        });
    }
    findAll(tenantContext, query) {
        return this.reservationService.findAll(tenantContext.tenantId, query);
    }
    findOne(tenantContext, id) {
        const reservation = this.reservationService.findOne(id, tenantContext.tenantId);
        if (!reservation) {
            throw new common_1.HttpException('Reservation not found', common_1.HttpStatus.NOT_FOUND);
        }
        return reservation;
    }
    findByUser(tenantContext, userId) {
        return this.reservationService.findByUser(tenantContext.tenantId, userId);
    }
    findByResource(tenantContext, resourceId) {
        return this.reservationService.findByResource(tenantContext.tenantId, resourceId);
    }
    findByTimeRange(tenantContext, startDate, endDate) {
        if (!startDate || !endDate) {
            throw new common_1.HttpException('startDate and endDate are required', common_1.HttpStatus.BAD_REQUEST);
        }
        return this.reservationService.findByTimeRange(tenantContext.tenantId, startDate, endDate);
    }
    checkConflict(tenantContext, resourceId, startTime, endTime) {
        if (!resourceId || !startTime || !endTime) {
            throw new common_1.HttpException('resourceId, startTime, and endTime are required', common_1.HttpStatus.BAD_REQUEST);
        }
        try {
            this.reservationService.checkConflict(tenantContext.tenantId, resourceId, startTime, endTime);
            return { hasConflict: false };
        }
        catch {
            return { hasConflict: true };
        }
    }
    updateReservation(tenantContext, id, body) {
        // Status transitions
        if (body.status === reservation_entity_1.ReservationStatus.Confirmed) {
            return this.reservationService.confirm(id, tenantContext.tenantId);
        }
        if (body.status === reservation_entity_1.ReservationStatus.InProgress) {
            return this.reservationService.startProgress(id, tenantContext.tenantId);
        }
        if (body.status === reservation_entity_1.ReservationStatus.Completed) {
            return this.reservationService.complete(id, tenantContext.tenantId);
        }
        if (body.status === reservation_entity_1.ReservationStatus.Cancelled) {
            return this.reservationService.cancel(id, tenantContext.tenantId, body.remark);
        }
        // Field updates
        return this.reservationService.update(id, tenantContext.tenantId, {
            startTime: body.startTime,
            endTime: body.endTime,
            duration: body.duration,
            price: body.price,
            deposit: body.deposit,
            remark: body.remark,
            resourceName: body.resourceName
        });
    }
    cancelReservation(tenantContext, id, reason) {
        return this.reservationService.cancel(id, tenantContext.tenantId, reason);
    }
};
exports.ReservationController = ReservationController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, tenant_decorator_1.TenantContext)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, reservation_dto_1.CreateReservationDto]),
    __metadata("design:returntype", void 0)
], ReservationController.prototype, "createReservation", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, tenant_decorator_1.TenantContext)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, reservation_dto_1.ReservationQueryDto]),
    __metadata("design:returntype", void 0)
], ReservationController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, tenant_decorator_1.TenantContext)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], ReservationController.prototype, "findOne", null);
__decorate([
    (0, common_1.Get)('by-user/:userId'),
    __param(0, (0, tenant_decorator_1.TenantContext)()),
    __param(1, (0, common_1.Param)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], ReservationController.prototype, "findByUser", null);
__decorate([
    (0, common_1.Get)('by-resource/:resourceId'),
    __param(0, (0, tenant_decorator_1.TenantContext)()),
    __param(1, (0, common_1.Param)('resourceId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], ReservationController.prototype, "findByResource", null);
__decorate([
    (0, common_1.Get)('by-timerange'),
    __param(0, (0, tenant_decorator_1.TenantContext)()),
    __param(1, (0, common_1.Query)('startDate')),
    __param(2, (0, common_1.Query)('endDate')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", void 0)
], ReservationController.prototype, "findByTimeRange", null);
__decorate([
    (0, common_1.Get)('check-conflict'),
    __param(0, (0, tenant_decorator_1.TenantContext)()),
    __param(1, (0, common_1.Query)('resourceId')),
    __param(2, (0, common_1.Query)('startTime')),
    __param(3, (0, common_1.Query)('endTime')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String]),
    __metadata("design:returntype", void 0)
], ReservationController.prototype, "checkConflict", null);
__decorate([
    (0, common_1.Patch)(':id'),
    __param(0, (0, tenant_decorator_1.TenantContext)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, reservation_dto_1.UpdateReservationDto]),
    __metadata("design:returntype", void 0)
], ReservationController.prototype, "updateReservation", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, tenant_decorator_1.TenantContext)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Query)('reason')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", void 0)
], ReservationController.prototype, "cancelReservation", null);
exports.ReservationController = ReservationController = __decorate([
    (0, common_1.Controller)('reservations'),
    __metadata("design:paramtypes", [reservation_service_1.ReservationService])
], ReservationController);
//# sourceMappingURL=reservation.controller.js.map