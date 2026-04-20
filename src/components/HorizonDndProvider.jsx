/**
 * Wraps the horizon timeline with @dnd-kit for live sortable tasks + cross-day moves.
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
import { parseTaskColumnDroppableId } from '../utils/dndIds'
import { pointerWithinThenClosestCorners } from '../utils/dndCollision'
import { isDayScopedTask } from '../utils/taskBuckets'

function sortTaskIdsForDay(tasks, dayId) {
  return tasks
    .filter((t) => isDayScopedTask(t) && t.dayId === dayId)
    .sort((a, b) => {
      const oa = typeof a.order === 'number' ? a.order : 0
      const ob = typeof b.order === 'number' ? b.order : 0
      if (oa !== ob) return oa - ob
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    })
    .map((t) => t.id)
}

export function HorizonDndProvider({ children }) {
  const { tasks, reorderTasksInDay, moveTaskToDay } = useTasks()
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

      if (!isDayScopedTask(activeTask)) return
      const activeDayId = activeTask.dayId
      const overDayIdFromColumn = parseTaskColumnDroppableId(overRaw)
      const overIsColumn = overDayIdFromColumn != null

      let overDayId
      if (overIsColumn) {
        overDayId = overDayIdFromColumn
      } else {
        const overTask = tasks.find((t) => t.id === overRaw)
        if (!overTask || !isDayScopedTask(overTask)) return
        overDayId = overTask.dayId
      }

      if (activeDayId === overDayId) {
        const ids = sortTaskIdsForDay(tasks, activeDayId)
        const oldIndex = ids.indexOf(activeTaskId)
        if (oldIndex === -1) return

        let newIndex
        if (overIsColumn) {
          newIndex = ids.length - 1
        } else {
          newIndex = ids.indexOf(overRaw)
        }

        if (oldIndex === newIndex) return
        reorderTasksInDay(activeDayId, arrayMove(ids, oldIndex, newIndex))
      } else {
        const targetIds = sortTaskIdsForDay(tasks, overDayId)
        let insertIndex
        if (overIsColumn) {
          insertIndex = targetIds.length
        } else {
          insertIndex = targetIds.indexOf(overRaw)
          if (insertIndex === -1) return
        }
        moveTaskToDay(activeTaskId, overDayId, insertIndex)
      }
    },
    [tasks, reorderTasksInDay, moveTaskToDay]
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
