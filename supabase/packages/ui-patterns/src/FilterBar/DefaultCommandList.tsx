'use client'

import { useEffect, useMemo, useRef } from 'react'

import { CommandListItem } from './CommandListItem'
import { EmptyState, GroupHeader, GroupSeparator } from './DefaultCommandList.helpers'
import { MenuItem, MenuItemGroup, OPERATOR_GROUP_LABELS, FilterOperatorGroup } from './types'

const TRANSLATION_KEYS: Record<FilterOperatorGroup, string> = {
  comparison: 'filter_bar.operator_group.comparison',
  pattern: 'filter_bar.operator_group.pattern_matching',
  setNull: 'filter_bar.operator_group.set_null_checks',
  uncategorized: 'filter_bar.operator_group.other',
}
import { groupMenuItemsByOperator } from './utils'

export type DefaultCommandListProps = {
  items: MenuItem[]
  highlightedIndex: number
  onSelect: (item: MenuItem) => void
  includeIcon?: boolean
  grouped?: boolean
  t?: (key: string) => string
}

export function DefaultCommandList({
  items,
  highlightedIndex,
  onSelect,
  includeIcon = true,
  grouped = false,
  t,
}: DefaultCommandListProps) {
  const listRef = useRef<HTMLDivElement>(null)
  const itemRefs = useRef<Map<number, HTMLDivElement>>(new Map())

  const groups: MenuItemGroup[] = useMemo(() => {
    if (grouped) {
      return groupMenuItemsByOperator(items)
    }
    // Non-grouped items are treated as a single uncategorized group
    return [
      {
        group: 'uncategorized',
        items: items.map((item, index) => ({ item, index })),
      },
    ]
  }, [grouped, items])

  const showGroupHeaders = groups.length > 1

  useEffect(() => {
    const itemEl = itemRefs.current.get(highlightedIndex)
    if (itemEl && listRef.current) {
      itemEl.scrollIntoView({ block: 'center', behavior: 'smooth' })
    }
  }, [highlightedIndex])

  const setItemRef = (index: number) => (el: HTMLDivElement | null) => {
    if (el) {
      itemRefs.current.set(index, el)
    } else {
      itemRefs.current.delete(index)
    }
  }

  if (items.length === 0) {
    return (
      <div ref={listRef} className="max-h-[300px] overflow-y-auto py-1">
        <EmptyState />
      </div>
    )
  }

  return (
    <div ref={listRef} className="max-h-[300px] overflow-y-auto py-1">
      {groups.map((groupData, groupIndex) => (
        <div key={groupData.group}>
          {groupIndex > 0 && showGroupHeaders && <GroupSeparator />}
          {showGroupHeaders && groupData.group && (
            <GroupHeader label={t ? t(TRANSLATION_KEYS[groupData.group]) : OPERATOR_GROUP_LABELS[groupData.group]} />
          )}
          {groupData.items.map(({ item, index }) => (
            <CommandListItem
              key={`${item.value}-${item.label}`}
              item={item}
              isHighlighted={index === highlightedIndex}
              includeIcon={includeIcon}
              onSelect={onSelect}
              setRef={setItemRef(index)}
              t={t}
            />
          ))}
        </div>
      ))}
    </div>
  )
}
