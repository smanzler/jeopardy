import type { CellPosition } from "@/lib/db"

/**
 * Gives the position `step` places away, in the order that reads down each
 * category and then on to the next. Gives `undefined` past either end.
 */
export const getStepPosition = ({
  categoryCount,
  position,
  rowCount,
  step,
}: {
  categoryCount: number
  position: CellPosition
  rowCount: number
  step: -1 | 1
}): CellPosition | undefined => {
  const index = position.categoryIndex * rowCount + position.rowIndex + step
  if (index < 0 || index >= categoryCount * rowCount) return
  return {
    categoryIndex: Math.floor(index / rowCount),
    rowIndex: index % rowCount,
  }
}
