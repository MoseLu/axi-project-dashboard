import React, { useState } from 'react';
import { Card, Typography, Table, Tag, Space, Button, Input, Select, Avatar, Progress } from 'antd';
import { 
  ProjectOutlined, 
  PlusOutlined, 
  EditOutlined, 
  DeleteOutlined,
  TeamOutlined,
  GitlabOutlined,
  CalendarOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const { Text } = Typography;
const { Search } = Input;
const { Option } = Select;

interface Project {
  id: number;
  name: string;
  description: string;
  status: 'active' | 'archived' | 'maintenance';
  team_size: number;
  branches: string[];
  last_updated: string;
  progress: number;
  repository: string;
}

const ProjectListPage: React.FC = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([
    {
      id: 1,
      name: 'axi-project-dashboard',
      description: '部署进度可视化仪表板',
      status: 'active',
      team_size: 5,
      branches: ['main', 'develop', 'feature/new-ui'],
      last_updated: '2024-01-15 14:30:00',
      progress: 85,
      repository: 'https://github.com/axi/axi-project-dashboard'
    },
    {
      id: 2,
      name: 'axi-star-cloud',
      description: '云存储和文件管理系统',
      status: 'active',
      team_size: 8,
      branches: ['main', 'develop', 'feature/cloud-sync'],
      last_updated: '2024-01-15 13:15:00',
      progress: 92,
      repository: 'https://github.com/axi/axi-star-cloud'
    },
    {
      id: 3,
      name: 'axi-docs',
      description: '项目文档管理系统',
      status: 'maintenance',
      team_size: 3,
      branches: ['main', 'docs-update'],
      last_updated: '2024-01-15 12:00:00',
      progress: 65,
      repository: 'https://github.com/axi/axi-docs'
    }
  ]);

  const columns = [
    {
      title: '项目信息',
      key: 'project_info',
      render: (record: Project) => (
        <Space>
          <Avatar 
            size="large" 
            icon={<ProjectOutlined />}
            style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
            }}
          />
          <div>
            <div>
              <Text strong className="content-text" style={{ fontSize: '16px' }}>
                {record.name}
              </Text>
            </div>
            <div>
              <Text className="content-text-secondary" style={{ fontSize: '12px' }}>
                {record.description}
              </Text>
            </div>
          </div>
        </Space>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const statusConfig = {
          active: { color: 'success', text: '活跃' },
          archived: { color: 'default', text: '已归档' },
          maintenance: { color: 'warning', text: '维护中' },
        };
        const config = statusConfig[status as keyof typeof statusConfig] || { color: 'default', text: status };
        return <Tag color={config.color}>{config.text}</Tag>;
      },
    },
    {
      title: '团队规模',
      dataIndex: 'team_size',
      key: 'team_size',
      render: (size: number) => (
        <Space>
          <TeamOutlined />
          <Text className="content-text">{size} 人</Text>
        </Space>
      ),
    },
    {
      title: '分支',
      dataIndex: 'branches',
      key: 'branches',
      render: (branches: string[]) => (
        <Space size="small">
          <GitlabOutlined />
          {branches.slice(0, 2).map(branch => (
            <Tag key={branch} color="blue">{branch}</Tag>
          ))}
          {branches.length > 2 && (
            <Tag color="default">+{branches.length - 2}</Tag>
          )}
        </Space>
      ),
    },
    {
      title: '进度',
      dataIndex: 'progress',
      key: 'progress',
      render: (progress: number) => (
        <div style={{ width: '120px' }}>
          <Progress 
            percent={progress} 
            size={[120, 8]}
            status={progress >= 100 ? 'success' : 'active'}
          />
        </div>
      ),
    },
    {
      title: '最后更新',
      dataIndex: 'last_updated',
      key: 'last_updated',
      render: (date: string) => (
        <Space>
          <CalendarOutlined />
          <Text className="content-text-secondary">{date}</Text>
        </Space>
      ),
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: Project) => (
        <Space size="small">
          <Button 
            type="link" 
            size="small"
            onClick={() => navigate(`/projects/${record.id}`)}
          >
            查看详情
          </Button>
          <Button 
            type="link" 
            size="small"
            icon={<EditOutlined />}
            onClick={() => navigate(`/projects/${record.id}/edit`)}
          >
            编辑
          </Button>
          <Button 
            type="link" 
            size="small"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record.id)}
          >
            删除
          </Button>
        </Space>
      ),
    },
  ];

  const handleDelete = (id: number) => {
    setProjects(projects.filter(project => project.id !== id));
  };

  return (
    <div className="content-area" style={{ 
      minHeight: '100vh',
      padding: '24px',
      position: 'relative',
      overflow: 'hidden',
      width: '100%',
      maxWidth: '100%',
      boxSizing: 'border-box'
    }}>
      <div style={{ position: 'relative', zIndex: 1 }}>
      {/* 搜索和筛选 */}
      <Card className="glass-card" style={{ marginBottom: '24px' }}>
        <Space size="large" wrap>
          <Search
            placeholder="搜索项目名称或描述"
            style={{ width: 300 }}
            allowClear
          />
          <Select
            placeholder="项目状态"
            style={{ width: 150 }}
            allowClear
          >
            <Option value="active">活跃</Option>
            <Option value="archived">已归档</Option>
            <Option value="maintenance">维护中</Option>
          </Select>
          <Button type="primary" icon={<PlusOutlined />}>
            新建项目
          </Button>
        </Space>
      </Card>

      {/* 项目列表 */}
      <Card className="glass-card">
        <Table
          columns={columns}
          dataSource={projects}
          rowKey="id"
          pagination={{
            total: projects.length,
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`
          }}
          className="content-table"
        />
      </Card>
      </div>
    </div>
  );
};

export default ProjectListPage;
