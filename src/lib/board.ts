import type { Category, GameDraft, Question } from "@/lib/db"

export const DEFAULT_CATEGORY_COUNT = 5

export const DEFAULT_ROW_COUNT = 5

export const MAX_CATEGORY_COUNT = 8

export const MAX_ROW_COUNT = 8

const ROW_VALUE_STEP = 200

const currencyFormat = new Intl.NumberFormat("en-US", {
  currency: "USD",
  maximumFractionDigits: 0,
  style: "currency",
})

/**
 * The value of a row comes from its position, so the values stay correct after
 * the editor adds or removes a row.
 */
export const formatRowValue = (rowIndex: number): string =>
  currencyFormat.format((rowIndex + 1) * ROW_VALUE_STEP)

const buildEmptyQuestion = (): Question => ({ answer: "", question: "" })

const buildEmptyCategory = (rowCount: number): Category => ({
  name: "",
  questions: Array.from({ length: rowCount }, buildEmptyQuestion),
})

export const buildEmptyDraft = (): GameDraft => ({
  categories: Array.from({ length: DEFAULT_CATEGORY_COUNT }, () =>
    buildEmptyCategory(DEFAULT_ROW_COUNT)
  ),
  title: "",
})

/** Every category holds the same number of questions, one for each row. */
export const getRowCount = (draft: GameDraft): number =>
  draft.categories[0].questions.length

export const isQuestionComplete = (question: Question): boolean =>
  question.answer.trim() !== "" && question.question.trim() !== ""

const hasQuestionContent = (question: Question): boolean =>
  question.answer.trim() !== "" || question.question.trim() !== ""

/** The name of a category is work that a removal loses, the same as a question. */
export const hasCategoryContent = (category: Category): boolean =>
  category.name.trim() !== "" || category.questions.some(hasQuestionContent)

export const hasDraftContent = (draft: GameDraft): boolean =>
  draft.title.trim() !== "" || draft.categories.some(hasCategoryContent)

export const hasRowContent = ({
  draft,
  rowIndex,
}: {
  draft: GameDraft
  rowIndex: number
}): boolean =>
  draft.categories.some((category) =>
    hasQuestionContent(category.questions[rowIndex])
  )

export const setCategoryName = ({
  categoryIndex,
  draft,
  name,
}: {
  categoryIndex: number
  draft: GameDraft
  name: string
}): GameDraft => ({
  ...draft,
  categories: draft.categories.map((category, index) =>
    index === categoryIndex ? { ...category, name } : category
  ),
})

export const setQuestion = ({
  categoryIndex,
  draft,
  question,
  rowIndex,
}: {
  categoryIndex: number
  draft: GameDraft
  question: Question
  rowIndex: number
}): GameDraft => ({
  ...draft,
  categories: draft.categories.map((category, index) =>
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

export const addCategory = (draft: GameDraft): GameDraft => ({
  ...draft,
  categories: [...draft.categories, buildEmptyCategory(getRowCount(draft))],
})

export const removeCategory = ({
  categoryIndex,
  draft,
}: {
  categoryIndex: number
  draft: GameDraft
}): GameDraft => ({
  ...draft,
  categories: draft.categories.filter((_, index) => index !== categoryIndex),
})

export const addRow = (draft: GameDraft): GameDraft => ({
  ...draft,
  categories: draft.categories.map((category) => ({
    ...category,
    questions: [...category.questions, buildEmptyQuestion()],
  })),
})

export const removeRow = ({
  draft,
  rowIndex,
}: {
  draft: GameDraft
  rowIndex: number
}): GameDraft => ({
  ...draft,
  categories: draft.categories.map((category) => ({
    ...category,
    questions: category.questions.filter((_, index) => index !== rowIndex),
  })),
})

export const countQuestions = (draft: GameDraft): number =>
  draft.categories.flatMap((category) => category.questions).length

export const countCompleteQuestions = (draft: GameDraft): number =>
  draft.categories
    .flatMap((category) => category.questions)
    .filter(isQuestionComplete).length

export const isDraftComplete = (draft: GameDraft): boolean =>
  draft.title.trim() !== "" &&
  draft.categories.every((category) => category.name.trim() !== "") &&
  countCompleteQuestions(draft) === countQuestions(draft)
