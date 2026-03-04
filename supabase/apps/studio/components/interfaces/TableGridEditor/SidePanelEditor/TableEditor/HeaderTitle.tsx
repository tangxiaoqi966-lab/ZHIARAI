import { Trans } from 'react-i18next'

interface HeaderTitleProps {
  schema: string
  table?: { name: string }
  isDuplicating: boolean
}

export const HeaderTitle = ({ schema, table, isDuplicating }: HeaderTitleProps) => {
  if (!table) {
    return (
      <Trans
        i18nKey="table_editor.create_table"
        values={{ schema }}
        components={{ 1: <code className="text-code-inline !text-sm" /> }}
      />
    )
  }
  if (isDuplicating) {
    return (
      <Trans
        i18nKey="table_editor.duplicate_table"
        values={{ name: table.name }}
        components={{ 1: <code className="text-code-inline !text-sm" /> }}
      />
    )
  }
  return (
    <Trans
      i18nKey="table_editor.update_table"
      values={{ name: table.name }}
      components={{ 1: <code className="text-code-inline !text-sm" /> }}
    />
  )
}
