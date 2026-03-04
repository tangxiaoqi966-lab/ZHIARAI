import { Loader2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'

export type DNSTableHeaderProps = {
  display: string
}

export const DNSTableHeaders = ({ display }: DNSTableHeaderProps) => {
  const { t } = useTranslation()
  // Display the DNS table headers if we have something to show
  if (display !== '') {
    return (
      <div className="flex gap-4">
        <div className="w-[50px]">
          <p className="text-foreground-light text-sm">{t('settings.general.custom_domains_dns_type')}</p>
        </div>
        <div className="text-sm grid gap-2 md:grid md:grid-cols-12 md:gap-x-4 input-mono flex-1">
          <div className="flex flex-row space-x-2 justify-between col-span-12">
            <label className="block text-foreground-light text-sm break-all">
              {t('settings.general.custom_domains_dns_name')}
            </label>
          </div>
        </div>
        <div className="text-sm grid gap-2 md:grid md:grid-cols-12 md:gap-x-4 input-mono flex-1">
          <div className="flex flex-row space-x-2 justify-between col-span-12">
            <label className="block text-foreground-light text-sm break-all">
              {t('settings.general.custom_domains_dns_content')}
            </label>
          </div>
        </div>
      </div>
    )
  }

  // If we have not detected SSL TXT records ask the user to (re)validate
  return (
    <div className="flex items-center gap-2">
      <Loader2 size={14} className="animate-spin" />
      <p className="text-sm text-foreground-light">
        {t('settings.general.custom_domains_validating')}
      </p>
    </div>
  )
}
