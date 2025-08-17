import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Tag, Button, Spin } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import { api } from '../../utils/api';

const RealTimeMonitor: React.FC = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      const response = await api.get('/monitoring/projects/status');
      if (response.success) {
        setProjects(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch monitoring data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
        <div style={{ marginTop: '16px' }}>加载监控数据中...</div>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '24px', textAlign: 'right' }}>
        <Button
          type="primary"
          icon={<ReloadOutlined spin={refreshing} />}
          onClick={handleRefresh}
          loading={refreshing}
        >
          刷新数据
        </Button>
      </div>

      <Row gutter={[16, 16]}>
        {projects.map((project: any) => (
          <Col xs={24} sm={12} lg={8} xl={6} key={project.id}>
            <Card
              title={project.display_name}
              extra={
                <Tag color={project.is_running ? 'success' : 'error'}>
                  {project.is_running ? '运行中' : '已停止'}
                </Tag>
              }
              size="small"
            >
              <div style={{ marginBottom: '8px' }}>
                <strong>项目:</strong> {project.name}
              </div>
              <div style={{ marginBottom: '8px' }}>
                <strong>类型:</strong> {project.deploy_type === 'backend' ? '后端' : '静态'}
              </div>
              {project.port && (
                <div style={{ marginBottom: '8px' }}>
                  <strong>端口:</strong> {project.port}
                </div>
              )}
            </Card>
          </Col>
        ))}
      </Row>

      {projects.length === 0 && !loading && (
        <div style={{ textAlign: 'center', padding: '50px', color: '#666' }}>
          暂无项目数据
        </div>
      )}
    </div>
  );
};

export default RealTimeMonitor;
