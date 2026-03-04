import type { PostgresPolicy } from '@supabase/postgres-meta'
import { ChevronRight, PanelRightClose, PanelRightOpen, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import {
  BreadcrumbItem_Shadcn_,
  Breadcrumb_Shadcn_,
  Button,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from 'ui'

interface PolicyEditorPanelHeaderProps {
  policy?: PostgresPolicy
  showTools: boolean
  onToggleTools: () => void
  onSelectCancel: () => void
}

export const PolicyEditorPanelHeader = ({
  policy,
  showTools,
  onToggleTools,
  onSelectCancel,
}: PolicyEditorPanelHeaderProps) => {
  const { t } = useTranslation()
  return (
    <div className="flex items-center justify-between border-b h-[46px] px-5">
      <Breadcrumb_Shadcn_ className="text-sm">
        <BreadcrumbItem_Shadcn_ className="text-foreground-light">
          {policy ? t('auth_policies.update_policy', { name: policy.name }) : t('auth_policies.create_new_policy')}
        </BreadcrumbItem_Shadcn_>
      </Breadcrumb_Shadcn_>
      <div className="flex items-center gap-x-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="text"
              className="px-1"
              icon={showTools ? <PanelRightClose /> : <PanelRightOpen />}
              onClick={() => onToggleTools()}
            />
          </TooltipTrigger>
          <TooltipContent side="bottom">
            {showTools ? t('auth_policies.hide_tools') : t('auth_policies.show_tools')}
          </TooltipContent>
        </Tooltip>
        <Button type="text" className="px-1" icon={<X />} onClick={onSelectCancel} />
      </div>
    </div>
  )
}
