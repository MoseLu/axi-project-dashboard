import { Model, Optional } from 'sequelize';
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
export interface DeploymentCreationAttributes extends Optional<DeploymentAttributes, 'id' | 'createdAt' | 'updatedAt'> {
}
export declare class Deployment extends Model<DeploymentAttributes, DeploymentCreationAttributes> implements DeploymentAttributes {
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
export default Deployment;
//# sourceMappingURL=deployment.d.ts.map