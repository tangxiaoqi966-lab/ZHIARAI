import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

// 导入翻译资源
import enCommon from '../../locales/en/common.json'
import zhCommon from '../../locales/zh-CN/common.json'
import enDashboard from '../../locales/en/dashboard.json'
import zhDashboard from '../../locales/zh-CN/dashboard.json'
import enSettings from '../../locales/en/settings.json'
import zhSettings from '../../locales/zh-CN/settings.json'
import enApiKeys from '../../locales/en/api-keys.json'
import zhApiKeys from '../../locales/zh-CN/api-keys.json'

// 可用语言
export const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'zh-CN', name: '简体中文', flag: '🇨🇳' },
]

export const DEFAULT_LANGUAGE = 'zh-CN'

// 初始化 i18n
i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: {
        common: enCommon,
        dashboard: enDashboard,
        settings: enSettings,
        'api-keys': enApiKeys,
      },
      'zh-CN': {
        common: zhCommon,
        dashboard: zhDashboard,
        settings: zhSettings,
        'api-keys': zhApiKeys,
      },
    },
    fallbackLng: DEFAULT_LANGUAGE,
    lng: DEFAULT_LANGUAGE, // Force initial language to match server (SSR) to prevent hydration mismatch
    defaultNS: 'common',
    ns: ['common', 'dashboard', 'settings', 'api-keys'],
    interpolation: {
      escapeValue: false, // React 已经安全转义
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'supabase-i18next-lng', // 使用特定的键名
    },
    react: {
      useSuspense: false,
    },
  })

export default i18n