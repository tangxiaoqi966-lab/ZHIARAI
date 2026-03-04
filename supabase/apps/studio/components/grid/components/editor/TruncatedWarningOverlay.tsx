import { MAX_CHARACTERS } from '@supabase/pg-meta/src/query/table-row-query'
import { useTranslation } from 'react-i18next'
import { Button, cn } from 'ui'

export const TruncatedWarningOverlay = ({
  isLoading,
  loadFullValue,
}: {
  isLoading: boolean
  loadFullValue: () => void
}) => {
  const { t } = useTranslation()
  return (
    <div
      className={cn(
        'absolute top-0 left-0 flex items-center justify-center flex-col gap-y-3',
        'text-xs w-full h-full px-3 text-center',
        'bg-default/80 backdrop-blur-[1.5px]'
      )}
    >
      <div className="flex flex-col gap-y-1">
        <p>{t('grid.editor.value_too_large', { MAX_CHARACTERS: MAX_CHARACTERS.toLocaleString() })}</p>
        <p className="text-foreground-light">
          {t('grid.editor.performance_warning')}
        </p>
      </div>
      <Button type="default" loading={isLoading} onClick={loadFullValue}>
        {t('grid.editor.load_full_value')}
      </Button>
    </div>
  )
}
