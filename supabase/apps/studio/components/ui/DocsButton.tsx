import { BookOpen } from 'lucide-react'
import { Button } from 'ui'
import { useTranslation } from 'react-i18next'

interface DocsButtonProps {
  href: string
  abbrev?: boolean
  className?: string
}

export const DocsButton = ({ href, abbrev = true, className }: DocsButtonProps) => {
  const { t } = useTranslation()
  return (
    <Button
      asChild
      type="default"
      className={className}
      icon={<BookOpen />}
      onClick={(e) => e.stopPropagation()}
    >
      <a target="_blank" rel="noopener noreferrer" href={href}>
        {abbrev ? t('common.docs') : t('common.documentation')}
      </a>
    </Button>
  )
}
