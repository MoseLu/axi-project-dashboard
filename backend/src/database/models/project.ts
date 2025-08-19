import { Model, DataTypes, Sequelize } from 'sequelize';
import { sequelize } from '../sequelize';

export interface ProjectAttributes {
  id: number;
  uuid: string;
  name: string;
  display_name: string;
  description?: string;
  repository: string;
  branch: string;
  deploy_type: 'static' | 'backend';
  status: 'active' | 'inactive' | 'maintenance';
  
  // 部署配置
  deploy_path: string;
  nginx_config?: string;
  start_command?: string;
  environment_variables?: string;
  
  // 运行状态
  is_running: boolean;
  port?: number;
  url?: string;
  memory_usage?: number;
  disk_usage?: number;
  cpu_usage?: number;
  uptime?: number;
  last_health_check?: Date;
  
  // 数据库状态
  has_mysql: boolean;
  mysql_status?: 'running' | 'stopped' | 'error';
  mysql_backup_enabled: boolean;
  mysql_backup_schedule?: string;
  mysql_backup_last?: Date;
  mysql_backup_path?: string;
  
  has_redis: boolean;
  redis_status?: 'running' | 'stopped' | 'error';
  redis_port?: number;
  
  // 监控配置
  health_check_url?: string;
  health_check_interval: number;
  auto_restart: boolean;
  restart_threshold: number;
  
  // 统计信息
  total_deployments: number;
  successful_deployments: number;
  failed_deployments: number;
  last_deployment?: Date;
  average_deployment_time: number;
  
  created_at: Date;
  updated_at: Date;
}

export interface ProjectCreationAttributes extends Omit<ProjectAttributes, 'id' | 'uuid' | 'created_at' | 'updated_at'> {
  uuid?: string;
}

export class Project extends Model<ProjectAttributes, ProjectCreationAttributes> implements ProjectAttributes {
  public id!: number;
  public uuid!: string;
  public name!: string;
  public display_name!: string;
  public description?: string;
  public repository!: string;
  public branch!: string;
  public deploy_type!: 'static' | 'backend';
  public status!: 'active' | 'inactive' | 'maintenance';
  
  // 部署配置
  public deploy_path!: string;
  public nginx_config?: string;
  public start_command?: string;
  public environment_variables?: string;
  
  // 运行状态
  public is_running!: boolean;
  public port?: number;
  public url?: string;
  public memory_usage?: number;
  public disk_usage?: number;
  public cpu_usage?: number;
  public uptime?: number;
  public last_health_check?: Date;
  
  // 数据库状态
  public has_mysql!: boolean;
  public mysql_status?: 'running' | 'stopped' | 'error';
  public mysql_backup_enabled!: boolean;
  public mysql_backup_schedule?: string;
  public mysql_backup_last?: Date;
  public mysql_backup_path?: string;
  
  public has_redis!: boolean;
  public redis_status?: 'running' | 'stopped' | 'error';
  public redis_port?: number;
  
  // 监控配置
  public health_check_url?: string;
  public health_check_interval!: number;
  public auto_restart!: boolean;
  public restart_threshold!: number;
  
  // 统计信息
  public total_deployments!: number;
  public successful_deployments!: number;
  public failed_deployments!: number;
  public last_deployment?: Date;
  public average_deployment_time!: number;
  
  public created_at!: Date;
  public updated_at!: Date;
}

Project.init(
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
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
      comment: '项目名称（唯一标识）',
    },
    display_name: {
      type: DataTypes.STRING(200),
      allowNull: false,
      comment: '项目显示名称',
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '项目描述',
    },
    repository: {
      type: DataTypes.STRING(255),
      allowNull: false,
      comment: 'Git仓库地址',
    },
    branch: {
      type: DataTypes.STRING(100),
      allowNull: false,
      defaultValue: 'main',
      comment: '默认分支',
    },
    deploy_type: {
      type: DataTypes.ENUM('static', 'backend'),
      allowNull: false,
      defaultValue: 'static',
      comment: '部署类型',
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive', 'maintenance'),
      allowNull: false,
      defaultValue: 'active',
      comment: '项目状态',
    },
    
    // 部署配置
    deploy_path: {
      type: DataTypes.STRING(255),
      allowNull: false,
      comment: '部署路径',
    },
    nginx_config: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Nginx配置',
    },
    start_command: {
      type: DataTypes.STRING(500),
      allowNull: true,
      comment: '启动命令',
    },
    environment_variables: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '环境变量（JSON格式）',
    },
    
    // 运行状态
    is_running: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: '是否正在运行',
    },
    port: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: '运行端口',
    },
    url: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: '访问URL',
    },
    memory_usage: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: '内存使用量（MB）',
    },
    disk_usage: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: '磁盘使用量（MB）',
    },
    cpu_usage: {
      type: DataTypes.FLOAT,
      allowNull: true,
      comment: 'CPU使用率（百分比）',
    },
    uptime: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: '运行时长（秒）',
    },
    last_health_check: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: '最后健康检查时间',
    },
    
    // 数据库状态
    has_mysql: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: '是否使用MySQL',
    },
    mysql_status: {
      type: DataTypes.ENUM('running', 'stopped', 'error'),
      allowNull: true,
      comment: 'MySQL状态',
    },
    mysql_backup_enabled: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: '是否启用MySQL备份',
    },
    mysql_backup_schedule: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: 'MySQL备份计划（cron表达式）',
    },
    mysql_backup_last: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: '最后备份时间',
    },
    mysql_backup_path: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: 'MySQL备份路径',
    },
    
    has_redis: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: '是否使用Redis',
    },
    redis_status: {
      type: DataTypes.ENUM('running', 'stopped', 'error'),
      allowNull: true,
      comment: 'Redis状态',
    },
    redis_port: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Redis端口',
    },
    
    // 监控配置
    health_check_url: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: '健康检查URL',
    },
    health_check_interval: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 300,
      comment: '健康检查间隔（秒）',
    },
    auto_restart: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      comment: '是否自动重启',
    },
    restart_threshold: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 3,
      comment: '重启阈值（失败次数）',
    },
    
    // 统计信息
    total_deployments: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: '总部署次数',
    },
    successful_deployments: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: '成功部署次数',
    },
    failed_deployments: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: '失败部署次数',
    },
    last_deployment: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: '最后部署时间',
    },
    average_deployment_time: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: '平均部署时间（秒）',
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
    tableName: 'projects',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        unique: true,
        fields: ['uuid'],
      },
      {
        unique: true,
        fields: ['name'],
      },
      {
        fields: ['status'],
      },
      {
        fields: ['deploy_type'],
      },
      {
        fields: ['is_running'],
      },
    ],
  }
);

export default Project;
