import React, { useState, useEffect } from 'react'
import {
  Layout,
  Menu,
  Breadcrumb,
  Avatar,
  Dropdown,
  Input,
  Badge,
  Select,
  Space,
  Typography,
  theme,
  Button,
} from 'antd'
import {
  DashboardOutlined,
  AppstoreOutlined,
  DatabaseOutlined,
  KeyOutlined,
  SwapOutlined,
  FileTextOutlined,
  SettingOutlined,
  UserOutlined,
  BellOutlined,
  SearchOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
} from '@ant-design/icons'
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/auth'
import { useProjectStore } from '@/store/project'
import { SIDEBAR_MENU } from '@/constants/menu'
import { hasPermission } from '@/store/auth'

const { Header, Content, Footer, Sider } = Layout
const { Search } = Input
const { Option } = Select
const { Text } = Typography

const MainLayout: React.FC = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const [collapsed, setCollapsed] = useState(false)
  const [searchValue, setSearchValue] = useState('')
  
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken()
  
  const { user, logout, currentProject } = useAuthStore()
  const { projects, setCurrentProject } = useProjectStore()
  
  // 过滤有权限的菜单项
  const filteredMenuItems = SIDEBAR_MENU.filter(item => 
    !item.permission || hasPermission(item.permission)
  ).map(item => ({
    key: item.key,
    icon: item.icon,
    label: <Link to={item.path}>{item.label}</Link>,
  }))
  
  // 生成面包屑
  const breadcrumbItems = location.pathname
    .split('/')
    .filter(Boolean)
    .map((segment, index, arr) => ({
      title: index === arr.length - 1 ? 
        segment.charAt(0).toUpperCase() + segment.slice(1) : 
        <Link to={`/${arr.slice(0, index + 1).join('/')}`}>
          {segment.charAt(0).toUpperCase() + segment.slice(1)}
        </Link>,
    }))
  
  // 用户下拉菜单
  const userMenuItems = [
    {
      key: 'profile',
      label: '个人资料',
    },
    {
      key: 'settings',
      label: '账户设置',
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      label: '退出登录',
      danger: true,
    },
  ]
  
  const handleUserMenuClick = ({ key }: { key: string }) => {
    switch (key) {
      case 'logout':
        logout()
        navigate('/login')
        break
      case 'profile':
        navigate('/profile')
        break
      case 'settings':
        navigate('/settings')
        break
    }
  }
  
  const handleProjectChange = (projectId: string) => {
    setCurrentProject(projectId)
  }
  
  const handleSearch = (value: string) => {
    if (value.trim()) {
      // 实现搜索功能
      console.log('Search:', value)
    }
  }
  
  // 通知下拉菜单
  const notifications = [
    {
      id: 1,
      title: '新项目创建',
      description: '用户 "admin" 创建了新项目 "测试项目"',
      time: '5分钟前',
      read: false,
    },
    {
      id: 2,
      title: 'API调用异常',
      description: '项目 "demo" 的API调用次数异常',
      time: '2小时前',
      read: true,
    },
  ]
  
  const notificationMenuItems = [
    ...notifications.map(notification => ({
      key: `notification-${notification.id}`,
      label: (
        <div style={{ width: 300 }}>
          <div>
            <Text strong>{notification.title}</Text>
            {!notification.read && <Badge dot style={{ marginLeft: 8 }} />}
          </div>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {notification.description}
          </Text>
          <div>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {notification.time}
            </Text>
          </div>
        </div>
      ),
    })),
    {
      type: 'divider',
    },
    {
      key: 'view-all',
      label: '查看所有通知',
    },
  ]
  
  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        breakpoint="lg"
        collapsedWidth="0"
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        trigger={null}
        style={{
          overflow: 'auto',
          height: '100vh',
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
          zIndex: 1000,
        }}
      >
        <div style={{ 
          height: 64, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        }}>
          {!collapsed && (
            <Space direction="vertical" align="center" size={0}>
              <Text strong style={{ color: 'white', fontSize: 18 }}>
                Supabase 平台
              </Text>
              <Text type="secondary" style={{ color: 'rgba(255, 255, 255, 0.65)', fontSize: 12 }}>
                多租户管理后台
              </Text>
            </Space>
          )}
          {collapsed && (
            <Text strong style={{ color: 'white', fontSize: 18 }}>
              SP
            </Text>
          )}
        </div>
        
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname === '/' ? 'dashboard' : location.pathname.split('/')[1]]}
          items={filteredMenuItems}
          style={{ borderRight: 0 }}
        />
        
        <div style={{ 
          position: 'absolute', 
          bottom: 0, 
          left: 0, 
          right: 0,
          padding: 16,
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          background: '#001529',
        }}>
          {!collapsed && user && (
            <Space direction="vertical" size={4} style={{ width: '100%' }}>
              <Space>
                <Avatar size="small" icon={<UserOutlined />} src={user.avatar} />
                <div>
                  <Text style={{ color: 'white', fontSize: 12 }}>{user.username}</Text>
                  <div>
                    <Text type="secondary" style={{ color: 'rgba(255, 255, 255, 0.65)', fontSize: 10 }}>
                      {user.role.replace('_', ' ')}
                    </Text>
                  </div>
                </div>
              </Space>
            </Space>
          )}
          {collapsed && user && (
            <div style={{ textAlign: 'center' }}>
              <Avatar size="small" icon={<UserOutlined />} src={user.avatar} />
            </div>
          )}
        </div>
      </Sider>
      
      <Layout style={{ marginLeft: collapsed ? 0 : 200, transition: 'margin-left 0.2s' }}>
        <Header style={{ 
          padding: '0 24px', 
          background: colorBgContainer,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid #f0f0f0',
          position: 'sticky',
          top: 0,
          zIndex: 999,
        }}>
          <Space>
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed(!collapsed)}
              style={{ fontSize: 16 }}
            />
            
            <Select
              placeholder="选择项目"
              style={{ width: 200 }}
              value={currentProject}
              onChange={handleProjectChange}
              allowClear
            >
              {projects.map(project => (
                <Option key={project.id} value={project.id}>
                  {project.name}
                </Option>
              ))}
            </Select>
          </Space>
          
          <Space size="large">
            <Search
              placeholder="搜索项目、API、日志..."
              allowClear
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              onSearch={handleSearch}
              style={{ width: 250 }}
              prefix={<SearchOutlined />}
            />
            
            <Dropdown
              menu={{ items: notificationMenuItems }}
              trigger={['click']}
              placement="bottomRight"
            >
              <Badge count={notifications.filter(n => !n.read).length} size="small">
                <Button type="text" icon={<BellOutlined />} />
              </Badge>
            </Dropdown>
            
            <Dropdown
              menu={{ items: userMenuItems, onClick: handleUserMenuClick }}
              trigger={['click']}
              placement="bottomRight"
            >
              <Space style={{ cursor: 'pointer' }}>
                <Avatar size="small" icon={<UserOutlined />} src={user?.avatar} />
                {!collapsed && (
                  <div>
                    <div>
                      <Text strong>{user?.username}</Text>
                    </div>
                    <div>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {user?.role?.replace('_', ' ')}
                      </Text>
                    </div>
                  </div>
                )}
              </Space>
            </Dropdown>
          </Space>
        </Header>
        
        <Content style={{ margin: '16px 16px 0' }}>
          <Breadcrumb 
            style={{ margin: '16px 0' }} 
            items={[
              { title: <Link to="/">首页</Link> },
              ...breadcrumbItems,
            ]}
          />
          
          <div
            style={{
              padding: 24,
              minHeight: 'calc(100vh - 180px)',
              background: colorBgContainer,
              borderRadius: borderRadiusLG,
            }}
          >
            <Outlet />
          </div>
        </Content>
        
        <Footer style={{ textAlign: 'center', padding: '16px 24px' }}>
          <Space direction="vertical" size={2}>
            <Text type="secondary">
              Supabase 平台管理后台 ©{new Date().getFullYear()} - 多租户自托管解决方案
            </Text>
            <Text type="secondary" style={{ fontSize: 12 }}>
              Version 1.0.0 • 基于 React + Ant Design + TypeScript
            </Text>
          </Space>
        </Footer>
      </Layout>
    </Layout>
  )
}

export default MainLayout