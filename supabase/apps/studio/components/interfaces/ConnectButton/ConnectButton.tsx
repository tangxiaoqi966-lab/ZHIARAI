import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { Plug } from 'lucide-react'
import { parseAsBoolean, useQueryState } from 'nuqs'
import { ComponentProps } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from 'ui'

import { PROJECT_STATUS } from '@/lib/constants'

interface ConnectButtonProps {
  buttonType?: ComponentProps<typeof Button>['type']
}

export const ConnectButton = ({ buttonType = 'default' }: ConnectButtonProps) => {
  const { t } = useTranslation()
  const { data: selectedProject } = useSelectedProjectQuery()
  const isActiveHealthy = selectedProject?.status === PROJECT_STATUS.ACTIVE_HEALTHY

  const [, setShowConnect] = useQueryState('showConnect', parseAsBoolean.withDefault(false))

  return (
    <ButtonTooltip
      type={buttonType}
      disabled={!isActiveHealthy}
      className="rounded-full"
      icon={<Plug className="rotate-90" />}
      onClick={() => setShowConnect(true)}
      tooltip={{
        content: {
          side: 'bottom',
          text: !isActiveHealthy
            ? t('connect.project_inactive')
            : undefined,
        },
      }}
    >
      <span>{t('connect.button')}</span>
    </ButtonTooltip>
  )
}
