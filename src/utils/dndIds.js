/** Droppable ids: `kind:id` — kind is day | week | month | year */

export function horizonColumnDroppableId(kind, id) {
  return `${kind}:${id}`
}

/** @returns {{ kind: string, id: string } | null} */
export function parseHorizonColumnDroppableId(droppableId) {
  if (typeof droppableId !== 'string') return null
  const i = droppableId.indexOf(':')
  if (i <= 0) return null
  const kind = droppableId.slice(0, i)
  const id = droppableId.slice(i + 1)
  if (!id || !['day', 'week', 'month', 'year'].includes(kind)) return null
  return { kind, id }
}

/** @deprecated use horizonColumnDroppableId('day', dayId) */
export function taskColumnDroppableId(dayId) {
  return horizonColumnDroppableId('day', dayId)
}

export function parseTaskColumnDroppableId(id) {
  const p = parseHorizonColumnDroppableId(id)
  if (!p || p.kind !== 'day') return null
  return p.id
}
