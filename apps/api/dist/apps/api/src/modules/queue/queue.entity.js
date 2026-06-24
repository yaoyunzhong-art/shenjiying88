"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QueueEntity = exports.QUEUE_STATUS_TRANSITIONS = exports.QueueStatus = exports.QueueType = void 0;
var QueueType;
(function (QueueType) {
    QueueType["Booking"] = "booking";
    QueueType["Waiting"] = "waiting";
    QueueType["Service"] = "service";
})(QueueType || (exports.QueueType = QueueType = {}));
var QueueStatus;
(function (QueueStatus) {
    QueueStatus["Waiting"] = "waiting";
    QueueStatus["Called"] = "called";
    QueueStatus["Serving"] = "serving";
    QueueStatus["Completed"] = "completed";
    QueueStatus["Cancelled"] = "cancelled";
    QueueStatus["NoShow"] = "no_show";
})(QueueStatus || (exports.QueueStatus = QueueStatus = {}));
exports.QUEUE_STATUS_TRANSITIONS = {
    [QueueStatus.Waiting]: [QueueStatus.Called, QueueStatus.Cancelled],
    [QueueStatus.Called]: [QueueStatus.Serving, QueueStatus.NoShow, QueueStatus.Cancelled],
    [QueueStatus.Serving]: [QueueStatus.Completed, QueueStatus.Cancelled],
    [QueueStatus.Completed]: [],
    [QueueStatus.Cancelled]: [],
    [QueueStatus.NoShow]: []
};
class QueueEntity {
    id;
    tenantId;
    type;
    queueNumber;
    userId;
    userName;
    phone;
    partySize;
    resourceId;
    resourceName;
    status;
    priority;
    estimatedWaitMin;
    actualWaitMin;
    calledAt;
    servedAt;
    completedAt;
    remark;
    createdAt;
    updatedAt;
}
exports.QueueEntity = QueueEntity;
//# sourceMappingURL=queue.entity.js.map