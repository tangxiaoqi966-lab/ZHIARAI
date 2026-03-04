import { yupResolver } from '@hookform/resolvers/yup'
import { PermissionAction } from '@supabase/shared-types/out/constants'
import { Eye, EyeOff } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Trans, useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import * as yup from 'yup'

import { useParams } from 'common'
import AlertError from 'components/ui/AlertError'
import { InlineLink } from 'components/ui/InlineLink'
import NoPermission from 'components/ui/NoPermission'
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
  PrePostTab,
  Switch,
  cn,
} from 'ui'
import { Admonition, PageSection, PageSectionContent } from 'ui-patterns'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import { urlRegex } from '../Auth.constants'
import { defaultDisabledSmtpFormValues } from './SmtpForm.constants'
import { generateFormValues, isSmtpEnabled } from './SmtpForm.utils'

interface SmtpFormValues {
  SMTP_ADMIN_EMAIL?: string
  SMTP_SENDER_NAME?: string
  SMTP_HOST?: string
  SMTP_PORT?: number
  SMTP_MAX_FREQUENCY?: number
  SMTP_USER?: string
  SMTP_PASS?: string
  ENABLE_SMTP: boolean
}

export const SmtpForm = () => {
  const { t } = useTranslation()
  const { ref: projectRef } = useParams()
  const { data: authConfig, error: authConfigError, isError } = useAuthConfigQuery({ projectRef })
  const { mutate: updateAuthConfig, isPending: isUpdatingConfig } = useAuthConfigUpdateMutation()

  const [enableSmtp, setEnableSmtp] = useState(false)
  const [hidden, setHidden] = useState(true)

  const { can: canReadConfig } = useAsyncCheckPermissions(
    PermissionAction.READ,
    'custom_config_gotrue'
  )
  const { can: canUpdateConfig } = useAsyncCheckPermissions(
    PermissionAction.UPDATE,
    'custom_config_gotrue'
  )

  const smtpSchema = yup.object({
    SMTP_ADMIN_EMAIL: yup.string().when('ENABLE_SMTP', {
      is: true,
      then: (schema) =>
        schema.email(t('smtp.validation.valid_email')).required(t('smtp.validation.sender_email_required')),
      otherwise: (schema) => schema,
    }),
    SMTP_SENDER_NAME: yup.string().when('ENABLE_SMTP', {
      is: true,
      then: (schema) => schema.required(t('smtp.validation.sender_name_required')),
      otherwise: (schema) => schema,
    }),
    SMTP_HOST: yup.string().when('ENABLE_SMTP', {
      is: true,
      then: (schema) =>
        schema
          .matches(urlRegex({ excludeSimpleDomains: false }), t('smtp.validation.valid_url_ip'))
          .required(t('smtp.validation.host_required')),
      otherwise: (schema) => schema,
    }),
    SMTP_PORT: yup.number().when('ENABLE_SMTP', {
      is: true,
      then: (schema) =>
        schema
          .required(t('smtp.validation.port_required'))
          .min(1, t('smtp.validation.valid_port_min'))
          .max(65535, t('smtp.validation.valid_port_max')),
      otherwise: (schema) => schema,
    }),
    SMTP_MAX_FREQUENCY: yup.number().when('ENABLE_SMTP', {
      is: true,
      then: (schema) =>
        schema
          .required(t('smtp.validation.rate_limit_required'))
          .min(1, t('smtp.validation.rate_limit_min'))
          .max(32767, t('smtp.validation.rate_limit_max')),
      otherwise: (schema) => schema,
    }),
    SMTP_USER: yup.string().when('ENABLE_SMTP', {
      is: true,
      then: (schema) => schema.required(t('smtp.validation.username_required')),
      otherwise: (schema) => schema,
    }),
    SMTP_PASS: yup.string(),
    ENABLE_SMTP: yup.boolean().required(),
  })

  const form = useForm<SmtpFormValues>({
    resolver: yupResolver(smtpSchema),
    defaultValues: {
      SMTP_ADMIN_EMAIL: '',
      SMTP_SENDER_NAME: '',
      SMTP_HOST: '',
      SMTP_PORT: undefined,
      SMTP_MAX_FREQUENCY: undefined,
      SMTP_USER: '',
      SMTP_PASS: '',
      ENABLE_SMTP: false,
    },
  })

  // Update form values when auth config is loaded
  useEffect(() => {
    if (authConfig) {
      const formValues = generateFormValues(authConfig)
      // Convert SMTP_PORT from string to number if it exists
      if (formValues.SMTP_PORT) {
        formValues.SMTP_PORT = Number(formValues.SMTP_PORT) as any
      }
      form.reset({
        ...formValues,
        ENABLE_SMTP: isSmtpEnabled(authConfig),
      } as SmtpFormValues)
      setEnableSmtp(isSmtpEnabled(authConfig))
    }
  }, [authConfig, form])

  // Update enableSmtp state when the form field changes
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === 'ENABLE_SMTP') {
        setEnableSmtp(value.ENABLE_SMTP as boolean)
      }
    })
    return () => subscription.unsubscribe()
  }, [form])

  const onSubmit = (values: SmtpFormValues) => {
    const { ENABLE_SMTP, ...rest } = values
    const basePayload = ENABLE_SMTP ? rest : defaultDisabledSmtpFormValues

    // When enabling SMTP, set RATE_LIMIT_EMAIL_SENT to 30
    // When disabling, backend will handle resetting to default
    const isEnablingSmtp = ENABLE_SMTP && !isSmtpEnabled(authConfig)
    const payload = {
      ...basePayload,
      ...(isEnablingSmtp && { RATE_LIMIT_EMAIL_SENT: 30 }),
    }

    // Format payload: Convert port to string
    if (payload.SMTP_PORT) {
      payload.SMTP_PORT = payload.SMTP_PORT.toString() as any
    }

    // the SMTP_PASS is write-only, it's never shown. If we don't delete it from the payload, it will replace the
    // previously saved value with an empty one
    if (payload.SMTP_PASS === '') {
      delete payload.SMTP_PASS
    }

    updateAuthConfig(
      { projectRef: projectRef!, config: payload as any },
      {
        onError: (error) => {
          toast.error(t('smtp.failed_to_update_settings', { error: error.message }))
        },
        onSuccess: () => {
          setHidden(true)
          toast.success(t('smtp.successfully_updated_settings'))
        },
      }
    )
  }

  if (isError) {
    return (
      <PageSection>
        <PageSectionContent>
          <AlertError error={authConfigError} subject={t('smtp.failed_to_retrieve_auth_config')} />
        </PageSectionContent>
      </PageSection>
    )
  }

  if (!canReadConfig) {
    return (
      <PageSection>
        <PageSectionContent>
          <NoPermission resourceText={t('smtp.view_smtp_settings')} />
        </PageSectionContent>
      </PageSection>
    )
  }

  return (
    <PageSection>
      <PageSectionContent>
        <Form_Shadcn_ {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <Card>
              <CardContent>
                <FormField_Shadcn_
                  control={form.control}
                  name="ENABLE_SMTP"
                  render={({ field }: { field: any }) => (
                    <FormItemLayout
                      layout="flex-row-reverse"
                      label={t('smtp.enable_custom_smtp')}
                      description={
                        <p className="max-w-full prose text-sm text-foreground-lighter">
                          <Trans
                            i18nKey="smtp.custom_smtp_description"
                            components={{
                              link: <InlineLink href={`/project/${projectRef}/auth/rate-limits`} />,
                            }}
                          />
                        </p>
                      }
                    >
                      <FormControl_Shadcn_>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          disabled={!canUpdateConfig}
                        />
                      </FormControl_Shadcn_>
                    </FormItemLayout>
                  )}
                />

                {enableSmtp && !isSmtpEnabled(form.getValues() as any) && (
                  <Admonition
                    type="warning"
                    title={t('smtp.all_fields_must_be_filled')}
                    description={t('smtp.all_fields_must_be_filled_description')}
                    className="bg-warning-200 border-warning-400 mt-4"
                  />
                )}
              </CardContent>

              {enableSmtp && (
                <>
                  <CardContent className="py-6">
                    <div className="grid grid-cols-12 gap-6">
                      <div className="col-span-4">
                        <h3 className="text-sm mb-1">{t('smtp.sender_details')}</h3>
                        <p className="text-sm text-foreground-lighter text-balance">
                          {t('smtp.sender_details_description')}
                        </p>
                      </div>
                      <div className="col-span-8 space-y-4">
                        <FormField_Shadcn_
                          control={form.control}
                          name="SMTP_ADMIN_EMAIL"
                          render={({ field }: { field: any }) => (
                            <FormItemLayout
                              label={t('smtp.sender_email_address')}
                              description={t('smtp.sender_email_address_description')}
                            >
                              <FormControl_Shadcn_>
                                <Input_Shadcn_
                                  {...field}
                                  placeholder="noreply@yourdomain.com"
                                  disabled={!canUpdateConfig}
                                />
                              </FormControl_Shadcn_>
                            </FormItemLayout>
                          )}
                        />

                        <FormField_Shadcn_
                          control={form.control}
                          name="SMTP_SENDER_NAME"
                          render={({ field }: { field: any }) => (
                            <FormItemLayout
                              label={t('smtp.sender_name')}
                              description={t('smtp.sender_name_description')}
                            >
                              <FormControl_Shadcn_>
                                <Input_Shadcn_
                                  {...field}
                                  placeholder="Your Name"
                                  disabled={!canUpdateConfig}
                                />
                              </FormControl_Shadcn_>
                            </FormItemLayout>
                          )}
                        />
                      </div>
                    </div>
                  </CardContent>

                  <CardContent className="py-6">
                    <div className="grid grid-cols-12 gap-6">
                      <div className="col-span-4">
                        <h3 className="text-sm mb-1">{t('smtp.smtp_provider_settings')}</h3>
                        <p className="text-sm text-foreground-lighter text-balance">
                          {t('smtp.smtp_provider_settings_description')}
                        </p>
                      </div>
                      <div className="col-span-8 space-y-4">
                        <FormField_Shadcn_
                          control={form.control}
                          name="SMTP_HOST"
                          render={({ field }: { field: any }) => (
                            <FormItemLayout
                              label={t('smtp.host')}
                              description={t('smtp.host_description')}
                            >
                              <FormControl_Shadcn_>
                                <Input_Shadcn_
                                  {...field}
                                  placeholder="your.smtp.host.com"
                                  disabled={!canUpdateConfig}
                                />
                              </FormControl_Shadcn_>
                            </FormItemLayout>
                          )}
                        />

                        {form.watch('SMTP_HOST')?.endsWith('.gmail.com') && (
                          <Admonition
                            type="warning"
                            title={t('smtp.check_smtp_provider')}
                            description={t('smtp.check_smtp_provider_description')}
                            className="mb-4 bg-warning-200 border-warning-400"
                          />
                        )}

                        <FormField_Shadcn_
                          control={form.control}
                          name="SMTP_PORT"
                          render={({ field }: { field: any }) => (
                            <FormItemLayout
                              label={t('smtp.port_number')}
                              description={
                                <>
                                  <span className="block">
                                    {t('smtp.port_number_description')}
                                  </span>
                                </>
                              }
                            >
                              <FormControl_Shadcn_>
                                <Input_Shadcn_
                                  type="number"
                                  value={field.value}
                                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => field.onChange(Number(e.target.value))}
                                  placeholder="587"
                                  disabled={!canUpdateConfig}
                                />
                              </FormControl_Shadcn_>
                            </FormItemLayout>
                          )}
                        />

                        <FormField_Shadcn_
                          control={form.control}
                          name="SMTP_MAX_FREQUENCY"
                          render={({ field }: { field: any }) => (
                            <FormItemLayout
                              label={t('smtp.minimum_interval')}
                              description={t('smtp.minimum_interval_description')}
                            >
                              <FormControl_Shadcn_>
                                <PrePostTab postTab={t('smtp.seconds')}>
                                  <Input_Shadcn_
                                    type="number"
                                    value={field.value}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => field.onChange(Number(e.target.value))}
                                    disabled={!canUpdateConfig}
                                  />
                                </PrePostTab>
                              </FormControl_Shadcn_>
                            </FormItemLayout>
                          )}
                        />

                        <FormField_Shadcn_
                          control={form.control}
                          name="SMTP_USER"
                          render={({ field }: { field: any }) => (
                            <FormItemLayout
                              label={t('smtp.username')}
                              description={t('smtp.username_description')}
                            >
                              <FormControl_Shadcn_>
                                <Input_Shadcn_
                                  {...field}
                                  placeholder={t('smtp.username')}
                                  disabled={!canUpdateConfig}
                                />
                              </FormControl_Shadcn_>
                            </FormItemLayout>
                          )}
                        />

                        <FormField_Shadcn_
                          control={form.control}
                          name="SMTP_PASS"
                          render={({ field }: { field: any }) => (
                            <FormItemLayout
                              label={t('smtp.password')}
                              description={t('smtp.password_description')}
                            >
                              <FormControl_Shadcn_>
                                <PrePostTab
                                  postTab={
                                    <Button
                                      type="text"
                                      className="p-0"
                                      onClick={() => setHidden(!hidden)}
                                      icon={hidden ? <Eye /> : <EyeOff />}
                                    />
                                  }
                                >
                                  <Input_Shadcn_
                                    {...field}
                                    type={hidden ? 'password' : 'text'}
                                    placeholder={
                                      authConfig?.SMTP_PASS === null ? t('smtp.smtp_password_placeholder') : '••••••••'
                                    }
                                    disabled={!canUpdateConfig}
                                  />
                                </PrePostTab>
                              </FormControl_Shadcn_>
                            </FormItemLayout>
                          )}
                        />
                      </div>
                    </div>
                  </CardContent>
                </>
              )}

              <CardFooter
                className={cn(
                  form.formState.isDirty ? 'justify-between' : 'justify-end',
                  'gap-x-2'
                )}
              >
                {form.formState.isDirty && (
                  <p className="text-sm text-foreground-light">
                    {enableSmtp ? (
                      <Trans
                        i18nKey="smtp.rate_limit_increased"
                        components={{
                          link: <InlineLink href={`/project/${projectRef}/auth/rate-limits`} />,
                        }}
                      />
                    ) : (
                      t('smtp.rate_limit_reduced')
                    )}
                  </p>
                )}
                <div className="flex items-center gap-x-2">
                  {form.formState.isDirty && (
                    <Button
                      type="default"
                      onClick={() => {
                        form.reset()
                        setEnableSmtp(isSmtpEnabled(authConfig))
                      }}
                    >
                      {t('smtp.cancel')}
                    </Button>
                  )}
                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={isUpdatingConfig}
                    disabled={!canUpdateConfig || !form.formState.isDirty}
                  >
                    {t('smtp.save_changes')}
                  </Button>
                </div>
              </CardFooter>
            </Card>
          </form>
        </Form_Shadcn_>
      </PageSectionContent>
    </PageSection>
  )
}
