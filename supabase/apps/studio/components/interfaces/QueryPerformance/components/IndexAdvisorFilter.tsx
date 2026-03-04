import { Lightbulb, X } from 'lucide-react'
import { Button, cn } from 'ui'
import { useTranslation } from 'react-i18next'

interface IndexAdvisorFilterProps {
  isActive: boolean
  onToggle: () => void
}

export const IndexAdvisorFilter = ({ isActive, onToggle }: IndexAdvisorFilterProps) => {
  const { t } = useTranslation()
  return (
    <Button
      type={isActive ? 'default' : 'outline'}
      size="tiny"
      className={cn(isActive ? 'bg-surface-300' : 'border-dashed')}
      onClick={onToggle}
      iconRight={isActive ? <X size={14} /> : undefined}
    >
      <span className="flex items-center gap-x-2">
        <Lightbulb size={12} className={isActive ? 'text-warning' : 'text-foreground-lighter'} />
        <span>{t('advisor.title')}</span>
      </span>
    </Button>
  )
}
