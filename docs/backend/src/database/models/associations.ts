import { setupDeploymentAssociations } from './deployment';
import { setupDeploymentStepAssociations } from './deployment-step';

export const initializeModelAssociations = () => {
  // 设置部署相关模型的关联关系
  setupDeploymentAssociations();
  setupDeploymentStepAssociations();
  
  console.log('✅ Model associations initialized successfully');
};
