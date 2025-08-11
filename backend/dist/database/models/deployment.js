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
    project: {
        type: sequelize_1.DataTypes.STRING(100),
        allowNull: false,
        comment: '项目名称',
    },
    status: {
        type: sequelize_1.DataTypes.ENUM('success', 'failed', 'running'),
        allowNull: false,
        defaultValue: 'running',
        comment: '部署状态',
    },
    duration: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        comment: '部署耗时（秒）',
    },
    timestamp: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: false,
        comment: '部署时间戳',
    },
    sourceRepo: {
        type: sequelize_1.DataTypes.STRING(200),
        allowNull: true,
        comment: '源仓库地址',
    },
    runId: {
        type: sequelize_1.DataTypes.STRING(50),
        allowNull: true,
        comment: 'GitHub Actions 运行ID',
    },
    deployType: {
        type: sequelize_1.DataTypes.ENUM('backend', 'static'),
        allowNull: true,
        comment: '部署类型',
    },
    serverHost: {
        type: sequelize_1.DataTypes.STRING(100),
        allowNull: true,
        comment: '服务器地址',
    },
    logs: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: true,
        comment: '部署日志',
    },
    errorMessage: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: true,
        comment: '错误信息',
    },
    createdAt: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: false,
        defaultValue: sequelize_1.DataTypes.NOW,
    },
    updatedAt: {
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
            fields: ['project'],
        },
        {
            fields: ['status'],
        },
        {
            fields: ['timestamp'],
        },
        {
            fields: ['createdAt'],
        },
    ],
});
exports.default = Deployment;
//# sourceMappingURL=deployment.js.map