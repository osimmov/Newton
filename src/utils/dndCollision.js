import { pointerWithin, closestCorners } from '@dnd-kit/core'

/** Prefer pointer hit-test so empty column bodies (large flex areas) register drops; fall back to corners. */
export function pointerWithinThenClosestCorners(args) {
  const within = pointerWithin(args)
  if (within.length > 0) return within
  return closestCorners(args)
}
