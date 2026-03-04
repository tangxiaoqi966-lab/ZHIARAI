import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { LOCAL_STORAGE_KEYS } from 'common'
import { CANCELLATION_REASONS } from 'components/interfaces/Billing/Billing.constants'
import { TextConfirmModal } from 'components/ui/TextConfirmModalWrapper'
import { useSendDowngradeFeedbackMutation } from 'data/feedback/exit-survey-send'
import { useProjectDeleteMutation } from 'data/projects/project-delete-mutation'
import type { OrgProject } from 'data/projects/org-projects-infinite-query'
import { useOrgSubscriptionQuery } from 'data/subscriptions/org-subscription-query'
import { useLocalStorageQuery } from 'hooks/misc/useLocalStorage'
import { useSelectedOrganizationQuery } from 'hooks/misc/useSelectedOrganization'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import type { Organization } from 'types'
import { Input } from 'ui'

export const DeleteProjectModal = ({
  visible,
  onClose,
  project: projectProp,
  organization: organizationProp,
}: {
  visible: boolean
  onClose: () => void
  project?: OrgProject
  organization?: Organization
}) => {
  const { t } = useTranslation()
  const router = useRouter()
  const { data: projectFromQuery } = useSelectedProjectQuery()
  const { data: organizationFromQuery } = useSelectedOrganizationQuery()

  // Use props if provided, otherwise fall back to hooks
  const project = projectProp || projectFromQuery
  const organization = organizationProp || organizationFromQuery

  const [lastVisitedOrganization] = useLocalStorageQuery(
    LOCAL_STORAGE_KEYS.LAST_VISITED_ORGANIZATION,
    ''
  )

  const projectRef = project?.ref
  const { data: subscription } = useOrgSubscriptionQuery({ orgSlug: organization?.slug })
  const projectPlan = subscription?.plan?.id ?? 'free'
  const isFree = projectPlan === 'free'

  const [message, setMessage] = useState<string>('')
  const [selectedReason, setSelectedReason] = useState<string[]>([])

  // Single select for cancellation reason
  const onSelectCancellationReason = (reason: string) => {
    setSelectedReason([reason])
  }

  // Helper to get label for selected reason
  const getReasonLabel = (reason: string | undefined) => {
    const found = CANCELLATION_REASONS.find((r) => r.value === reason)
    return found?.label || t('settings.general.what_improve')
  }

  const textareaLabel = getReasonLabel(selectedReason[0])

  const [shuffledReasons] = useState(() => [
    ...CANCELLATION_REASONS.sort(() => Math.random() - 0.5),
    { value: t('settings.general.none_of_above') },
  ])

  const { mutate: deleteProject, isPending: isDeleting } = useProjectDeleteMutation({
    onSuccess: async () => {
      if (!isFree) {
        try {
          await sendExitSurvey({
            orgSlug: organization?.slug,
            projectRef,
            message,
            reasons: selectedReason.reduce((a, b) => `${a}- ${b}\n`, ''),
            exitAction: 'delete',
          })
        } catch (error) {
          // [Joshen] In this case we don't raise any errors if the exit survey fails to send since it shouldn't block the user
        }
      }

      toast.success(t('settings.general.successfully_deleted_project', { name: project?.name }))

      if (lastVisitedOrganization) router.push(`/org/${lastVisitedOrganization}`)
      else router.push('/organizations')
    },
  })
  const { mutateAsync: sendExitSurvey, isPending: isSending } = useSendDowngradeFeedbackMutation()
  const isSubmitting = isDeleting || isSending

  async function handleDeleteProject() {
    if (project === undefined) return
    if (!isFree && selectedReason.length === 0) {
      return toast.error(t('settings.general.select_delete_reason'))
    }

    deleteProject({ projectRef: project.ref, organizationSlug: organization?.slug })
  }

  useEffect(() => {
    if (visible) {
      setSelectedReason([])
      setMessage('')
    }
  }, [visible])

  return (
    <TextConfirmModal
      visible={visible}
      loading={isSubmitting}
      size={isFree ? 'small' : 'xlarge'}
      title={t('settings.general.confirm_deletion_of', { name: project?.name })}
      variant="destructive"
      alert={{
        title: isFree
          ? t('settings.general.action_cannot_be_undone')
          : t('settings.general.permanently_delete_project', { name: project?.name }),
        description: !isFree ? t('settings.general.all_data_lost') : '',
      }}
      text={
        isFree
          ? t('settings.general.permanently_delete_project_desc', { name: project?.name })
          : undefined
      }
      confirmPlaceholder={t('settings.general.type_project_name')}
      confirmString={project?.name || ''}
      confirmLabel={t('settings.general.i_understand')}
      onConfirm={handleDeleteProject}
      onCancel={() => {
        if (!isSubmitting) onClose()
      }}
    >
      {/* 
          [Joshen] This is basically ExitSurvey.tsx, ideally we have one shared component but the one
          in ExitSurvey has a Form wrapped around it already. Will probably need some effort to refactor
          but leaving that for the future.
        */}
      {!isFree && (
        <>
          <div className="space-y-1">
            <h4 className="text-base">
              {t('settings.general.help_us_improve')}
            </h4>
          </div>
          <div className="space-y-4 pt-4">
            <div className="flex flex-wrap gap-2" data-toggle="buttons">
              {shuffledReasons.map((option) => {
                const active = selectedReason[0] === option.value
                return (
                  <label
                    key={option.value}
                    className={[
                      'flex cursor-pointer items-center space-x-2 rounded-md py-1',
                      'pl-2 pr-3 text-center text-sm shadow-sm transition-all duration-100',
                      `${
                        active
                          ? ` bg-foreground text-background opacity-100 hover:bg-opacity-75`
                          : ` bg-border-strong text-foreground opacity-50 hover:opacity-75`
                      }`,
                    ].join(' ')}
                  >
                    <input
                      type="radio"
                      name="options"
                      value={option.value}
                      className="hidden"
                      checked={active}
                      onChange={() => onSelectCancellationReason(option.value)}
                    />
                    <div>{option.value}</div>
                  </label>
                )
              })}
            </div>
            <div className="text-area-text-sm flex flex-col gap-y-2">
              <label className="text-sm whitespace-pre-line break-words">{textareaLabel}</label>
              <Input.TextArea
                name="message"
                rows={3}
                value={message}
                onChange={(event: any) => setMessage(event.target.value)}
              />
            </div>
          </div>
        </>
      )}
    </TextConfirmModal>
  )
}
