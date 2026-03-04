import { zodResolver } from '@hookform/resolvers/zod'
import { PermissionAction } from '@supabase/shared-types/out/constants'
import { type ControllerRenderProps, useForm } from 'react-hook-form'
import { z } from 'zod'

import { useParams } from 'common'
import { DocsButton } from 'components/ui/DocsButton'
import { useProjectSettingsV2Query } from 'data/config/project-settings-v2-query'
import { useCheckCNAMERecordMutation } from 'data/custom-domains/check-cname-mutation'
import { useCustomDomainCreateMutation } from 'data/custom-domains/custom-domains-create-mutation'
import { useAsyncCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { DOCS_URL } from 'lib/constants'
import { useTranslation } from 'react-i18next'
import {
  Button,
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  FormControl_Shadcn_,
  FormField_Shadcn_,
  FormMessage_Shadcn_,
  Form_Shadcn_,
  Input_Shadcn_,
} from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'

const CustomDomainsConfigureHostname = () => {
  const { t } = useTranslation()
  const { ref } = useParams()
  const { data: project } = useSelectedProjectQuery()

  const { mutate: checkCNAMERecord, isPending: isCheckingRecord } = useCheckCNAMERecordMutation()
  const { mutate: createCustomDomain, isPending: isCreating } = useCustomDomainCreateMutation()
  const { data: settings } = useProjectSettingsV2Query({ projectRef: ref })

  const endpoint = settings?.app_config?.endpoint
  const { can: canConfigureCustomDomain } = useAsyncCheckPermissions(
    PermissionAction.UPDATE,
    'projects',
    {
      resource: {
        project_id: project?.id,
      },
    }
  )

  const schema = z.object({
    domain: z.string().trim().min(1, t('settings.general.custom_domains_domain_required')),
  })
  type FormValues = z.infer<typeof schema>

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      domain: '',
    },
    mode: 'onSubmit',
    reValidateMode: 'onBlur',
  })

  const onCreateCustomDomain = async (values: FormValues) => {
    if (!ref) return console.error('Project ref is required')

    checkCNAMERecord(
      { domain: values.domain.trim() },
      {
        onSuccess: () => {
          createCustomDomain({ projectRef: ref, customDomain: values.domain.trim() })
        },
      }
    )
  }

  const domain = form.watch('domain')
  const isSubmitting = isCheckingRecord || isCreating

  return (
    <Form_Shadcn_ {...form}>
      <form onSubmit={form.handleSubmit(onCreateCustomDomain)}>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 gap-4">
            <CardTitle>{t('settings.general.custom_domains_add_title')}</CardTitle>
            <DocsButton href={`${DOCS_URL}/guides/platform/custom-domains`} />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <FormField_Shadcn_
                control={form.control}
                name="domain"
                render={({ field }: { field: ControllerRenderProps<FormValues, 'domain'> }) => (
                  <FormItemLayout
                    layout="flex-row-reverse"
                    label={t('settings.general.custom_domains_domain_label')}
                    description={t('settings.general.custom_domains_domain_desc')}
                    className="[&>div]:md:w-1/2"
                  >
                    <FormControl_Shadcn_>
                      <Input_Shadcn_
                        {...field}
                        placeholder="subdomain.example.com"
                        disabled={!canConfigureCustomDomain || isSubmitting}
                        autoComplete="off"
                      />
                    </FormControl_Shadcn_>
                    <FormMessage_Shadcn_ />
                  </FormItemLayout>
                )}
              />
            </div>
          </CardContent>
          <CardContent>
            <h4 className="text-sm mb-1">{t('settings.general.custom_domains_cname_title')}</h4>
            <p className="text-sm text-foreground-light">
              {t('settings.general.custom_domains_cname_desc_1')}{' '}
              {domain ? (
                <code className="text-code-inline">{domain}</code>
              ) : (
                t('settings.general.custom_domains_your_domain')
              )}{' '}
              {t('settings.general.custom_domains_cname_desc_2')}{' '}
              {endpoint ? (
                <code className="text-code-inline">{endpoint}</code>
              ) : (
                t('settings.general.custom_domains_project_api_url')
              )}{' '}
              {t('settings.general.custom_domains_cname_desc_3')}{' '}
              {t('settings.general.custom_domains_cname_cloudflare_note')}
            </p>
          </CardContent>

          <CardFooter className="justify-end space-x-2">
            {form.formState.isDirty && (
              <Button
                type="default"
                disabled={isSubmitting}
                onClick={() => form.reset({ domain: '' })}
              >
                {t('actions.cancel')}
              </Button>
            )}
            <Button
              type="primary"
              htmlType="submit"
              loading={isSubmitting}
              disabled={!form.formState.isDirty || isSubmitting || !canConfigureCustomDomain}
            >
              {t('actions.create')}
            </Button>
          </CardFooter>
        </Card>

        {!canConfigureCustomDomain && (
          <p className="text-xs text-foreground-light">
            {t('settings.general.custom_domains_permission_error')}
          </p>
        )}
      </form>
    </Form_Shadcn_>
  )
}

export default CustomDomainsConfigureHostname
