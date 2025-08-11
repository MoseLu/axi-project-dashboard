import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../sequelize';

export interface DeploymentAttributes {
  id: number;
  uuid: string;
  project_name: string;
  repository: string;
  branch: string;
  commit_hash: string;
  status: 'pending' | 'running' | 'success' | 'failed' | 'cancelled';
  start_time?: string;
  end_time?: string;
  duration: number;
  triggered_by?: string;
  trigger_type: 'push' | 'manual' | 'schedule';
  logs?: string;
  metadata?: any;
  created_at: string;
  updated_at: string;
}

export interface DeploymentCreationAttributes extends Optional<DeploymentAttributes, 'id' | 'created_at' | 'updated_at'> {}

export class Deployment extends Model<DeploymentAttributes, DeploymentCreationAttributes> implements DeploymentAttributes {
  public id!: number;
  public uuid!: string;
  public project_name!: string;
  public repository!: string;
  public branch!: string;
  public commit_hash!: string;
  public status!: 'pending' | 'running' | 'success' | 'failed' | 'cancelled';
  public start_time?: string;
  public end_time?: string;
  public duration!: number;
  public triggered_by?: string;
  public trigger_type!: 'push' | 'manual' | 'schedule';
  public logs?: string;
  public metadata?: any;
  public created_at!: string;
  public updated_at!: string;
}

Deployment.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    uuid: {
      type: DataTypes.UUID,
      allowNull: false,
      defaultValue: DataTypes.UUIDV4,
      unique: true,
      comment: '唯一标识符',
    },
    project_name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: '项目名称',
    },
    repository: {
      type: DataTypes.STRING(255),
      allowNull: false,
      comment: '仓库地址',
    },
    branch: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: '分支名称',
    },
    commit_hash: {
      type: DataTypes.STRING(40),
      allowNull: false,
      comment: '提交哈希',
    },
    status: {
      type: DataTypes.ENUM('pending', 'running', 'success', 'failed', 'cancelled'),
      allowNull: false,
      defaultValue: 'pending',
      comment: '部署状态',
    },
    start_time: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: '开始时间',
    },
    end_time: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: '结束时间',
    },
    duration: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: '部署耗时（秒）',
    },
    triggered_by: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: '触发者',
    },
    trigger_type: {
      type: DataTypes.ENUM('push', 'manual', 'schedule'),
      allowNull: false,
      defaultValue: 'manual',
      comment: '触发类型',
    },
    logs: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '部署日志',
    },
    metadata: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: '元数据',
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
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
  }
);

export default Deployment;
