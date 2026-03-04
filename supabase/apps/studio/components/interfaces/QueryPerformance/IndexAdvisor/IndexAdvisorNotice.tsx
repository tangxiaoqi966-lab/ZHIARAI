import { useTranslation } from 'react-i18next'
import { useIndexAdvisorStatus } from 'components/interfaces/QueryPerformance/hooks/useIsIndexAdvisorStatus'
import { BASE_PATH } from 'lib/constants'
import { Admonition } from 'ui-patterns'
import { EnableIndexAdvisorButton } from './EnableIndexAdvisorButton'
import { useLocalStorageQuery } from 'hooks/misc/useLocalStorage'
import { LOCAL_STORAGE_KEYS } from 'common'
import { useParams } from 'common/hooks'
import { Button } from 'ui'

export const IndexAdvisorNotice = () => {
  const { t } = useTranslation()
  const { ref } = useParams()
  const { isIndexAdvisorAvailable, isIndexAdvisorEnabled } = useIndexAdvisorStatus()
  const [isDismissed, setIsDismissed] = useLocalStorageQuery(
    LOCAL_STORAGE_KEYS.INDEX_ADVISOR_NOTICE_DISMISSED(ref ?? ''),
    false
  )

  if (!isIndexAdvisorAvailable || isIndexAdvisorEnabled || isDismissed) return null

  return (
    <div className="px-6">
      <Admonition showIcon={false} type="tip" className="relative overflow-hidden mb-4">
        <div className="absolute -inset-16 z-0 opacity-50">
          <img
            src={`${BASE_PATH}/img/reports/bg-grafana-dark.svg`}
            alt={t('advisor.title')}
            className="w-full h-full object-cover object-right hidden dark:block"
          />
          <img
            src={`${BASE_PATH}/img/reports/bg-grafana-light.svg`}
            alt={t('advisor.title')}
            className="w-full h-full object-cover object-right dark:hidden"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-background-alternative to-transparent" />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center gap-y-2 md:gap-x-8 justify-between px-2 py-1">
          <div className="flex flex-col gap-y-0.5">
            <div className="flex flex-col gap-y-2 items-start">
              <p className="text-sm font-medium">{t('advisor.enable_button')}</p>
            </div>
            <p className="text-sm text-foreground-lighter text-balance">
              {t('advisor.enable_description')}
            </p>
          </div>
          <div className="flex items-center gap-x-2">
            <Button
              type="default"
              size="tiny"
              onClick={() => setIsDismissed(true)}
              aria-label={t('advisor.dismiss_notification')}
            >
              {t('advisor.dismiss')}
            </Button>
            <EnableIndexAdvisorButton />
          </div>
        </div>
      </Admonition>
    </div>
  )
}
