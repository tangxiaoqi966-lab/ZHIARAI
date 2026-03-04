import { useTranslation } from 'react-i18next'
import { Globe } from 'lucide-react'
import { SUPPORTED_LANGUAGES } from 'lib/i18n/config'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from 'ui'
import { cn } from 'ui'

interface LanguageSwitcherProps {
  className?: string
}

export const LanguageSwitcher = ({ className }: LanguageSwitcherProps) => {
  const { i18n, t } = useTranslation('common')

  const currentLanguage = SUPPORTED_LANGUAGES.find(lang => lang.code === i18n.language) || SUPPORTED_LANGUAGES[0]

  const handleLanguageChange = (languageCode: string) => {
    i18n.changeLanguage(languageCode)
    // 保存到 localStorage
    if (typeof window !== 'undefined') {
        localStorage.setItem('supabase-i18next-lng', languageCode)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className={cn(
            'flex items-center justify-center rounded-md border border-control bg-surface-100 p-1.5 text-foreground-lighter hover:text-foreground transition-colors',
            'focus:outline-none focus:ring-2 focus:ring-foreground focus:ring-offset-2 focus:ring-offset-background',
            className
          )}
          aria-label={t('language.switch')}
        >
          <Globe size={16} strokeWidth={1.5} />
          <span className="ml-1 text-xs font-medium">{currentLanguage.flag}</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {SUPPORTED_LANGUAGES.map(language => (
          <DropdownMenuItem
            key={language.code}
            className={cn(
              'flex items-center justify-between cursor-pointer',
              i18n.language === language.code && 'bg-surface-200'
            )}
            onClick={() => handleLanguageChange(language.code)}
          >
            <div className="flex items-center">
              <span className="mr-2 text-sm">{language.flag}</span>
              <span className="text-sm">{language.name}</span>
            </div>
            {i18n.language === language.code && (
              <span className="text-xs text-foreground-muted">✓</span>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}