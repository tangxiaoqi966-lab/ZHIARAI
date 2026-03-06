import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { ConfigProvider, App as AntdApp } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import MainLayout from '@/layouts/MainLayout'
import Dashboard from '@/pages/Dashboard'
import ProjectList from '@/pages/Projects/ProjectList'
import ProjectDetail from '@/pages/Projects/ProjectDetail'
import MigrationList from '@/pages/Migrations/MigrationList'
import Database from '@/pages/Database/Database'
import ApiKeys from '@/pages/ApiKeys/ApiKeys'
import Logs from '@/pages/Logs/Logs'
import Settings from '@/pages/Settings'
import Admin from '@/pages/Admin/Admin'

const App: React.FC = () => {
  return (
    <ConfigProvider
      locale={zhCN}
      theme={{
        token: {
          colorPrimary: '#1890ff',
          borderRadius: 6,
        },
      }}
    >
      <AntdApp>
        <Router>
          <Routes>
            <Route path="/" element={<MainLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="projects" element={<ProjectList />} />
              <Route path="projects/:id" element={<ProjectDetail />} />
              <Route path="database" element={<Database />} />
              <Route path="api-keys" element={<ApiKeys />} />
              <Route path="migrations" element={<MigrationList />} />
              <Route path="logs" element={<Logs />} />
              <Route path="settings" element={<Settings />} />
              <Route path="admin" element={<Admin />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </Router>
      </AntdApp>
    </ConfigProvider>
  )
}

export default App