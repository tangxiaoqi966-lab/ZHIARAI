import React, { useState, useEffect } from 'react'
import {
  Table,
  Button,
  Card,
  Typography,
  Select,
  Input,
  Space,
  Modal,
  Form,
  message,
  Tag,
  Empty,
} from 'antd'
import { PlusOutlined, SearchOutlined } from '@ant-design/icons'
import { migrationApi, projectApi } from '@/services/api'
import type { Migration, Project } from '@/types'
import { formatDate } from '@/utils/format'

const { Title } = Typography
const { TextArea } = Input
const { Option } = Select

const MigrationList: React.FC = () => {
  const [migrations, setMigrations] = useState<Migration[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [selectedProjectId, setSelectedProjectId] = useState<string>('')
  const [form] = Form.useForm()

  useEffect(() => {
    loadProjects()
    loadMigrations()
  }, [])

  const loadProjects = async () => {
    try {
      const data = await projectApi.getProjects()
      setProjects(data)
    } catch (error) {
      console.error('加载项目失败:', error)
    }
  }

  const loadMigrations = async (projectId?: string) => {
    setLoading(true)
    try {
      const params = projectId ? { project_id: projectId } : {}
      const data = await migrationApi.getMigrations(params)
      setMigrations(data)
    } catch (error) {
      console.error('加载迁移记录失败:', error)
      message.error('加载迁移记录失败')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateMigration = async (values: any) => {
    if (!selectedProjectId) {
      message.error('请先选择项目')
      return
    }

    try {
      await migrationApi.createMigration({
        project_id: selectedProjectId,
        migration_sql: values.migration_sql,
        description: values.description,
      })
      message.success('迁移执行成功')
      setModalVisible(false)
      form.resetFields()
      loadMigrations(selectedProjectId)
    } catch (error: any) {
      message.error(error || '迁移执行失败')
    }
  }

  const handleProjectChange = (projectId: string) => {
    setSelectedProjectId(projectId)
    loadMigrations(projectId)
  }

  const columns = [
    {
      title: '项目',
      dataIndex: 'project_name',
      key: 'project_name',
      render: (text: string, record: Migration) => (
        <Space>
          <span>{text}</span>
          <Tag color="blue">{record.schema_name}</Tag>
        </Space>
      ),
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      render: (text?: string) => text || '无描述',
    },
    {
      title: 'SQL片段',
      dataIndex: 'migration_sql',
      key: 'migration_sql',
      render: (text: string) => (
        <div style={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis' }}>
          <code>{text.substring(0, 100)}...</code>
        </div>
      ),
    },
    {
      title: '执行时间',
      dataIndex: 'executed_at',
      key: 'executed_at',
      render: (date: string) => formatDate(date),
    },
    {
      title: '版本',
      dataIndex: 'version',
      key: 'version',
      render: (version?: string) => version ? <Tag>{version}</Tag> : '-',
    },
  ]

  return (
    <div>
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <Title level={4} style={{ margin: 0 }}>数据迁移管理</Title>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setModalVisible(true)}
            disabled={!selectedProjectId}
          >
            执行迁移
          </Button>
        </div>

        <div style={{ marginBottom: 16 }}>
          <Space>
            <span>选择项目：</span>
            <Select
              placeholder="选择项目以查看迁移记录"
              style={{ width: 300 }}
              onChange={handleProjectChange}
              allowClear
              onClear={() => {
                setSelectedProjectId('')
                setMigrations([])
              }}
            >
              {projects.map(project => (
                <Option key={project.id} value={project.id}>
                  {project.name} ({project.schema_name})
                </Option>
              ))}
            </Select>
            <Button
              icon={<SearchOutlined />}
              onClick={() => loadMigrations(selectedProjectId)}
            >
              刷新
            </Button>
          </Space>
        </div>

        {!selectedProjectId ? (
          <Empty
            description="请选择项目以查看迁移记录"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        ) : (
          <Table
            columns={columns}
            dataSource={migrations}
            rowKey="id"
            loading={loading}
            pagination={{ pageSize: 10 }}
          />
        )}
      </Card>

      {/* 执行迁移模态框 */}
      <Modal
        title="执行数据迁移"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={() => form.submit()}
        width={800}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleCreateMigration}
          initialValues={{
            description: '',
          }}
        >
          <Form.Item
            label="目标项目"
            required
          >
            <Select
              placeholder="选择要执行迁移的项目"
              value={selectedProjectId}
              onChange={setSelectedProjectId}
              disabled={modalVisible && !!selectedProjectId}
            >
              {projects.map(project => (
                <Option key={project.id} value={project.id}>
                  {project.name} (schema: {project.schema_name})
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="description"
            label="迁移描述（可选）"
          >
            <Input placeholder="例如：创建用户表、添加索引等" />
          </Form.Item>

          <Form.Item
            name="migration_sql"
            label="迁移SQL"
            rules={[
              { required: true, message: '请输入迁移SQL' },
              { min: 10, message: 'SQL语句太短' },
            ]}
          >
            <TextArea
              placeholder="输入要执行的SQL语句，例如：CREATE TABLE users (id UUID PRIMARY KEY, name TEXT);"
              rows={10}
              style={{ fontFamily: 'monospace' }}
            />
          </Form.Item>

          <Form.Item
            label="注意事项"
          >
            <div style={{ color: 'orange' }}>
              <p>⚠️ 迁移SQL将在选定的项目schema中执行</p>
              <p>⚠️ 请确保SQL语法正确，错误的SQL可能导致数据损坏</p>
              <p>⚠️ 迁移操作将被记录，但无法自动回滚</p>
              <p>⚠️ 建议先在测试环境验证SQL语句</p>
            </div>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default MigrationList