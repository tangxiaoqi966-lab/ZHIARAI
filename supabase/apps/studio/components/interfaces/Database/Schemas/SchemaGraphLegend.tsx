import { useTranslation } from 'react-i18next'
import { DiamondIcon, Fingerprint, Hash, Key } from 'lucide-react'

export const SchemaGraphLegend = () => {
  const { t } = useTranslation()
  return (
    <div className="absolute bottom-0 left-0 border-t flex justify-center px-1 py-2 shadow-md bg-surface-100 w-full z-10">
      <ul className="flex flex-wrap  items-center justify-center gap-4">
        <li className="flex items-center text-xs font-mono gap-1">
          <Key size={15} strokeWidth={1.5} className="flex-shrink-0 text-light" />
          {t('table_editor.primary_key_label')}
        </li>
        <li className="flex items-center text-xs font-mono gap-1">
          <Hash size={15} strokeWidth={1.5} className="flex-shrink-0 text-light" />
          {t('table_editor.identity_label')}
        </li>
        <li className="flex items-center text-xs font-mono gap-1">
          <Fingerprint size={15} strokeWidth={1.5} className="flex-shrink-0 text-light" />
          {t('table_editor.unique_label')}
        </li>
        <li className="flex items-center text-xs font-mono gap-1">
          <DiamondIcon size={15} strokeWidth={1.5} className="flex-shrink-0 text-light" />
          {t('table_editor.nullable_label')}
        </li>
        <li className="flex items-center text-xs font-mono gap-1">
          <DiamondIcon
            size={15}
            strokeWidth={1.5}
            fill="currentColor"
            className="flex-shrink-0 text-light"
          />
          {t('table_editor.non_nullable_label')}
        </li>
      </ul>
    </div>
  )
}
