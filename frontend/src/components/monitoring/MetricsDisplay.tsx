import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Spin, Alert } from 'antd';
import { useDashboardData } from '../../hooks/useDashboardData';
import { api } from '../../utils/api';

interface MetricsData {
  cpu?: { value: [number, number] };
  memory?: { value: [number, number] };
  disk?: { value: [number, number] };
  connections?: { value: [number, number] };
  requests?: { value: [number, number] };
  errors?: { value: [number, number] };
}

export const MetricsDisplay: React.FC = () => {
  const [metrics, setMetrics] = useState<MetricsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      const response = await api.get('/metrics');
      setMetrics(response.data);
      setError(null);
    } catch (err: any) {
      setError(err.message || '获取监控指标失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 30000); // 30秒刷新
    return () => clearInterval(interval);
  }, []);

  if (loading && !metrics) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
        <div style={{ marginTop: '16px' }}>加载监控指标...</div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert
        message="监控指标加载失败"
        description={error}
        type="error"
        showIcon
        action={
          <a onClick={fetchMetrics} style={{ color: '#1890ff' }}>
            重试
          </a>
        }
      />
    );
  }

  return (
    <Row gutter={[16, 16]}>
      <Col xs={24} sm={12} md={6}>
        <Card>
          <Statistic
            title="CPU 使用率"
            value={metrics?.cpu?.value?.[1] || 0}
            suffix="%"
            precision={2}
            valueStyle={{
              color: (metrics?.cpu?.value?.[1] || 0) > 80 ? '#cf1322' : 
                     (metrics?.cpu?.value?.[1] || 0) > 60 ? '#fa8c16' : '#3f8600'
            }}
          />
        </Card>
      </Col>
      <Col xs={24} sm={12} md={6}>
        <Card>
          <Statistic
            title="内存使用率"
            value={metrics?.memory?.value?.[1] || 0}
            suffix="%"
            precision={2}
            valueStyle={{
              color: (metrics?.memory?.value?.[1] || 0) > 85 ? '#cf1322' : 
                     (metrics?.memory?.value?.[1] || 0) > 70 ? '#fa8c16' : '#3f8600'
            }}
          />
        </Card>
      </Col>
      <Col xs={24} sm={12} md={6}>
        <Card>
          <Statistic
            title="磁盘使用率"
            value={metrics?.disk?.value?.[1] || 0}
            suffix="%"
            precision={2}
            valueStyle={{
              color: (metrics?.disk?.value?.[1] || 0) > 90 ? '#cf1322' : 
                     (metrics?.disk?.value?.[1] || 0) > 80 ? '#fa8c16' : '#3f8600'
            }}
          />
        </Card>
      </Col>
      <Col xs={24} sm={12} md={6}>
        <Card>
          <Statistic
            title="活跃连接"
            value={metrics?.connections?.value?.[1] || 0}
            valueStyle={{
              color: (metrics?.connections?.value?.[1] || 0) < 1 ? '#cf1322' : '#3f8600'
            }}
          />
        </Card>
      </Col>
      <Col xs={24} sm={12} md={6}>
        <Card>
          <Statistic
            title="请求总数"
            value={metrics?.requests?.value?.[1] || 0}
            valueStyle={{ color: '#1890ff' }}
          />
        </Card>
      </Col>
      <Col xs={24} sm={12} md={6}>
        <Card>
          <Statistic
            title="错误率"
            value={metrics?.errors?.value?.[1] || 0}
            suffix="%"
            precision={2}
            valueStyle={{
              color: (metrics?.errors?.value?.[1] || 0) > 10 ? '#cf1322' : 
                     (metrics?.errors?.value?.[1] || 0) > 5 ? '#fa8c16' : '#3f8600'
            }}
          />
        </Card>
      </Col>
    </Row>
  );
};
