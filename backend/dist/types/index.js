"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FilterOperator = exports.SocketEventType = exports.DeliveryStatus = exports.NotificationChannel = exports.NotificationLevel = exports.NotificationType = exports.LogLevel = exports.StepStatus = exports.TriggerType = exports.DeploymentStatus = exports.UserRole = void 0;
var UserRole;
(function (UserRole) {
    UserRole["ADMIN"] = "admin";
    UserRole["MAINTAINER"] = "maintainer";
    UserRole["DEVELOPER"] = "developer";
    UserRole["VIEWER"] = "viewer";
})(UserRole || (exports.UserRole = UserRole = {}));
var DeploymentStatus;
(function (DeploymentStatus) {
    DeploymentStatus["PENDING"] = "pending";
    DeploymentStatus["IN_PROGRESS"] = "in_progress";
    DeploymentStatus["SUCCESS"] = "success";
    DeploymentStatus["FAILURE"] = "failure";
    DeploymentStatus["CANCELLED"] = "cancelled";
    DeploymentStatus["SKIPPED"] = "skipped";
})(DeploymentStatus || (exports.DeploymentStatus = DeploymentStatus = {}));
var TriggerType;
(function (TriggerType) {
    TriggerType["MANUAL"] = "manual";
    TriggerType["PUSH"] = "push";
    TriggerType["PULL_REQUEST"] = "pull_request";
    TriggerType["SCHEDULE"] = "schedule";
    TriggerType["WEBHOOK"] = "webhook";
    TriggerType["API"] = "api";
})(TriggerType || (exports.TriggerType = TriggerType = {}));
var StepStatus;
(function (StepStatus) {
    StepStatus["PENDING"] = "pending";
    StepStatus["IN_PROGRESS"] = "in_progress";
    StepStatus["SUCCESS"] = "success";
    StepStatus["FAILURE"] = "failure";
    StepStatus["SKIPPED"] = "skipped";
    StepStatus["RETRYING"] = "retrying";
    StepStatus["CANCELLED"] = "cancelled";
})(StepStatus || (exports.StepStatus = StepStatus = {}));
var LogLevel;
(function (LogLevel) {
    LogLevel["DEBUG"] = "debug";
    LogLevel["INFO"] = "info";
    LogLevel["WARN"] = "warn";
    LogLevel["ERROR"] = "error";
    LogLevel["FATAL"] = "fatal";
})(LogLevel || (exports.LogLevel = LogLevel = {}));
var NotificationType;
(function (NotificationType) {
    NotificationType["DEPLOYMENT_STARTED"] = "deployment_started";
    NotificationType["DEPLOYMENT_SUCCESS"] = "deployment_success";
    NotificationType["DEPLOYMENT_FAILURE"] = "deployment_failure";
    NotificationType["DEPLOYMENT_CANCELLED"] = "deployment_cancelled";
    NotificationType["SYSTEM_ALERT"] = "system_alert";
    NotificationType["USER_ACTION"] = "user_action";
    NotificationType["SECURITY_ALERT"] = "security_alert";
})(NotificationType || (exports.NotificationType = NotificationType = {}));
var NotificationLevel;
(function (NotificationLevel) {
    NotificationLevel["INFO"] = "info";
    NotificationLevel["SUCCESS"] = "success";
    NotificationLevel["WARNING"] = "warning";
    NotificationLevel["ERROR"] = "error";
    NotificationLevel["CRITICAL"] = "critical";
})(NotificationLevel || (exports.NotificationLevel = NotificationLevel = {}));
var NotificationChannel;
(function (NotificationChannel) {
    NotificationChannel["EMAIL"] = "email";
    NotificationChannel["SLACK"] = "slack";
    NotificationChannel["WEBHOOK"] = "webhook";
    NotificationChannel["IN_APP"] = "in_app";
    NotificationChannel["SMS"] = "sms";
    NotificationChannel["WECHAT"] = "wechat";
    NotificationChannel["DINGTALK"] = "dingtalk";
})(NotificationChannel || (exports.NotificationChannel = NotificationChannel = {}));
var DeliveryStatus;
(function (DeliveryStatus) {
    DeliveryStatus["PENDING"] = "pending";
    DeliveryStatus["SENT"] = "sent";
    DeliveryStatus["DELIVERED"] = "delivered";
    DeliveryStatus["FAILED"] = "failed";
    DeliveryStatus["BOUNCED"] = "bounced";
})(DeliveryStatus || (exports.DeliveryStatus = DeliveryStatus = {}));
var SocketEventType;
(function (SocketEventType) {
    SocketEventType["DEPLOYMENT_STARTED"] = "deployment:started";
    SocketEventType["DEPLOYMENT_UPDATED"] = "deployment:updated";
    SocketEventType["DEPLOYMENT_COMPLETED"] = "deployment:completed";
    SocketEventType["DEPLOYMENT_FAILED"] = "deployment:failed";
    SocketEventType["STEP_STARTED"] = "step:started";
    SocketEventType["STEP_UPDATED"] = "step:updated";
    SocketEventType["STEP_COMPLETED"] = "step:completed";
    SocketEventType["STEP_FAILED"] = "step:failed";
    SocketEventType["STEP_RETRYING"] = "step:retrying";
    SocketEventType["LOG_ENTRY"] = "log:entry";
    SocketEventType["LOG_BATCH"] = "log:batch";
    SocketEventType["SYSTEM_ALERT"] = "system:alert";
    SocketEventType["METRICS_UPDATE"] = "metrics:update";
    SocketEventType["USER_CONNECTED"] = "user:connected";
    SocketEventType["USER_DISCONNECTED"] = "user:disconnected";
    SocketEventType["USER_TYPING"] = "user:typing";
    SocketEventType["CONNECTION_ESTABLISHED"] = "connection:established";
    SocketEventType["CONNECTION_ERROR"] = "connection:error";
    SocketEventType["HEARTBEAT"] = "heartbeat";
})(SocketEventType || (exports.SocketEventType = SocketEventType = {}));
var FilterOperator;
(function (FilterOperator) {
    FilterOperator["EQUALS"] = "eq";
    FilterOperator["NOT_EQUALS"] = "ne";
    FilterOperator["GREATER_THAN"] = "gt";
    FilterOperator["GREATER_THAN_OR_EQUAL"] = "gte";
    FilterOperator["LESS_THAN"] = "lt";
    FilterOperator["LESS_THAN_OR_EQUAL"] = "lte";
    FilterOperator["CONTAINS"] = "contains";
    FilterOperator["STARTS_WITH"] = "startsWith";
    FilterOperator["ENDS_WITH"] = "endsWith";
    FilterOperator["IN"] = "in";
    FilterOperator["NOT_IN"] = "notIn";
    FilterOperator["BETWEEN"] = "between";
    FilterOperator["IS_NULL"] = "isNull";
    FilterOperator["IS_NOT_NULL"] = "isNotNull";
})(FilterOperator || (exports.FilterOperator = FilterOperator = {}));
__exportStar(require("./express"), exports);
//# sourceMappingURL=index.js.map