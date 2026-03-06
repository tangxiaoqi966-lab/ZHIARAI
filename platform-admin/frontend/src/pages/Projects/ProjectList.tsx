import React, { useState, useEffect } from 'react'
import {
  Card,
  Table,
  Button,
  Space,
  Typography,
  Modal,
  Form,
  Input,
  Select,
  Tag,
  message,
  Popconfirm,
  Tooltip,
  Row,
  Col,
  Switch,
} from 'antd'
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ApiOutlined,
  SwapOutlined,
  EyeOutlined,
  CopyOutlined,
  CheckOutlined,
  CloseOutlined,
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { projectApi } from '@/services/api'
import { useProjectStore } from '@/store/project'
import { hasPermission } from '@/store/auth'
import type { Project, CreateProjectRequest } from '@/types'
import { formatDate } from '@/utils/format'

const { Title, Text } = Typography
const { Option } = Select

const ProjectList: React.FC = () => {
  const navigate = useNavigate()
  const [form] = Form.useForm()
  const [createModalVisible, setCreateModalVisible] = useState(false)
  const [loading, setLoading] = useState(false)
  const [copyingKey, setCopyingKey] = useState<string | null>(null)
  
  const { projects, setProjects, deleteProject, updateProject } = useProjectStore()
  
  const loadProjects = async () => {
    setLoading(true)
    try {
      const data = await projectApi.getProjects()
      setProjects(data)
    } catch (error) {
      console.error('加载项目列表失败:', error)
      message.error('加载项目列表失败')
    } finally {
      setLoading(false)
    }
  }
  
  useEffect(() => {
    loadProjects()
  }, [])
  
  const handleCreateProject = async (values: CreateProjectRequest) => {
    try {
      const newProject = await projectApi.createProject(values)
      message.success('项目创建成功！')
      setCreateModalVisible(false)
      form.resetFields()
      
      // 更新状态
      setProjects([...projects, newProject])
      
      // 自动生成API Key
      setTimeout(async () => {
        try {
          const updated = await projectApi.generateApiKey(newProject.id)
          updateProject(newProject.id, { api_key: updated.api_key })
          message.success('API Key 已自动生成')
        } catch (error) {
          console.error('生成API Key失败:', error)
        }
      }, 1000)
      
    } catch (error: any) {
      console.error('创建项目失败:', error)
      message.error(`创建项目失败: ${error}`)
    }
  }
  
  const handleUpdateStatus = async (id: string, isActive: boolean) => {
    try {
      await projectApi.updateProject(id, { is_active: isActive })
      updateProject(id, { is_active: isActive })
      message.success(`项目已${isActive ? '启用' : '禁用'}`)
    } catch (error: any) {
      console.error('更新项目状态失败:', error)
      message.error(`更新失败: ${error}`)
    }
  }
  
  const handleDeleteProject = async (id: string, name: string) => {
    try {
      await projectApi.deleteProject(id)
      deleteProject(id)
      message.success(`项目 "${name}" 已删除`)
    } catch (error: any) {
      console.error('删除项目失败:', error)
      message.error(`删除失败: ${error}`)
    }
  }
  
  const handleCopyApiKey = async (key: string) => {
    try {
      await navigator.clipboard.writeText(key)
      setCopyingKey(key)
      message.success('API Key 已复制到剪贴板')
      setTimeout(() => setCopyingKey(null), 2000)
    } catch (error) {
      console.error('复制失败:', error)
      message.error('复制失败')
    }
  }
  
  const handleGenerateApiKey = async (id: string) => {
    try {
      const updated = await projectApi.generateApiKey(id)
      updateProject(id, { api_key: updated.api_key })
      message.success('新的 API Key 已生成')
    } catch (error: any) {
      console.error('生成API Key失败:', error)
      message.error(`生成失败: ${error}`)
    }
  }
  
  const handleEnterProject = (projectId: string, tab: string = 'overview') => {
    navigate(`/projects/${projectId}/${tab}`)
  }
  
  // 表格列定义
  const columns = [
    {
      title: '项目名称',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: Project) => (
        <Space>
          <Text strong>{text}</Text>
          {record.description && (
            <Tooltip title={record.description}>
              <Text type="secondary" style={{ fontSize: 12 }}>ℹ️</Text>
            </Tooltip>
          )}
        </Space>
      ),
    },
    {
      title: 'Schema',
      dataIndex: 'schema_name',
      key: 'schema_name',
      render: (text: string) => <Text code>{text}</Text>,
    },
    {
      title: 'API Key',
      dataIndex: 'api_key',
      key: 'api_key',
      render: (key: string, record: Project) => (
        <Space>
          <Tooltip title="点击复制" placement="top">
            <Button
              type="text"
              size="small"
              onClick={() => handleCopyApiKey(key)}
              style={{ padding: 0, height: 'auto' }}
            >
              <Text code style={{ fontSize: 12 }}>
                {key.substring(0, 8)}...
                {copyingKey === key && <CheckOutlined style={{ color: '#52c41a', marginLeft: 4 }} />}
              </Text>
            </Button>
          </Tooltip>
          <Tooltip title="生成新Key">
            <Button
              type="text"
              size="small"
              icon={<ApiOutlined />}
              onClick={() => handleGenerateApiKey(record.id)}
              disabled={!hasPermission('apikeys:create')}
            />
          </Tooltip>
        </Space>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date: string) => formatDate(date),
    },
    {
      title: '状态',
      dataIndex: 'is_active',
      key: 'is_active',
      render: (active: boolean, record: Project) => (
        <Switch
          checked={active}
          onChange={(checked) => handleUpdateStatus(record.id, checked)}
          checkedChildren="启用"
          unCheckedChildren="禁用"
          disabled={!hasPermission('projects:edit')}
        />
      ),
    },
    {
      title: '操作',
      key: 'actions',
      width: 250,
      render: (_: any, record: Project) => (
        <Space>
          <Tooltip title="查看详情">
            <Button
              type="text"
              icon={<EyeOutlined />}
              size="small"
              onClick={() => handleEnterProject(record.id, 'overview')}
              disabled={!hasPermission('projects:view')}
            />
          </Tooltip>
          <Tooltip title="进入项目">
            <Button
              type="text"
              icon={<SwapOutlined />}
              size="small"
              onClick={() => handleEnterProject(record.id, 'database')}
              disabled={!hasPermission('database:view')}
            >
              进入
            </Button>
          </Tooltip>
          <Tooltip title="API管理">
            <Button
              type="text"
              icon={<ApiOutlined />}
              size="small"
              onClick={() => handleEnterProject(record.id, 'apikey')}
              disabled={!hasPermission('apikeys:view')}
            >
              API
            </Button>
          </Tooltip>
          <Tooltip title="迁移管理">
            <Button
              type="text"
              icon={<SwapOutlined />}
              size="small"
              onClick={() => handleEnterProject(record.id, 'migration')}
              disabled={!hasPermission('migrations:view')}
            >
              迁移
            </Button>
          </Tooltip>
          <Popconfirm
            title={`确定要删除项目 "${record.name}" 吗？`}
            description="此操作将删除项目及其所有数据，且无法恢复。"
            okText="确认删除"
            okType="danger"
            cancelText="取消"
            onConfirm={() => handleDeleteProject(record.id, record.name)}
            disabled={!hasPermission('projects:delete')}
          >
            <Tooltip title="删除项目">
              <Button
                type="text"
                icon={<DeleteOutlined />}
                size="small"
                danger
                disabled={!hasPermission('projects:delete')}
              />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ]
  
  return (
    <div>
      <Space style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={2} style={{ margin: 0 }}>项目管理</Title>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setCreateModalVisible(true)}
          disabled={!hasPermission('projects:create')}
        >
          新建项目
        </Button>
      </Space>
      
      <Card>
        <Table
          dataSource={projects}
          columns={columns}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 个项目`,
          }}
          scroll={{ x: true }}
        />
      </Card>
      
      {/* 创建项目模态框 */}
      <Modal
        title="创建新项目"
        open={createModalVisible}
        onCancel={() => {
          setCreateModalVisible(false)
          form.resetFields()
        }}
        footer={null}
        width={600}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleCreateProject}
          initialValues={{
            schema_name: '',
            description: '',
            database_name: '',
            template: 'basic',
          }}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="项目名称"
                name="name"
                rules={[
                  { required: true, message: '请输入项目名称' },
                  { max: 50, message: '项目名称不能超过50个字符' },
                ]}
              >
                <Input placeholder="例如：我的电商项目" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Schema名称"
                name="schema_name"
                rules={[
                  { pattern: /^[a-z0-9_]+$/, message: '只能包含小写字母、数字和下划线' },
                ]}
                tooltip="数据库schema名称，留空将自动生成"
              >
                <Input placeholder="例如：my_ecommerce" />
              </Form.Item>
            </Col>
          </Row>
          
          <Form.Item
            label="项目描述"
            name="description"
            rules={[{ max: 200, message: '描述不能超过200个字符' }]}
          >
            <Input.TextArea
              placeholder="项目的简要描述"
              rows={3}
            />
          </Form.Item>
          
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="数据库名称"
                name="database_name"
                tooltip="指定数据库名称，留空使用默认数据库"
              >
                <Input placeholder="例如：ecommerce_db" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="选择模板"
                name="template"
              >
                <Select>
                  <Option value="basic">基础模板</Option>
                  <Option value="ecommerce">电商模板</Option>
                  <Option value="blog">博客模板</Option>
                  <Option value="saas">SaaS模板</Option>
                  <Option value="custom">自定义</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          
          <Form.Item
            label="自动执行"
            valuePropName="checked"
            initialValue={true}
          >
            <Space direction="vertical" size={4}>
              <Text type="secondary" style={{ fontSize: 12 }}>
                创建项目后将自动执行以下操作：
              </Text>
              <ul style={{ margin: 0, paddingLeft: 16, fontSize: 12 }}>
                <li>创建数据库schema</li>
                <li>生成唯一的API Key</li>
                <li>创建默认表结构（根据模板）</li>
              </ul>
            </Space>
          </Form.Item>
          
          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setCreateModalVisible(false)}>
                取消
              </Button>
              <Button type="primary" htmlType="submit">
                创建
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
      
      {/* 创建成功提示 */}
      <div style={{ marginTop: 16 }}>
        <Text type="secondary">
          提示：项目创建后将自动生成独立的数据库schema和API Key，确保数据隔离。
        </Text>
      </div>
    </div>
  )
}

export default ProjectList