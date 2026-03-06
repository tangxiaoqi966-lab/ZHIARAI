import React, { useState, useEffect } from 'react'
import {
  Layout,
  Card,
  Table,
  Button,
  Space,
  Typography,
  Input,
  Modal,
  Form,
  Select,
  Tag,
  message,
  Popconfirm,
  Tooltip,
  Row,
  Col,
  Tabs,
  Divider,
  InputNumber,
  Switch,
  Radio,
  Collapse,
  Empty,
  Badge,
} from 'antd'
import {
  DatabaseOutlined,
  PlusOutlined,
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
  ReloadOutlined,
  SearchOutlined,
  CodeOutlined,
  TableOutlined,
  SortAscendingOutlined,
  FilterOutlined,
} from '@ant-design/icons'
import { useParams, useNavigate } from 'react-router-dom'
import { useProjectStore } from '@/store/project'
import { hasPermission } from '@/store/auth'
import { formatDate } from '@/utils/format'

const { Title, Text } = Typography
const { Sider, Content } = Layout
const { Option } = Select
const { TabPane } = Tabs
const { Panel } = Collapse
const { TextArea } = Input
const { Search } = Input

// 模拟数据
const mockTables = [
  {
    name: 'users',
    schema: 'public',
    columns: [
      { name: 'id', type: 'uuid', is_nullable: false, is_primary_key: true, default_value: 'gen_random_uuid()', description: '用户ID' },
      { name: 'email', type: 'text', is_nullable: false, is_primary_key: false, default_value: null, description: '邮箱' },
      { name: 'name', type: 'text', is_nullable: true, is_primary_key: false, default_value: null, description: '姓名' },
      { name: 'created_at', type: 'timestamptz', is_nullable: false, is_primary_key: false, default_value: 'now()', description: '创建时间' },
      { name: 'updated_at', type: 'timestamptz', is_nullable: false, is_primary_key: false, default_value: 'now()', description: '更新时间' },
    ],
    indexes: [
      { name: 'users_pkey', columns: ['id'], is_unique: true, type: 'btree' },
      { name: 'users_email_key', columns: ['email'], is_unique: true, type: 'btree' },
    ],
    row_count: 1524,
    size_bytes: 245760,
    created_at: '2024-01-15T10:30:00Z',
  },
  {
    name: 'products',
    schema: 'public',
    columns: [
      { name: 'id', type: 'serial', is_nullable: false, is_primary_key: true, default_value: null, description: '产品ID' },
      { name: 'name', type: 'text', is_nullable: false, is_primary_key: false, default_value: null, description: '产品名称' },
      { name: 'price', type: 'decimal', is_nullable: false, is_primary_key: false, default_value: '0.00', description: '价格' },
      { name: 'stock', type: 'integer', is_nullable: false, is_primary_key: false, default_value: '0', description: '库存' },
      { name: 'category', type: 'text', is_nullable: true, is_primary_key: false, default_value: null, description: '分类' },
      { name: 'created_at', type: 'timestamptz', is_nullable: false, is_primary_key: false, default_value: 'now()', description: '创建时间' },
    ],
    indexes: [
      { name: 'products_pkey', columns: ['id'], is_unique: true, type: 'btree' },
      { name: 'products_category_idx', columns: ['category'], is_unique: false, type: 'btree' },
    ],
    row_count: 89,
    size_bytes: 81920,
    created_at: '2024-01-20T14:20:00Z',
  },
  {
    name: 'orders',
    schema: 'public',
    columns: [
      { name: 'id', type: 'uuid', is_nullable: false, is_primary_key: true, default_value: 'gen_random_uuid()', description: '订单ID' },
      { name: 'user_id', type: 'uuid', is_nullable: false, is_primary_key: false, default_value: null, description: '用户ID' },
      { name: 'total_amount', type: 'decimal', is_nullable: false, is_primary_key: false, default_value: '0.00', description: '总金额' },
      { name: 'status', type: 'text', is_nullable: false, is_primary_key: false, default_value: "'pending'", description: '状态' },
      { name: 'created_at', type: 'timestamptz', is_nullable: false, is_primary_key: false, default_value: 'now()', description: '创建时间' },
    ],
    indexes: [
      { name: 'orders_pkey', columns: ['id'], is_unique: true, type: 'btree' },
      { name: 'orders_user_id_idx', columns: ['user_id'], is_unique: false, type: 'btree' },
      { name: 'orders_status_idx', columns: ['status'], is_unique: false, type: 'btree' },
    ],
    row_count: 423,
    size_bytes: 122880,
    created_at: '2024-01-25T09:15:00Z',
  },
]

// SQL历史记录
const mockSQLHistory = [
  { id: 1, sql: 'SELECT * FROM users LIMIT 10', executed_at: '2024-02-01T10:30:00Z', duration_ms: 45, success: true },
  { id: 2, sql: 'INSERT INTO products (name, price) VALUES (\'Test Product\', 19.99)', executed_at: '2024-02-01T09:15:00Z', duration_ms: 28, success: true },
  { id: 3, sql: 'ALTER TABLE users ADD COLUMN phone TEXT', executed_at: '2024-01-31T14:20:00Z', duration_ms: 120, success: true },
  { id: 4, sql: 'DROP TABLE temporary_data', executed_at: '2024-01-30T16:45:00Z', duration_ms: 85, success: true },
]

const Database: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>()
  const navigate = useNavigate()
  const [form] = Form.useForm()
  const [sqlForm] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [tables, setTables] = useState(mockTables)
  const [selectedTable, setSelectedTable] = useState<string | null>('users')
  const [createModalVisible, setCreateModalVisible] = useState(false)
  const [sqlEditorVisible, setSqlEditorVisible] = useState(false)
  const [sqlValue, setSqlValue] = useState('SELECT * FROM users LIMIT 10')
  const [sqlResults, setSqlResults] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState('structure')
  const [columns, setColumns] = useState<any[]>([
    { name: '', type: 'text', is_nullable: true, is_primary_key: false, default_value: '', description: '' },
  ])
  
  const { currentProject, getProjectById } = useProjectStore()
  const project = currentProject || (projectId ? getProjectById(projectId) : null)
  
  useEffect(() => {
    if (projectId && !project) {
      // 加载项目数据
      console.log('加载项目:', projectId)
    }
  }, [projectId, project])
  
  const loadTables = async () => {
    setLoading(true)
    try {
      // 模拟API调用
      setTimeout(() => {
        setTables([...mockTables])
        setLoading(false)
        message.success('表列表已刷新')
      }, 500)
    } catch (error) {
      console.error('加载表失败:', error)
      message.error('加载表失败')
      setLoading(false)
    }
  }
  
  const handleCreateTable = async (values: any) => {
    try {
      // 模拟API调用
      setTimeout(() => {
        const newTable = {
          name: values.name,
          schema: 'public',
          columns: columns.map(col => ({
            ...col,
            is_nullable: col.is_nullable || false,
            is_primary_key: col.is_primary_key || false,
          })),
          indexes: [],
          row_count: 0,
          size_bytes: 0,
          created_at: new Date().toISOString(),
        }
        setTables([...tables, newTable])
        setCreateModalVisible(false)
        form.resetFields()
        setColumns([{ name: '', type: 'text', is_nullable: true, is_primary_key: false, default_value: '', description: '' }])
        message.success(`表 "${values.name}" 创建成功`)
      }, 500)
    } catch (error) {
      console.error('创建表失败:', error)
      message.error('创建表失败')
    }
  }
  
  const handleDeleteTable = async (tableName: string) => {
    try {
      // 模拟API调用
      setTimeout(() => {
        setTables(tables.filter(table => table.name !== tableName))
        if (selectedTable === tableName) {
          setSelectedTable(tables.length > 1 ? tables[1].name : null)
        }
        message.success(`表 "${tableName}" 已删除`)
      }, 500)
    } catch (error) {
      console.error('删除表失败:', error)
      message.error('删除表失败')
    }
  }
  
  const handleExecuteSQL = async () => {
    if (!sqlValue.trim()) {
      message.warning('请输入SQL语句')
      return
    }
    
    setLoading(true)
    try {
      // 模拟API调用
      setTimeout(() => {
        const mockResults = [
          { id: 1, name: 'John Doe', email: 'john@example.com', created_at: '2024-01-15T10:30:00Z' },
          { id: 2, name: 'Jane Smith', email: 'jane@example.com', created_at: '2024-01-16T14:20:00Z' },
          { id: 3, name: 'Bob Johnson', email: 'bob@example.com', created_at: '2024-01-17T09:15:00Z' },
        ]
        setSqlResults(mockResults)
        setLoading(false)
        message.success('SQL执行成功')
      }, 800)
    } catch (error) {
      console.error('执行SQL失败:', error)
      message.error('执行SQL失败')
      setLoading(false)
    }
  }
  
  const handleAddColumn = () => {
    setColumns([...columns, { name: '', type: 'text', is_nullable: true, is_primary_key: false, default_value: '', description: '' }])
  }
  
  const handleRemoveColumn = (index: number) => {
    if (columns.length > 1) {
      const newColumns = [...columns]
      newColumns.splice(index, 1)
      setColumns(newColumns)
    }
  }
  
  const handleColumnChange = (index: number, field: string, value: any) => {
    const newColumns = [...columns]
    newColumns[index] = { ...newColumns[index], [field]: value }
    setColumns(newColumns)
  }
  
  const selectedTableData = tables.find(table => table.name === selectedTable)
  
  const tableColumns = [
    {
      title: '表名',
      dataIndex: 'name',
      key: 'name',
      render: (text: string) => (
        <Space>
          <TableOutlined />
          <Text strong>{text}</Text>
        </Space>
      ),
    },
    {
      title: 'Schema',
      dataIndex: 'schema',
      key: 'schema',
      render: (text: string) => <Tag color="blue">{text}</Tag>,
    },
    {
      title: '行数',
      dataIndex: 'row_count',
      key: 'row_count',
      render: (count: number) => count?.toLocaleString() || '0',
    },
    {
      title: '大小',
      dataIndex: 'size_bytes',
      key: 'size_bytes',
      render: (bytes: number) => {
        if (!bytes) return '0 B'
        const sizes = ['B', 'KB', 'MB', 'GB']
        const i = Math.floor(Math.log(bytes) / Math.log(1024))
        return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`
      },
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date: string) => formatDate(date),
    },
    {
      title: '操作',
      key: 'actions',
      render: (_: any, record: any) => (
        <Space>
          <Tooltip title="查看表结构">
            <Button
              type="text"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => setSelectedTable(record.name)}
            />
          </Tooltip>
          <Tooltip title="编辑表">
            <Button
              type="text"
              size="small"
              icon={<EditOutlined />}
              disabled={!hasPermission('database:edit')}
            />
          </Tooltip>
          <Popconfirm
            title={`确定要删除表 "${record.name}" 吗？`}
            description="此操作将删除表及其所有数据，且无法恢复。"
            okText="确认删除"
            okType="danger"
            cancelText="取消"
            onConfirm={() => handleDeleteTable(record.name)}
            disabled={!hasPermission('database:edit')}
          >
            <Tooltip title="删除表">
              <Button
                type="text"
                size="small"
                icon={<DeleteOutlined />}
                danger
                disabled={!hasPermission('database:edit')}
              />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ]
  
  const columnTypes = [
    'text', 'varchar', 'integer', 'bigint', 'decimal', 'numeric', 'boolean', 'date', 'timestamp', 'timestamptz',
    'uuid', 'json', 'jsonb', 'serial', 'bigserial', 'real', 'double precision', 'bytea', 'inet', 'cidr',
  ]
  
  return (
    <div>
      <Space style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={2} style={{ margin: 0 }}>
          <DatabaseOutlined /> 数据库管理
          {project && (
            <Text type="secondary" style={{ marginLeft: 8, fontSize: 16 }}>
              - {project.name}
            </Text>
          )}
        </Title>
        <Space>
          <Button
            icon={<ReloadOutlined />}
            onClick={loadTables}
            loading={loading}
          >
            刷新
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setCreateModalVisible(true)}
            disabled={!hasPermission('database:edit')}
          >
            新建表
          </Button>
          <Button
            icon={<CodeOutlined />}
            onClick={() => setSqlEditorVisible(true)}
          >
            SQL编辑器
          </Button>
        </Space>
      </Space>
      
      <Layout style={{ background: 'transparent' }}>
        <Sider
          width={250}
          style={{
            background: 'transparent',
            marginRight: 16,
            borderRight: '1px solid #f0f0f0',
          }}
        >
          <Card
            title="表列表"
            size="small"
            extra={
              <Badge count={tables.length} size="small" />
            }
            style={{ height: 'calc(100vh - 250px)', overflow: 'auto' }}
          >
            {tables.length === 0 ? (
              <Empty description="暂无表" />
            ) : (
              <div style={{ padding: 0 }}>
                {tables.map(table => (
                  <div
                    key={table.name}
                    style={{
                      padding: '8px 12px',
                      marginBottom: 4,
                      borderRadius: 4,
                      cursor: 'pointer',
                      background: selectedTable === table.name ? '#e6f7ff' : 'transparent',
                      border: selectedTable === table.name ? '1px solid #1890ff' : '1px solid transparent',
                      transition: 'all 0.2s',
                    }}
                    onClick={() => setSelectedTable(table.name)}
                  >
                    <Space direction="vertical" size={2} style={{ width: '100%' }}>
                      <Space>
                        <TableOutlined style={{ fontSize: 12 }} />
                        <Text strong>{table.name}</Text>
                      </Space>
                      <Space size={4}>
                        <Tag color="blue" style={{ fontSize: 10 }}>{table.schema}</Tag>
                        <Text type="secondary" style={{ fontSize: 10 }}>
                          {table.row_count?.toLocaleString()} 行
                        </Text>
                      </Space>
                    </Space>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </Sider>
        
        <Content>
          {selectedTable ? (
            <Card
              title={
                <Space>
                  <TableOutlined />
                  <Text strong>{selectedTable}</Text>
                  <Tag color="blue">{selectedTableData?.schema}</Tag>
                  {selectedTableData?.row_count && (
                    <Text type="secondary">
                      {selectedTableData.row_count.toLocaleString()} 行
                    </Text>
                  )}
                </Space>
              }
              extra={
                <Space>
                  <Button icon={<EyeOutlined />}>数据预览</Button>
                  <Button icon={<FilterOutlined />}>筛选</Button>
                  <Button icon={<SortAscendingOutlined />}>排序</Button>
                </Space>
              }
            >
              <Tabs activeKey={activeTab} onChange={setActiveTab}>
                <TabPane tab="表结构" key="structure">
                  <Table
                    dataSource={selectedTableData?.columns || []}
                    columns={[
                      { title: '字段名', dataIndex: 'name', key: 'name' },
                      { title: '类型', dataIndex: 'type', key: 'type', render: (type) => <Tag>{type}</Tag> },
                      { title: '可空', dataIndex: 'is_nullable', key: 'is_nullable', render: (nullable) => nullable ? '是' : '否' },
                      { title: '主键', dataIndex: 'is_primary_key', key: 'is_primary_key', render: (pk) => pk ? '是' : '否' },
                      { title: '默认值', dataIndex: 'default_value', key: 'default_value', render: (val) => val || '-' },
                      { title: '描述', dataIndex: 'description', key: 'description' },
                    ]}
                    rowKey="name"
                    pagination={false}
                    size="small"
                  />
                  
                  {selectedTableData?.indexes && selectedTableData.indexes.length > 0 && (
                    <div style={{ marginTop: 24 }}>
                      <Title level={5}>索引</Title>
                      <Table
                        dataSource={selectedTableData.indexes}
                        columns={[
                          { title: '索引名', dataIndex: 'name', key: 'name' },
                          { title: '字段', dataIndex: 'columns', key: 'columns', render: (cols) => cols.join(', ') },
                          { title: '唯一', dataIndex: 'is_unique', key: 'is_unique', render: (unique) => unique ? '是' : '否' },
                          { title: '类型', dataIndex: 'type', key: 'type' },
                        ]}
                        rowKey="name"
                        pagination={false}
                        size="small"
                      />
                    </div>
                  )}
                </TabPane>
                
                <TabPane tab="数据预览" key="preview">
                  <Alert
                    message="数据预览功能"
                    description="支持分页、筛选、排序和导出功能"
                    type="info"
                    showIcon
                    style={{ marginBottom: 16 }}
                  />
                  <Empty description="数据预览功能待实现" />
                </TabPane>
                
                <TabPane tab="SQL" key="sql">
                  <div style={{ marginBottom: 16 }}>
                    <TextArea
                      value={sqlValue}
                      onChange={(e) => setSqlValue(e.target.value)}
                      placeholder="输入SQL语句，例如：SELECT * FROM users LIMIT 10"
                      rows={6}
                      style={{ fontFamily: 'monospace', fontSize: 14 }}
                    />
                  </div>
                  <Space>
                    <Button type="primary" onClick={handleExecuteSQL} loading={loading}>
                      执行SQL
                    </Button>
                    <Button>格式化</Button>
                    <Button danger onClick={() => setSqlValue('')}>
                      清空
                    </Button>
                    <Button>保存脚本</Button>
                  </Space>
                  
                  {sqlResults.length > 0 && (
                    <div style={{ marginTop: 24 }}>
                      <Title level={5}>查询结果</Title>
                      <Table
                        dataSource={sqlResults}
                        columns={Object.keys(sqlResults[0] || {}).map(key => ({
                          title: key,
                          dataIndex: key,
                          key: key,
                        }))}
                        rowKey="id"
                        pagination={false}
                        size="small"
                        scroll={{ x: true }}
                      />
                    </div>
                  )}
                </TabPane>
              </Tabs>
            </Card>
          ) : (
            <Card>
              <Empty
                description="请从左侧选择表或创建新表"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            </Card>
          )}
        </Content>
      </Layout>
      
      {/* 创建表模态框 */}
      <Modal
        title="创建新表"
        open={createModalVisible}
        onCancel={() => {
          setCreateModalVisible(false)
          form.resetFields()
          setColumns([{ name: '', type: 'text', is_nullable: true, is_primary_key: false, default_value: '', description: '' }])
        }}
        width={800}
        footer={null}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleCreateTable}
          initialValues={{ schema: 'public' }}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="表名"
                name="name"
                rules={[
                  { required: true, message: '请输入表名' },
                  { pattern: /^[a-z][a-z0-9_]*$/, message: '表名只能包含小写字母、数字和下划线，且以字母开头' },
                ]}
              >
                <Input placeholder="例如：users, products, orders" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Schema"
                name="schema"
              >
                <Select disabled>
                  <Option value="public">public</Option>
                  <Option value="auth">auth</Option>
                  <Option value="storage">storage</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          
          <Divider orientation="left">字段定义</Divider>
          
          {columns.map((column, index) => (
            <Card
              key={index}
              size="small"
              style={{ marginBottom: 8 }}
              extra={
                columns.length > 1 && (
                  <Button
                    type="text"
                    size="small"
                    danger
                    onClick={() => handleRemoveColumn(index)}
                  >
                    删除
                  </Button>
                )
              }
            >
              <Row gutter={16}>
                <Col span={6}>
                  <Form.Item label="字段名" required>
                    <Input
                      value={column.name}
                      onChange={(e) => handleColumnChange(index, 'name', e.target.value)}
                      placeholder="例如：id, email, created_at"
                    />
                  </Form.Item>
                </Col>
                <Col span={4}>
                  <Form.Item label="类型" required>
                    <Select
                      value={column.type}
                      onChange={(value) => handleColumnChange(index, 'type', value)}
                    >
                      {columnTypes.map(type => (
                        <Option key={type} value={type}>{type}</Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={3}>
                  <Form.Item label="可空">
                    <Switch
                      checked={column.is_nullable}
                      onChange={(checked) => handleColumnChange(index, 'is_nullable', checked)}
                    />
                  </Form.Item>
                </Col>
                <Col span={3}>
                  <Form.Item label="主键">
                    <Switch
                      checked={column.is_primary_key}
                      onChange={(checked) => handleColumnChange(index, 'is_primary_key', checked)}
                    />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item label="默认值">
                    <Input
                      value={column.default_value}
                      onChange={(e) => handleColumnChange(index, 'default_value', e.target.value)}
                      placeholder="例如：now(), 'default_value'"
                    />
                  </Form.Item>
                </Col>
              </Row>
              <Row>
                <Col span={24}>
                  <Form.Item label="描述">
                    <Input
                      value={column.description}
                      onChange={(e) => handleColumnChange(index, 'description', e.target.value)}
                      placeholder="字段描述"
                    />
                  </Form.Item>
                </Col>
              </Row>
            </Card>
          ))}
          
          <div style={{ marginBottom: 16, textAlign: 'center' }}>
            <Button type="dashed" onClick={handleAddColumn} block>
              <PlusOutlined /> 添加字段
            </Button>
          </div>
          
          <Divider />
          
          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setCreateModalVisible(false)}>
                取消
              </Button>
              <Button type="primary" htmlType="submit">
                创建表
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
      
      {/* SQL编辑器模态框 */}
      <Modal
        title="SQL编辑器"
        open={sqlEditorVisible}
        onCancel={() => setSqlEditorVisible(false)}
        width={900}
        footer={null}
        style={{ top: 20 }}
      >
        <div style={{ marginBottom: 16 }}>
          <TextArea
            value={sqlValue}
            onChange={(e) => setSqlValue(e.target.value)}
            placeholder="输入SQL语句..."
            rows={10}
            style={{ fontFamily: 'monospace', fontSize: 14 }}
          />
        </div>
        
        <Space style={{ marginBottom: 16 }}>
          <Button type="primary" onClick={handleExecuteSQL} loading={loading}>
            <CodeOutlined /> 运行SQL
          </Button>
          <Button>
            格式化
          </Button>
          <Button>
            保存脚本
          </Button>
          <Button danger onClick={() => setSqlValue('')}>
            清空
          </Button>
          <Button onClick={() => setSqlValue('SELECT * FROM users LIMIT 10')}>
            示例
          </Button>
        </Space>
        
        <Divider orientation="left">历史记录</Divider>
        
        <Table
          dataSource={mockSQLHistory}
          columns={[
            {
              title: 'SQL语句',
              dataIndex: 'sql',
              key: 'sql',
              render: (sql) => (
                <Text code style={{ fontSize: 12, maxWidth: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {sql}
                </Text>
              ),
            },
            {
              title: '执行时间',
              dataIndex: 'executed_at',
              key: 'executed_at',
              render: (date) => formatDate(date),
            },
            {
              title: '耗时',
              dataIndex: 'duration_ms',
              key: 'duration_ms',
              render: (ms) => `${ms}ms`,
            },
            {
              title: '状态',
              key: 'success',
              render: (_: any, record: any) => (
                <Tag color={record.success ? 'success' : 'error'}>
                  {record.success ? '成功' : '失败'}
                </Tag>
              ),
            },
            {
              title: '操作',
              key: 'actions',
              render: (_: any, record: any) => (
                <Space>
                  <Button type="text" size="small" onClick={() => setSqlValue(record.sql)}>
                    复用
                  </Button>
                </Space>
              ),
            },
          ]}
          rowKey="id"
          pagination={false}
          size="small"
        />
        
        {sqlResults.length > 0 && (
          <>
            <Divider orientation="left">查询结果</Divider>
            <Table
              dataSource={sqlResults}
              columns={Object.keys(sqlResults[0] || {}).map(key => ({
                title: key,
                dataIndex: key,
                key: key,
              }))}
              rowKey="id"
              pagination={false}
              size="small"
              scroll={{ x: true }}
            />
          </>
        )}
      </Modal>
    </div>
  )
}

export default Database