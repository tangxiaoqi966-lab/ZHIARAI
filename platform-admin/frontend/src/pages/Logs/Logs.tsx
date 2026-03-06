import React, { useState, useEffect } from 'react'
import {
  Card,
  Table,
  Button,
  Space,
  Tag,
  DatePicker,
  Select,
  Input,
  Form,
  Row,
  Col,
  Typography,
  Modal,
  message,
  Popconfirm,
  Tooltip,
  Badge,
  Alert,
  Divider,
} from 'antd'
import {
  SearchOutlined,
  ReloadOutlined,
  ExportOutlined,
  DeleteOutlined,
  FilterOutlined,
  EyeOutlined,
} from '@ant-design/icons'
import dayjs from 'dayjs'
import { useProjectStore } from '@/store/project'
import { hasPermission } from '@/store/auth'
import type { Log, LogQuery } from '@/types'
import { logApi } from '@/services/api'

const { RangePicker } = DatePicker
const { Title, Text, Paragraph } = Typography
const { Option } = Select

// 日志级别选项
const LOG_LEVELS = [
  { label: 'INFO', value: 'info', color: 'blue' },
  { label: 'WARN', value: 'warn', color: 'orange' },
  { label: 'ERROR', value: 'error', color: 'red' },
  { label: 'DEBUG', value: 'debug', color: 'gray' },
]

// 操作类型选项（根据实际系统定义）
const ACTION_OPTIONS = [
  'project.create',
  'project.update',
  'project.delete',
  'api_key.create',
  'api_key.delete',
  'api_key.rotate',
  'migration.execute',
  'migration.rollback',
  'table.create',
  'table.update',
  'table.delete',
  'user.login',
  'user.logout',
  'settings.update',
]

const Logs: React.FC = () => {
  const [loading, setLoading] = useState(false)
  const [logs, setLogs] = useState<Log[]>([])
  const [total, setTotal] = useState(0)
  const [filterVisible, setFilterVisible] = useState(true)
  const [form] = Form.useForm()
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])
  const [activeProject] = useProjectStore((state) => [state.activeProject])

  // 分页状态
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0,
  })

  // 构建查询参数
  const buildQueryParams = (values: any): LogQuery => {
    const params: LogQuery = {}
    
    if (values.levels && values.levels.length > 0) {
      params.level = values.levels
    }
    
    if (values.dateRange && values.dateRange.length === 2) {
      params.start_date = values.dateRange[0].format('YYYY-MM-DD')
      params.end_date = values.dateRange[1].format('YYYY-MM-DD')
    }
    
    if (values.project_id) {
      params.project_id = values.project_id
    } else if (activeProject?.id) {
      params.project_id = activeProject.id
    }
    
    if (values.user_id) {
      params.user_id = values.user_id
    }
    
    if (values.action) {
      params.action = values.action
    }
    
    if (values.search) {
      params.search = values.search
    }
    
    return params
  }

  // 加载日志
  const loadLogs = async (page = 1, pageSize = 20) => {
    setLoading(true)
    try {
      const values = await form.validateFields()
      const queryParams = buildQueryParams(values)
      
      // 这里使用mock数据，实际应该调用logApi.getLogs(activeProject?.id || '', queryParams)
      const mockData: Log[] = [
        {
          id: '1',
          timestamp: '2024-03-06T10:30:00Z',
          level: 'info',
          message: '项目"电商平台"创建成功',
          user_id: 'admin',
          user_name: '管理员',
          project_id: activeProject?.id || 'proj_123',
          action: 'project.create',
          details: { name: '电商平台', schema_name: 'ecommerce' },
          ip_address: '192.168.1.100',
        },
        {
          id: '2',
          timestamp: '2024-03-06T11:15:00Z',
          level: 'info',
          message: 'API密钥"生产环境"创建成功',
          user_id: 'admin',
          user_name: '管理员',
          project_id: activeProject?.id || 'proj_123',
          action: 'api_key.create',
          details: { name: '生产环境', permissions: ['projects:read', 'projects:write'] },
          ip_address: '192.168.1.100',
        },
        {
          id: '3',
          timestamp: '2024-03-06T12:45:00Z',
          level: 'warn',
          message: '数据库连接池接近上限',
          user_id: 'system',
          user_name: '系统',
          project_id: activeProject?.id || 'proj_123',
          action: 'system.warning',
          details: { connection_count: 95, max_connections: 100 },
          ip_address: '127.0.0.1',
        },
        {
          id: '4',
          timestamp: '2024-03-06T14:20:00Z',
          level: 'error',
          message: '迁移脚本执行失败',
          user_id: 'dev_user',
          user_name: '开发用户',
          project_id: activeProject?.id || 'proj_123',
          action: 'migration.execute',
          details: { migration_id: 5, error: '语法错误: 缺少分号' },
          ip_address: '192.168.1.150',
        },
        {
          id: '5',
          timestamp: '2024-03-06T15:10:00Z',
          level: 'info',
          message: '用户登录成功',
          user_id: 'admin',
          user_name: '管理员',
          project_id: activeProject?.id || 'proj_123',
          action: 'user.login',
          details: { method: 'password' },
          ip_address: '192.168.1.100',
        },
        {
          id: '6',
          timestamp: '2024-03-06T16:30:00Z',
          level: 'debug',
          message: 'SQL查询执行',
          user_id: 'system',
          user_name: '系统',
          project_id: activeProject?.id || 'proj_123',
          action: 'database.query',
          details: { sql: 'SELECT * FROM users LIMIT 10', duration: 45 },
          ip_address: '127.0.0.1',
        },
        {
          id: '7',
          timestamp: '2024-03-06T17:45:00Z',
          level: 'info',
          message: '系统设置已更新',
          user_id: 'admin',
          user_name: '管理员',
          project_id: activeProject?.id || 'proj_123',
          action: 'settings.update',
          details: { section: 'database', changes: ['max_connections'] },
          ip_address: '192.168.1.100',
        },
      ]
      
      // 模拟分页
      const start = (page - 1) * pageSize
      const end = start + pageSize
      const paginatedData = mockData.slice(start, end)
      
      setLogs(paginatedData)
      setTotal(mockData.length)
      setPagination({
        current: page,
        pageSize,
        total: mockData.length,
      })
    } catch (error) {
      message.error('加载日志失败')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadLogs()
  }, [activeProject])

  // 处理分页变化
  const handleTableChange = (pagination: any) => {
    setPagination(pagination)
    loadLogs(pagination.current, pagination.pageSize)
  }

  // 处理查询
  const handleSearch = () => {
    setPagination({ ...pagination, current: 1 })
    loadLogs(1, pagination.pageSize)
  }

  // 重置查询
  const handleReset = () => {
    form.resetFields()
    setPagination({ ...pagination, current: 1 })
    loadLogs(1, pagination.pageSize)
  }

  // 导出日志
  const handleExport = async () => {
    try {
      const values = await form.validateFields()
      const queryParams = buildQueryParams(values)
      
      // 这里应该调用logApi.exportLogs(activeProject?.id || '', queryParams)
      message.success('日志导出任务已开始，下载将在后台进行')
    } catch (error) {
      message.error('导出日志失败')
      console.error(error)
    }
  }

  // 清空日志
  const handleClear = async () => {
    try {
      // 这里应该调用logApi.clearLogs(activeProject?.id || '')
      setLogs([])
      setTotal(0)
      message.success('日志已清空')
    } catch (error) {
      message.error('清空日志失败')
      console.error(error)
    }
  }

  // 查看日志详情
  const handleViewDetail = (log: Log) => {
    Modal.info({
      title: '日志详情',
      width: 800,
      content: (
        <div>
          <Row gutter={16} style={{ marginBottom: 16 }}>
            <Col span={12}>
              <Text strong>时间戳: </Text>
              <Text>{dayjs(log.timestamp).format('YYYY-MM-DD HH:mm:ss')}</Text>
            </Col>
            <Col span={12}>
              <Text strong>级别: </Text>
              <Tag color={LOG_LEVELS.find(l => l.value === log.level)?.color}>
                {log.level.toUpperCase()}
              </Tag>
            </Col>
          </Row>
          <Row gutter={16} style={{ marginBottom: 16 }}>
            <Col span={12}>
              <Text strong>用户: </Text>
              <Text>{log.user_name} ({log.user_id})</Text>
            </Col>
            <Col span={12}>
              <Text strong>IP地址: </Text>
              <Text>{log.ip_address || '未知'}</Text>
            </Col>
          </Row>
          <Row gutter={16} style={{ marginBottom: 16 }}>
            <Col span={12}>
              <Text strong>操作: </Text>
              <Text>{log.action}</Text>
            </Col>
            <Col span={12}>
              <Text strong>项目ID: </Text>
              <Text>{log.project_id}</Text>
            </Col>
          </Row>
          <Divider />
          <Text strong>消息内容: </Text>
          <Paragraph style={{ marginTop: 8 }}>{log.message}</Paragraph>
          <Divider />
          <Text strong>详细信息: </Text>
          <pre style={{ 
            backgroundColor: '#f6f6f6', 
            padding: 16, 
            borderRadius: 4,
            marginTop: 8,
            maxHeight: 300,
            overflow: 'auto',
          }}>
            {JSON.stringify(log.details, null, 2)}
          </pre>
        </div>
      ),
      okText: '关闭',
    })
  }

  // 表格列定义
  const columns = [
    {
      title: '时间',
      dataIndex: 'timestamp',
      key: 'timestamp',
      width: 180,
      render: (timestamp: string) => dayjs(timestamp).format('MM-DD HH:mm:ss'),
      sorter: true,
    },
    {
      title: '级别',
      dataIndex: 'level',
      key: 'level',
      width: 100,
      render: (level: string) => {
        const levelConfig = LOG_LEVELS.find(l => l.value === level)
        return (
          <Tag color={levelConfig?.color} style={{ margin: 0 }}>
            {levelConfig?.label || level.toUpperCase()}
          </Tag>
        )
      },
      filters: LOG_LEVELS.map(l => ({ text: l.label, value: l.value })),
      onFilter: (value: string, record: Log) => record.level === value,
    },
    {
      title: '消息',
      dataIndex: 'message',
      key: 'message',
      width: 300,
      ellipsis: true,
    },
    {
      title: '用户',
      dataIndex: 'user_name',
      key: 'user_name',
      width: 150,
      render: (userName: string, record: Log) => (
        <Space direction="vertical" size={0}>
          <Text strong>{userName}</Text>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {record.user_id}
          </Text>
        </Space>
      ),
    },
    {
      title: '操作',
      dataIndex: 'action',
      key: 'action',
      width: 150,
      filters: ACTION_OPTIONS.map(action => ({ text: action, value: action })),
      onFilter: (value: string, record: Log) => record.action === value,
    },
    {
      title: 'IP地址',
      dataIndex: 'ip_address',
      key: 'ip_address',
      width: 120,
    },
    {
      title: '操作',
      key: 'actions',
      width: 100,
      fixed: 'right',
      render: (_: any, record: Log) => (
        <Tooltip title="查看详情">
          <Button
            type="text"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleViewDetail(record)}
          />
        </Tooltip>
      ),
    },
  ]

  // 行选择配置
  const rowSelection = {
    selectedRowKeys,
    onChange: setSelectedRowKeys,
  }

  return (
    <div>
      <Title level={2}>系统日志</Title>
      <Paragraph type="secondary">
        查看系统操作日志，监控系统运行状态和用户活动。
      </Paragraph>

      <Divider />

      <Card>
        {/* 过滤条件 */}
        {filterVisible && (
          <Form
            form={form}
            layout="vertical"
            style={{ marginBottom: 24 }}
            initialValues={{
              levels: ['info', 'warn', 'error'],
              dateRange: [dayjs().subtract(7, 'days'), dayjs()],
            }}
          >
            <Row gutter={16}>
              <Col span={6}>
                <Form.Item name="levels" label="日志级别">
                  <Select
                    mode="multiple"
                    placeholder="选择日志级别"
                    options={LOG_LEVELS.map(l => ({ label: l.label, value: l.value }))}
                  />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item name="dateRange" label="时间范围">
                  <RangePicker
                    style={{ width: '100%' }}
                    format="YYYY-MM-DD"
                  />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item name="project_id" label="项目">
                  <Select
                    placeholder="选择项目"
                    allowClear
                  >
                    <Option value={activeProject?.id || ''}>
                      {activeProject?.name || '当前项目'}
                    </Option>
                    <Option value="all">所有项目</Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item name="action" label="操作类型">
                  <Select
                    placeholder="选择操作类型"
                    allowClear
                    options={ACTION_OPTIONS.map(action => ({ label: action, value: action }))}
                  />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="search" label="搜索">
                  <Input
                    placeholder="搜索日志消息"
                    prefix={<SearchOutlined />}
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="操作" style={{ marginTop: 29 }}>
                  <Space>
                    <Button
                      type="primary"
                      icon={<SearchOutlined />}
                      onClick={handleSearch}
                    >
                      查询
                    </Button>
                    <Button
                      icon={<ReloadOutlined />}
                      onClick={handleReset}
                    >
                      重置
                    </Button>
                    <Button
                      type="text"
                      onClick={() => setFilterVisible(!filterVisible)}
                    >
                      {filterVisible ? '隐藏筛选' : '显示筛选'}
                    </Button>
                  </Space>
                </Form.Item>
              </Col>
            </Row>
          </Form>
        )}

        {/* 操作栏 */}
        <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
          <Col>
            <Space>
              <Button
                type="text"
                icon={<FilterOutlined />}
                onClick={() => setFilterVisible(!filterVisible)}
              >
                {filterVisible ? '隐藏筛选' : '显示筛选'}
              </Button>
              <Text type="secondary">
                共 {total} 条日志记录
              </Text>
            </Space>
          </Col>
          <Col>
            <Space>
              <Button
                icon={<ExportOutlined />}
                onClick={handleExport}
                disabled={!hasPermission('logs:export')}
              >
                导出日志
              </Button>
              <Popconfirm
                title="确定要清空所有日志吗？"
                description="此操作不可恢复，将删除所有日志记录。"
                onConfirm={handleClear}
                okText="清空"
                cancelText="取消"
                okType="danger"
                disabled={!hasPermission('logs:clear')}
              >
                <Button
                  danger
                  icon={<DeleteOutlined />}
                  disabled={!hasPermission('logs:clear') || logs.length === 0}
                >
                  清空日志
                </Button>
              </Popconfirm>
            </Space>
          </Col>
        </Row>

        {/* 日志表格 */}
        <Table
          columns={columns}
          dataSource={logs}
          rowKey="id"
          loading={loading}
          scroll={{ x: 1200 }}
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => 
              `第 ${range[0]}-${range[1]} 条，共 ${total} 条`,
          }}
          onChange={handleTableChange}
          rowSelection={hasPermission('logs:manage') ? rowSelection : undefined}
        />

        {/* 统计信息 */}
        <Divider />
        <Title level={5}>日志统计</Title>
        <Row gutter={16}>
          <Col span={6}>
            <Card size="small">
              <StatisticCard
                title="今日日志"
                value={logs.filter(l => dayjs(l.timestamp).isSame(dayjs(), 'day')).length}
                color="#1890ff"
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small">
              <StatisticCard
                title="错误日志"
                value={logs.filter(l => l.level === 'error').length}
                color="#ff4d4f"
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small">
              <StatisticCard
                title="警告日志"
                value={logs.filter(l => l.level === 'warn').length}
                color="#faad14"
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small">
              <StatisticCard
                title="用户操作"
                value={logs.filter(l => l.user_id !== 'system').length}
                color="#52c41a"
              />
            </Card>
          </Col>
        </Row>

        {/* 提醒信息 */}
        <Alert
          message="日志保留策略"
          description="系统默认保留最近30天的日志。超过保留期限的日志将自动清理。"
          type="info"
          showIcon
          style={{ marginTop: 24 }}
        />
      </Card>
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

export default Logs