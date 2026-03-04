import { PermissionAction } from '@supabase/shared-types/out/constants'
import { Check, ChevronsUpDown, Plus } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { useSchemasQuery } from 'data/database/schemas-query'
import { useAsyncCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import {
  AlertDescription_Shadcn_,
  AlertTitle_Shadcn_,
  Alert_Shadcn_,
  Button,
  CommandEmpty_Shadcn_,
  CommandGroup_Shadcn_,
  CommandInput_Shadcn_,
  CommandItem_Shadcn_,
  CommandList_Shadcn_,
  CommandSeparator_Shadcn_,
  Command_Shadcn_,
  PopoverContent_Shadcn_,
  PopoverTrigger_Shadcn_,
  Popover_Shadcn_,
  ScrollArea,
  Skeleton,
} from 'ui'

interface SchemaSelectorProps {
  className?: string
  disabled?: boolean
  size?: 'tiny' | 'small'
  showError?: boolean
  selectedSchemaName: string
  supportSelectAll?: boolean
  excludedSchemas?: string[]
  onSelectSchema: (name: string) => void
  onSelectCreateSchema?: () => void
  align?: 'start' | 'end'
}

export const SchemaSelector = ({
  className,
  disabled = false,
  size = 'tiny',
  showError = true,
  selectedSchemaName,
  supportSelectAll = false,
  excludedSchemas = [],
  onSelectSchema,
  onSelectCreateSchema,
  align = 'start',
}: SchemaSelectorProps) => {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const { can: canCreateSchemas } = useAsyncCheckPermissions(
    PermissionAction.TENANT_SQL_ADMIN_WRITE,
    'schemas'
  )

  const { data: project } = useSelectedProjectQuery()
  const {
    data,
    isPending: isSchemasLoading,
    isSuccess: isSchemasSuccess,
    isError: isSchemasError,
    error: schemasError,
    refetch: refetchSchemas,
  } = useSchemasQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })

  const schemas = (data || [])
    .filter((schema) => !excludedSchemas.includes(schema.name))
    .sort((a, b) => a.name.localeCompare(b.name))

  return (
    <div className={className}>
      {isSchemasLoading && (
        <Button
          type="default"
          key="schema-selector-skeleton"
          className="w-full [&>span]:w-full"
          size={size}
          disabled
        >
          <Skeleton className="w-full h-3 bg-foreground-muted" />
        </Button>
      )}

      {showError && isSchemasError && (
        <Alert_Shadcn_ variant="warning" className="!px-3 !py-3">
          <AlertTitle_Shadcn_ className="text-xs text-amber-900">
            {t('schema_selector.failed_load_schemas')}
          </AlertTitle_Shadcn_>
          <AlertDescription_Shadcn_ className="text-xs mb-2 break-words">
            {t('schema_selector.error_prefix')} {(schemasError as any)?.message}
          </AlertDescription_Shadcn_>
          <Button type="default" size="tiny" onClick={() => refetchSchemas()}>
            {t('schema_selector.reload_schemas')}
          </Button>
        </Alert_Shadcn_>
      )}

      {isSchemasSuccess && (
        <Popover_Shadcn_ open={open} onOpenChange={setOpen} modal={false}>
          <PopoverTrigger_Shadcn_ asChild>
            <Button
              size={size}
              disabled={disabled}
              type="default"
              data-testid="schema-selector"
              className={`w-full [&>span]:w-full !pr-1 space-x-1`}
              iconRight={
                <ChevronsUpDown className="text-foreground-muted" strokeWidth={2} size={14} />
              }
            >
              {selectedSchemaName ? (
                <div className="w-full flex gap-1">
                  <p className="text-foreground-lighter">{t('labels.schema')}</p>
                  <p className="text-foreground">
                    {selectedSchemaName === '*'
                      ? t('schema_selector.all_schemas')
                      : selectedSchemaName}
                  </p>
                </div>
              ) : (
                <div className="w-full flex gap-1">
                  <p className="text-foreground-lighter">{t('schema_selector.choose_schema')}</p>
                </div>
              )}
            </Button>
          </PopoverTrigger_Shadcn_>
          <PopoverContent_Shadcn_
            className="p-0 min-w-[200px] pointer-events-auto"
            side="bottom"
            align={align}
            sameWidthAsTrigger
          >
            <Command_Shadcn_>
              <CommandInput_Shadcn_
                className="text-xs"
                placeholder={t('schema_selector.find_schema')}
              />
              <CommandList_Shadcn_>
                <CommandEmpty_Shadcn_>{t('schema_selector.no_schemas_found')}</CommandEmpty_Shadcn_>
                <CommandGroup_Shadcn_>
                  <ScrollArea className={(schemas || []).length > 7 ? 'h-[210px]' : ''}>
                    {supportSelectAll && (
                      <CommandItem_Shadcn_
                        key="select-all"
                        className="cursor-pointer flex items-center justify-between space-x-2 w-full"
                        onSelect={() => {
                          onSelectSchema('*')
                          setOpen(false)
                        }}
                        onClick={() => {
                          onSelectSchema('*')
                          setOpen(false)
                        }}
                      >
                        <span>{t('schema_selector.all_schemas')}</span>
                        {selectedSchemaName === '*' && (
                          <Check className="text-brand" strokeWidth={2} size={16} />
                        )}
                      </CommandItem_Shadcn_>
                    )}
                    {schemas?.map((schema) => (
                      <CommandItem_Shadcn_
                        key={schema.id}
                        className="cursor-pointer flex items-center justify-between space-x-2 w-full"
                        onSelect={() => {
                          onSelectSchema(schema.name)
                          setOpen(false)
                        }}
                        onClick={() => {
                          onSelectSchema(schema.name)
                          setOpen(false)
                        }}
                      >
                        <span>{schema.name}</span>
                        {selectedSchemaName === schema.name && (
                          <Check className="text-brand" strokeWidth={2} size={16} />
                        )}
                      </CommandItem_Shadcn_>
                    ))}
                  </ScrollArea>
                </CommandGroup_Shadcn_>
                {onSelectCreateSchema !== undefined && canCreateSchemas && (
                  <>
                    <CommandSeparator_Shadcn_ />
                    <CommandGroup_Shadcn_>
                      <CommandItem_Shadcn_
                        className="cursor-pointer flex items-center gap-x-2 w-full"
                        onSelect={() => {
                          onSelectCreateSchema()
                          setOpen(false)
                        }}
                        onClick={() => {
                          onSelectCreateSchema()
                          setOpen(false)
                        }}
                      >
                        <Plus size={12} />
                        {t('schema_selector.create_new_schema')}
                      </CommandItem_Shadcn_>
                    </CommandGroup_Shadcn_>
                  </>
                )}
              </CommandList_Shadcn_>
            </Command_Shadcn_>
          </PopoverContent_Shadcn_>
        </Popover_Shadcn_>
      )}
    </div>
  )
}

export default SchemaSelector
