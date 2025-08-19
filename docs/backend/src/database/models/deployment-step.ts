import { Model, DataTypes, Sequelize } from 'sequelize';
import { sequelize } from '../sequelize';

export interface DeploymentStepAttributes {
  id: number;
  uuid: string;
  deployment_uuid: string;
  step_name: string;
  display_name: string;
  step_order: number;
  step_type: 'validation' | 'deployment' | 'configuration' | 'service' | 'testing' | 'backup' | 'cleanup';
  status: 'pending' | 'running' | 'success' | 'failed' | 'skipped' | 'cancelled';
  
  // 时间信息
  start_time?: Date;
  end_time?: Date;
  duration: number;
  
  // 进度信息
  progress: number;
  total_steps?: number;
  current_step?: number;
  
  // 日志和错误
  logs?: string;
  error_message?: string;
  error_code?: string;
  
  // 步骤配置
  is_required: boolean;
  can_retry: boolean;
  retry_count: number;
  max_retries: number;
  
  // 依赖关系
  depends_on?: string; // 依赖的其他步骤UUID，逗号分隔
  
  // 步骤结果
  result_data?: string; // JSON格式的结果数据
  artifacts?: string; // 生成的产物信息
  
  // 元数据
  metadata?: string; // JSON格式的元数据
  
  created_at: Date;
  updated_at: Date;
}

export interface DeploymentStepCreationAttributes extends Omit<DeploymentStepAttributes, 'id' | 'uuid' | 'created_at' | 'updated_at'> {
  uuid?: string;
}

export class DeploymentStep extends Model<DeploymentStepAttributes, DeploymentStepCreationAttributes> implements DeploymentStepAttributes {
  public id!: number;
  public uuid!: string;
  public deployment_uuid!: string;
  public step_name!: string;
  public display_name!: string;
  public step_order!: number;
  public step_type!: 'validation' | 'deployment' | 'configuration' | 'service' | 'testing' | 'backup' | 'cleanup';
  public status!: 'pending' | 'running' | 'success' | 'failed' | 'skipped' | 'cancelled';
  
  // 时间信息
  public start_time?: Date;
  public end_time?: Date;
  public duration!: number;
  
  // 进度信息
  public progress!: number;
  public total_steps?: number;
  public current_step?: number;
  
  // 日志和错误
  public logs?: string;
  public error_message?: string;
  public error_code?: string;
  
  // 步骤配置
  public is_required!: boolean;
  public can_retry!: boolean;
  public retry_count!: number;
  public max_retries!: number;
  
  // 依赖关系
  public depends_on?: string;
  
  // 步骤结果
  public result_data?: string;
  public artifacts?: string;
  
  // 元数据
  public metadata?: string;
  
  public created_at!: Date;
  public updated_at!: Date;
  
  // 关联关系
  public readonly deployment?: any;
}

DeploymentStep.init(
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
    deployment_uuid: {
      type: DataTypes.UUID,
      allowNull: false,
      comment: '关联的部署UUID',
      references: {
        model: 'deployments',
        key: 'uuid',
      },
    },
    step_name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: '步骤名称（内部标识）',
    },
    display_name: {
      type: DataTypes.STRING(200),
      allowNull: false,
      comment: '步骤显示名称',
    },
    step_order: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: '步骤执行顺序',
    },
    step_type: {
      type: DataTypes.ENUM('validation', 'deployment', 'configuration', 'service', 'testing', 'backup', 'cleanup'),
      allowNull: false,
      comment: '步骤类型',
    },
    status: {
      type: DataTypes.ENUM('pending', 'running', 'success', 'failed', 'skipped', 'cancelled'),
      allowNull: false,
      defaultValue: 'pending',
      comment: '步骤状态',
    },
    
    // 时间信息
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
      comment: '执行时长（秒）',
    },
    
    // 进度信息
    progress: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: '进度百分比（0-100）',
    },
    total_steps: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: '总子步骤数',
    },
    current_step: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: '当前子步骤',
    },
    
    // 日志和错误
    logs: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '执行日志',
    },
    error_message: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '错误信息',
    },
    error_code: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: '错误代码',
    },
    
    // 步骤配置
    is_required: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      comment: '是否必需步骤',
    },
    can_retry: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      comment: '是否可以重试',
    },
    retry_count: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: '重试次数',
    },
    max_retries: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 3,
      comment: '最大重试次数',
    },
    
    // 依赖关系
    depends_on: {
      type: DataTypes.STRING(500),
      allowNull: true,
      comment: '依赖的步骤UUID（逗号分隔）',
    },
    
    // 步骤结果
    result_data: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '结果数据（JSON格式）',
    },
    artifacts: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '生成的产物信息（JSON格式）',
    },
    
    // 元数据
    metadata: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '元数据（JSON格式）',
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
    tableName: 'deployment_steps',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        unique: true,
        fields: ['uuid'],
      },
      {
        fields: ['deployment_uuid'],
      },
      {
        fields: ['step_name'],
      },
      {
        fields: ['status'],
      },
      {
        fields: ['step_order'],
      },
      {
        fields: ['step_type'],
      },
    ],
  }
);

// 定义关联关系 - 延迟加载以避免循环依赖
export const setupDeploymentStepAssociations = () => {
  const { default: Deployment } = require('./deployment');
  DeploymentStep.belongsTo(Deployment, {
    foreignKey: 'deployment_uuid',
    targetKey: 'uuid',
    as: 'deployment',
  });
};

export default DeploymentStep;
