import type { Board, CellPosition, DailyDoubles } from "@/lib/db"
import { buildQuestionKey, isSamePosition } from "@/lib/board"
import type { QuestionMove } from "@/lib/board"
import { toMovedIndex } from "@/lib/move"

export type DailyDoublesType = DailyDoubles["type"]

export const MAX_RANDOM_DAILY_DOUBLES = 3

type DailyDoublesOf<TType extends DailyDoublesType> = Extract<
  DailyDoubles,
  { type: TType }
>

/** What the editor and the game can do with the daily doubles of one board. */
type DailyDoubleOps = {
  hasPosition: (position: CellPosition) => boolean
  /** True when the editor picks the positions one by one. */
  isChoosable: boolean
  /** True when the board has daily doubles at all. */
  isOn: boolean
  /** Keeps each daily double on its question when `moveQuestion` moves it. */
  moveQuestion: (move: QuestionMove) => DailyDoubles
  pickPositions: (args: {
    board: Board
    random: () => number
  }) => Array<CellPosition>
  removeCategory: (categoryIndex: number) => DailyDoubles
  removeRow: (rowIndex: number) => DailyDoubles
  /** One line for the editor that says how the board gets its daily doubles. */
  summary: string
  togglePosition: (position: CellPosition) => DailyDoubles
}

type DailyDoubleDispatch = {
  [TType in DailyDoublesType]: {
    buildDefault: (boardIndex: number) => DailyDoublesOf<TType>
    buildOps: (dailyDoubles: DailyDoublesOf<TType>) => DailyDoubleOps
  }
}

/** Drops the positions at `index` and moves the later ones down by one. */
const removeIndex = ({
  index,
  key,
  positions,
}: {
  index: number
  key: keyof CellPosition
  positions: Array<CellPosition>
}): Array<CellPosition> =>
  positions
    .filter((position) => position[key] !== index)
    .map((position) =>
      position[key] > index
        ? { ...position, [key]: position[key] - 1 }
        : position
    )

const listCells = (board: Board): Array<CellPosition> =>
  board.categories.flatMap((category, categoryIndex) =>
    category.questions.map((_, rowIndex) => ({ categoryIndex, rowIndex }))
  )

const pickRandom = ({
  cells,
  count,
  random,
}: {
  cells: Array<CellPosition>
  count: number
  random: () => number
}): Array<CellPosition> => {
  if (count <= 0 || cells.length === 0) return []
  const index = Math.floor(random() * cells.length)
  return [
    cells[index],
    ...pickRandom({
      cells: cells.filter((_, other) => other !== index),
      count: count - 1,
      random,
    }),
  ]
}

const buildChosenOps = (
  dailyDoubles: DailyDoublesOf<"chosen">
): DailyDoubleOps => {
  const { positions } = dailyDoubles
  const hasPosition = (position: CellPosition) =>
    positions.some((chosen) => isSamePosition(chosen, position))
  return {
    hasPosition,
    isChoosable: true,
    isOn: true,
    moveQuestion: ({ categoryIndex, from, to }) => ({
      ...dailyDoubles,
      positions: positions.map((position) =>
        position.categoryIndex === categoryIndex
          ? {
              ...position,
              rowIndex: toMovedIndex({ from, index: position.rowIndex, to }),
            }
          : position
      ),
    }),
    pickPositions: () => positions,
    removeCategory: (categoryIndex) => ({
      ...dailyDoubles,
      positions: removeIndex({
        index: categoryIndex,
        key: "categoryIndex",
        positions,
      }),
    }),
    removeRow: (rowIndex) => ({
      ...dailyDoubles,
      positions: removeIndex({ index: rowIndex, key: "rowIndex", positions }),
    }),
    summary:
      positions.length === 0
        ? "None yet. Turn them on in each question."
        : `${positions.length} chosen in the questions`,
    togglePosition: (position) => ({
      ...dailyDoubles,
      positions: hasPosition(position)
        ? positions.filter((chosen) => !isSamePosition(chosen, position))
        : [...positions, position],
    }),
  }
}

const buildRandomOps = (
  dailyDoubles: DailyDoublesOf<"random">
): DailyDoubleOps => ({
  hasPosition: () => false,
  isChoosable: false,
  isOn: dailyDoubles.count > 0,
  moveQuestion: () => dailyDoubles,
  pickPositions: ({ board, random }) =>
    pickRandom({ cells: listCells(board), count: dailyDoubles.count, random }),
  removeCategory: () => dailyDoubles,
  removeRow: () => dailyDoubles,
  summary:
    dailyDoubles.count === 0
      ? "None"
      : `${dailyDoubles.count} at random when the game starts`,
  togglePosition: () => dailyDoubles,
})

const buildNoneOps = (
  dailyDoubles: DailyDoublesOf<"none">
): DailyDoubleOps => ({
  hasPosition: () => false,
  isChoosable: false,
  isOn: false,
  moveQuestion: () => dailyDoubles,
  pickPositions: () => [],
  removeCategory: () => dailyDoubles,
  removeRow: () => dailyDoubles,
  summary: "None",
  togglePosition: () => dailyDoubles,
})

const dailyDoubleDispatch: DailyDoubleDispatch = {
  chosen: {
    buildDefault: () => ({ positions: [], type: "chosen" }),
    buildOps: buildChosenOps,
  },
  none: {
    buildDefault: () => ({ type: "none" }),
    buildOps: buildNoneOps,
  },
  random: {
    // The show hides one daily double on the first board and two on the next.
    buildDefault: (boardIndex) => ({
      count: Math.min(boardIndex + 1, MAX_RANDOM_DAILY_DOUBLES),
      type: "random",
    }),
    buildOps: buildRandomOps,
  },
}

const buildOpsOf = <TType extends DailyDoublesType>(
  type: TType,
  dailyDoubles: DailyDoublesOf<TType>
): DailyDoubleOps => dailyDoubleDispatch[type].buildOps(dailyDoubles)

export const getDailyDoubleOps = (dailyDoubles: DailyDoubles): DailyDoubleOps =>
  buildOpsOf(dailyDoubles.type, dailyDoubles)

/** The settings that a board gets when the editor switches it to `type`. */
export const buildDailyDoubles = ({
  boardIndex,
  type,
}: {
  boardIndex: number
  type: DailyDoublesType
}): DailyDoubles => dailyDoubleDispatch[type].buildDefault(boardIndex)

/** Picks the daily doubles of every board, as keys from `buildQuestionKey`. */
export const buildDailyDoubleKeys = ({
  boards,
  random,
}: {
  boards: Array<Board>
  random: () => number
}): Array<string> =>
  boards.flatMap((board, boardIndex) =>
    getDailyDoubleOps(board.dailyDoubles)
      .pickPositions({ board, random })
      .map((position) => buildQuestionKey({ ...position, boardIndex }))
  )
