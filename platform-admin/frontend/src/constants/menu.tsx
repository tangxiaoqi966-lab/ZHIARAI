import {
  DashboardOutlined,
  AppstoreOutlined,
  DatabaseOutlined,
  KeyOutlined,
  SwapOutlined,
  FileTextOutlined,
  SettingOutlined,
  UserOutlined,
} from '@ant-design/icons'

export interface MenuItem {
  key: string
  icon: React.ReactNode
  label: string
  path: string
  children?: MenuItem[]
  permission?: string
}

export const SIDEBAR_MENU: MenuItem[] = [
  {
    key: 'dashboard',
    icon: <DashboardOutlined />,
    label: '控制台',
    path: '/',
    permission: 'dashboard:view',
  },
  {
    key: 'projects',
    icon: <AppstoreOutlined />,
    label: '项目管理',
    path: '/projects',
    permission: 'projects:view',
  },
  {
    key: 'database',
    icon: <DatabaseOutlined />,
    label: '数据库',
    path: '/database',
    permission: 'database:view',
  },
  {
    key: 'api-keys',
    icon: <KeyOutlined />,
    label: 'API Keys',
    path: '/api-keys',
    permission: 'apikeys:view',
  },
  {
    key: 'migrations',
    icon: <SwapOutlined />,
    label: '数据迁移',
    path: '/migrations',
    permission: 'migrations:view',
  },
  {
    key: 'logs',
    icon: <FileTextOutlined />,
    label: '日志',
    path: '/logs',
    permission: 'logs:view',
  },
  {
    key: 'settings',
    icon: <SettingOutlined />,
    label: '系统设置',
    path: '/settings',
    permission: 'settings:view',
  },
  {
    key: 'admin',
    icon: <UserOutlined />,
    label: '管理员',
    path: '/admin',
    permission: 'admin:view',
  },
]

export const ROLE_PERMISSIONS = {
  SUPER_ADMIN: [
    'dashboard:view',
    'projects:view',
    'projects:create',
    'projects:edit',
    'projects:delete',
    'database:view',
    'database:edit',
    'apikeys:view',
    'apikeys:create',
    'apikeys:delete',
    'migrations:view',
    'migrations:execute',
    'logs:view',
    'settings:view',
    'settings:edit',
    'admin:view',
    'admin:create',
    'admin:edit',
    'admin:delete',
  ],
  ADMIN: [
    'dashboard:view',
    'projects:view',
    'projects:create',
    'projects:edit',
    'database:view',
    'database:edit',
    'apikeys:view',
    'apikeys:create',
    'migrations:view',
    'migrations:execute',
    'logs:view',
    'settings:view',
  ],
  DEVELOPER: [
    'dashboard:view',
    'projects:view',
    'database:view',
    'apikeys:view',
    'migrations:view',
    'migrations:execute',
    'logs:view',
  ],
  VIEWER: [
    'dashboard:view',
    'projects:view',
    'database:view',
    'apikeys:view',
    'migrations:view',
    'logs:view',
  ],
}