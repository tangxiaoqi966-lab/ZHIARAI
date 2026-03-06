import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Card,
  Tabs,
  Typography,
  Space,
  Button,
  Row,
  Col,
  Statistic,
  Tag,
  message,
  Spin,
  Alert,
} from 'antd'
import {
  DatabaseOutlined,
  ApiOutlined,
  SwapOutlined,
  FileTextOutlined,
  SettingOutlined,
  EyeOutlined,
  CopyOutlined,
  DeleteOutlined,
  ArrowLeftOutlined,
} from '@ant-design/icons'
import { projectApi } from '@/services/api'
import { useProjectStore } from '@/store/project'
import { hasPermission } from '@/store/auth'
import type { Project } from '@/types'
import { formatDate } from '@/utils/format'

const { Title, Text } = Typography
const { TabPane } = Tabs

// 各个子页面组件（占位符）
const ProjectOverview: React.FC<{ project: Project }> = ({ project }) => (
  <Card title="项目概览">
    <Row gutter={[16, 16]}>
      <Col span={12}>
        <Card size="small">
          <Statistic title="项目ID" value={project.id} />
        </Card>
      </Col>
      <Col span={12}>
        <Card size="small">
          <Statistic title="Schema名称" value={project.schema_name} />
        </Card>
      </Col>
      <Col span={12}>
        <Card size="small">
          <Statistic title="创建时间" value={formatDate(project.created_at)} />
        </Card>
      </Col>
      <Col span={12}>
        <Card size="small">
          <Statistic title="状态" value={
            <Tag color={project.is_active ? 'success' : 'error'}>
              {project.is_active ? '活跃' : '已禁用'}
            </Tag>
          } />
        </Card>
      </Col>
    </Row>
    
    <Card title="API Key" style={{ marginTop: 16 }}>
      <Space>
        <Text code copyable={{ text: project.api_key }}>
          {project.api_key}
        </Text>
        <Button icon={<CopyOutlined />} size="small">
          复制
        </Button>
        <Button icon={<ApiOutlined />} size="small">
          重置
        </Button>
      </Space>
    </Card>
    
    <Card title="项目信息" style={{ marginTop: 16 }}>
      {project.description && (
        <div style={{ marginBottom: 16 }}>
          <Text strong>描述：</Text>
          <Text type="secondary">{project.description}</Text>
        </div>
      )}
      <div>
        <Text strong>数据库名称：</Text>
        <Text type="secondary">{project.database_name || '默认数据库'}</Text>
      </div>
    </Card>
  </Card>
)

const ProjectDatabase: React.FC<{ project: Project }> = ({ project }) => (
  <Card title="数据库管理">
    <Alert
      message="数据库管理功能"
      description="表结构管理、数据浏览、SQL编辑器等功能"
      type="info"
      showIcon
    />
    <div style={{ marginTop: 16 }}>
      <Text>项目：{project.name}</Text>
    </div>
  </Card>
)

const ProjectApiKeys: React.FC<{ project: Project }> = ({ project }) => (
  <Card title="API Key管理">
    <Alert
      message="API Key管理功能"
      description="创建、禁用、删除API Key，权限控制"
      type="info"
      showIcon
    />
  </Card>
)

const ProjectMigrations: React.FC<{ project: Project }> = ({ project }) => (
  <Card title="迁移管理">
    <Alert
      message="迁移管理功能"
      description="上传迁移文件、执行迁移、回滚迁移"
      type="info"
      showIcon
    />
  </Card>
)

const ProjectLogs: React.FC<{ project: Project }> = ({ project }) => (
  <Card title="日志">
    <Alert
      message="日志查看功能"
      description="操作日志、API调用日志、SQL执行日志"
      type="info"
      showIcon
    />
  </Card>
)

const ProjectSettings: React.FC<{ project: Project }> = ({ project }) => (
  <Card title="项目设置">
    <Alert
      message="项目设置功能"
      description="项目配置、权限设置、高级选项"
      type="info"
      showIcon
    />
  </Card>
)

const ProjectDetail: React.FC = () => {
  const { id, tab = 'overview' } = useParams<{ id: string; tab?: string }>()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [project, setProject] = useState<Project | null>(null)
  
  const { getProjectById } = useProjectStore()
  
  const loadProject = async () => {
    setLoading(true)
    try {
      if (id) {
        const data = await projectApi.getProject(id)
        setProject(data)
      }
    } catch (error) {
      console.error('加载项目详情失败:', error)
      message.error('加载项目详情失败')
      navigate('/projects')
    } finally {
      setLoading(false)
    }
  }
  
  useEffect(() => {
    loadProject()
  }, [id])
  
  const handleTabChange = (key: string) => {
    navigate(`/projects/${id}/${key}`)
  }
  
  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
      </div>
    )
  }
  
  if (!project) {
    return (
      <Alert
        message="项目不存在"
        description="请求的项目不存在或已被删除"
        type="error"
        showIcon
        action={
          <Button type="primary" onClick={() => navigate('/projects')}>
            返回项目列表
          </Button>
        }
      />
    )
  }
  
  const renderContent = () => {
    switch (tab) {
      case 'overview':
        return <ProjectOverview project={project} />
      case 'database':
        return <ProjectDatabase project={project} />
      case 'apikey':
        return <ProjectApiKeys project={project} />
      case 'migration':
        return <ProjectMigrations project={project} />
      case 'logs':
        return <ProjectLogs project={project} />
      case 'settings':
        return <ProjectSettings project={project} />
      default:
        return <ProjectOverview project={project} />
    }
  }
  
  return (
    <div>
      <Space style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Space>
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate('/projects')}
          >
            返回
          </Button>
          <Title level={2} style={{ margin: 0 }}>
            {project.name}
          </Title>
          <Tag color={project.is_active ? 'success' : 'error'}>
            {project.is_active ? '活跃' : '已禁用'}
          </Tag>
        </Space>
        <Space>
          <Button
            icon={<EyeOutlined />}
            onClick={() => window.open(`https://supabase.com/dashboard/project/${id}`, '_blank')}
          >
            打开API文档
          </Button>
          <Button
            icon={<DeleteOutlined />}
            danger
            disabled={!hasPermission('projects:delete')}
          >
            删除项目
          </Button>
        </Space>
      </Space>
      
      <Tabs
        activeKey={tab}
        onChange={handleTabChange}
        type="card"
        items={[
          {
            key: 'overview',
            label: (
              <span>
                <EyeOutlined />
                概览
              </span>
            ),
          },
          {
            key: 'database',
            label: (
              <span>
                <DatabaseOutlined />
                数据库
              </span>
            ),
            disabled: !hasPermission('database:view'),
          },
          {
            key: 'apikey',
            label: (
              <span>
                <ApiOutlined />
                API Keys
              </span>
            ),
            disabled: !hasPermission('apikeys:view'),
          },
          {
            key: 'migration',
            label: (
              <span>
                <SwapOutlined />
                迁移
              </span>
            ),
            disabled: !hasPermission('migrations:view'),
          },
          {
            key: 'logs',
            label: (
              <span>
                <FileTextOutlined />
                日志
              </span>
            ),
            disabled: !hasPermission('logs:view'),
          },
          {
            key: 'settings',
            label: (
              <span>
                <SettingOutlined />
                设置
              </span>
            ),
            disabled: !hasPermission('projects:edit'),
          },
        ]}
      />
      
      {renderContent()}
    </div>
  )
}

export default ProjectDetail