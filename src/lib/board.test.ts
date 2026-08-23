import { describe, expect, it } from "vitest"
import {
  DEFAULT_CATEGORY_COUNT,
  DEFAULT_ROW_COUNT,
  addCategory,
  addRow,
  buildEmptyDraft,
  buildQuestionKey,
  countCompleteQuestions,
  countQuestions,
  formatRowValue,
  formatValue,
  getQuestionStatus,
  getRowCount,
  getRowValue,
  hasCategoryContent,
  isEveryQuestionUsed,
  hasRowContent,
  isDraftComplete,
  isQuestionComplete,
  removeCategory,
  removeRow,
  setCategoryName,
  setQuestion,
} from "@/lib/board"
import type { GameDraft } from "@/lib/db"

const buildFilledDraft = (draft: GameDraft): GameDraft => ({
  categories: draft.categories.map((category, index) => ({
    name: `Category ${index + 1}`,
    questions: category.questions.map(() => ({
      answer: "An answer",
      question: "A question",
    })),
  })),
  title: "A board",
})

describe("buildEmptyDraft", () => {
  it("makes a 5 by 5 board", () => {
    const draft = buildEmptyDraft()
    expect(draft.categories).toHaveLength(DEFAULT_CATEGORY_COUNT)
    expect(getRowCount(draft.categories)).toBe(DEFAULT_ROW_COUNT)
    expect(countQuestions(draft)).toBe(
      DEFAULT_CATEGORY_COUNT * DEFAULT_ROW_COUNT
    )
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
    const question = { answer: "Who is John?", question: "Magna Carta" }
    const next = setQuestion({ categoryIndex: 1, draft, question, rowIndex: 1 })
    expect(next.categories[1].questions[1]).toEqual(question)
    expect(next.categories[1].questions[0]).toBe(
      draft.categories[1].questions[0]
    )
    expect(draft.categories[1].questions[1].question).toBe("")
  })
})

describe("addCategory", () => {
  it("adds an empty category that has one question for each row", () => {
    const draft = addCategory(buildEmptyDraft())
    expect(draft.categories).toHaveLength(DEFAULT_CATEGORY_COUNT + 1)
    expect(draft.categories[DEFAULT_CATEGORY_COUNT]).toEqual({
      name: "",
      questions: Array.from({ length: DEFAULT_ROW_COUNT }, () => ({
        answer: "",
        question: "",
      })),
    })
  })

  it("matches the row count after a row is added", () => {
    const draft = addCategory(addRow(buildEmptyDraft()))
    expect(getRowCount(draft.categories)).toBe(DEFAULT_ROW_COUNT + 1)
    expect(draft.categories[DEFAULT_CATEGORY_COUNT].questions).toHaveLength(
      DEFAULT_ROW_COUNT + 1
    )
  })
})

describe("removeCategory", () => {
  it("drops that category and keeps the others in order", () => {
    const draft = buildFilledDraft(buildEmptyDraft())
    const next = removeCategory({ categoryIndex: 1, draft })
    expect(next.categories.map((category) => category.name)).toEqual([
      "Category 1",
      "Category 3",
      "Category 4",
      "Category 5",
    ])
    expect(draft.categories).toHaveLength(DEFAULT_CATEGORY_COUNT)
  })
})

describe("addRow", () => {
  it("adds one empty question to every category", () => {
    const draft = addRow(buildFilledDraft(buildEmptyDraft()))
    expect(getRowCount(draft.categories)).toBe(DEFAULT_ROW_COUNT + 1)
    for (const category of draft.categories) {
      expect(category.questions).toHaveLength(DEFAULT_ROW_COUNT + 1)
      expect(category.questions[DEFAULT_ROW_COUNT]).toEqual({
        answer: "",
        question: "",
      })
    }
  })
})

describe("removeRow", () => {
  it("drops that row from every category", () => {
    const draft = setQuestion({
      categoryIndex: 0,
      draft: buildEmptyDraft(),
      question: { answer: "An answer", question: "A question" },
      rowIndex: 0,
    })
    const next = removeRow({ draft, rowIndex: 0 })
    expect(getRowCount(next.categories)).toBe(DEFAULT_ROW_COUNT - 1)
    expect(countCompleteQuestions(next)).toBe(0)
    for (const category of next.categories) {
      expect(category.questions).toHaveLength(DEFAULT_ROW_COUNT - 1)
    }
  })
})

describe("isQuestionComplete", () => {
  it("needs a question and an answer that are not blank", () => {
    expect(isQuestionComplete({ answer: "a", question: "q" })).toBe(true)
    expect(isQuestionComplete({ answer: " ", question: "q" })).toBe(false)
    expect(isQuestionComplete({ answer: "a", question: "" })).toBe(false)
  })
})

describe("countCompleteQuestions", () => {
  it("counts only the questions that have both fields", () => {
    expect(countCompleteQuestions(buildEmptyDraft())).toBe(0)
    expect(countCompleteQuestions(buildFilledDraft(buildEmptyDraft()))).toBe(
      DEFAULT_CATEGORY_COUNT * DEFAULT_ROW_COUNT
    )
  })
})

describe("isDraftComplete", () => {
  it("accepts a board with a title, category names and every question", () => {
    expect(isDraftComplete(buildFilledDraft(buildEmptyDraft()))).toBe(true)
  })

  it("needs the questions of a row that was just added", () => {
    expect(isDraftComplete(addRow(buildFilledDraft(buildEmptyDraft())))).toBe(
      false
    )
  })

  it("rejects a board that misses the title, a category or a question", () => {
    const draft = buildFilledDraft(buildEmptyDraft())
    expect(isDraftComplete({ ...draft, title: " " })).toBe(false)
    expect(
      isDraftComplete(setCategoryName({ categoryIndex: 0, draft, name: "" }))
    ).toBe(false)
    expect(
      isDraftComplete(
        setQuestion({
          categoryIndex: 0,
          draft,
          question: { answer: "", question: "" },
          rowIndex: 0,
        })
      )
    ).toBe(false)
  })
})

describe("formatRowValue", () => {
  it("goes up by 200 dollars for each row", () => {
    expect(formatRowValue(0)).toBe("$200")
    expect(formatRowValue(4)).toBe("$1,000")
  })
})

describe("hasCategoryContent", () => {
  it("is false for a category that holds nothing", () => {
    expect(hasCategoryContent(buildEmptyDraft().categories[0])).toBe(false)
  })

  it("is true for a name on its own", () => {
    const draft = setCategoryName({
      categoryIndex: 1,
      draft: buildEmptyDraft(),
      name: "History",
    })
    expect(hasCategoryContent(draft.categories[1])).toBe(true)
    expect(hasCategoryContent(draft.categories[0])).toBe(false)
  })

  it("is true for a half-written question", () => {
    const draft = setQuestion({
      categoryIndex: 2,
      draft: buildEmptyDraft(),
      question: { answer: "", question: "Magna Carta" },
      rowIndex: 3,
    })
    expect(hasCategoryContent(draft.categories[2])).toBe(true)
    expect(hasCategoryContent(draft.categories[3])).toBe(false)
  })
})

describe("hasRowContent", () => {
  it("is false for a row that holds nothing", () => {
    expect(hasRowContent({ draft: buildEmptyDraft(), rowIndex: 0 })).toBe(false)
  })

  it("is true when any category has content in that row", () => {
    const draft = setQuestion({
      categoryIndex: 4,
      draft: buildEmptyDraft(),
      question: { answer: "Who is John?", question: "" },
      rowIndex: 2,
    })
    expect(hasRowContent({ draft, rowIndex: 2 })).toBe(true)
    expect(hasRowContent({ draft, rowIndex: 1 })).toBe(false)
  })

  it("ignores the name of a category", () => {
    const draft = setCategoryName({
      categoryIndex: 0,
      draft: buildEmptyDraft(),
      name: "History",
    })
    expect(hasRowContent({ draft, rowIndex: 0 })).toBe(false)
  })
})

describe("getRowValue", () => {
  it("goes up by 200 for each row", () => {
    expect(getRowValue(0)).toBe(200)
    expect(getRowValue(4)).toBe(1000)
  })
})

describe("formatValue", () => {
  it("shows whole dollars, and a loss with a sign", () => {
    expect(formatValue(1200)).toBe("$1,200")
    expect(formatValue(-400)).toBe("-$400")
  })
})

describe("buildQuestionKey", () => {
  it("gives each position on the board its own key", () => {
    expect(buildQuestionKey({ categoryIndex: 1, rowIndex: 2 })).not.toBe(
      buildQuestionKey({ categoryIndex: 2, rowIndex: 1 })
    )
  })
})

describe("getQuestionStatus", () => {
  it("names what a question still needs", () => {
    expect(getQuestionStatus({ answer: "", question: "" })).toBe("empty")
    expect(getQuestionStatus({ answer: "  ", question: " " })).toBe("empty")
    expect(getQuestionStatus({ answer: "", question: "Magna Carta" })).toBe(
      "no-answer"
    )
    expect(getQuestionStatus({ answer: "Who is John?", question: "" })).toBe(
      "no-question"
    )
    expect(
      getQuestionStatus({ answer: "Who is John?", question: "Magna Carta" })
    ).toBe("complete")
  })
})

describe("isEveryQuestionUsed", () => {
  const { categories } = buildEmptyDraft()

  const buildAllKeys = () =>
    categories.flatMap((category, categoryIndex) =>
      category.questions.map((_, rowIndex) =>
        buildQuestionKey({ categoryIndex, rowIndex })
      )
    )

  it("is false while the board holds a question that the game did not show", () => {
    expect(isEveryQuestionUsed({ categories, usedKeys: [] })).toBe(false)
    expect(
      isEveryQuestionUsed({ categories, usedKeys: buildAllKeys().slice(1) })
    ).toBe(false)
  })

  it("is true when every question has a key", () => {
    expect(isEveryQuestionUsed({ categories, usedKeys: buildAllKeys() })).toBe(
      true
    )
  })

  it("counts only the positions that the board holds now", () => {
    const smaller = removeCategory({
      categoryIndex: 0,
      draft: buildEmptyDraft(),
    })
    // The keys of the board before the removal cover the smaller board.
    expect(
      isEveryQuestionUsed({
        categories: smaller.categories,
        usedKeys: buildAllKeys(),
      })
    ).toBe(true)
  })
})
