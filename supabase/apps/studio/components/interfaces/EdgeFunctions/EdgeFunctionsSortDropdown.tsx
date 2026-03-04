import { useTranslation } from 'react-i18next'
import { ArrowDownNarrowWide, ArrowDownWideNarrow } from 'lucide-react'
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from 'ui'

export const EDGE_FUNCTIONS_SORT_VALUES = [
  'name:asc',
  'name:desc',
  'created_at:asc',
  'created_at:desc',
  'updated_at:asc',
  'updated_at:desc',
] as const

export type EdgeFunctionsSort = (typeof EDGE_FUNCTIONS_SORT_VALUES)[number]
export type EdgeFunctionsSortColumn = EdgeFunctionsSort extends `${infer Column}:${string}`
  ? Column
  : unknown
export type EdgeFunctionsSortOrder = EdgeFunctionsSort extends `${string}:${infer Order}`
  ? Order
  : unknown

interface EdgeFunctionsSortDropdownProps {
  value: EdgeFunctionsSort
  onChange: (value: EdgeFunctionsSort) => void
}

function getSortLabel(value: EdgeFunctionsSort, t: any) {
  const [sortCol] = value.split(':')
  const label = sortCol.replace('_', ' ')
  switch (sortCol) {
    case 'name':
      return t('functions.sort_by_name')
    case 'created_at':
      return t('functions.sort_by_created_at')
    case 'updated_at':
      return t('functions.sort_by_updated_at')
    default:
      return label
  }
}

export const EdgeFunctionsSortDropdown = ({ value, onChange }: EdgeFunctionsSortDropdownProps) => {
  const { t } = useTranslation()
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="default"
          icon={
            value.includes('desc') ? (
              <ArrowDownWideNarrow size={14} />
            ) : (
              <ArrowDownNarrowWide size={14} />
            )
          }
        >
          {t('functions.sorted_by', { sort: getSortLabel(value, t) })}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-48">
        <DropdownMenuRadioGroup
          value={value}
          onValueChange={(val) => onChange(val as EdgeFunctionsSort)}
        >
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>{t('functions.sorted_by', { sort: t('functions.sort_by_name') })}</DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuRadioItem value="name:asc">{t('home.sort.ascending')}</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="name:desc">{t('home.sort.descending')}</DropdownMenuRadioItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>{t('functions.sorted_by', { sort: t('functions.sort_by_created_at') })}</DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuRadioItem value="created_at:asc">{t('home.sort.ascending')}</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="created_at:desc">{t('home.sort.descending')}</DropdownMenuRadioItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>{t('functions.sorted_by', { sort: t('functions.sort_by_updated_at') })}</DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuRadioItem value="updated_at:asc">{t('home.sort.ascending')}</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="updated_at:desc">{t('home.sort.descending')}</DropdownMenuRadioItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
