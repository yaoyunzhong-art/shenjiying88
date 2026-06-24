"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReservationService = void 0;
const node_crypto_1 = require("node:crypto");
const common_1 = require("@nestjs/common");
const reservation_entity_1 = require("./reservation.entity");
let ReservationService = class ReservationService {
    reservationStore = new Map();
    // ── CRUD ───────────────────────────────────────────────────────────
    create(input) {
        if (new Date(input.endTime) <= new Date(input.startTime)) {
            throw new Error('endTime must be after startTime');
        }
        const now = new Date();
        const reservation = new reservation_entity_1.ReservationEntity();
        reservation.id = `reservation-${(0, node_crypto_1.randomUUID)()}`;
        reservation.tenantId = input.tenantId;
        reservation.type = input.type;
        reservation.resourceId = input.resourceId;
        reservation.resourceName = input.resourceName;
        reservation.userId = input.userId;
        reservation.userName = input.userName;
        reservation.status = reservation_entity_1.ReservationStatus.Pending;
        reservation.startTime = new Date(input.startTime);
        reservation.endTime = new Date(input.endTime);
        reservation.duration = input.duration;
        reservation.price = input.price;
        reservation.deposit = input.deposit;
        reservation.remark = input.remark;
        reservation.createdAt = now;
        reservation.updatedAt = now;
        this.reservationStore.set(reservation.id, reservation);
        return reservation;
    }
    findAll(tenantId, filter) {
        return Array.from(this.reservationStore.values())
            .filter((r) => r.tenantId === tenantId)
            .filter((r) => (filter?.type ? r.type === filter.type : true))
            .filter((r) => (filter?.resourceId ? r.resourceId === filter.resourceId : true))
            .filter((r) => (filter?.userId ? r.userId === filter.userId : true))
            .filter((r) => (filter?.status ? r.status === filter.status : true))
            .filter((r) => {
            if (!filter?.startDate)
                return true;
            return r.startTime >= new Date(filter.startDate);
        })
            .filter((r) => {
            if (!filter?.endDate)
                return true;
            return r.endTime <= new Date(filter.endDate);
        })
            .sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
    }
    findOne(id, tenantId) {
        const reservation = this.reservationStore.get(id);
        if (!reservation || reservation.tenantId !== tenantId)
            return undefined;
        return reservation;
    }
    update(id, tenantId, data) {
        const reservation = this.assertOwned(id, tenantId);
        if (data.startTime !== undefined) {
            reservation.startTime = new Date(data.startTime);
        }
        if (data.endTime !== undefined) {
            reservation.endTime = new Date(data.endTime);
        }
        if (data.duration !== undefined) {
            reservation.duration = data.duration;
        }
        if (data.price !== undefined) {
            reservation.price = data.price;
        }
        if (data.deposit !== undefined) {
            reservation.deposit = data.deposit;
        }
        if (data.remark !== undefined) {
            reservation.remark = data.remark;
        }
        if (data.resourceName !== undefined) {
            reservation.resourceName = data.resourceName;
        }
        reservation.updatedAt = new Date();
        this.reservationStore.set(id, reservation);
        return reservation;
    }
    cancel(id, tenantId, reason) {
        const reservation = this.assertOwned(id, tenantId);
        this.assertStatusTransition(reservation.status, reservation_entity_1.ReservationStatus.Cancelled);
        reservation.status = reservation_entity_1.ReservationStatus.Cancelled;
        reservation.cancelledAt = new Date();
        reservation.cancelledReason = reason;
        reservation.updatedAt = new Date();
        this.reservationStore.set(id, reservation);
        return reservation;
    }
    confirm(id, tenantId) {
        const reservation = this.assertOwned(id, tenantId);
        this.assertStatusTransition(reservation.status, reservation_entity_1.ReservationStatus.Confirmed);
        // Conflict detection on confirm
        this.checkConflict(reservation.tenantId, reservation.resourceId, reservation.startTime.toISOString(), reservation.endTime.toISOString(), reservation.id);
        reservation.status = reservation_entity_1.ReservationStatus.Confirmed;
        reservation.updatedAt = new Date();
        this.reservationStore.set(id, reservation);
        return reservation;
    }
    startProgress(id, tenantId) {
        const reservation = this.assertOwned(id, tenantId);
        this.assertStatusTransition(reservation.status, reservation_entity_1.ReservationStatus.InProgress);
        reservation.status = reservation_entity_1.ReservationStatus.InProgress;
        reservation.updatedAt = new Date();
        this.reservationStore.set(id, reservation);
        return reservation;
    }
    complete(id, tenantId) {
        const reservation = this.assertOwned(id, tenantId);
        this.assertStatusTransition(reservation.status, reservation_entity_1.ReservationStatus.Completed);
        reservation.status = reservation_entity_1.ReservationStatus.Completed;
        reservation.updatedAt = new Date();
        this.reservationStore.set(id, reservation);
        return reservation;
    }
    // ── 冲突检测 ───────────────────────────────────────────────────────
    checkConflict(tenantId, resourceId, startTime, endTime, excludeId) {
        const conflicts = Array.from(this.reservationStore.values())
            .filter((r) => r.tenantId === tenantId)
            .filter((r) => r.resourceId === resourceId)
            .filter((r) => r.status === reservation_entity_1.ReservationStatus.Confirmed)
            .filter((r) => (excludeId ? r.id !== excludeId : true))
            .filter((r) => this.isOverlapping(r.startTime.toISOString(), r.endTime.toISOString(), startTime, endTime));
        if (conflicts.length > 0) {
            throw new Error(`Resource ${resourceId} is already booked from ${startTime} to ${endTime}`);
        }
    }
    // ── Query helpers ──────────────────────────────────────────────────
    findByTimeRange(tenantId, startDate, endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        return Array.from(this.reservationStore.values())
            .filter((r) => r.tenantId === tenantId)
            .filter((r) => r.startTime >= start && r.endTime <= end)
            .sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
    }
    findByUser(tenantId, userId) {
        return Array.from(this.reservationStore.values())
            .filter((r) => r.tenantId === tenantId)
            .filter((r) => r.userId === userId)
            .sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
    }
    findByResource(tenantId, resourceId) {
        return Array.from(this.reservationStore.values())
            .filter((r) => r.tenantId === tenantId)
            .filter((r) => r.resourceId === resourceId)
            .sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
    }
    // ── Internals ──────────────────────────────────────────────────────
    assertOwned(id, tenantId) {
        const reservation = this.reservationStore.get(id);
        if (!reservation || reservation.tenantId !== tenantId) {
            throw new Error(`Reservation not found: ${id}`);
        }
        return reservation;
    }
    assertStatusTransition(from, to) {
        const allowed = reservation_entity_1.RESERVATION_STATUS_TRANSITIONS[from];
        if (!allowed.includes(to)) {
            throw new Error(`Invalid reservation status transition: ${from} → ${to}`);
        }
    }
    isOverlapping(startA, endA, startB, endB) {
        return new Date(startA) < new Date(endB) && new Date(endA) > new Date(startB);
    }
    // Testing helper
    resetStoreForTests() {
        this.reservationStore.clear();
    }
};
exports.ReservationService = ReservationService;
exports.ReservationService = ReservationService = __decorate([
    (0, common_1.Injectable)()
], ReservationService);
//# sourceMappingURL=reservation.service.js.map