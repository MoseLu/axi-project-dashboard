"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Deployment = void 0;
const sequelize_1 = require("sequelize");
const sequelize_2 = require("../sequelize");
class Deployment extends sequelize_1.Model {
}
exports.Deployment = Deployment;
Deployment.init({
    id: {
        type: sequelize_1.DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    uuid: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: false,
        defaultValue: sequelize_1.DataTypes.UUIDV4,
        unique: true,
        comment: '唯一标识符',
    },
    project_name: {
        type: sequelize_1.DataTypes.STRING(100),
        allowNull: false,
        comment: '项目名称',
    },
    repository: {
        type: sequelize_1.DataTypes.STRING(255),
        allowNull: false,
        comment: '仓库地址',
    },
    branch: {
        type: sequelize_1.DataTypes.STRING(100),
        allowNull: false,
        comment: '分支名称',
    },
    commit_hash: {
        type: sequelize_1.DataTypes.STRING(40),
        allowNull: false,
        comment: '提交哈希',
    },
    status: {
        type: sequelize_1.DataTypes.ENUM('pending', 'running', 'success', 'failed', 'cancelled'),
        allowNull: false,
        defaultValue: 'pending',
        comment: '部署状态',
    },
    start_time: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
        comment: '开始时间',
    },
    end_time: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
        comment: '结束时间',
    },
    duration: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        comment: '部署耗时（秒）',
    },
    triggered_by: {
        type: sequelize_1.DataTypes.STRING(50),
        allowNull: true,
        comment: '触发者',
    },
    trigger_type: {
        type: sequelize_1.DataTypes.ENUM('push', 'manual', 'schedule'),
        allowNull: false,
        defaultValue: 'manual',
        comment: '触发类型',
    },
    logs: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: true,
        comment: '部署日志',
    },
    metadata: {
        type: sequelize_1.DataTypes.JSON,
        allowNull: true,
        comment: '元数据',
    },
    created_at: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: false,
        defaultValue: sequelize_1.DataTypes.NOW,
    },
    updated_at: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: false,
        defaultValue: sequelize_1.DataTypes.NOW,
    },
}, {
    sequelize: sequelize_2.sequelize,
    tableName: 'deployments',
    timestamps: true,
    indexes: [
        {
            fields: ['uuid'],
        },
        {
            fields: ['project_name'],
        },
        {
            fields: ['status'],
        },
        {
            fields: ['created_at'],
        },
    ],
});
exports.default = Deployment;
//# sourceMappingURL=deployment.js.map