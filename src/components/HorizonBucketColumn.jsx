/**
 * Generic horizon column for week / month / year buckets (tasks + add + insights).
 */

import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { useTasks } from '../context/TaskContext'
import { useDayInsights } from '../context/DayInsightsContext'
import Task from './Task'
import AddTaskInput from './AddTaskInput'
import { horizonColumnDroppableId } from '../utils/dndIds'
import { tasksInBucket } from '../utils/taskBuckets'

export default function HorizonBucketColumn({
  bucketKind,
  bucketId,
  title,
  subtitle,
  isHighlight,
  ...rest
}) {
  const { openHorizonInsights, responses, loadingByKey, insightStorageKey } = useDayInsights()
  const key = insightStorageKey(bucketKind, bucketId)
  const insightLoading = !!loadingByKey[key]
  const hasInsight = Boolean((responses[key] || '').trim())
  const labelForModal = subtitle ? `${title} · ${subtitle}` : title

  return (
    <div
      className={`flex flex-col h-full min-h-0 w-[280px] min-w-[280px] flex-shrink-0 border-r border-newton-border overflow-hidden ${isHighlight ? 'bg-newton-surface/30' : ''}`}
      data-bucket-id={bucketId}
      {...rest}
    >
      <div className="flex items-start justify-between gap-2 px-4 py-4 border-b border-newton-border">
        <div className="min-w-0">
          <h2
            className={`text-lg font-semibold ${isHighlight ? 'text-newton-today' : 'text-newton-text'}`}
          >
            {title}
          </h2>
          {subtitle && (
            <p
              className={`text-sm mt-0.5 ${isHighlight ? 'text-newton-today' : 'text-newton-muted'}`}
            >
              {subtitle}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={() => openHorizonInsights(bucketKind, bucketId, labelForModal)}
          aria-busy={insightLoading}
          className={`flex-shrink-0 p-1.5 rounded-lg transition-colors hover:bg-newton-charcoal ${
            insightLoading
              ? 'text-newton-today'
              : hasInsight
                ? isHighlight
                  ? 'text-newton-today'
                  : 'text-amber-400/90 hover:text-amber-300'
                : 'text-newton-muted hover:text-newton-text'
          }`}
          aria-label={`Insights for ${labelForModal}`}
          title={insightLoading ? 'Generating insights…' : hasInsight ? 'View insights' : 'Insights'}
        >
          {insightLoading ? (
            <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden>
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path
                className="opacity-80"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          ) : hasInsight ? (
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
              <path d="M12 .75a8.25 8.25 0 0 0-4.135 15.39c.686.398 1.115 1.008 1.134 1.623a.75.75 0 0 0 .577.706c.352.083.71.148 1.074.195.323.041.6-.218.6-.544v-4.661a6.714 6.714 0 0 1-.937-.171.75.75 0 1 1 .374-1.453 5.261 5.261 0 0 0 2.626 0 .75.75 0 1 1 .374 1.452 6.712 6.712 0 0 1-.937.172v4.66c0 .327.277.586.6.545.364-.047.722-.112 1.074-.195a.75.75 0 0 0 .577-.706c.02-.615.448-1.225 1.134-1.623A8.25 8.25 0 0 0 12 .75Z" />
              <path
                fillRule="evenodd"
                d="M9.013 19.9a.75.75 0 0 1 .877-.597 11.319 11.319 0 0 0 4.22 0 .75.75 0 1 1 .28 1.473 12.819 12.819 0 0 1-4.78 0 .75.75 0 0 1-.597-.876ZM9.754 22.344a.75.75 0 0 1 .824-.668 13.682 13.682 0 0 0 2.844 0 .75.75 0 1 1 .156 1.492 15.156 15.156 0 0 1-3.156 0 .75.75 0 0 1-.668-.824Z"
                clipRule="evenodd"
              />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
              />
            </svg>
          )}
        </button>
      </div>

      <div className="flex-1 min-h-0 h-full px-4 py-3 overflow-y-auto flex flex-col">
        <BucketTaskList bucketKind={bucketKind} bucketId={bucketId} />
      </div>
    </div>
  )
}

function BucketTaskList({ bucketKind, bucketId }) {
  const { tasks } = useTasks()
  const bucketTasks = tasksInBucket(tasks, bucketKind, bucketId).sort((a, b) => {
    const oa = typeof a.order === 'number' ? a.order : 0
    const ob = typeof b.order === 'number' ? b.order : 0
    if (oa !== ob) return oa - ob
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  })

  const itemIds = bucketTasks.map((t) => t.id)
  const isEmpty = bucketTasks.length === 0

  const { setNodeRef } = useDroppable({
    id: horizonColumnDroppableId(bucketKind, bucketId),
    data: { type: 'column', bucketKind, bucketId },
  })

  return (
    <div ref={setNodeRef} className="flex-1 min-h-0 h-full w-full flex flex-col">
      {isEmpty ? (
        <>
          <AddTaskInput bucketKind={bucketKind} bucketId={bucketId} formClassName="mb-2 flex-shrink-0" />
          <div className="flex-1 min-h-0 min-w-0 w-full basis-0 grow" aria-hidden />
        </>
      ) : (
        <>
          <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
            {bucketTasks.map((task) => (
              <Task key={task.id} task={task} />
            ))}
          </SortableContext>
          <AddTaskInput bucketKind={bucketKind} bucketId={bucketId} />
        </>
      )}
    </div>
  )
}
