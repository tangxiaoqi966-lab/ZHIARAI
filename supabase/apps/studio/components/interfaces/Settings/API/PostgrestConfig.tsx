import { zodResolver } from '@hookform/resolvers/zod'
import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useParams } from 'common'
import { indexOf } from 'lodash'
import { Lock } from 'lucide-react'
import Link from 'next/link'
import { type ChangeEvent, useCallback, useEffect, useMemo, useState } from 'react'
import { type ControllerRenderProps, useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import {
  Button,
  Card,
  CardContent,
  CardFooter,
  Form_Shadcn_,
  FormControl_Shadcn_,
  FormField_Shadcn_,
  FormItem_Shadcn_,
  Input_Shadcn_,
  PrePostTab,
  Skeleton,
} from 'ui'
import { GenericSkeletonLoader, PageSection, PageSectionContent } from 'ui-patterns'
import { Admonition } from 'ui-patterns/admonition'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import {
  MultiSelector,
  MultiSelectorContent,
  MultiSelectorItem,
  MultiSelectorList,
  MultiSelectorTrigger,
} from 'ui-patterns/multi-select'
import { z } from 'zod'

import { HardenAPIModal } from './HardenAPIModal'
import { FormActions } from '@/components/ui/Forms/FormActions'
import { useProjectPostgrestConfigQuery } from '@/data/config/project-postgrest-config-query'
import { useProjectPostgrestConfigUpdateMutation } from '@/data/config/project-postgrest-config-update-mutation'
import { useDatabaseExtensionsQuery } from '@/data/database-extensions/database-extensions-query'
import { useSchemasQuery } from '@/data/database/schemas-query'
import { useAsyncCheckPermissions } from '@/hooks/misc/useCheckPermissions'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'

export const PostgrestConfig = () => {
  const { t } = useTranslation()
  const { ref: projectRef } = useParams()
  const { data: project } = useSelectedProjectQuery()

  const formSchema = z.object({
    dbSchema: z.array(z.string()),
    dbExtraSearchPath: z.array(z.string()),
    maxRows: z
      .number()
      .max(1000000, t('settings.api_settings.cant_be_more_than', { value: '1,000,000' })),
    dbPool: z
      .number()
      .min(0, t('settings.api_settings.must_be_more_than', { value: 0 }))
      .max(1000, t('settings.api_settings.cant_be_more_than', { value: 1000 }))
      .optional()
      .nullable(),
  })
  type FormValues = z.infer<typeof formSchema>

  const [showModal, setShowModal] = useState(false)

  const {
    data: config,
    isError,
    isPending: isLoadingConfig,
  } = useProjectPostgrestConfigQuery({ projectRef })
  const { data: extensions } = useDatabaseExtensionsQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })
  const {
    data: allSchemas = [],
    isPending: isLoadingSchemas,
    isSuccess: isSuccessSchemas,
  } = useSchemasQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })

  const isLoading = isLoadingConfig || isLoadingSchemas

  const { mutate: updatePostgrestConfig, isPending: isUpdating } =
    useProjectPostgrestConfigUpdateMutation({
      onSuccess: () => {
        toast.success(t('settings.api_settings.successfully_saved_settings'))
      },
    })

  const formId = 'project-postgres-config'
  const hiddenSchema = [
    'auth',
    'pgbouncer',
    'hooks',
    'extensions',
    'vault',
    'storage',
    'realtime',
    'pgsodium',
    'pgsodium_masks',
  ]
  const { can: canUpdatePostgrestConfig, isSuccess: isPermissionsLoaded } =
    useAsyncCheckPermissions(PermissionAction.UPDATE, 'custom_config_postgrest')

  const isGraphqlExtensionEnabled =
    (extensions ?? []).find((ext) => ext.name === 'pg_graphql')?.installed_version !== null

  const defaultValues = useMemo(() => {
    const dbSchema = config?.db_schema ? config?.db_schema.split(',').map((x) => x.trim()) : []
    return {
      dbSchema,
      maxRows: config?.max_rows,
      dbExtraSearchPath: (config?.db_extra_search_path ?? '')
        .split(',')
        .map((x) => x.trim())
        .filter((x) => x.length > 0 && allSchemas.find((y) => y.name === x)),
      dbPool: config?.db_pool,
    }
  }, [config, allSchemas])

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    mode: 'onChange',
    defaultValues,
  })

  const schemas =
    allSchemas
      .filter((x) => {
        const find = indexOf(hiddenSchema, x.name)
        if (find < 0) return x
      })
      .map((x) => {
        return {
          id: x.id,
          value: x.name,
          name: x.name,
          disabled: false,
        }
      }) ?? []

  const resetForm = useCallback(() => {
    form.reset({ ...defaultValues })
  }, [form, defaultValues])

  const onSubmit = async (values: FormValues) => {
    if (!projectRef) return console.error('Project ref is required') // is this needed ?

    updatePostgrestConfig({
      projectRef,
      dbSchema: values.dbSchema.join(', '),
      maxRows: values.maxRows,
      dbExtraSearchPath: values.dbExtraSearchPath.join(','),
      dbPool: values.dbPool ? values.dbPool : null,
    })
  }

  useEffect(() => {
    if (config && isSuccessSchemas) {
      resetForm()
    }
  }, [config, isSuccessSchemas, resetForm])

  return (
    <PageSection id="postgrest-config" className="first:pt-0">
      <PageSectionContent>
        <Card className="mb-4">
          <Form_Shadcn_ {...form}>
            <form id={formId} onSubmit={form.handleSubmit(onSubmit)}>
              {isLoading ? (
                <CardContent>
                  <GenericSkeletonLoader />
                </CardContent>
              ) : isError ? (
                <CardContent>
                  <Admonition
                    type="destructive"
                    title={t('settings.api_settings.failed_retrieve_api_settings')}
                  />
                </CardContent>
              ) : (
                <>
                  <CardContent>
                    <FormField_Shadcn_
                      control={form.control}
                      name="dbSchema"
                      render={({
                        field,
                      }: {
                        field: ControllerRenderProps<FormValues, 'dbSchema'>
                      }) => (
                        <FormItem_Shadcn_>
                          <FormItemLayout
                            label={t('settings.api_settings.exposed_schemas')}
                            description={t('settings.api_settings.exposed_schemas_desc')}
                            layout="flex-row-reverse"
                          >
                            {isLoadingSchemas ? (
                              <div className="col-span-12 flex flex-col gap-2 lg:col-span-7">
                                <Skeleton className="w-full h-[38px]" />
                              </div>
                            ) : (
                              <MultiSelector
                                onValuesChange={field.onChange}
                                values={field.value}
                                size="small"
                                disabled={!canUpdatePostgrestConfig}
                              >
                                <MultiSelectorTrigger
                                  mode="inline-combobox"
                                  label={t('settings.api_settings.select_schemas')}
                                  badgeLimit="wrap"
                                  showIcon={false}
                                  deletableBadge
                                />
                                <MultiSelectorContent>
                                  <MultiSelectorList>
                                    {schemas.length <= 0 ? (
                                      <MultiSelectorItem key="empty" value="no">
                                        {t('settings.api_settings.no_schema')}
                                      </MultiSelectorItem>
                                    ) : (
                                      schemas.map((x) => (
                                        <MultiSelectorItem key={x.id + '-' + x.name} value={x.name}>
                                          {x.name}
                                        </MultiSelectorItem>
                                      ))
                                    )}
                                  </MultiSelectorList>
                                </MultiSelectorContent>
                              </MultiSelector>
                            )}
                          </FormItemLayout>
                          {!field.value.includes('public') && field.value.length > 0 && (
                            <Admonition
                              type="default"
                              title={t('settings.api_settings.public_schema_not_exposed')}
                              className="mt-2"
                              description={
                                <>
                                  <p className="text-sm">
                                    {t('settings.api_settings.public_schema_not_exposed_desc_1')}{' '}
                                    <code className="text-code-inline">public</code>{' '}
                                    {t('settings.api_settings.public_schema_not_exposed_desc_2')}
                                  </p>
                                  {isGraphqlExtensionEnabled && (
                                    <>
                                      <p className="text-sm">
                                        {t('settings.api_settings.graphql_exposed_desc')}{' '}
                                        <code className="text-code-inline">public</code>{' '}
                                        {t('settings.api_settings.graphql_exposed_desc_2')}
                                      </p>
                                      <Button asChild type="default" className="mt-2">
                                        <Link href={`/project/${projectRef}/database/extensions`}>
                                          {t('settings.api_settings.disable_pg_graphql')}
                                        </Link>
                                      </Button>
                                    </>
                                  )}
                                </>
                              }
                            />
                          )}
                        </FormItem_Shadcn_>
                      )}
                    />
                  </CardContent>
                  <CardContent>
                    <FormField_Shadcn_
                      control={form.control}
                      name="dbExtraSearchPath"
                      render={({
                        field,
                      }: {
                        field: ControllerRenderProps<FormValues, 'dbExtraSearchPath'>
                      }) => (
                        <FormItem_Shadcn_>
                          <FormItemLayout
                            layout="flex-row-reverse"
                            label={t('settings.api_settings.extra_search_path')}
                            description={t('settings.api_settings.extra_search_path_desc')}
                          >
                            {isLoadingSchemas ? (
                              <div className="col-span-12 flex flex-col gap-2 lg:col-span-7">
                                <Skeleton className="w-full h-[38px]" />
                              </div>
                            ) : (
                              <MultiSelector
                                onValuesChange={field.onChange}
                                values={field.value}
                                size="small"
                                disabled={!canUpdatePostgrestConfig}
                              >
                                <MultiSelectorTrigger
                                  mode="inline-combobox"
                                  label={t('settings.api_settings.select_schemas')}
                                  badgeLimit="wrap"
                                  showIcon={false}
                                  deletableBadge
                                />
                                <MultiSelectorContent>
                                  <MultiSelectorList>
                                    {allSchemas.length <= 0 ? (
                                      <MultiSelectorItem key="empty" value="no">
                                        {t('settings.api_settings.no_schema')}
                                      </MultiSelectorItem>
                                    ) : (
                                      allSchemas.map((x) => (
                                        <MultiSelectorItem key={x.id + '-' + x.name} value={x.name}>
                                          {x.name}
                                        </MultiSelectorItem>
                                      ))
                                    )}
                                  </MultiSelectorList>
                                </MultiSelectorContent>
                              </MultiSelector>
                            )}
                          </FormItemLayout>
                        </FormItem_Shadcn_>
                      )}
                    />
                  </CardContent>
                  <CardContent>
                    <FormField_Shadcn_
                      control={form.control}
                      name="maxRows"
                      render={({
                        field,
                      }: {
                        field: ControllerRenderProps<FormValues, 'maxRows'>
                      }) => (
                        <FormItem_Shadcn_>
                          <FormItemLayout
                            layout="flex-row-reverse"
                            label={t('settings.api_settings.max_rows')}
                            description={t('settings.api_settings.max_rows_desc')}
                          >
                            <FormControl_Shadcn_>
                              <PrePostTab postTab="rows">
                                <Input_Shadcn_
                                  size="small"
                                  disabled={!canUpdatePostgrestConfig}
                                  {...field}
                                  type="number"
                                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                                    field.onChange(Number(e.target.value))
                                  }
                                />
                              </PrePostTab>
                            </FormControl_Shadcn_>
                          </FormItemLayout>
                        </FormItem_Shadcn_>
                      )}
                    />
                  </CardContent>
                  <CardContent>
                    <FormField_Shadcn_
                      control={form.control}
                      name="dbPool"
                      render={({
                        field,
                      }: {
                        field: ControllerRenderProps<FormValues, 'dbPool'>
                      }) => (
                        <FormItem_Shadcn_>
                          <FormItemLayout
                            layout="flex-row-reverse"
                            label={t('settings.api_settings.pool_size')}
                            description={t('settings.api_settings.pool_size_desc')}
                          >
                            <FormControl_Shadcn_>
                              <PrePostTab postTab="connections">
                                <Input_Shadcn_
                                  size="small"
                                  disabled={!canUpdatePostgrestConfig}
                                  {...field}
                                  type="number"
                                  placeholder={t('settings.api_settings.configured_automatically')}
                                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                                    field.onChange(
                                      e.target.value === '' ? null : Number(e.target.value)
                                    )
                                  }
                                  value={field.value === null ? '' : field.value}
                                />
                              </PrePostTab>
                            </FormControl_Shadcn_>
                          </FormItemLayout>
                        </FormItem_Shadcn_>
                      )}
                    />
                  </CardContent>
                </>
              )}
            </form>
          </Form_Shadcn_>
          <CardFooter className="border-t">
            <FormActions
              form={formId}
              isSubmitting={isUpdating}
              hasChanges={form.formState.isDirty}
              handleReset={resetForm}
              disabled={!canUpdatePostgrestConfig}
              helper={
                isPermissionsLoaded && !canUpdatePostgrestConfig
                  ? t('settings.api_settings.update_permission_error')
                  : undefined
              }
            />
          </CardFooter>
        </Card>
        <Card className="mb-4">
          <CardContent>
            <FormItemLayout
              isReactForm={false}
              layout="flex-row-reverse"
              label={t('settings.api_settings.harden_data_api')}
              description={t('settings.api_settings.harden_data_api_desc')}
            >
              <div className="flex gap-2 items-center justify-end">
                <Button type="default" icon={<Lock />} onClick={() => setShowModal(true)}>
                  {t('settings.api_settings.harden_data_api')}
                </Button>
              </div>
            </FormItemLayout>
          </CardContent>
        </Card>
      </PageSectionContent>

      <HardenAPIModal visible={showModal} onClose={() => setShowModal(false)} />
    </PageSection>
  )
}
