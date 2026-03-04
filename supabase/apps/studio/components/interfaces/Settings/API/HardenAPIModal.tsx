import { Check, ChevronDown } from 'lucide-react'
import { useTranslation, Trans } from 'react-i18next'
import { toast } from 'sonner'

import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import { DocsButton } from 'components/ui/DocsButton'
import InformationBox from 'components/ui/InformationBox'
import { useCreateAndExposeAPISchemaMutation } from 'data/api-settings/create-and-expose-api-schema-mutation'
import { useProjectPostgrestConfigQuery } from 'data/config/project-postgrest-config-query'
import { useProjectPostgrestConfigUpdateMutation } from 'data/config/project-postgrest-config-update-mutation'
import { useSchemasQuery } from 'data/database/schemas-query'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { DOCS_URL } from 'lib/constants'
import {
  AlertDescription_Shadcn_,
  AlertTitle_Shadcn_,
  Alert_Shadcn_,
  CodeBlock,
  CollapsibleContent_Shadcn_,
  CollapsibleTrigger_Shadcn_,
  Collapsible_Shadcn_,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogSection,
  DialogSectionSeparator,
  DialogTitle,
  WarningIcon,
} from 'ui'

interface HardenAPIModalProps {
  visible: boolean
  onClose: () => void
}

export const HardenAPIModal = ({ visible, onClose }: HardenAPIModalProps) => {
  const { t } = useTranslation()
  const { data: project } = useSelectedProjectQuery()

  const { data: schemas } = useSchemasQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })
  const { data: config } = useProjectPostgrestConfigQuery({ projectRef: project?.ref })

  const hasAPISchema = (schemas ?? []).find((schema) => schema.name === 'api')
  const exposedSchemas = config?.db_schema.split(',').map((x) => x.trim()) ?? []
  const isAPISchemaExposed = exposedSchemas.includes('api')
  const isPublicSchemaExposed = exposedSchemas.includes('public')

  const { mutate: createAndExposeAPISchema, isPending: isCreatingAPISchema } =
    useCreateAndExposeAPISchemaMutation({
      onSuccess: () => {
        toast.success(t('settings.api_settings.harden_api.success_create_expose'))
      },
    })

  const { mutate: updatePostgrestConfig, isPending: isUpdatingConfig } =
    useProjectPostgrestConfigUpdateMutation({
      onSuccess: () => {
        toast.success(t('settings.api_settings.harden_api.success_remove_public'))
      },
    })

  const onSelectCreateAndExposeAPISchema = () => {
    if (project === undefined) return console.error('Project is required')
    if (config === undefined) return console.error('Postgrest config is required')
    createAndExposeAPISchema({
      projectRef: project?.ref,
      connectionString: project?.connectionString,
      existingPostgrestConfig: {
        max_rows: config.max_rows,
        db_pool: config.db_pool,
        db_schema: config.db_schema,
        db_extra_search_path: config?.db_extra_search_path,
      },
    })
  }

  const onSelectRemovePublicSchema = () => {
    if (project === undefined) return console.error('Project is required')
    if (config === undefined) return console.error('Postgrest config is required')

    const updatedDbExtraSearchPath = config.db_extra_search_path
      .split(',')
      .map((x) => x.trim())
      .filter((x) => x !== 'public')
      .join(', ')
    const updatedDbSchema = config.db_schema
      .split(',')
      .map((x) => x.trim())
      .filter((x) => x !== 'public')
      .join(', ')
    updatePostgrestConfig({
      projectRef: project.ref,
      maxRows: config.max_rows,
      dbPool: config.db_pool,
      dbSchema: updatedDbSchema,
      dbExtraSearchPath: updatedDbExtraSearchPath,
    })
  }

  return (
    <Dialog open={visible} onOpenChange={onClose}>
      <DialogContent size="large">
        <DialogHeader>
          <DialogTitle>{t('settings.api_settings.harden_api.title')}</DialogTitle>
          <DialogDescription>
            <Trans
              i18nKey="settings.api_settings.harden_api.subtitle"
              components={[<span key="0" />, <code key="1" className="text-code-inline" />]}
            />
          </DialogDescription>
        </DialogHeader>

        <DialogSectionSeparator />

        <DialogSection className="text-sm text-foreground-light">
          <p>
            <Trans
              i18nKey="settings.api_settings.harden_api.description"
              components={[
                <span key="0" />,
                <code key="1" className="text-code-inline" />,
                <span key="2" />,
                <code key="3" className="text-code-inline" />,
                <span key="4" />,
                <span key="5" className="text-brand" />,
              ]}
            />
          </p>
          <DocsButton
            abbrev={false}
            className="w-min mt-4"
            href={`${DOCS_URL}/guides/database/hardening-data-api`}
          />
        </DialogSection>

        <DialogSectionSeparator />

        <Collapsible_Shadcn_>
          <CollapsibleTrigger_Shadcn_ className="py-4 px-5 w-full flex items-center justify-between text-sm">
            <p>
              <Trans
                i18nKey="settings.api_settings.harden_api.step_1"
                components={[<span key="0" />, <code key="1" className="text-code-inline" />]}
              />
            </p>
            {hasAPISchema && isAPISchemaExposed ? (
              <Check size={16} className="text-brand" />
            ) : (
              <ChevronDown
                size={16}
                className="transition data-open-parent:rotate-180 data-closed-parent:rotate-0"
              />
            )}
          </CollapsibleTrigger_Shadcn_>
          <CollapsibleContent_Shadcn_ className="text-sm text-foreground-light flex flex-col gap-y-4">
            <p className="mx-5">
              <Trans
                i18nKey="settings.api_settings.harden_api.step_1_description"
                components={[
                  <span key="0" />,
                  <code key="1" className="text-code-inline" />,
                  <span key="2" />,
                  <code key="3" className="text-code-inline" />,
                  <span key="4" />,
                  <code key="5" className="text-code-inline" />,
                ]}
              />
            </p>

            <div className="px-5">
              <InformationBox
                title={t('settings.api_settings.harden_api.how_schema_created')}
                description={
                  <div className="flex flex-col gap-y-2">
                    <p>
                      <Trans
                        i18nKey="settings.api_settings.harden_api.how_schema_created_desc"
                        components={[<span key="0" />, <code key="1" className="text-code-inline" />]}
                      />
                    </p>
                    <CodeBlock
                      language="sql"
                      className="p-1 language-bash prose dark:prose-dark max-w-[68.3ch]"
                    >
                      {`create schema if not exists api;\ngrant usage on schema api to anon, authenticated;`}
                    </CodeBlock>
                  </div>
                }
              />
            </div>

            <ButtonTooltip
              type="primary"
              className="w-min mx-5"
              onClick={onSelectCreateAndExposeAPISchema}
              disabled={hasAPISchema && isAPISchemaExposed}
              loading={isCreatingAPISchema}
              tooltip={{
                content: {
                  side: 'right',
                  text:
                    hasAPISchema && isAPISchemaExposed
                      ? t('settings.api_settings.harden_api.schema_already_exposed')
                      : undefined,
                },
              }}
            >
              {t('settings.api_settings.harden_api.create_expose_button')}
            </ButtonTooltip>

            <div className="flex flex-col gap-y-4 px-5 pb-4">
              <p>
                <Trans
                  i18nKey="settings.api_settings.harden_api.permissions_note"
                  components={[
                    <span key="0" />,
                    <code key="1" className="text-code-inline" />,
                    <span key="2" />,
                    <code key="3" className="text-code-inline" />,
                    <span key="4" />,
                    <code key="5" className="text-code-inline" />,
                  ]}
                />
              </p>
              <CodeBlock
                language="sql"
                className="p-1 language-bash prose dark:prose-dark max-w-[68.3ch]"
              >
                {`grant select on table api.<your_table> to anon;\ngrant select, insert, update, delete on table api.<your_table> to authenticated;`}
              </CodeBlock>
            </div>
          </CollapsibleContent_Shadcn_>
        </Collapsible_Shadcn_>

        <DialogSectionSeparator />

        <Collapsible_Shadcn_>
          <CollapsibleTrigger_Shadcn_ className="py-4 px-5 w-full flex items-center justify-between text-sm">
            <p>
              <Trans
                i18nKey="settings.api_settings.harden_api.step_2"
                components={[<span key="0" />, <code key="1" className="text-code-inline" />]}
              />
            </p>
            {!isPublicSchemaExposed ? (
              <Check size={16} className="text-brand" />
            ) : (
              <ChevronDown
                size={16}
                className="transition data-open-parent:rotate-180 data-closed-parent:rotate-0"
              />
            )}
          </CollapsibleTrigger_Shadcn_>
          <CollapsibleContent_Shadcn_ className="text-sm text-foreground-light">
            <div className="px-5 pb-4 flex flex-col gap-y-4">
              <Alert_Shadcn_ variant="warning">
                <WarningIcon />
                <AlertTitle_Shadcn_ className="text-foreground">
                  <Trans
                    i18nKey="settings.api_settings.harden_api.warning_title"
                    components={[<span key="0" />, <code key="1" className="text-code-inline" />]}
                  />
                </AlertTitle_Shadcn_>
                <AlertDescription_Shadcn_>
                  <Trans
                    i18nKey="settings.api_settings.harden_api.warning_desc"
                    components={[
                      <span key="0" />,
                      <code key="1" className="text-code-inline" />,
                      <span key="2" />,
                      <code key="3" className="text-code-inline" />,
                    ]}
                  />
                </AlertDescription_Shadcn_>
              </Alert_Shadcn_>
              <p>
                <Trans
                  i18nKey="settings.api_settings.harden_api.remove_public_desc"
                  components={[<span key="0" />, <code key="1" className="text-code-inline" />]}
                />
              </p>
              <ButtonTooltip
                type="primary"
                className="w-min"
                disabled={!isPublicSchemaExposed}
                loading={isUpdatingConfig}
                tooltip={{
                  content: {
                    side: 'right',
                    text: !isPublicSchemaExposed
                      ? t('settings.api_settings.harden_api.public_removed_tooltip')
                      : undefined,
                  },
                }}
                onClick={onSelectRemovePublicSchema}
              >
                {t('settings.api_settings.harden_api.remove_public_button')}
              </ButtonTooltip>
            </div>
          </CollapsibleContent_Shadcn_>
        </Collapsible_Shadcn_>
      </DialogContent>
    </Dialog>
  )
}
