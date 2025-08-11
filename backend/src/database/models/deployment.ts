import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../sequelize';

export interface DeploymentAttributes {
  id: number;
  project: string;
  status: 'success' | 'failed' | 'running';
  duration: number;
  timestamp: string;
  createdAt: string;
  updatedAt: string;
  sourceRepo?: string;
  runId?: string;
  deployType?: 'backend' | 'static';
  serverHost?: string;
  logs?: string;
  errorMessage?: string;
}

export interface DeploymentCreationAttributes extends Optional<DeploymentAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

export class Deployment extends Model<DeploymentAttributes, DeploymentCreationAttributes> implements DeploymentAttributes {
  public id!: number;
  public project!: string;
  public status!: 'success' | 'failed' | 'running';
  public duration!: number;
  public timestamp!: string;
  public createdAt!: string;
  public updatedAt!: string;
  public sourceRepo?: string;
  public runId?: string;
  public deployType?: 'backend' | 'static';
  public serverHost?: string;
  public logs?: string;
  public errorMessage?: string;
}

Deployment.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    project: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: '项目名称',
    },
    status: {
      type: DataTypes.ENUM('success', 'failed', 'running'),
      allowNull: false,
      defaultValue: 'running',
      comment: '部署状态',
    },
    duration: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: '部署耗时（秒）',
    },
    timestamp: {
      type: DataTypes.DATE,
      allowNull: false,
      comment: '部署时间戳',
    },
    sourceRepo: {
      type: DataTypes.STRING(200),
      allowNull: true,
      comment: '源仓库地址',
    },
    runId: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: 'GitHub Actions 运行ID',
    },
    deployType: {
      type: DataTypes.ENUM('backend', 'static'),
      allowNull: true,
      comment: '部署类型',
    },
    serverHost: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: '服务器地址',
    },
    logs: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '部署日志',
    },
    errorMessage: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '错误信息',
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
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
  }
);

export default Deployment;
