/**
 * DnD for week / month / year horizon columns (same behavior as day, different bucket kind).
 */

import { useState, useRef, useCallback } from 'react'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable'
import { useTasks } from '../context/TaskContext'
import { HorizonDndUiContext } from '../context/HorizonDndUiContext'
import { parseHorizonColumnDroppableId, horizonColumnDroppableId } from '../utils/dndIds'
import { pointerWithinThenClosestCorners } from '../utils/dndCollision'
import { tasksInBucket } from '../utils/taskBuckets'

function sortTaskIdsForBucket(tasks, kind, id) {
  return tasksInBucket(tasks, kind, id)
    .sort((a, b) => {
      const oa = typeof a.order === 'number' ? a.order : 0
      const ob = typeof b.order === 'number' ? b.order : 0
      if (oa !== ob) return oa - ob
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    })
    .map((t) => t.id)
}

function bucketOfTask(task) {
  if (task.weekId) return { kind: 'week', id: task.weekId }
  if (task.monthId) return { kind: 'month', id: task.monthId }
  if (task.yearId) return { kind: 'year', id: task.yearId }
  return null
}

export function HorizonBucketDndProvider({ bucketKind, children }) {
  const { tasks, reorderTasksInBucket, moveTaskToBucket } = useTasks()
  const [activeId, setActiveId] = useState(null)
  const lastDragEndAtRef = useRef(0)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const handleDragStart = useCallback((e) => {
    setActiveId(String(e.active.id))
  }, [])

  const handleDragCancel = useCallback(() => {
    lastDragEndAtRef.current = Date.now()
    setActiveId(null)
  }, [])

  const handleDragEnd = useCallback(
    (event) => {
      lastDragEndAtRef.current = Date.now()
      setActiveId(null)
      const { active, over } = event
      if (!over) return

      const activeTaskId = String(active.id)
      const overRaw = String(over.id)

      if (activeTaskId === overRaw) return

      const activeTask = tasks.find((t) => t.id === activeTaskId)
      if (!activeTask) return

      const activeBucket = bucketOfTask(activeTask)
      if (!activeBucket || activeBucket.kind !== bucketKind) return

      const overCol = parseHorizonColumnDroppableId(overRaw)
      const overIsColumn = overCol != null && overCol.kind === bucketKind
      let overBucketId
      if (overIsColumn) {
        overBucketId = overCol.id
      } else {
        const overTask = tasks.find((t) => t.id === overRaw)
        if (!overTask) return
        const ob = bucketOfTask(overTask)
        if (!ob || ob.kind !== bucketKind) return
        overBucketId = ob.id
      }

      if (activeBucket.id === overBucketId) {
        const ids = sortTaskIdsForBucket(tasks, bucketKind, activeBucket.id)
        const oldIndex = ids.indexOf(activeTaskId)
        if (oldIndex === -1) return
        let newIndex
        if (overIsColumn && overRaw === horizonColumnDroppableId(bucketKind, overBucketId)) {
          newIndex = ids.length - 1
        } else {
          newIndex = ids.indexOf(overRaw)
        }
        if (oldIndex === newIndex) return
        reorderTasksInBucket(bucketKind, activeBucket.id, arrayMove(ids, oldIndex, newIndex))
      } else {
        const targetIds = sortTaskIdsForBucket(tasks, bucketKind, overBucketId)
        let insertIndex
        if (overIsColumn && overRaw === horizonColumnDroppableId(bucketKind, overBucketId)) {
          insertIndex = targetIds.length
        } else {
          insertIndex = targetIds.indexOf(overRaw)
          if (insertIndex === -1) return
        }
        moveTaskToBucket(activeTaskId, bucketKind, overBucketId, insertIndex)
      }
    },
    [tasks, reorderTasksInBucket, moveTaskToBucket, bucketKind]
  )

  const activeTask = activeId ? tasks.find((t) => t.id === activeId) : null

  return (
    <HorizonDndUiContext.Provider value={{ lastDragEndAtRef }}>
      <DndContext
        sensors={sensors}
        collisionDetection={pointerWithinThenClosestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        {children}
        <DragOverlay dropAnimation={null}>
          {activeTask ? (
            <div className="flex items-center gap-2 py-2 px-3 rounded-lg bg-newton-charcoal border border-newton-border shadow-xl cursor-grabbing min-w-[200px] max-w-[260px] pointer-events-none">
              <span className="text-newton-text text-sm font-medium truncate">{activeTask.title}</span>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </HorizonDndUiContext.Provider>
  )
}
