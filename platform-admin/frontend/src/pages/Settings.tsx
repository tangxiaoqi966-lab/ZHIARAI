import React, { useState } from 'react'
import { Card, Form, Input, Button, Switch, message, Typography, Divider, Alert, Space } from 'antd'
import { SaveOutlined, ReloadOutlined } from '@ant-design/icons'

const { Title, Paragraph } = Typography

const Settings: React.FC = () => {
  const [loading, setLoading] = useState(false)
  const [form] = Form.useForm()

  const handleSave = async (values: any) => {
    setLoading(true)
    try {
      // 这里应该调用API保存设置
      await new Promise(resolve => setTimeout(resolve, 1000)) // 模拟API调用
      message.success('设置保存成功')
    } catch (error) {
      message.error('设置保存失败')
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    form.resetFields()
    message.info('设置已重置')
  }

  return (
    <div>
      <Title level={2}>系统设置</Title>
      
      <Alert
        message="系统设置"
        description="这些设置控制管理后台的行为和配置。部分设置需要重启服务才能生效。"
        type="info"
        showIcon
        style={{ marginBottom: 24 }}
      />

      <Card title="基本设置" style={{ marginBottom: 16 }}>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSave}
          initialValues={{
            system_name: 'Supabase 平台管理后台',
            api_timeout: 30,
            enable_auto_backup: true,
            log_retention_days: 30,
          }}
        >
          <Form.Item
            name="system_name"
            label="系统名称"
            rules={[{ required: true, message: '请输入系统名称' }]}
          >
            <Input placeholder="请输入系统显示名称" />
          </Form.Item>

          <Form.Item
            name="api_timeout"
            label="API超时时间（秒）"
            rules={[{ required: true, message: '请输入超时时间' }]}
          >
            <Input type="number" min={5} max={300} />
          </Form.Item>

          <Form.Item
            name="enable_auto_backup"
            label="自动备份"
            valuePropName="checked"
          >
            <Switch checkedChildren="开启" unCheckedChildren="关闭" />
          </Form.Item>

          <Form.Item
            name="log_retention_days"
            label="日志保留天数"
            rules={[{ required: true, message: '请输入日志保留天数' }]}
          >
            <Input type="number" min={1} max={365} />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button
                type="primary"
                htmlType="submit"
                icon={<SaveOutlined />}
                loading={loading}
              >
                保存设置
              </Button>
              <Button
                icon={<ReloadOutlined />}
                onClick={handleReset}
              >
                重置
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>

      <Card title="数据库配置" style={{ marginBottom: 16 }}>
        <Paragraph type="secondary">
          数据库连接配置通过环境变量管理。如需修改，请更新后端服务的环境变量并重启服务。
        </Paragraph>
        
        <div style={{ fontFamily: 'monospace', backgroundColor: '#f6f8fa', padding: 12, borderRadius: 4 }}>
          <div>DB_HOST=localhost</div>
          <div>DB_PORT=5432</div>
          <div>DB_NAME=postgres</div>
          <div>DB_USER=postgres</div>
          <div>DB_PASSWORD=********</div>
        </div>
      </Card>

      <Card title="系统信息">
        <div>
          <Paragraph>
            <strong>前端版本：</strong> 1.0.0
          </Paragraph>
          <Paragraph>
            <strong>后端版本：</strong> 1.0.0
          </Paragraph>
          <Paragraph>
            <strong>数据库架构：</strong> platform schema v1
          </Paragraph>
          <Paragraph>
            <strong>支持的项目数：</strong> 无限制（受数据库资源限制）
          </Paragraph>
          <Divider />
          <Paragraph type="secondary">
            系统设计用于管理多租户 Supabase 实例。每个项目独立 schema，通过 API Key 访问。
            管理后台提供项目创建、迁移管理和监控功能。
          </Paragraph>
        </div>
      </Card>
    </div>
  )
}

export default Settings