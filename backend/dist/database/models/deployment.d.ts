import { Model, Optional } from 'sequelize';
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
export interface DeploymentCreationAttributes extends Optional<DeploymentAttributes, 'id' | 'created_at' | 'updated_at'> {
}
export declare class Deployment extends Model<DeploymentAttributes, DeploymentCreationAttributes> implements DeploymentAttributes {
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
export default Deployment;
//# sourceMappingURL=deployment.d.ts.map