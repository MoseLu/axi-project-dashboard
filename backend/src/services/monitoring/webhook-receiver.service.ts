import { logger } from '@/utils/logger';
import { Deployment } from '@/database/models/deployment';
import { DeploymentStep } from '@/database/models/deployment-step';
import { Project } from '@/database/models/project';

export interface WebhookPayload {
  project: string;
  repository: string;
  branch: string;
  commit_hash: string;
  status: 'pending' | 'running' | 'success' | 'failed' | 'cancelled';
  triggered_by?: string;
  trigger_type: 'push' | 'manual' | 'schedule';
  step_details?: {
    validate_artifact?: string;
    parse_secrets?: string;
    server_init?: string;
    deploy_project?: string;
    configure_nginx?: string;
    start_service?: string;
    test_website_static?: string;
    test_website_backend?: string;
  };
}

export class WebhookReceiverService {
  private static instance: WebhookReceiverService;

  public static getInstance(): WebhookReceiverService {
    if (!WebhookReceiverService.instance) {
      WebhookReceiverService.instance = new WebhookReceiverService();
    }
    return WebhookReceiverService.instance;
  }

  async handleWebhookEvent(payload: WebhookPayload): Promise<void> {
    try {
      logger.info(`📥 收到 Webhook 事件: ${payload.project} - ${payload.status}`);

      let deployment = await this.findOrCreateDeployment(payload);
      await this.updateDeploymentStatus(deployment, payload);
      
      // 处理步骤详情
      if (payload.step_details) {
        await this.handleStepDetails(deployment, payload.step_details);
      }
      
      await this.updateProjectStats(payload.project);
      
      logger.info(`✅ Webhook 事件处理完成: ${payload.project}`);
    } catch (error) {
      logger.error('❌ 处理 Webhook 事件失败:', error);
      throw error;
    }
  }

  private async findOrCreateDeployment(payload: WebhookPayload): Promise<Deployment> {
    try {
      let deployment = await Deployment.findOne({
        where: {
          project_name: payload.project,
          repository: payload.repository,
          branch: payload.branch,
          commit_hash: payload.commit_hash
        }
      });

      if (!deployment) {
        const createData: any = {
          project_name: payload.project,
          repository: payload.repository,
          branch: payload.branch,
          commit_hash: payload.commit_hash,
          status: payload.status,
          trigger_type: payload.trigger_type,
          start_time: new Date().toISOString(),
          uuid: `deploy-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          duration: 0
        };

        if (payload.triggered_by) {
          createData.triggered_by = payload.triggered_by;
        }

        deployment = await Deployment.create(createData);
      }

      return deployment;
    } catch (error) {
      logger.error('❌ 查找或创建部署记录失败:', error);
      throw error;
    }
  }

  private async updateDeploymentStatus(deployment: Deployment, payload: WebhookPayload): Promise<void> {
    try {
      const updateData: any = {
        status: payload.status,
        updated_at: new Date()
      };

      if (['success', 'failed', 'cancelled'].includes(payload.status)) {
        updateData.end_time = new Date();
        
        if (deployment.start_time) {
          const startTime = new Date(deployment.start_time);
          const endTime = new Date();
          updateData.duration = Math.floor((endTime.getTime() - startTime.getTime()) / 1000);
        }
      }

      await deployment.update(updateData);
    } catch (error) {
      logger.error('❌ 更新部署状态失败:', error);
      throw error;
    }
  }

  private async updateProjectStats(projectName: string): Promise<void> {
    try {
      const project = await Project.findOne({
        where: { name: projectName }
      });

      if (!project) {
        return;
      }

      const deploymentStats = await Deployment.findAll({
        where: { project_name: projectName }
      });

      const totalDeployments = deploymentStats.length;
      const successfulDeployments = deploymentStats.filter(d => d.status === 'success').length;
      const failedDeployments = deploymentStats.filter(d => d.status === 'failed').length;

      const completedDeployments = deploymentStats.filter(d => 
        ['success', 'failed'].includes(d.status) && d.duration > 0
      );
      
      const averageDeploymentTime = completedDeployments.length > 0
        ? Math.round(completedDeployments.reduce((sum, d) => sum + d.duration, 0) / completedDeployments.length)
        : 0;

      const lastDeployment = deploymentStats
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];

      const updateData: any = {
        total_deployments: totalDeployments,
        successful_deployments: successfulDeployments,
        failed_deployments: failedDeployments,
        average_deployment_time: averageDeploymentTime
      };

      if (lastDeployment) {
        updateData.last_deployment = new Date(lastDeployment.created_at);
      }

      await project.update(updateData);
    } catch (error) {
      logger.error('❌ 更新项目统计失败:', error);
      throw error;
    }
  }

  private async handleStepDetails(deployment: Deployment, stepDetails: any): Promise<void> {
    try {
      const stepMappings = {
        validate_artifact: '验证构建产物',
        parse_secrets: '解析部署密钥',
        server_init: '服务器初始化',
        deploy_project: '部署项目',
        configure_nginx: '配置Nginx',
        start_service: '启动服务',
        test_website_static: '测试网站(静态)',
        test_website_backend: '测试网站(后端)'
      };

      for (const [stepKey, stepName] of Object.entries(stepMappings)) {
        const stepStatus = stepDetails[stepKey];
        if (stepStatus) {
          await this.createOrUpdateDeploymentStep(deployment, stepName, stepStatus);
        }
      }
    } catch (error) {
      logger.error('❌ 处理步骤详情失败:', error);
      throw error;
    }
  }

  private async createOrUpdateDeploymentStep(deployment: Deployment, stepName: string, stepStatus: string): Promise<void> {
    try {
      const step = await DeploymentStep.findOne({
        where: {
          deployment_uuid: deployment.uuid,
          step_name: stepName
        }
      });

      // 确定步骤类型
      const stepTypeMap: { [key: string]: 'validation' | 'deployment' | 'configuration' | 'service' | 'testing' | 'backup' | 'cleanup' } = {
        '验证构建产物': 'validation',
        '解析部署密钥': 'validation',
        '服务器初始化': 'configuration',
        '部署项目': 'deployment',
        '配置Nginx': 'configuration',
        '启动服务': 'service',
        '测试网站(静态)': 'testing',
        '测试网站(后端)': 'testing'
      };

      const stepType = stepTypeMap[stepName] || 'deployment';
      const stepOrder = Object.keys(stepTypeMap).indexOf(stepName) + 1;

      const stepData: any = {
        deployment_uuid: deployment.uuid,
        step_name: stepName,
        display_name: stepName,
        step_order: stepOrder,
        step_type: stepType,
        status: stepStatus as 'pending' | 'running' | 'success' | 'failed' | 'skipped' | 'cancelled',
        start_time: new Date(),
        end_time: new Date(),
        duration: 0,
        progress: stepStatus === 'success' ? 100 : stepStatus === 'failed' ? 0 : 50,
        logs: `步骤 ${stepName} ${stepStatus}`,
        is_required: true,
        can_retry: true,
        retry_count: 0,
        max_retries: 3
      };

      if (stepStatus === 'failed') {
        stepData.error_message = `步骤 ${stepName} 执行失败`;
      }

      if (step) {
        await step.update(stepData);
      } else {
        await DeploymentStep.create(stepData);
      }
    } catch (error) {
      logger.error(`❌ 创建或更新部署步骤失败: ${stepName}`, error);
      throw error;
    }
  }
}

export default WebhookReceiverService;
