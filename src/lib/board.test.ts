import { describe, expect, it } from "vitest"
import {
  CATEGORY_COUNT,
  QUESTION_COUNT,
  QUESTION_VALUES,
  buildEmptyDraft,
  countCompleteQuestions,
  formatQuestionValue,
  isDraftComplete,
  isQuestionComplete,
  setCategoryName,
  setQuestion,
} from "@/lib/board"
import type { GameDraft } from "@/lib/db"

const buildCompleteDraft = (): GameDraft => ({
  categories: Array.from({ length: CATEGORY_COUNT }, (_, index) => ({
    name: `Category ${index + 1}`,
    questions: QUESTION_VALUES.map((value) => ({
      answer: "An answer",
      question: "A question",
      value,
    })),
  })),
  title: "A board",
})

describe("buildEmptyDraft", () => {
  it("makes a 5 by 5 board with the row values", () => {
    const draft = buildEmptyDraft()
    expect(draft.categories).toHaveLength(CATEGORY_COUNT)
    for (const category of draft.categories) {
      expect(category.questions.map((question) => question.value)).toEqual(
        QUESTION_VALUES
      )
    }
  })

  it("makes a new set of categories on each call", () => {
    const first = setCategoryName({
      categoryIndex: 0,
      draft: buildEmptyDraft(),
      name: "History",
    })
    expect(buildEmptyDraft().categories[0].name).toBe("")
    expect(first.categories[0].name).toBe("History")
  })
})

describe("setCategoryName", () => {
  it("changes one category and leaves the others", () => {
    const draft = buildEmptyDraft()
    const next = setCategoryName({ categoryIndex: 2, draft, name: "Science" })
    expect(next.categories[2].name).toBe("Science")
    expect(next.categories[1]).toBe(draft.categories[1])
    expect(draft.categories[2].name).toBe("")
  })
})

describe("setQuestion", () => {
  it("changes one question and leaves the others", () => {
    const draft = buildEmptyDraft()
    const question = {
      answer: "Who is John?",
      question: "Magna Carta",
      value: 400,
    }
    const next = setQuestion({
      categoryIndex: 1,
      draft,
      question,
      questionIndex: 1,
    })
    expect(next.categories[1].questions[1]).toEqual(question)
    expect(next.categories[1].questions[0]).toBe(
      draft.categories[1].questions[0]
    )
    expect(draft.categories[1].questions[1].question).toBe("")
  })
})

describe("isQuestionComplete", () => {
  it("needs a question and an answer that are not blank", () => {
    expect(isQuestionComplete({ answer: "a", question: "q", value: 200 })).toBe(
      true
    )
    expect(isQuestionComplete({ answer: " ", question: "q", value: 200 })).toBe(
      false
    )
    expect(isQuestionComplete({ answer: "a", question: "", value: 200 })).toBe(
      false
    )
  })
})

describe("countCompleteQuestions", () => {
  it("counts only the questions that have both fields", () => {
    expect(countCompleteQuestions(buildEmptyDraft())).toBe(0)
    expect(countCompleteQuestions(buildCompleteDraft())).toBe(QUESTION_COUNT)
  })
})

describe("isDraftComplete", () => {
  it("accepts a board with a title, category names and every question", () => {
    expect(isDraftComplete(buildCompleteDraft())).toBe(true)
  })

  it("rejects a board that misses the title, a category or a question", () => {
    expect(isDraftComplete({ ...buildCompleteDraft(), title: " " })).toBe(false)
    expect(
      isDraftComplete(
        setCategoryName({
          categoryIndex: 0,
          draft: buildCompleteDraft(),
          name: "",
        })
      )
    ).toBe(false)
    expect(
      isDraftComplete(
        setQuestion({
          categoryIndex: 0,
          draft: buildCompleteDraft(),
          question: { answer: "", question: "", value: 200 },
          questionIndex: 0,
        })
      )
    ).toBe(false)
  })
})

describe("formatQuestionValue", () => {
  it("shows whole dollars", () => {
    expect(formatQuestionValue(1000)).toBe("$1,000")
  })
})
