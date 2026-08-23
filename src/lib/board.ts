import type { Category, GameDraft, Question } from "@/lib/db"

export const CATEGORY_COUNT = 5

/** The dollar value of each row, from the top row down. */
export const QUESTION_VALUES = [200, 400, 600, 800, 1000]

export const QUESTION_COUNT = CATEGORY_COUNT * QUESTION_VALUES.length

const currencyFormat = new Intl.NumberFormat("en-US", {
  currency: "USD",
  maximumFractionDigits: 0,
  style: "currency",
})

export const formatQuestionValue = (value: number): string =>
  currencyFormat.format(value)

const buildEmptyCategory = (): Category => ({
  name: "",
  questions: QUESTION_VALUES.map((value) => ({
    answer: "",
    question: "",
    value,
  })),
})

export const buildEmptyDraft = (): GameDraft => ({
  categories: Array.from({ length: CATEGORY_COUNT }, buildEmptyCategory),
  title: "",
})

export const isQuestionComplete = (question: Question): boolean =>
  question.answer.trim() !== "" && question.question.trim() !== ""

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
  questionIndex,
}: {
  categoryIndex: number
  draft: GameDraft
  question: Question
  questionIndex: number
}): GameDraft => ({
  ...draft,
  categories: draft.categories.map((category, index) =>
    index === categoryIndex
      ? {
          ...category,
          questions: category.questions.map((existing, position) =>
            position === questionIndex ? question : existing
          ),
        }
      : category
  ),
})

export const countCompleteQuestions = (draft: GameDraft): number =>
  draft.categories
    .flatMap((category) => category.questions)
    .filter(isQuestionComplete).length

export const isDraftComplete = (draft: GameDraft): boolean =>
  draft.title.trim() !== "" &&
  draft.categories.every((category) => category.name.trim() !== "") &&
  countCompleteQuestions(draft) === QUESTION_COUNT
