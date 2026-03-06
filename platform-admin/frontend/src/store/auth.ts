import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface User {
  id: string
  username: string
  email: string
  role: 'SUPER_ADMIN' | 'ADMIN' | 'DEVELOPER' | 'VIEWER'
  avatar?: string
}

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  currentProject: string | null
  login: (user: User, token: string) => void
  logout: () => void
  setCurrentProject: (projectId: string | null) => void
  updateUser: (user: Partial<User>) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      currentProject: null,
      login: (user, token) => set({ user, token, isAuthenticated: true }),
      logout: () => set({ user: null, token: null, isAuthenticated: false, currentProject: null }),
      setCurrentProject: (projectId) => set({ currentProject: projectId }),
      updateUser: (user) => set((state) => ({ user: state.user ? { ...state.user, ...user } : null })),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
        currentProject: state.currentProject,
      }),
    }
  )
)

// 权限检查工具函数
export const hasPermission = (permission: string): boolean => {
  const { user } = useAuthStore.getState()
  if (!user) return false
  
  // 超级管理员拥有所有权限
  if (user.role === 'SUPER_ADMIN') return true
  
  // 根据角色检查权限
  const permissions = {
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
  
  return permissions[user.role]?.includes(permission) || false
}