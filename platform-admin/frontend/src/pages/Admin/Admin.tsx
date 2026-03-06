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
  message,
  Popconfirm,
  Tooltip,
  Typography,
  Row,
  Col,
  Divider,
  Avatar,
  Alert,
} from 'antd'
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  UserOutlined,
  LockOutlined,
  MailOutlined,
} from '@ant-design/icons'
import dayjs from 'dayjs'
import { hasPermission } from '@/store/auth'
import type { AdminUser, CreateAdminRequest, UpdateAdminRequest } from '@/types'
import { adminApi } from '@/services/api'

const { Title, Text, Paragraph } = Typography
const { Option } = Select

// 角色选项
const ROLE_OPTIONS = [
  { label: '超级管理员', value: 'SUPER_ADMIN', color: 'red' },
  { label: '管理员', value: 'ADMIN', color: 'orange' },
  { label: '开发人员', value: 'DEVELOPER', color: 'blue' },
  { label: '查看者', value: 'VIEWER', color: 'green' },
]

// 角色权限描述
const ROLE_DESCRIPTIONS = {
  SUPER_ADMIN: '拥有系统所有权限，包括管理其他管理员',
  ADMIN: '拥有管理权限，可以管理项目、数据库、API密钥等',
  DEVELOPER: '拥有开发权限，可以执行迁移、管理数据库等',
  VIEWER: '只读权限，只能查看系统信息',
}

const Admin: React.FC = () => {
  const [loading, setLoading] = useState(false)
  const [admins, setAdmins] = useState<AdminUser[]>([])
  const [modalVisible, setModalVisible] = useState(false)
  const [editingAdmin, setEditingAdmin] = useState<AdminUser | null>(null)
  const [form] = Form.useForm()
  const [passwordVisible, setPasswordVisible] = useState(false)

  // 加载管理员列表
  const loadAdmins = async () => {
    setLoading(true)
    try {
      // 这里使用mock数据，实际应该调用adminApi.getAdmins()
      const mockData: AdminUser[] = [
        {
          id: '1',
          username: 'admin',
          email: 'admin@example.com',
          role: 'SUPER_ADMIN',
          is_active: true,
          created_at: '2024-01-01T00:00:00Z',
          last_login_at: '2024-03-06T10:30:00Z',
          avatar_url: '',
        },
        {
          id: '2',
          username: 'manager',
          email: 'manager@example.com',
          role: 'ADMIN',
          is_active: true,
          created_at: '2024-01-15T09:15:00Z',
          last_login_at: '2024-03-05T14:20:00Z',
          avatar_url: '',
        },
        {
          id: '3',
          username: 'developer',
          email: 'developer@example.com',
          role: 'DEVELOPER',
          is_active: true,
          created_at: '2024-02-01T11:30:00Z',
          last_login_at: '2024-03-04T16:45:00Z',
          avatar_url: '',
        },
        {
          id: '4',
          username: 'viewer',
          email: 'viewer@example.com',
          role: 'VIEWER',
          is_active: false,
          created_at: '2024-02-20T14:50:00Z',
          last_login_at: '2024-02-25T09:10:00Z',
          avatar_url: '',
        },
      ]
      setAdmins(mockData)
    } catch (error) {
      message.error('加载管理员列表失败')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAdmins()
  }, [])

  // 打开创建模态框
  const handleCreate = () => {
    setEditingAdmin(null)
    form.resetFields()
    setPasswordVisible(true)
    setModalVisible(true)
  }

  // 打开编辑模态框
  const handleEdit = (admin: AdminUser) => {
    setEditingAdmin(admin)
    form.setFieldsValue({
      username: admin.username,
      email: admin.email,
      role: admin.role,
      is_active: admin.is_active,
    })
    setPasswordVisible(false)
    setModalVisible(true)
  }

  // 保存管理员
  const handleSave = async (values: any) => {
    try {
      setLoading(true)
      if (editingAdmin) {
        // 更新管理员
        // 这里应该调用adminApi.updateAdmin(editingAdmin.id, values)
        setAdmins(admins.map(admin => 
          admin.id === editingAdmin.id 
            ? { ...admin, ...values }
            : admin
        ))
        message.success('管理员信息已更新')
      } else {
        // 创建管理员
        // 这里应该调用adminApi.createAdmin(values)
        const newAdmin: AdminUser = {
          id: Date.now().toString(),
          username: values.username,
          email: values.email,
          role: values.role,
          is_active: values.is_active !== false,
          created_at: new Date().toISOString(),
          last_login_at: undefined,
          avatar_url: '',
        }
        setAdmins([...admins, newAdmin])
        message.success('管理员创建成功')
      }
      setModalVisible(false)
      form.resetFields()
      setEditingAdmin(null)
    } catch (error) {
      message.error(editingAdmin ? '更新管理员失败' : '创建管理员失败')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  // 删除管理员
  const handleDelete = async (id: string) => {
    try {
      // 这里应该调用adminApi.deleteAdmin(id)
      setAdmins(admins.filter(admin => admin.id !== id))
      message.success('管理员已删除')
    } catch (error) {
      message.error('删除管理员失败')
      console.error(error)
    }
  }

  // 切换管理员状态
  const handleToggle = async (id: string, isActive: boolean) => {
    try {
      // 这里应该调用adminApi.toggleAdmin(id, !isActive)
      setAdmins(admins.map(admin => 
        admin.id === id ? { ...admin, is_active: !isActive } : admin
      ))
      message.success(`管理员已${!isActive ? '启用' : '禁用'}`)
    } catch (error) {
      message.error('操作失败')
      console.error(error)
    }
  }

  // 检查是否可以删除/编辑
  const canEditOrDelete = (admin: AdminUser) => {
    // 不能操作自己的账号，除非是超级管理员
    const currentUser = { id: '1', role: 'SUPER_ADMIN' } // 模拟当前用户
    if (admin.id === currentUser.id) {
      return false
    }
    // 只有超级管理员可以管理其他超级管理员
    if (admin.role === 'SUPER_ADMIN' && currentUser.role !== 'SUPER_ADMIN') {
      return false
    }
    return true
  }

  // 表格列定义
  const columns = [
    {
      title: '管理员',
      dataIndex: 'username',
      key: 'username',
      width: 150,
      render: (username: string, record: AdminUser) => (
        <Space>
          <Avatar icon={<UserOutlined />} src={record.avatar_url} />
          <div>
            <div style={{ fontWeight: 'bold' }}>{username}</div>
            <div style={{ fontSize: '12px', color: '#666' }}>{record.email}</div>
          </div>
        </Space>
      ),
    },
    {
      title: '角色',
      dataIndex: 'role',
      key: 'role',
      width: 120,
      render: (role: string) => {
        const roleConfig = ROLE_OPTIONS.find(r => r.value === role)
        return (
          <Tag color={roleConfig?.color}>
            {roleConfig?.label || role}
          </Tag>
        )
      },
      filters: ROLE_OPTIONS.map(r => ({ text: r.label, value: r.value })),
      onFilter: (value: string, record: AdminUser) => record.role === value,
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
      filters: [
        { text: '启用', value: true },
        { text: '禁用', value: false },
      ],
      onFilter: (value: boolean, record: AdminUser) => record.is_active === value,
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 180,
      render: (date: string) => dayjs(date).format('YYYY-MM-DD HH:mm'),
      sorter: (a: AdminUser, b: AdminUser) => 
        dayjs(a.created_at).unix() - dayjs(b.created_at).unix(),
    },
    {
      title: '最后登录',
      dataIndex: 'last_login_at',
      key: 'last_login_at',
      width: 180,
      render: (date: string | undefined) => 
        date ? dayjs(date).format('YYYY-MM-DD HH:mm') : '从未登录',
      sorter: (a: AdminUser, b: AdminUser) => {
        const aTime = a.last_login_at ? dayjs(a.last_login_at).unix() : 0
        const bTime = b.last_login_at ? dayjs(b.last_login_at).unix() : 0
        return aTime - bTime
      },
    },
    {
      title: '操作',
      key: 'actions',
      width: 150,
      fixed: 'right',
      render: (_: any, record: AdminUser) => (
        <Space size="small">
          <Tooltip title="编辑">
            <Button
              type="text"
              size="small"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
              disabled={!hasPermission('admin:edit') || !canEditOrDelete(record)}
            />
          </Tooltip>
          <Tooltip title={record.is_active ? '禁用' : '启用'}>
            <Switch
              size="small"
              checked={record.is_active}
              onChange={() => handleToggle(record.id, record.is_active)}
              disabled={!hasPermission('admin:edit') || !canEditOrDelete(record)}
            />
          </Tooltip>
          <Tooltip title="删除">
            <Popconfirm
              title="确定要删除这个管理员吗？"
              description="删除后将无法恢复，该管理员将无法登录系统。"
              onConfirm={() => handleDelete(record.id)}
              okText="删除"
              cancelText="取消"
              okType="danger"
              disabled={!hasPermission('admin:delete') || !canEditOrDelete(record)}
            >
              <Button
                type="text"
                size="small"
                danger
                icon={<DeleteOutlined />}
                disabled={!hasPermission('admin:delete') || !canEditOrDelete(record)}
              />
            </Popconfirm>
          </Tooltip>
        </Space>
      ),
    },
  ]

  return (
    <div>
      <Title level={2}>管理员管理</Title>
      <Paragraph type="secondary">
        管理系统管理员账号，分配角色和权限。
      </Paragraph>

      <Divider />

      <Card>
        <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
          <Col>
            <Text strong>管理员总数：</Text>
            <Text style={{ marginLeft: 8, fontSize: 16, fontWeight: 'bold' }}>
              {admins.length}
            </Text>
          </Col>
          <Col>
            <Space>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleCreate}
                disabled={!hasPermission('admin:create')}
              >
                创建管理员
              </Button>
            </Space>
          </Col>
        </Row>

        <Alert
          message="权限说明"
          description="超级管理员拥有所有权限，包括管理其他管理员。管理员可以管理项目和系统设置。开发人员可以执行迁移和管理数据库。查看者只有只读权限。"
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />

        <Table
          columns={columns}
          dataSource={admins}
          rowKey="id"
          loading={loading}
          scroll={{ x: 1000 }}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 个管理员`,
          }}
        />

        {/* 角色统计 */}
        <Divider />
        <Title level={5}>角色分布</Title>
        <Row gutter={16}>
          {ROLE_OPTIONS.map(role => (
            <Col key={role.value} span={6}>
              <Card size="small">
                <StatisticCard
                  title={role.label}
                  value={admins.filter(a => a.role === role.value).length}
                  color={role.color}
                />
              </Card>
            </Col>
          ))}
        </Row>
      </Card>

      {/* 创建/编辑管理员模态框 */}
      <Modal
        title={editingAdmin ? '编辑管理员' : '创建管理员'}
        open={modalVisible}
        onOk={() => form.submit()}
        onCancel={() => {
          setModalVisible(false)
          form.resetFields()
          setEditingAdmin(null)
          setPasswordVisible(false)
        }}
        width={600}
        confirmLoading={loading}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSave}
          initialValues={{
            is_active: true,
            role: 'VIEWER',
          }}
        >
          <Form.Item
            name="username"
            label="用户名"
            rules={[
              { required: true, message: '请输入用户名' },
              { min: 3, message: '用户名至少3个字符' },
              { max: 20, message: '用户名最多20个字符' },
            ]}
          >
            <Input 
              placeholder="请输入用户名" 
              prefix={<UserOutlined />}
              disabled={!!editingAdmin}
            />
          </Form.Item>

          <Form.Item
            name="email"
            label="邮箱"
            rules={[
              { required: true, message: '请输入邮箱' },
              { type: 'email', message: '请输入有效的邮箱地址' },
            ]}
          >
            <Input 
              placeholder="请输入邮箱" 
              prefix={<MailOutlined />}
            />
          </Form.Item>

          {(!editingAdmin || passwordVisible) && (
            <Form.Item
              name="password"
              label="密码"
              rules={[
                { required: !editingAdmin, message: '请输入密码' },
                { min: 6, message: '密码至少6个字符' },
              ]}
              extra={editingAdmin ? "留空表示不修改密码" : undefined}
            >
              <Input.Password
                placeholder={editingAdmin ? "留空表示不修改密码" : "请输入密码"}
                prefix={<LockOutlined />}
              />
            </Form.Item>
          )}

          {editingAdmin && !passwordVisible && (
            <Form.Item>
              <Button
                type="link"
                onClick={() => setPasswordVisible(true)}
              >
                修改密码
              </Button>
            </Form.Item>
          )}

          <Form.Item
            name="role"
            label="角色"
            rules={[{ required: true, message: '请选择角色' }]}
          >
            <Select placeholder="选择角色">
              {ROLE_OPTIONS.map(role => (
                <Option key={role.value} value={role.value}>
                  <Space>
                    <Tag color={role.color}>{role.label}</Tag>
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      {ROLE_DESCRIPTIONS[role.value as keyof typeof ROLE_DESCRIPTIONS]}
                    </Text>
                  </Space>
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="is_active"
            label="状态"
            valuePropName="checked"
          >
            <Switch
              checkedChildren="启用"
              unCheckedChildren="禁用"
            />
          </Form.Item>

          {editingAdmin && (
            <Alert
              message="注意"
              description="修改管理员角色可能会影响其权限。"
              type="warning"
              showIcon
              style={{ marginBottom: 16 }}
            />
          )}
        </Form>
      </Modal>
    </div>
  )
}

// 统计卡片组件
const StatisticCard: React.FC<{
  title: string
  value: number
  color: string
}> = ({ title, value, color }) => {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: 24, fontWeight: 'bold', color }}>
        {value}
      </div>
      <div style={{ fontSize: 14, color: '#666', marginTop: 4 }}>
        {title}
      </div>
    </div>
  )
}

export default Admin