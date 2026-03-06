import React, { useState, useEffect } from 'react'
import {
  Card,
  Table,
  Button,
  Space,
  Tag,
  Modal,
  Form,
  Input,
  Select,
  Switch,
  DatePicker,
  message,
  Popconfirm,
  Tooltip,
  Typography,
  Row,
  Col,
  Divider,
  Alert,
} from 'antd'
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  CopyOutlined,
  EyeOutlined,
  EyeInvisibleOutlined,
  KeyOutlined,
  ReloadOutlined,
} from '@ant-design/icons'
import dayjs from 'dayjs'
import { useProjectStore } from '@/store/project'
import { hasPermission } from '@/store/auth'
import type { ApiKey, CreateApiKeyRequest } from '@/types'
import { apiKeyApi } from '@/services/api'

const { Title, Text, Paragraph } = Typography
const { Option } = Select

// 权限选项
const PERMISSION_OPTIONS = [
  { label: '项目读取', value: 'projects:read' },
  { label: '项目写入', value: 'projects:write' },
  { label: '数据库读取', value: 'database:read' },
  { label: '数据库写入', value: 'database:write' },
  { label: 'API密钥管理', value: 'apikeys:manage' },
  { label: '迁移执行', value: 'migrations:execute' },
  { label: '日志查看', value: 'logs:view' },
  { label: '系统设置', value: 'settings:view' },
]

// 默认权限组
const PERMISSION_PRESETS = {
  '只读访问': ['projects:read', 'database:read', 'logs:view'],
  '开发人员': ['projects:read', 'projects:write', 'database:read', 'database:write', 'migrations:execute', 'logs:view'],
  '管理员': ['projects:read', 'projects:write', 'database:read', 'database:write', 'apikeys:manage', 'migrations:execute', 'logs:view', 'settings:view'],
  '完全控制': ['projects:read', 'projects:write', 'database:read', 'database:write', 'apikeys:manage', 'migrations:execute', 'logs:view', 'settings:view'],
}

const ApiKeys: React.FC = () => {
  const [loading, setLoading] = useState(false)
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([])
  const [selectedProject, setSelectedProject] = useState<string>('')
  const [modalVisible, setModalVisible] = useState(false)
  const [form] = Form.useForm()
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([])
  const [selectedPreset, setSelectedPreset] = useState<string>('')
  const [showApiKey, setShowApiKey] = useState<string | null>(null)
  const [newApiKey, setNewApiKey] = useState<string>('')
  const [activeProject] = useProjectStore((state) => [state.activeProject])

  // 获取项目ID
  const projectId = selectedProject || activeProject?.id || ''

  // 加载API密钥
  const loadApiKeys = async () => {
    if (!projectId) return
    setLoading(true)
    try {
      // 这里使用mock数据，实际应该调用apiKeyApi.getApiKeys(projectId)
      const mockData: ApiKey[] = [
        {
          id: '1',
          name: '生产环境API密钥',
          key: 'sk_live_1234567890abcdef',
          project_id: projectId,
          permissions: ['projects:read', 'projects:write', 'database:read', 'database:write'],
          created_at: '2024-01-15T10:30:00Z',
          expires_at: '2025-01-15T10:30:00Z',
          is_active: true,
          last_used_at: '2024-03-05T14:25:00Z',
        },
        {
          id: '2',
          name: '开发环境只读密钥',
          key: 'sk_dev_abcdef1234567890',
          project_id: projectId,
          permissions: ['projects:read', 'database:read'],
          created_at: '2024-02-20T08:15:00Z',
          expires_at: '2024-08-20T08:15:00Z',
          is_active: true,
          last_used_at: '2024-03-04T11:20:00Z',
        },
        {
          id: '3',
          name: '迁移脚本密钥',
          key: 'sk_mig_7890abcdef123456',
          project_id: projectId,
          permissions: ['migrations:execute'],
          created_at: '2024-03-01T09:45:00Z',
          expires_at: null,
          is_active: false,
          last_used_at: null,
        },
      ]
      setApiKeys(mockData)
    } catch (error) {
      message.error('加载API密钥失败')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (projectId) {
      loadApiKeys()
    }
  }, [projectId])

  // 创建API密钥
  const handleCreate = async (values: any) => {
    try {
      setLoading(true)
      // 这里应该调用apiKeyApi.createApiKey(projectId, values)
      const newKey: ApiKey = {
        id: Date.now().toString(),
        name: values.name,
        key: `sk_new_${Math.random().toString(36).substring(2, 15)}`,
        project_id: projectId,
        permissions: selectedPermissions,
        created_at: new Date().toISOString(),
        expires_at: values.expires_in_days 
          ? dayjs().add(values.expires_in_days, 'day').toISOString()
          : undefined,
        is_active: true,
      }
      
      setApiKeys([...apiKeys, newKey])
      setNewApiKey(newKey.key)
      setModalVisible(false)
      form.resetFields()
      setSelectedPermissions([])
      setSelectedPreset('')
      message.success('API密钥创建成功')
    } catch (error) {
      message.error('创建API密钥失败')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  // 删除API密钥
  const handleDelete = async (id: string) => {
    try {
      // 这里应该调用apiKeyApi.deleteApiKey(projectId, id)
      setApiKeys(apiKeys.filter(key => key.id !== id))
      message.success('API密钥已删除')
    } catch (error) {
      message.error('删除API密钥失败')
      console.error(error)
    }
  }

  // 切换API密钥状态
  const handleToggle = async (id: string, isActive: boolean) => {
    try {
      // 这里应该调用apiKeyApi.toggleApiKey(projectId, id, !isActive)
      setApiKeys(apiKeys.map(key => 
        key.id === id ? { ...key, is_active: !isActive } : key
      ))
      message.success(`API密钥已${!isActive ? '启用' : '禁用'}`)
    } catch (error) {
      message.error('操作失败')
      console.error(error)
    }
  }

  // 轮换API密钥
  const handleRotate = async (id: string) => {
    try {
      // 这里应该调用apiKeyApi.rotateApiKey(projectId, id)
      const newKey = `sk_rotated_${Math.random().toString(36).substring(2, 15)}`
      setApiKeys(apiKeys.map(key => 
        key.id === id ? { ...key, key: newKey } : key
      ))
      setShowApiKey(id)
      message.success('API密钥已轮换')
    } catch (error) {
      message.error('轮换API密钥失败')
      console.error(error)
    }
  }

  // 复制API密钥
  const handleCopy = (key: string) => {
    navigator.clipboard.writeText(key)
    message.success('API密钥已复制到剪贴板')
  }

  // 权限预设选择
  const handlePresetChange = (preset: string) => {
    setSelectedPreset(preset)
    const permissions = PERMISSION_PRESETS[preset as keyof typeof PERMISSION_PRESETS] || []
    setSelectedPermissions(permissions)
    form.setFieldsValue({ permissions })
  }

  // 表格列定义
  const columns = [
    {
      title: '名称',
      dataIndex: 'name',
      key: 'name',
      width: 200,
    },
    {
      title: 'API密钥',
      dataIndex: 'key',
      key: 'key',
      width: 300,
      render: (key: string, record: ApiKey) => (
        <Space>
          <Text copyable={{ text: key }} style={{ fontFamily: 'monospace' }}>
            {showApiKey === record.id || hasPermission('apikeys:view') 
              ? key 
              : '••••••••••••••••••••••••'}
          </Text>
          {showApiKey !== record.id && (
            <Button
              type="text"
              size="small"
              icon={showApiKey === record.id ? <EyeInvisibleOutlined /> : <EyeOutlined />}
              onClick={() => setShowApiKey(showApiKey === record.id ? null : record.id)}
            />
          )}
          <Button
            type="text"
            size="small"
            icon={<CopyOutlined />}
            onClick={() => handleCopy(key)}
          />
        </Space>
      ),
    },
    {
      title: '权限',
      dataIndex: 'permissions',
      key: 'permissions',
      width: 300,
      render: (permissions: string[]) => (
        <Space wrap>
          {permissions.map(perm => (
            <Tag key={perm} color="blue" style={{ margin: '2px' }}>
              {PERMISSION_OPTIONS.find(p => p.value === perm)?.label || perm}
            </Tag>
          ))}
        </Space>
      ),
    },
    {
      title: '状态',
      dataIndex: 'is_active',
      key: 'is_active',
      width: 100,
      render: (isActive: boolean) => (
        <Tag color={isActive ? 'success' : 'error'}>
          {isActive ? '启用' : '禁用'}
        </Tag>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 180,
      render: (date: string) => dayjs(date).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '过期时间',
      dataIndex: 'expires_at',
      key: 'expires_at',
      width: 180,
      render: (date: string | null) => date ? dayjs(date).format('YYYY-MM-DD HH:mm') : '永不过期',
    },
    {
      title: '最后使用',
      dataIndex: 'last_used_at',
      key: 'last_used_at',
      width: 180,
      render: (date: string | null) => date ? dayjs(date).format('YYYY-MM-DD HH:mm') : '从未使用',
    },
    {
      title: '操作',
      key: 'actions',
      width: 200,
      fixed: 'right',
      render: (_: any, record: ApiKey) => (
        <Space size="small">
          <Tooltip title="轮换密钥">
            <Button
              type="text"
              size="small"
              icon={<ReloadOutlined />}
              onClick={() => handleRotate(record.id)}
              disabled={!hasPermission('apikeys:manage')}
            />
          </Tooltip>
          <Tooltip title={record.is_active ? '禁用' : '启用'}>
            <Switch
              size="small"
              checked={record.is_active}
              onChange={() => handleToggle(record.id, record.is_active)}
              disabled={!hasPermission('apikeys:manage')}
            />
          </Tooltip>
          <Tooltip title="删除">
            <Popconfirm
              title="确定要删除这个API密钥吗？"
              description="删除后将无法恢复，使用此密钥的应用将无法访问API。"
              onConfirm={() => handleDelete(record.id)}
              okText="删除"
              cancelText="取消"
              okType="danger"
            >
              <Button
                type="text"
                size="small"
                danger
                icon={<DeleteOutlined />}
                disabled={!hasPermission('apikeys:delete')}
              />
            </Popconfirm>
          </Tooltip>
        </Space>
      ),
    },
  ]

  // 如果没有选择项目
  if (!projectId) {
    return (
      <Card>
        <Alert
          message="请先选择项目"
          description="在顶部导航栏中选择一个项目以管理其API密钥。"
          type="info"
          showIcon
        />
      </Card>
    )
  }

  return (
    <div>
      <Title level={2}>API密钥管理</Title>
      <Paragraph type="secondary">
        管理项目的API密钥，控制不同应用和服务的访问权限。
      </Paragraph>

      <Divider />

      <Card>
        <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
          <Col>
            <Text strong>当前项目：</Text>
            <Tag color="blue" style={{ marginLeft: 8 }}>
              {activeProject?.name || '未选择项目'}
            </Tag>
          </Col>
          <Col>
            <Space>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => setModalVisible(true)}
                disabled={!hasPermission('apikeys:create')}
              >
                创建API密钥
              </Button>
            </Space>
          </Col>
        </Row>

        <Table
          columns={columns}
          dataSource={apiKeys}
          rowKey="id"
          loading={loading}
          scroll={{ x: 1300 }}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 个API密钥`,
          }}
        />
      </Card>

      {/* 创建API密钥模态框 */}
      <Modal
        title="创建API密钥"
        open={modalVisible}
        onOk={() => form.submit()}
        onCancel={() => {
          setModalVisible(false)
          form.resetFields()
          setSelectedPermissions([])
          setSelectedPreset('')
        }}
        width={700}
        confirmLoading={loading}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleCreate}
          initialValues={{
            expires_in_days: 365,
          }}
        >
          <Form.Item
            name="name"
            label="密钥名称"
            rules={[{ required: true, message: '请输入密钥名称' }]}
          >
            <Input placeholder="例如：生产环境API密钥" />
          </Form.Item>

          <Form.Item
            label="权限预设"
          >
            <Select
              placeholder="选择权限预设"
              value={selectedPreset}
              onChange={handlePresetChange}
              style={{ width: '100%' }}
            >
              {Object.keys(PERMISSION_PRESETS).map(preset => (
                <Option key={preset} value={preset}>{preset}</Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="permissions"
            label="权限"
            rules={[{ required: true, message: '请选择至少一个权限' }]}
          >
            <Select
              mode="multiple"
              placeholder="选择权限"
              value={selectedPermissions}
              onChange={setSelectedPermissions}
              options={PERMISSION_OPTIONS}
              style={{ width: '100%' }}
            />
          </Form.Item>

          <Form.Item
            name="expires_in_days"
            label="有效期（天）"
            tooltip="设置为空表示永不过期"
          >
            <Input type="number" min={1} placeholder="例如：365" />
          </Form.Item>

          <Alert
            message="安全提醒"
            description="API密钥具有访问您项目的权限，请妥善保管。建议设置合理的有效期并定期轮换。"
            type="warning"
            showIcon
            style={{ marginBottom: 16 }}
          />
        </Form>
      </Modal>

      {/* 显示新创建的API密钥 */}
      <Modal
        title="API密钥创建成功"
        open={!!newApiKey}
        onOk={() => setNewApiKey('')}
        onCancel={() => setNewApiKey('')}
        footer={[
          <Button key="copy" type="primary" onClick={() => handleCopy(newApiKey)}>
            复制密钥
          </Button>,
          <Button key="close" onClick={() => setNewApiKey('')}>
            关闭
          </Button>,
        ]}
      >
        <Alert
          message="请立即保存此API密钥"
          description="此密钥只会显示一次，关闭后将无法再次查看。请妥善保管。"
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
        />
        <div style={{ 
          backgroundColor: '#f6f6f6', 
          padding: 16, 
          borderRadius: 4,
          fontFamily: 'monospace',
          wordBreak: 'break-all',
        }}>
          {newApiKey}
        </div>
        <Text type="secondary" style={{ display: 'block', marginTop: 8 }}>
          请将此密钥添加到您的应用配置中，如环境变量或配置文件。
        </Text>
      </Modal>
    </div>
  )
}

export default ApiKeys