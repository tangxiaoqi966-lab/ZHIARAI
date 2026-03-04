import { yupResolver } from '@hookform/resolvers/yup'
import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { object, string } from 'yup'

import { useParams } from 'common'
import AlertError from 'components/ui/AlertError'
import { useAuthConfigQuery } from 'data/auth/auth-config-query'
import { useAuthConfigUpdateMutation } from 'data/auth/auth-config-update-mutation'
import { useAsyncCheckPermissions } from 'hooks/misc/useCheckPermissions'
import {
  Button,
  Card,
  CardContent,
  CardFooter,
  FormControl_Shadcn_,
  FormField_Shadcn_,
  Form_Shadcn_,
  Input_Shadcn_,
} from 'ui'
import { GenericSkeletonLoader } from 'ui-patterns'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import {
  PageSection,
  PageSectionContent,
  PageSectionMeta,
  PageSectionSummary,
  PageSectionTitle,
} from 'ui-patterns/PageSection'

const SiteUrl = () => {
  const { t } = useTranslation()
  const { ref: projectRef } = useParams()
  const {
    data: authConfig,
    error: authConfigError,
    isError,
    isPending: isLoading,
  } = useAuthConfigQuery({ projectRef })

  const schema = object({
    SITE_URL: string().required(t('site_url.validation_required')),
  })
  const { mutate: updateAuthConfig } = useAuthConfigUpdateMutation()
  const [isUpdatingSiteUrl, setIsUpdatingSiteUrl] = useState(false)

  const { can: canUpdateConfig } = useAsyncCheckPermissions(
    PermissionAction.UPDATE,
    'custom_config_gotrue'
  )

  const siteUrlForm = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      SITE_URL: '',
    },
  })

  useEffect(() => {
    if (authConfig && !isUpdatingSiteUrl) {
      siteUrlForm.reset({
        SITE_URL: authConfig.SITE_URL || '',
      })
    }
  }, [authConfig, isUpdatingSiteUrl])

  const onSubmitSiteUrl = (values: any) => {
    setIsUpdatingSiteUrl(true)

    updateAuthConfig(
      { projectRef: projectRef!, config: values },
      {
        onError: (error) => {
          toast.error(t('site_url.failed_to_update', { error: error?.message }))
          setIsUpdatingSiteUrl(false)
        },
        onSuccess: () => {
          toast.success(t('site_url.successfully_updated'))
          setIsUpdatingSiteUrl(false)
          siteUrlForm.reset(values)
        },
      }
    )
  }

  if (isError) {
    return (
      <PageSection>
        <PageSectionContent>
          <AlertError error={authConfigError} subject={t('site_url.failed_to_retrieve_auth_config')} />
        </PageSectionContent>
      </PageSection>
    )
  }

  if (isLoading) {
    return (
      <PageSection>
        <PageSectionContent>
          <GenericSkeletonLoader />
        </PageSectionContent>
      </PageSection>
    )
  }

  return (
    <PageSection>
      <PageSectionMeta>
        <PageSectionSummary>
          <PageSectionTitle>{t('site_url.title')}</PageSectionTitle>
        </PageSectionSummary>
      </PageSectionMeta>
      <PageSectionContent>
        <Form_Shadcn_ {...siteUrlForm}>
          <form onSubmit={siteUrlForm.handleSubmit(onSubmitSiteUrl)}>
            <Card>
              <CardContent>
                <FormField_Shadcn_
                  control={siteUrlForm.control}
                  name="SITE_URL"
                  render={({ field }: { field: any }) => (
                    <FormItemLayout
                      layout="flex-row-reverse"
                      label={t('site_url.title')}
                      description={t('site_url.description')}
                    >
                      <FormControl_Shadcn_>
                        <Input_Shadcn_ {...field} disabled={!canUpdateConfig} />
                      </FormControl_Shadcn_>
                    </FormItemLayout>
                  )}
                />
              </CardContent>

              <CardFooter className="justify-end space-x-2">
                {siteUrlForm.formState.isDirty && (
                  <Button type="default" onClick={() => siteUrlForm.reset()}>
                    {t('site_url.cancel')}
                  </Button>
                )}
                <Button
                  type="primary"
                  htmlType="submit"
                  disabled={!canUpdateConfig || isUpdatingSiteUrl || !siteUrlForm.formState.isDirty}
                  loading={isUpdatingSiteUrl}
                >
                  {t('site_url.save_changes')}
                </Button>
              </CardFooter>
            </Card>
          </form>
        </Form_Shadcn_>
      </PageSectionContent>
    </PageSection>
  )
}

export default SiteUrl
