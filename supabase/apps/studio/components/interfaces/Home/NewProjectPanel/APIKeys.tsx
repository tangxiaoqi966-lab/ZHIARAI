import { PermissionAction } from '@supabase/shared-types/out/constants'
import { JwtSecretUpdateStatus } from '@supabase/shared-types/out/events'
import { useParams } from 'common'
import { AlertError } from 'components/ui/AlertError'
import { InlineLink } from 'components/ui/InlineLink'
import { getKeys, useAPIKeysQuery } from 'data/api-keys/api-keys-query'
import { useLegacyAPIKeysStatusQuery } from 'data/api-keys/legacy-api-keys-status-query'
import { useJwtSecretUpdatingStatusQuery } from 'data/config/jwt-secret-updating-status-query'
import { useProjectSettingsV2Query } from 'data/config/project-settings-v2-query'
import { useAsyncCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { Loader } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from 'ui'
import { Admonition, GenericSkeletonLoader } from 'ui-patterns'
import { Input } from 'ui-patterns/DataInputs/Input'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import { Trans, useTranslation } from 'react-i18next'

import { ConnectionIcon } from '@/components/interfaces/Connect/ConnectionIcon'
import { ConnectButton } from '@/components/interfaces/ConnectButton/ConnectButton'

export const APIKeys = () => {
  const { t } = useTranslation()
  const { ref: projectRef } = useParams()
  const { can: canReadAPIKeys } = useAsyncCheckPermissions(PermissionAction.SECRETS_READ, '*')

  const {
    data: settings,
    error: projectSettingsError,
    isError: isProjectSettingsError,
    isPending: isProjectSettingsLoading,
  } = useProjectSettingsV2Query({ projectRef })

  const { data: legacyAPIKeysStatusData, isPending: isLoadingAPIKeysStatus } =
    useLegacyAPIKeysStatusQuery({ projectRef }, { enabled: canReadAPIKeys })

  const {
    data: apiKeys,
    error: errorAPIKeys,
    isError: isErrorAPIKeys,
    isPending: isLoadingAPIKeys,
  } = useAPIKeysQuery({ projectRef }, { enabled: canReadAPIKeys })
  const { anonKey, serviceKey, publishableKey, secretKey } = getKeys(apiKeys)

  const hasNewAPIKeys = !!publishableKey && !!secretKey
  const isLegacyKeysEnabled = legacyAPIKeysStatusData?.enabled ?? false
  const isApiKeysEmpty = !hasNewAPIKeys && !anonKey && !serviceKey

  const {
    data,
    error: jwtSecretUpdateError,
    isError: isJwtSecretUpdateStatusError,
    isPending: isJwtSecretUpdateStatusLoading,
  } = useJwtSecretUpdatingStatusQuery(
    { projectRef },
    { enabled: !isProjectSettingsLoading && isApiKeysEmpty }
  )

  const isLoading = isLoadingAPIKeys || isLoadingAPIKeysStatus || isProjectSettingsLoading
  const isError = isErrorAPIKeys || isProjectSettingsError || isJwtSecretUpdateStatusError

  // Only show JWT loading state if the query is actually enabled
  const showJwtLoading =
    isJwtSecretUpdateStatusLoading && !isProjectSettingsLoading && isApiKeysEmpty

  const jwtSecretUpdateStatus = data?.jwtSecretUpdateStatus

  const isNotUpdatingJwtSecret =
    jwtSecretUpdateStatus === undefined || jwtSecretUpdateStatus === JwtSecretUpdateStatus.Updated

  const protocol = settings?.app_config?.protocol ?? 'https'
  const endpoint = settings?.app_config?.endpoint
  const apiUrl = `${protocol}://${endpoint ?? '-'}`

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">{t('api_keys.project_api')}</CardTitle>
        <CardDescription>
          {t('api_keys.project_api_description')}
        </CardDescription>
      </CardHeader>

      {isLoading ? (
        <CardContent>
          <GenericSkeletonLoader />
        </CardContent>
      ) : isError ? (
        <AlertError
          className="rounded-none border-0"
          subject={
            isErrorAPIKeys
              ? t('api_keys.failed_retrieve_api_keys')
              : isProjectSettingsError
                ? t('api_keys.failed_retrieve_project_settings')
                : isJwtSecretUpdateStatusError
                  ? t('api_keys.failed_update_jwt_secret')
                  : ''
          }
          error={errorAPIKeys ?? projectSettingsError ?? jwtSecretUpdateError}
        />
      ) : showJwtLoading ? (
        <CardContent>
          <div className="flex items-center justify-center py-4 space-x-2">
            <Loader className="animate-spin" size={16} strokeWidth={1.5} />
            <p className="text-sm text-foreground-light">{t('api_keys.jwt_secret_updating')}</p>
          </div>
        </CardContent>
      ) : !isLegacyKeysEnabled && !hasNewAPIKeys ? (
        <Admonition
          type="default"
          className="border-0 rounded-none"
          title={t('api_keys.no_api_keys_title')}
          description={
            <Trans
              i18nKey="api_keys.no_api_keys_description"
              components={{
                link: <InlineLink href={`/project/${projectRef}/settings/api-keys`} />,
              }}
            />
          }
        />
      ) : (
        <>
          <CardContent>
            <FormItemLayout
              isReactForm={false}
              layout="horizontal"
              label={t('api_keys.project_url')}
              description={t('api_keys.project_url_description')}
            >
              <Input readOnly copy className="input-mono" value={apiUrl} />
            </FormItemLayout>
          </CardContent>

          <CardContent>
            <FormItemLayout
              isReactForm={false}
              layout="horizontal"
              label={
                hasNewAPIKeys ? (
                  t('api_keys.publishable_api_key')
                ) : (
                  <div className="space-y-2">
                    <p className="text-sm">{t('api_keys.api_key')}</p>
                    <div className="flex items-center space-x-1 -ml-1">
                      <code className="text-code-inline">{anonKey?.name}</code>
                      <code className="text-code-inline">{t('public')}</code>
                    </div>
                  </div>
                )
              }
              description={
                <Trans
                  i18nKey="api_keys.api_key_description"
                  values={{ keyType: hasNewAPIKeys ? t('api_keys.secret') : t('api_keys.service') }}
                  components={{
                    link: (
                      <InlineLink
                        href={`/project/${projectRef}/settings/api-keys${!hasNewAPIKeys ? '/legacy' : ''}`}
                      />
                    ),
                  }}
                />
              }
            >
              <Input
                readOnly
                className="input-mono"
                copy={canReadAPIKeys && isNotUpdatingJwtSecret}
                reveal={anonKey?.name !== 'anon' && canReadAPIKeys && isNotUpdatingJwtSecret}
                value={
                  !canReadAPIKeys
                    ? t('api_keys.need_permissions_view_api_keys')
                    : jwtSecretUpdateStatus === JwtSecretUpdateStatus.Failed
                        ? t('api_keys.jwt_secret_update_failed')
                      : jwtSecretUpdateStatus === JwtSecretUpdateStatus.Updating
                          ? t('api_keys.updating_jwt_secret')
                        : publishableKey?.api_key ?? anonKey?.api_key
                }
              />
            </FormItemLayout>
          </CardContent>

          <CardContent className="relative overflow-hidden">
            <div
              className="absolute inset-0 rounded-md -mt-[1px]"
              style={{
                backgroundImage: `
                  linear-gradient(to top, hsl(var(--background-surface-100)/1) 0%, hsl(var(--background-surface-100)/1) 30%, hsl(var(--background-surface-75)/0) 100%),
                  linear-gradient(to right, hsl(var(--border-default)/0.33) 1px, transparent 1px),
                  linear-gradient(to bottom, hsl(var(--border-default)/0.33) 1px, transparent 1px)
                `,
                backgroundSize: '100% 100%, 15px 15px, 15px 15px',
                backgroundPosition: '0 0, 0 0, 0 0',
              }}
            />
            <div className="relative mt-6 mb-3">
              <div className="flex gap-x-3.5 relative ml-0.5 mb-4 opacity-80">
                <ConnectionIcon icon="nextjs" size={26} />
                <ConnectionIcon icon="react" size={26} />
                <ConnectionIcon icon="svelte" size={22} />
                <ConnectionIcon icon="flutter" size={23} />
                <ConnectionIcon icon="prisma" size={22} />
              </div>
              <p className="mb-1">{t('api_keys.choose_framework')}</p>
              <p className="text-sm text-foreground-light mb-4 md:mr-20 text-balance">
                {t('api_keys.connect_description')}
              </p>
              <ConnectButton />
            </div>
          </CardContent>
        </>
      )}
    </Card>
  )
}
