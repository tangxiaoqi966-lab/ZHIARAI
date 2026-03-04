import { HTMLAttributes } from 'react'
import { useTranslation, Trans } from 'react-i18next'

import { cn } from 'ui'
import { calculateImprovement } from './index-advisor.utils'

interface IndexImprovementTextProps extends HTMLAttributes<HTMLParagraphElement> {
  indexStatements: string[]
  totalCostBefore: number
  totalCostAfter: number
}

export const IndexImprovementText = ({
  indexStatements,
  totalCostBefore,
  totalCostAfter,
  className,
  ...props
}: IndexImprovementTextProps) => {
  const { t } = useTranslation()
  const improvement = calculateImprovement(totalCostBefore, totalCostAfter)

  return (
    <p className={cn('text-sm text-foreground-light mb-3', className)} {...props}>
      <Trans
        i18nKey="advisor.recommendation_alert_description"
        values={{
          improvement: improvement.toFixed(2),
          indexes: indexStatements.length > 1 ? 'indexes' : 'index',
        }}
        components={{ 1: <span className="text-brand" /> }}
      />
    </p>
  )
}
