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
import { useTranslation } from 'react-i18next'

type SortOption = {
  label: string
  value: string
}

interface SortDropdownProps {
  options: SortOption[]
  value: string
  setValue: (value: string) => void
}

export const SortDropdown = ({ options, value, setValue }: SortDropdownProps) => {
  const { t } = useTranslation()
  const [sortColumn, sortOrder] = value.split('_')
  const columnLabel = options.find((x) => x.value === sortColumn)?.label

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="default"
          icon={sortOrder === 'desc' ? <ArrowDownWideNarrow /> : <ArrowDownNarrowWide />}
        >
          {t('home.sort.sorted_by', { label: columnLabel ?? sortColumn })}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent className="w-44" align="start">
        <DropdownMenuRadioGroup value={value} onValueChange={setValue}>
          {options.map((option) => {
            return (
              <DropdownMenuSub key={option.value}>
                <DropdownMenuSubTrigger>
                  {t('home.sort.sort_by', { label: option.label })}
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  <DropdownMenuRadioItem value={`${option.value}_asc`}>
                    {t('home.sort.ascending')}
                  </DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value={`${option.value}_desc`}>
                    {t('home.sort.descending')}
                  </DropdownMenuRadioItem>
                </DropdownMenuSubContent>
              </DropdownMenuSub>
            )
          })}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
