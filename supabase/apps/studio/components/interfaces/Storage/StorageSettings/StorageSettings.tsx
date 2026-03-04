import { zodResolver } from '@hookform/resolvers/zod'
import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useEffect, useMemo, useState } from 'react'
import { SubmitHandler, useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import * as z from 'zod'

import { IS_PLATFORM, useFlag, useParams } from 'common'
import AlertError from 'components/ui/AlertError'
import { InlineLink } from 'components/ui/InlineLink'
import NoPermission from 'components/ui/NoPermission'
import { UpgradeToPro } from 'components/ui/UpgradeToPro'
import { useProjectStorageConfigQuery } from 'data/config/project-storage-config-query'
import { useProjectStorageConfigUpdateUpdateMutation } from 'data/config/project-storage-config-update-mutation'
import { useLargestBucketSizeLimitsCheck } from 'data/storage/buckets-max-size-limit-query'
import { useCheckEntitlements } from 'hooks/misc/useCheckEntitlements'
import { useAsyncCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { useSelectedOrganizationQuery } from 'hooks/misc/useSelectedOrganization'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { DOCS_URL } from 'lib/constants'
import { formatBytes } from 'lib/helpers'
import {
  Button,
  Card,
  CardContent,
  CardFooter,
  FormControl_Shadcn_,
  FormField_Shadcn_,
  FormMessage_Shadcn_,
  Form_Shadcn_,
  Input_Shadcn_,
  SelectContent_Shadcn_,
  SelectItem_Shadcn_,
  SelectTrigger_Shadcn_,
  SelectValue_Shadcn_,
  Select_Shadcn_,
  Switch,
} from 'ui'
import { Admonition } from 'ui-patterns/admonition'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import { PageContainer } from 'ui-patterns/PageContainer'
import { PageSection, PageSectionContent } from 'ui-patterns/PageSection'
import { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'
import { StorageFileSizeLimitErrorMessage } from './StorageFileSizeLimitErrorMessage'
import {
  StorageListV2MigratingCallout,
  StorageListV2MigrationCallout,
} from './StorageListV2MigrationCallout'
import {
  STORAGE_FILE_SIZE_LIMIT_MAX_BYTES_CAPPED,
  STORAGE_FILE_SIZE_LIMIT_MAX_BYTES_UNCAPPED,
  StorageSizeUnits,
} from './StorageSettings.constants'
import {
  convertFromBytes,
  convertToBytes,
  encodeBucketLimitErrorMessage,
} from './StorageSettings.utils'
import { ValidateSizeLimit } from './StorageSettings.ValidateSizeLimit'

const formId = 'storage-settings-form'

interface StorageSettingsState {
  fileSizeLimit: number
  unit: StorageSizeUnits
  imageTransformationEnabled: boolean
}

export const StorageSettings = () => {
  const { t } = useTranslation()
  const { ref: projectRef } = useParams()
  const { data: project } = useSelectedProjectQuery()

  const showMigrationCallout = useFlag('storageMigrationCallout')

  const { can: canReadStorageSettings, isLoading: isLoadingPermissions } = useAsyncCheckPermissions(
    PermissionAction.STORAGE_ADMIN_READ,
    '*'
  )
  const { can: canUpdateStorageSettings } = useAsyncCheckPermissions(
    PermissionAction.STORAGE_ADMIN_WRITE,
    '*'
  )

  const {
    data: config,
    error,
    isPending: isLoadingProjectStorageConfig,
    isSuccess,
    isError,
  } = useProjectStorageConfigQuery({ projectRef })
  const isListV2UpgradeAvailable =
    !!config && !config.capabilities.list_v2 && config.external.upstreamTarget === 'main'
  const isListV2Upgrading =
    !!config && !config.capabilities.list_v2 && config.external.upstreamTarget === 'canary'

  const {
    runCondition: sizeLimitCheckCondition,
    runQuery: sizeLimitCheckQuery,
    isEstimatePending: isBucketEstimatePending,
  } = useLargestBucketSizeLimitsCheck({
    projectRef,
    connectionString: project?.connectionString ?? undefined,
  })
  const shouldAutoValidateBucketLimits = sizeLimitCheckCondition === 'auto'

  const { data: organization } = useSelectedOrganizationQuery()
  const {
    getEntitlementNumericValue,
    isEntitlementUnlimited,
    isLoading: isLoadingMaxFileSizeEntitlement,
  } = useCheckEntitlements('storage.max_file_size')
  const { hasAccess: hasAccessToFileSizeConfiguration, isLoading: isLoadingFileSizeConfigurable } =
    useCheckEntitlements('storage.max_file_size.configurable')
  const {
    hasAccess: hasAccessToImageTransformations,
    isLoading: isLoadingImageTransformationEntitlement,
  } = useCheckEntitlements('storage.image_transformations')

  const isSpendCapOn =
    organization?.plan.id === 'pro' && organization?.usage_billing_enabled === false
  const hasLimitedStorageAccess =
    !hasAccessToImageTransformations && !hasAccessToFileSizeConfiguration

  const [isUpdating, setIsUpdating] = useState(false)
  const [initialValues, setInitialValues] = useState<StorageSettingsState>({
    fileSizeLimit: 0,
    unit: StorageSizeUnits.MB,
    imageTransformationEnabled: false,
  })

  const maxBytes = useMemo(() => {
    if (organization?.usage_billing_enabled || isEntitlementUnlimited()) {
      return STORAGE_FILE_SIZE_LIMIT_MAX_BYTES_UNCAPPED
    } else {
      return getEntitlementNumericValue() ?? STORAGE_FILE_SIZE_LIMIT_MAX_BYTES_CAPPED
    }
  }, [organization, isEntitlementUnlimited, getEntitlementNumericValue])

  const isLoading =
    isLoadingProjectStorageConfig ||
    isLoadingPermissions ||
    isLoadingMaxFileSizeEntitlement ||
    isLoadingFileSizeConfigurable ||
    isLoadingImageTransformationEntitlement
  const FormSchema = z
    .object({
      fileSizeLimit: z.coerce.number(),
      unit: z.nativeEnum(StorageSizeUnits),
      imageTransformationEnabled: z.boolean(),
    })
    .superRefine((data, ctx) => {
      const { unit, fileSizeLimit } = data
      const { value: formattedMaxLimit } = convertFromBytes(maxBytes, unit)

      if (fileSizeLimit > formattedMaxLimit) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: t('storage.max_limit_error', { limit: formattedMaxLimit.toLocaleString(), unit }),
          path: ['fileSizeLimit'],
        })
      }
    })

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: initialValues,
    mode: 'onSubmit',
    reValidateMode: 'onSubmit',
  })

  const { unit: storageUnit } = form.watch()
  const fileSizeLimitError = form.formState.errors.fileSizeLimit

  const { mutate: updateStorageConfig } = useProjectStorageConfigUpdateUpdateMutation({
    onSuccess: () => {
      toast.success(t('storage.successfully_updated_settings'))
      setIsUpdating(false)
    },
    onError: (error) => {
      toast.error(t('storage.failed_to_update_settings', { error: error.message }))
      setIsUpdating(false)
    },
  })

  const onSubmit: SubmitHandler<z.infer<typeof FormSchema>> = async (data) => {
    if (!projectRef) return console.error('Project ref is required')
    if (!config) return console.error('Storage config is required')

    setIsUpdating(true)

    if (shouldAutoValidateBucketLimits) {
      try {
        const buckets = await sizeLimitCheckQuery()
        const globalLimitInBytes = convertToBytes(data.fileSizeLimit, data.unit)
        const failingBuckets = buckets.filter(
          (bucket) => bucket.file_size_limit > globalLimitInBytes
        )

        if (failingBuckets.length > 0) {
          setIsUpdating(false)
          form.setError('fileSizeLimit', {
            type: 'manual',
            message: encodeBucketLimitErrorMessage(
              failingBuckets.map((bucket) => ({
                name: bucket.name,
                limit: bucket.file_size_limit,
              }))
            ),
          })
          return
        }

        form.clearErrors('fileSizeLimit')
      } catch (error) {
        setIsUpdating(false)
        const message =
          error instanceof Error && error.message.length > 0 ? error.message : 'Unexpected error'

        form.setError('fileSizeLimit', {
          type: 'manual',
          message: t('storage.failed_validate_limits', { error: message }),
        })
        return
      }
    }

    updateStorageConfig({
      projectRef,
      fileSizeLimit: convertToBytes(data.fileSizeLimit, data.unit),
      features: {
        imageTransformation: { enabled: data.imageTransformationEnabled },
        s3Protocol: { enabled: config.features.s3Protocol.enabled },
      },
    })
  }

  useEffect(() => {
    if (isSuccess && config && !isLoading) {
      const { fileSizeLimit, features } = config
      const { value, unit } = convertFromBytes(fileSizeLimit ?? 0)
      const imageTransformationEnabled =
        features?.imageTransformation?.enabled ?? hasAccessToImageTransformations

      setInitialValues({
        fileSizeLimit: value,
        unit: unit,
        imageTransformationEnabled,
      })

      // Reset the form values when the config values load
      form.reset({
        fileSizeLimit: value,
        unit: unit,
        imageTransformationEnabled,
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSuccess, config, isLoading, hasAccessToImageTransformations])

  return (
    <PageContainer>
      <PageSection>
        <PageSectionContent className="flex flex-col gap-y-8">
          <Form_Shadcn_ {...form}>
            {!IS_PLATFORM ? (
              <Admonition
                type="default"
                title={t('storage.self_hosted_warning_title')}
                description={t('storage.self_hosted_warning_description')}
              />
            ) : isLoading ? (
              <GenericSkeletonLoader />
            ) : (
              <>
                {!canReadStorageSettings && (
                  <NoPermission resourceText={t('storage.view_settings_permission')} />
                )}
                {isError && (
                  <AlertError
                    error={error}
                    subject={t('storage.failed_retrieve_config')}
                  />
                )}
                {isSuccess && (
                  <>
                    {showMigrationCallout && (
                      <>
                        {isListV2UpgradeAvailable && <StorageListV2MigrationCallout />}
                        {isListV2Upgrading && <StorageListV2MigratingCallout />}
                      </>
                    )}
                    <form id={formId} onSubmit={form.handleSubmit(onSubmit)}>
                      <Card>
                        <CardContent>
                          <FormField_Shadcn_
                            control={form.control}
                            name="imageTransformationEnabled"
                            render={({ field }: { field: any }) => (
                              <FormItemLayout
                                layout="flex-row-reverse"
                                label={t('storage.enable_image_transformation')}
                                description={
                                  <>
                                    {t('storage.image_transformation_description')}{' '}
                                    <InlineLink
                                      href={`${DOCS_URL}/guides/storage/serving/image-transformations`}
                                    >
                                      {t('storage.learn_more')}
                                    </InlineLink>
                                    .
                                  </>
                                }
                              >
                                <FormControl_Shadcn_>
                                  <Switch
                                    size="large"
                                    disabled={
                                      !hasAccessToImageTransformations || !canUpdateStorageSettings
                                    }
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                  />
                                </FormControl_Shadcn_>
                              </FormItemLayout>
                            )}
                          />
                        </CardContent>

                        <CardContent>
                          <FormField_Shadcn_
                            control={form.control}
                            name="fileSizeLimit"
                            render={({ field }: { field: any }) => (
                              <FormItemLayout
                                hideMessage
                                layout="flex-row-reverse"
                                label={t('storage.global_file_size_limit')}
                                className="[&>div]:md:w-1/2 [&>div]:xl:w-2/5 [&>div>div]:w-full [&>div]:min-w-100"
                                description={
                                  <>
                                    {t('storage.global_file_size_limit_description')}{' '}
                                    <InlineLink
                                      href={`${DOCS_URL}/guides/storage/uploads/file-limits`}
                                    >
                                      {t('storage.learn_more')}
                                    </InlineLink>
                                    .
                                    {!shouldAutoValidateBucketLimits && (
                                      <p>
                                        {t('storage.global_limit_warning')}
                                      </p>
                                    )}
                                  </>
                                }
                              >
                                <FormControl_Shadcn_>
                                  <div className="flex items-center justify-end">
                                    <Input_Shadcn_
                                      type="number"
                                      {...field}
                                      onChange={(e: any) => {
                                        field.onChange(e)
                                        form.clearErrors('fileSizeLimit')
                                      }}
                                      className="w-32 rounded-r-none border-r-0"
                                      disabled={
                                        !hasAccessToFileSizeConfiguration ||
                                        !canUpdateStorageSettings
                                      }
                                    />
                                    <FormField_Shadcn_
                                      control={form.control}
                                      name="unit"
                                      render={({ field: unitField }: { field: any }) => (
                                        <Select_Shadcn_
                                          value={unitField.value}
                                          onValueChange={(val: any) => {
                                            unitField.onChange(val)
                                            form.clearErrors('fileSizeLimit')
                                          }}
                                          disabled={
                                            !hasAccessToFileSizeConfiguration ||
                                            !canUpdateStorageSettings
                                          }
                                        >
                                          <SelectTrigger_Shadcn_ className="w-[90px] text-xs font-mono rounded-l-none bg-surface-300">
                                            <SelectValue_Shadcn_ placeholder={t('storage.choose_prefix')}>
                                              {storageUnit}
                                            </SelectValue_Shadcn_>
                                          </SelectTrigger_Shadcn_>
                                          <SelectContent_Shadcn_>
                                            {Object.values(StorageSizeUnits).map((unit: string) => (
                                              <SelectItem_Shadcn_
                                                key={unit}
                                                disabled={!hasAccessToFileSizeConfiguration}
                                                value={unit}
                                              >
                                                {unit}
                                              </SelectItem_Shadcn_>
                                            ))}
                                          </SelectContent_Shadcn_>
                                        </Select_Shadcn_>
                                      )}
                                    />
                                  </div>
                                </FormControl_Shadcn_>
                                {sizeLimitCheckCondition === 'confirm' && (
                                  <ValidateSizeLimit
                                    onValidate={sizeLimitCheckQuery}
                                    projectRef={projectRef}
                                    isLoadingBucketEstimate={isBucketEstimatePending}
                                  />
                                )}
                              </FormItemLayout>
                            )}
                          />
                          {fileSizeLimitError && (
                            <FormMessage_Shadcn_ className="ml-auto mt-2 text-right w-1/2">
                              <StorageFileSizeLimitErrorMessage
                                error={fileSizeLimitError}
                                projectRef={projectRef}
                              />
                            </FormMessage_Shadcn_>
                          )}
                        </CardContent>
                        {hasLimitedStorageAccess && (
                          <UpgradeToPro
                            fullWidth
                            variant="primary"
                            source="storageSizeLimit"
                            featureProposition="configure upload file size limits in Storage"
                            primaryText={t('storage.free_plan_limit')}
                            secondaryText={t('storage.upgrade_pro_limit', { limit: formatBytes(STORAGE_FILE_SIZE_LIMIT_MAX_BYTES_UNCAPPED) })}
                          />
                        )}
                        {isSpendCapOn && (
                          <UpgradeToPro
                            fullWidth
                            addon="spendCap"
                            variant="default"
                            source="storageSizeLimit"
                            featureProposition="increase the file upload size limits in Storage"
                            buttonText={t('storage.disable_spend_cap')}
                            primaryText={t('storage.spend_cap_warning_title')}
                            secondaryText={t('storage.spend_cap_warning_description', { limit: formatBytes(STORAGE_FILE_SIZE_LIMIT_MAX_BYTES_UNCAPPED) })}
                          />
                        )}

                        {!canUpdateStorageSettings && (
                          <CardContent>
                            <p className="text-sm text-foreground-light">
                              {t('storage.update_settings_permission_error')}
                            </p>
                          </CardContent>
                        )}

                        <CardFooter className="justify-end space-x-2">
                          {form.formState.isDirty && (
                            <Button
                              type="default"
                              htmlType="reset"
                              onClick={() => form.reset()}
                              disabled={
                                !form.formState.isDirty || !canUpdateStorageSettings || isUpdating
                              }
                            >
                              {t('storage.cancel')}
                            </Button>
                          )}
                          <Button
                            type={hasLimitedStorageAccess ? 'default' : 'primary'}
                            htmlType="submit"
                            loading={isUpdating}
                            disabled={
                              !canUpdateStorageSettings || isUpdating || !form.formState.isDirty
                            }
                          >
                            {t('storage.save')}
                          </Button>
                        </CardFooter>
                      </Card>
                    </form>
                  </>
                )}
              </>
            )}
          </Form_Shadcn_>
        </PageSectionContent>
      </PageSection>
    </PageContainer>
  )
}
