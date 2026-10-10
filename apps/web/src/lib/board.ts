import { buildDailyDoubles, getDailyDoubleOps } from "@/lib/daily-doubles"
import type {
  Board,
  Category,
  CellPosition,
  GameDraft,
  Question,
  QuestionPosition,
} from "@/lib/db"
import { moveItem } from "@/lib/move"

export const DEFAULT_CATEGORY_COUNT = 5

export const DEFAULT_ROW_COUNT = 5

/** The first board goes up by 100 for each row, the second by 200, and so on. */
const ROW_VALUE_STEP = 100

const currencyFormat = new Intl.NumberFormat("en-US", {
  currency: "USD",
  maximumFractionDigits: 0,
  style: "currency",
})

export const formatValue = (value: number): string =>
  currencyFormat.format(value)

export const buildRowValues = ({
  boardIndex,
  rowCount,
}: {
  boardIndex: number
  rowCount: number
}): Array<number> =>
  Array.from(
    { length: rowCount },
    (_, rowIndex) => (rowIndex + 1) * (boardIndex + 1) * ROW_VALUE_STEP
  )

const buildEmptyQuestion = (): Question => ({ answer: "", question: "" })

const buildEmptyCategory = (rowCount: number): Category => ({
  name: "",
  questions: Array.from({ length: rowCount }, buildEmptyQuestion),
})

export const buildEmptyBoard = (boardIndex: number): Board => ({
  categories: Array.from({ length: DEFAULT_CATEGORY_COUNT }, () =>
    buildEmptyCategory(DEFAULT_ROW_COUNT)
  ),
  dailyDoubles: buildDailyDoubles({ boardIndex, type: "random" }),
  values: buildRowValues({ boardIndex, rowCount: DEFAULT_ROW_COUNT }),
})

export const buildEmptyDraft = (): GameDraft => ({
  boards: [buildEmptyBoard(0)],
  title: "",
})

export const buildQuestionKey = ({
  boardIndex,
  categoryIndex,
  rowIndex,
}: QuestionPosition): string => `${boardIndex}-${categoryIndex}-${rowIndex}`

/**
 * True when `usedKeys` holds a key for every question that the board has now.
 * The keys carry positions, so a board that changed after the game started
 * counts only the positions that it still holds.
 */
export const isBoardDone = ({
  board,
  boardIndex,
  usedKeys,
}: {
  board: Board
  boardIndex: number
  usedKeys: Array<string>
}): boolean =>
  board.categories.every((category, categoryIndex) =>
    category.questions.every((_, rowIndex) =>
      usedKeys.includes(
        buildQuestionKey({ boardIndex, categoryIndex, rowIndex })
      )
    )
  )

export const countQuestionsLeft = ({
  board,
  boardIndex,
  usedKeys,
}: {
  board: Board
  boardIndex: number
  usedKeys: Array<string>
}): number =>
  board.categories
    .flatMap((category, categoryIndex) =>
      category.questions.map((_, rowIndex) =>
        buildQuestionKey({ boardIndex, categoryIndex, rowIndex })
      )
    )
    .filter((key) => !usedKeys.includes(key)).length

export const isGameDone = ({
  boards,
  usedKeys,
}: {
  boards: Array<Board>
  usedKeys: Array<string>
}): boolean =>
  boards.every((board, boardIndex) =>
    isBoardDone({ board, boardIndex, usedKeys })
  )

/**
 * The board to show after a question closes: the same board while it holds a
 * question that the game did not show, else the next board that does.
 */
export const getNextBoardIndex = ({
  boardIndex,
  boards,
  usedKeys,
}: {
  boardIndex: number
  boards: Array<Board>
  usedKeys: Array<string>
}): number => {
  const nextIndex = boards.findIndex(
    (board, index) =>
      index >= boardIndex &&
      !isBoardDone({ board, boardIndex: index, usedKeys })
  )
  return nextIndex === -1 ? boardIndex : nextIndex
}

/** Every category holds the same number of questions, one for each row. */
export const isSamePosition = (a: CellPosition, b: CellPosition): boolean =>
  a.categoryIndex === b.categoryIndex && a.rowIndex === b.rowIndex

export const getRowCount = (board: Board): number => board.values.length

export const isQuestionComplete = (question: Question): boolean =>
  question.answer.trim() !== "" && question.question.trim() !== ""

/** What the editor must still get for a question. */
export type QuestionStatus = "complete" | "empty" | "no-answer" | "no-question"

export const getQuestionStatus = (question: Question): QuestionStatus => {
  const hasQuestion = question.question.trim() !== ""
  const hasAnswer = question.answer.trim() !== ""
  if (hasQuestion && hasAnswer) return "complete"
  if (hasQuestion) return "no-answer"
  if (hasAnswer) return "no-question"
  return "empty"
}

const hasQuestionContent = (question: Question): boolean =>
  question.answer.trim() !== "" || question.question.trim() !== ""

/** The name of a category is work that a removal loses, the same as a question. */
export const hasCategoryContent = (category: Category): boolean =>
  category.name.trim() !== "" || category.questions.some(hasQuestionContent)

export const hasBoardContent = (board: Board): boolean =>
  board.categories.some(hasCategoryContent)

export const hasRowContent = ({
  board,
  rowIndex,
}: {
  board: Board
  rowIndex: number
}): boolean =>
  board.categories.some((category) =>
    hasQuestionContent(category.questions[rowIndex])
  )

export const setCategoryName = ({
  board,
  categoryIndex,
  name,
}: {
  board: Board
  categoryIndex: number
  name: string
}): Board => ({
  ...board,
  categories: board.categories.map((category, index) =>
    index === categoryIndex ? { ...category, name } : category
  ),
})

export const setQuestion = ({
  board,
  categoryIndex,
  question,
  rowIndex,
}: {
  board: Board
  categoryIndex: number
  question: Question
  rowIndex: number
}): Board => ({
  ...board,
  categories: board.categories.map((category, index) =>
    index === categoryIndex
      ? {
          ...category,
          questions: category.questions.map((existing, position) =>
            position === rowIndex ? question : existing
          ),
        }
      : category
  ),
})

/** Moves the question at row `from` to row `to` of one category. */
export type QuestionMove = { categoryIndex: number; from: number; to: number }

/** The values stay with the rows. */
export const moveQuestion = ({
  board,
  categoryIndex,
  from,
  to,
}: QuestionMove & { board: Board }): Board => ({
  ...board,
  categories: board.categories.map((category, index) =>
    index === categoryIndex
      ? {
          ...category,
          questions: moveItem({ from, items: category.questions, to }),
        }
      : category
  ),
  dailyDoubles: getDailyDoubleOps(board.dailyDoubles).moveQuestion({
    categoryIndex,
    from,
    to,
  }),
})

export const addCategory = (board: Board): Board => ({
  ...board,
  categories: [...board.categories, buildEmptyCategory(getRowCount(board))],
})

export const removeCategory = ({
  board,
  categoryIndex,
}: {
  board: Board
  categoryIndex: number
}): Board => ({
  ...board,
  categories: board.categories.filter((_, index) => index !== categoryIndex),
  dailyDoubles: getDailyDoubleOps(board.dailyDoubles).removeCategory(
    categoryIndex
  ),
})

/** The new row is worth the last row plus the first row. */
export const addRow = (board: Board): Board => ({
  ...board,
  categories: board.categories.map((category) => ({
    ...category,
    questions: [...category.questions, buildEmptyQuestion()],
  })),
  values: [
    ...board.values,
    board.values[board.values.length - 1] + board.values[0],
  ],
})

export const setRowValue = ({
  board,
  rowIndex,
  value,
}: {
  board: Board
  rowIndex: number
  value: number
}): Board => ({
  ...board,
  values: board.values.map((existing, index) =>
    index === rowIndex ? value : existing
  ),
})

/** A whole number of points from 0 up, or `undefined` for other text. */
export const toPoints = (text: string): number | undefined => {
  if (!/^\d+$/.test(text.trim())) return
  return Number(text)
}

export const removeRow = ({
  board,
  rowIndex,
}: {
  board: Board
  rowIndex: number
}): Board => ({
  ...board,
  categories: board.categories.map((category) => ({
    ...category,
    questions: category.questions.filter((_, index) => index !== rowIndex),
  })),
  dailyDoubles: getDailyDoubleOps(board.dailyDoubles).removeRow(rowIndex),
  values: board.values.filter((_, index) => index !== rowIndex),
})

export const setBoard = ({
  board,
  boardIndex,
  draft,
}: {
  board: Board
  boardIndex: number
  draft: GameDraft
}): GameDraft => ({
  ...draft,
  boards: draft.boards.map((existing, index) =>
    index === boardIndex ? board : existing
  ),
})

/** The new board starts on the values of its place in the game. */
export const addBoard = (draft: GameDraft): GameDraft => ({
  ...draft,
  boards: [...draft.boards, buildEmptyBoard(draft.boards.length)],
})

export const removeBoard = ({
  boardIndex,
  draft,
}: {
  boardIndex: number
  draft: GameDraft
}): GameDraft => ({
  ...draft,
  boards: draft.boards.filter((_, index) => index !== boardIndex),
})

const listQuestions = ({ boards }: { boards: Array<Board> }): Array<Question> =>
  boards.flatMap((board) =>
    board.categories.flatMap((category) => category.questions)
  )

export const countQuestions = (game: { boards: Array<Board> }): number =>
  listQuestions(game).length

export const countCompleteQuestions = (game: {
  boards: Array<Board>
}): number => listQuestions(game).filter(isQuestionComplete).length

export const isDraftComplete = (draft: GameDraft): boolean =>
  draft.title.trim() !== "" &&
  draft.boards.every((board) =>
    board.categories.every((category) => category.name.trim() !== "")
  ) &&
  countCompleteQuestions(draft) === countQuestions(draft)

export const formatBoardCount = (boardCount: number): string =>
  boardCount === 1 ? "1 board" : `${boardCount} boards`

export const formatGameSummary = (game: { boards: Array<Board> }): string =>
  `${formatBoardCount(game.boards.length)} · ${countQuestions(game)} questions`

/** The question at a position, or `undefined` when the game no longer holds it. */
export const findQuestion = ({
  boards,
  position,
}: {
  boards: Array<Board>
  position: QuestionPosition
}): { categoryName: string; question: Question; value: number } | undefined => {
  const board = boards.at(position.boardIndex)
  const category = board?.categories.at(position.categoryIndex)
  const question = category?.questions.at(position.rowIndex)
  const value = board?.values.at(position.rowIndex)
  if (!category || !question || value === undefined) return
  return { categoryName: category.name, question, value }
}
