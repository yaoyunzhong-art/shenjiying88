"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReservationEntity = exports.RESERVATION_STATUS_TRANSITIONS = exports.ReservationStatus = exports.ReservationType = void 0;
var ReservationType;
(function (ReservationType) {
    ReservationType["Venue"] = "venue";
    ReservationType["Equipment"] = "equipment";
    ReservationType["Service"] = "service";
    ReservationType["Class"] = "class";
})(ReservationType || (exports.ReservationType = ReservationType = {}));
var ReservationStatus;
(function (ReservationStatus) {
    ReservationStatus["Pending"] = "pending";
    ReservationStatus["Confirmed"] = "confirmed";
    ReservationStatus["InProgress"] = "in_progress";
    ReservationStatus["Completed"] = "completed";
    ReservationStatus["Cancelled"] = "cancelled";
})(ReservationStatus || (exports.ReservationStatus = ReservationStatus = {}));
exports.RESERVATION_STATUS_TRANSITIONS = {
    [ReservationStatus.Pending]: [ReservationStatus.Confirmed, ReservationStatus.Cancelled],
    [ReservationStatus.Confirmed]: [ReservationStatus.InProgress, ReservationStatus.Cancelled],
    [ReservationStatus.InProgress]: [ReservationStatus.Completed, ReservationStatus.Cancelled],
    [ReservationStatus.Completed]: [],
    [ReservationStatus.Cancelled]: []
};
class ReservationEntity {
    id;
    tenantId;
    type;
    resourceId;
    resourceName;
    userId;
    userName;
    status;
    startTime;
    endTime;
    duration;
    price;
    deposit;
    remark;
    createdAt;
    updatedAt;
    cancelledAt;
    cancelledReason;
}
exports.ReservationEntity = ReservationEntity;
//# sourceMappingURL=reservation.entity.js.map