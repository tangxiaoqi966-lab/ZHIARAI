import { PropsWithChildren } from 'react'
import { useTranslation } from 'react-i18next'
import { cn } from 'ui'

interface ProductMenuBarProps {
  title: string
  className?: string
}

const ProductMenuBar = ({ title, children, className }: PropsWithChildren<ProductMenuBarProps>) => {
  const { t } = useTranslation()
  const resolvedTitle =
    title === 'Table Editor'
      ? t('navigation.table_editor')
      : title === 'SQL Editor'
        ? t('navigation.sql_editor')
        : title === 'Database'
          ? t('navigation.database_label')
          : title

  return (
    <div
      /**
       * id used in playwright-tests/tests/snapshot/spec/table-editor.spec.ts
       * */
      id="spec-click-target"
      className={cn(
        'flex flex-col w-full h-full', // Layout
        'hide-scrollbar bg-dash-sidebar border-default'
      )}
    >
      <div className="border-default flex min-h-[var(--header-height)] items-center border-b px-6">
        <h4 className="text-lg">{resolvedTitle}</h4>
      </div>
      <div className={cn('flex-grow overflow-y-auto', className)}>{children}</div>
    </div>
  )
}

export default ProductMenuBar
