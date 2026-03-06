import React, { useState, useEffect } from 'react'
import {
  Card,
  Row,
  Col,
  Statistic,
  Typography,
  Table,
  Space,
  Button,
  Progress,
  Tag,
  Alert,
  Spin,
  message,
} from 'antd'
import {
  ProjectOutlined,
  DatabaseOutlined,
  ApiOutlined,
  DashboardOutlined,
  EyeOutlined,
  EnterOutlined,
  DeleteOutlined,
  RollbackOutlined,
  ReloadOutlined,
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { projectApi, systemApi } from '@/services/api'
import { useProjectStore } from '@/store/project'
import type { Project, Migration, SystemStats } from '@/types'
import { formatDate } from '@/utils/format'

const { Title, Text } = Typography

interface StatsCardProps {
  title: string
  value: number | string
  icon: React.ReactNode
  color?: string
  suffix?: string
  loading?: boolean
}

const StatsCard: React.FC<StatsCardProps> = ({ title, value, icon, color = '#1890ff', suffix, loading }) => (
  <Card>
    <Statistic
      title={
        <Space>
          {icon}
          <Text>{title}</Text>
        </Space>
      }
      value={loading ? '-' : value}
      valueStyle={{ color }}
      suffix={suffix}
      loading={loading}
    />
  </Card>
)

const Dashboard: React.FC = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<SystemStats>({
    total_projects: 0,
    total_databases: 0,
    total_api_calls: 0,
    total_migrations: 0,
    active_projects: 0,
    system_load: {
      cpu_percent: 0,
      memory_percent: 0,
      disk_percent: 0,
    },
    recent_projects: [],
    recent_migrations: [],
  })
  
  const { projects, setProjects } = useProjectStore()
  
  const loadData = async () => {
    setLoading(true)
    try {
      // 加载项目数据
      const projectsData = await projectApi.getProjects()
      setProjects(projectsData)
      
      // 模拟系统统计数据
      const mockStats: SystemStats = {
        total_projects: projectsData.length,
        total_databases: projectsData.length,
        total_api_calls: Math.floor(Math.random() * 10000) + 5000,
        total_migrations: projectsData.reduce((sum, p) => sum + (p.migration_count || 0), 0),
        active_projects: projectsData.filter(p => p.is_active).length,
        system_load: {
          cpu_percent: Math.floor(Math.random() * 30) + 10,
          memory_percent: Math.floor(Math.random() * 40) + 20,
          disk_percent: Math.floor(Math.random() * 50) + 30,
        },
        recent_projects: projectsData.slice(0, 5),
        recent_migrations: [],
      }
      
      // 模拟迁移数据
      if (projectsData.length > 0) {
        mockStats.recent_migrations = [
          {
            id: 1,
            project_id: projectsData[0].id,
            schema_name: projectsData[0].schema_name,
            migration_sql: 'CREATE TABLE users (id SERIAL PRIMARY KEY, email TEXT UNIQUE)',
            executed_at: new Date().toISOString(),
            version: '001',
            description: '创建用户表',
            project_name: projectsData[0].name,
            status: 'completed',
          },
          {
            id: 2,
            project_id: projectsData[0]?.id || '',
            schema_name: projectsData[0]?.schema_name || '',
            migration_sql: 'ALTER TABLE users ADD COLUMN name TEXT',
            executed_at: new Date(Date.now() - 86400000).toISOString(),
            version: '002',
            description: '添加用户名字段',
            project_name: projectsData[0]?.name || '',
            status: 'completed',
          },
        ]
      }
      
      setStats(mockStats)
    } catch (error) {
      console.error('加载数据失败:', error)
      message.error('加载数据失败')
    } finally {
      setLoading(false)
    }
  }
  
  useEffect(() => {
    loadData()
  }, [])
  
  const handleViewProject = (projectId: string) => {
    navigate(`/projects/${projectId}`)
  }
  
  const handleEnterProject = (projectId: string) => {
    navigate(`/projects/${projectId}/database`)
  }
  
  const handleDeleteProject = (projectId: string, projectName: string) => {
    // 实现删除逻辑
    message.info(`删除项目 ${projectName} (功能待实现)`)
  }
  
  const handleViewMigration = (migrationId: number) => {
    // 实现查看迁移详情
    message.info(`查看迁移 ${migrationId} (功能待实现)`)
  }
  
  const handleRollbackMigration = (migrationId: number) => {
    // 实现回滚迁移
    message.info(`回滚迁移 ${migrationId} (功能待实现)`)
  }
  
  // 最近项目表格列定义
  const recentProjectsColumns = [
    {
      title: '项目名称',
      dataIndex: 'name',
      key: 'name',
      render: (text: string) => <Text strong>{text}</Text>,
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date: string) => formatDate(date),
    },
    {
      title: 'API Key',
      dataIndex: 'api_key',
      key: 'api_key',
      render: (key: string) => (
        <Text code copyable={{ text: key }}>
          {key.substring(0, 8)}...
        </Text>
      ),
    },
    {
      title: '状态',
      dataIndex: 'is_active',
      key: 'is_active',
      render: (active: boolean) => (
        <Tag color={active ? 'success' : 'error'}>
          {active ? '活跃' : '已禁用'}
        </Tag>
      ),
    },
    {
      title: '操作',
      key: 'actions',
      render: (_: any, record: Project) => (
        <Space>
          <Button
            type="text"
            icon={<EyeOutlined />}
            size="small"
            onClick={() => handleViewProject(record.id)}
          >
            查看
          </Button>
          <Button
            type="text"
            icon={<EnterOutlined />}
            size="small"
            onClick={() => handleEnterProject(record.id)}
          >
            进入
          </Button>
          <Button
            type="text"
            icon={<DeleteOutlined />}
            size="small"
            danger
            onClick={() => handleDeleteProject(record.id, record.name)}
          >
            删除
          </Button>
        </Space>
      ),
    },
  ]
  
  // 最近迁移表格列定义
  const recentMigrationsColumns = [
    {
      title: '项目',
      dataIndex: 'project_name',
      key: 'project_name',
      render: (text: string) => <Text strong>{text}</Text>,
    },
    {
      title: 'SQL版本',
      dataIndex: 'version',
      key: 'version',
      render: (version: string) => <Tag color="blue">{version}</Tag>,
    },
    {
      title: '执行时间',
      dataIndex: 'executed_at',
      key: 'executed_at',
      render: (date: string) => formatDate(date),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'completed' ? 'success' : status === 'failed' ? 'error' : 'warning'}>
          {status === 'completed' ? '已完成' : status === 'failed' ? '失败' : '进行中'}
        </Tag>
      ),
    },
    {
      title: '操作',
      key: 'actions',
      render: (_: any, record: Migration) => (
        <Space>
          <Button
            type="text"
            size="small"
            onClick={() => handleViewMigration(record.id)}
          >
            查看详情
          </Button>
          <Button
            type="text"
            icon={<RollbackOutlined />}
            size="small"
            danger
            onClick={() => handleRollbackMigration(record.id)}
          >
            回滚
          </Button>
        </Space>
      ),
    },
  ]
  
  if (loading && projects.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
      </div>
    )
  }
  
  return (
    <div>
      <Space style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={2} style={{ margin: 0 }}>
          <DashboardOutlined /> 控制台
        </Title>
        <Button
          type="primary"
          icon={<ReloadOutlined />}
          onClick={loadData}
          loading={loading}
        >
          刷新数据
        </Button>
      </Space>
      
      {/* 平台统计卡片 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <StatsCard
            title="总项目数"
            value={stats.total_projects}
            icon={<ProjectOutlined />}
            color="#3f8600"
            loading={loading}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatsCard
            title="总数据库数量"
            value={stats.total_databases}
            icon={<DatabaseOutlined />}
            color="#1890ff"
            loading={loading}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatsCard
            title="API调用次数"
            value={stats.total_api_calls.toLocaleString()}
            icon={<ApiOutlined />}
            color="#722ed1"
            loading={loading}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title={
                <Space>
                  <DashboardOutlined />
                  <Text>系统负载</Text>
                </Space>
              }
              value={stats.system_load.cpu_percent}
              suffix="%"
              valueStyle={{ color: stats.system_load.cpu_percent > 70 ? '#cf1322' : '#3f8600' }}
            />
            <div style={{ marginTop: 8 }}>
              <Space direction="vertical" style={{ width: '100%' }}>
                <div>
                  <Text type="secondary" style={{ fontSize: 12 }}>CPU: </Text>
                  <Progress 
                    percent={stats.system_load.cpu_percent} 
                    size="small" 
                    strokeColor={stats.system_load.cpu_percent > 70 ? '#ff4d4f' : '#52c41a'}
                  />
                </div>
                <div>
                  <Text type="secondary" style={{ fontSize: 12 }}>内存: </Text>
                  <Progress 
                    percent={stats.system_load.memory_percent} 
                    size="small" 
                    strokeColor={stats.system_load.memory_percent > 70 ? '#ff4d4f' : '#52c41a'}
                  />
                </div>
                <div>
                  <Text type="secondary" style={{ fontSize: 12 }}>磁盘: </Text>
                  <Progress 
                    percent={stats.system_load.disk_percent} 
                    size="small" 
                    strokeColor={stats.system_load.disk_percent > 70 ? '#ff4d4f' : '#52c41a'}
                  />
                </div>
              </Space>
            </div>
          </Card>
        </Col>
      </Row>
      
      <Row gutter={[16, 16]}>
        {/* 最近创建项目 */}
        <Col xs={24} lg={12}>
          <Card
            title="最近创建项目"
            extra={
              <Button type="link" onClick={() => navigate('/projects')}>
                查看全部
              </Button>
            }
          >
            {stats.recent_projects.length === 0 ? (
              <Alert
                message="暂无项目"
                description="点击创建项目按钮开始您的第一个项目"
                type="info"
                showIcon
                action={
                  <Button type="primary" onClick={() => navigate('/projects')}>
                    创建项目
                  </Button>
                }
              />
            ) : (
              <Table
                dataSource={stats.recent_projects}
                columns={recentProjectsColumns}
                rowKey="id"
                pagination={false}
                size="small"
                scroll={{ x: true }}
              />
            )}
          </Card>
        </Col>
        
        {/* 最近迁移 */}
        <Col xs={24} lg={12}>
          <Card
            title="最近迁移"
            extra={
              <Button type="link" onClick={() => navigate('/migrations')}>
                查看全部
              </Button>
            }
          >
            {stats.recent_migrations.length === 0 ? (
              <Alert
                message="暂无迁移记录"
                description="执行SQL迁移后，记录将显示在这里"
                type="info"
                showIcon
              />
            ) : (
              <Table
                dataSource={stats.recent_migrations}
                columns={recentMigrationsColumns}
                rowKey="id"
                pagination={false}
                size="small"
                scroll={{ x: true }}
              />
            )}
          </Card>
        </Col>
      </Row>
      
      {/* 快速操作 */}
      <Card title="快速操作" style={{ marginTop: 16 }}>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={8} lg={6}>
            <Card
              hoverable
              onClick={() => navigate('/projects')}
              style={{ textAlign: 'center' }}
            >
              <ProjectOutlined style={{ fontSize: 32, color: '#1890ff', marginBottom: 8 }} />
              <div>
                <Text strong>项目管理</Text>
              </div>
              <Text type="secondary" style={{ fontSize: 12 }}>
                创建、编辑、删除项目
              </Text>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={8} lg={6}>
            <Card
              hoverable
              onClick={() => navigate('/database')}
              style={{ textAlign: 'center' }}
            >
              <DatabaseOutlined style={{ fontSize: 32, color: '#52c41a', marginBottom: 8 }} />
              <div>
                <Text strong>数据库管理</Text>
              </div>
              <Text type="secondary" style={{ fontSize: 12 }}>
                管理表结构、执行SQL
              </Text>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={8} lg={6}>
            <Card
              hoverable
              onClick={() => navigate('/api-keys')}
              style={{ textAlign: 'center' }}
            >
              <ApiOutlined style={{ fontSize: 32, color: '#722ed1', marginBottom: 8 }} />
              <div>
                <Text strong>API Keys</Text>
              </div>
              <Text type="secondary" style={{ fontSize: 12 }}>
                生成、管理API密钥
              </Text>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={8} lg={6}>
            <Card
              hoverable
              onClick={() => navigate('/migrations')}
              style={{ textAlign: 'center' }}
            >
              <RollbackOutlined style={{ fontSize: 32, color: '#fa8c16', marginBottom: 8 }} />
              <div>
                <Text strong>数据迁移</Text>
              </div>
              <Text type="secondary" style={{ fontSize: 12 }}>
                执行、回滚数据库迁移
              </Text>
            </Card>
          </Col>
        </Row>
      </Card>
    </div>
  )
}

export default Dashboard