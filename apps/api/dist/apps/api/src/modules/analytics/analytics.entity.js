"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DiagnosticCategory = exports.DiagnosticSeverity = exports.AnalyticsScope = void 0;
var AnalyticsScope;
(function (AnalyticsScope) {
    AnalyticsScope["Tenant"] = "TENANT";
    AnalyticsScope["Brand"] = "BRAND";
    AnalyticsScope["Store"] = "STORE";
})(AnalyticsScope || (exports.AnalyticsScope = AnalyticsScope = {}));
var DiagnosticSeverity;
(function (DiagnosticSeverity) {
    DiagnosticSeverity["Info"] = "INFO";
    DiagnosticSeverity["Warning"] = "WARNING";
    DiagnosticSeverity["Critical"] = "CRITICAL";
})(DiagnosticSeverity || (exports.DiagnosticSeverity = DiagnosticSeverity = {}));
var DiagnosticCategory;
(function (DiagnosticCategory) {
    DiagnosticCategory["PaymentHealth"] = "PAYMENT_HEALTH";
    DiagnosticCategory["CouponPerformance"] = "COUPON_PERFORMANCE";
    DiagnosticCategory["BlindboxEngagement"] = "BLINDBOX_ENGAGEMENT";
    DiagnosticCategory["MemberActivity"] = "MEMBER_ACTIVITY";
    DiagnosticCategory["PointEconomy"] = "POINT_ECONOMY";
    DiagnosticCategory["ConcentrationRisk"] = "CONCENTRATION_RISK";
})(DiagnosticCategory || (exports.DiagnosticCategory = DiagnosticCategory = {}));
//# sourceMappingURL=analytics.entity.js.map