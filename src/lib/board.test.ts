import { describe, expect, it } from "vitest"
import {
  DEFAULT_CATEGORY_COUNT,
  DEFAULT_ROW_COUNT,
  addBoard,
  addCategory,
  addRow,
  buildEmptyBoard,
  buildEmptyDraft,
  buildQuestionKey,
  buildRowValues,
  countCompleteQuestions,
  countQuestions,
  findQuestion,
  formatBoardCount,
  formatValue,
  getNextBoardIndex,
  getQuestionStatus,
  getRowCount,
  hasBoardContent,
  hasCategoryContent,
  hasRowContent,
  isBoardDone,
  isDraftComplete,
  isGameDone,
  isQuestionComplete,
  removeBoard,
  removeCategory,
  removeRow,
  setBoard,
  setCategoryName,
  setQuestion,
} from "@/lib/board"
import type { Board, GameDraft } from "@/lib/db"

const buildFilledBoard = (board: Board): Board => ({
  ...board,
  categories: board.categories.map((category, index) => ({
    name: `Category ${index + 1}`,
    questions: category.questions.map(() => ({
      answer: "An answer",
      question: "A question",
    })),
  })),
})

const buildFilledDraft = (draft: GameDraft): GameDraft => ({
  boards: draft.boards.map(buildFilledBoard),
  title: "A game",
})

const buildAllKeys = ({
  board,
  boardIndex,
}: {
  board: Board
  boardIndex: number
}) =>
  board.categories.flatMap((category, categoryIndex) =>
    category.questions.map((_, rowIndex) =>
      buildQuestionKey({ boardIndex, categoryIndex, rowIndex })
    )
  )

describe("buildEmptyDraft", () => {
  it("makes one 5 by 5 board", () => {
    const draft = buildEmptyDraft()
    expect(draft.boards).toHaveLength(1)
    expect(draft.boards[0].categories).toHaveLength(DEFAULT_CATEGORY_COUNT)
    expect(getRowCount(draft.boards[0])).toBe(DEFAULT_ROW_COUNT)
    expect(countQuestions(draft)).toBe(
      DEFAULT_CATEGORY_COUNT * DEFAULT_ROW_COUNT
    )
  })

  it("makes a new set of categories on each call", () => {
    const first = setCategoryName({
      board: buildEmptyDraft().boards[0],
      categoryIndex: 0,
      name: "History",
    })
    expect(buildEmptyDraft().boards[0].categories[0].name).toBe("")
    expect(first.categories[0].name).toBe("History")
  })
})

describe("buildRowValues", () => {
  it("goes up by 100 for each row on the first board", () => {
    expect(buildRowValues({ boardIndex: 0, rowCount: 5 })).toEqual([
      100, 200, 300, 400, 500,
    ])
  })

  it("doubles the values on the second board", () => {
    expect(buildRowValues({ boardIndex: 1, rowCount: 5 })).toEqual([
      200, 400, 600, 800, 1000,
    ])
  })
})

describe("buildEmptyBoard", () => {
  it("gives one value to each row", () => {
    const board = buildEmptyBoard(1)
    expect(board.values).toEqual([200, 400, 600, 800, 1000])
    expect(board.categories[0].questions).toHaveLength(board.values.length)
  })
})

describe("setCategoryName", () => {
  it("changes one category and leaves the others", () => {
    const board = buildEmptyBoard(0)
    const next = setCategoryName({ board, categoryIndex: 2, name: "Science" })
    expect(next.categories[2].name).toBe("Science")
    expect(next.categories[1]).toBe(board.categories[1])
    expect(board.categories[2].name).toBe("")
  })
})

describe("setQuestion", () => {
  it("changes one question and leaves the others", () => {
    const board = buildEmptyBoard(0)
    const question = { answer: "Who is John?", question: "Magna Carta" }
    const next = setQuestion({ board, categoryIndex: 1, question, rowIndex: 1 })
    expect(next.categories[1].questions[1]).toEqual(question)
    expect(next.categories[1].questions[0]).toBe(
      board.categories[1].questions[0]
    )
    expect(board.categories[1].questions[1].question).toBe("")
  })
})

describe("setBoard", () => {
  it("changes one board and leaves the others", () => {
    const draft = {
      ...buildEmptyDraft(),
      boards: [buildEmptyBoard(0), buildEmptyBoard(1)],
    }
    const board = buildFilledBoard(draft.boards[1])
    const next = setBoard({ board, boardIndex: 1, draft })
    expect(next.boards[1]).toBe(board)
    expect(next.boards[0]).toBe(draft.boards[0])
  })
})

describe("addCategory", () => {
  it("adds an empty category that has one question for each row", () => {
    const board = addCategory(buildEmptyBoard(0))
    expect(board.categories).toHaveLength(DEFAULT_CATEGORY_COUNT + 1)
    expect(board.categories[DEFAULT_CATEGORY_COUNT]).toEqual({
      name: "",
      questions: Array.from({ length: DEFAULT_ROW_COUNT }, () => ({
        answer: "",
        question: "",
      })),
    })
  })

  it("matches the row count after a row is added", () => {
    const board = addCategory(addRow(buildEmptyBoard(0)))
    expect(board.categories[DEFAULT_CATEGORY_COUNT].questions).toHaveLength(
      DEFAULT_ROW_COUNT + 1
    )
  })
})

describe("removeCategory", () => {
  it("drops that category and keeps the others in order", () => {
    const board = buildFilledBoard(buildEmptyBoard(0))
    const next = removeCategory({ board, categoryIndex: 1 })
    expect(next.categories.map((category) => category.name)).toEqual([
      "Category 1",
      "Category 3",
      "Category 4",
      "Category 5",
    ])
    expect(board.categories).toHaveLength(DEFAULT_CATEGORY_COUNT)
  })
})

describe("addRow", () => {
  it("adds one empty question to every category", () => {
    const board = addRow(buildFilledBoard(buildEmptyBoard(0)))
    expect(getRowCount(board)).toBe(DEFAULT_ROW_COUNT + 1)
    for (const category of board.categories) {
      expect(category.questions).toHaveLength(DEFAULT_ROW_COUNT + 1)
      expect(category.questions[DEFAULT_ROW_COUNT]).toEqual({
        answer: "",
        question: "",
      })
    }
  })

  it("adds the value of the first row to the value of the last row", () => {
    expect(addRow(buildEmptyBoard(0)).values.at(-1)).toBe(600)
    expect(addRow(buildEmptyBoard(1)).values.at(-1)).toBe(1200)
  })
})

describe("removeRow", () => {
  it("drops that row and its value from every category", () => {
    const board = setQuestion({
      board: buildEmptyBoard(0),
      categoryIndex: 0,
      question: { answer: "An answer", question: "A question" },
      rowIndex: 0,
    })
    const next = removeRow({ board, rowIndex: 0 })
    expect(getRowCount(next)).toBe(DEFAULT_ROW_COUNT - 1)
    expect(next.values).toEqual([200, 300, 400, 500])
    expect(countCompleteQuestions({ boards: [next], title: "" })).toBe(0)
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
  it("counts only the questions that have both fields, on every board", () => {
    const draft = {
      ...buildEmptyDraft(),
      boards: [buildEmptyBoard(0), buildEmptyBoard(1)],
    }
    expect(countCompleteQuestions(draft)).toBe(0)
    expect(countCompleteQuestions(buildFilledDraft(draft))).toBe(
      2 * DEFAULT_CATEGORY_COUNT * DEFAULT_ROW_COUNT
    )
  })
})

describe("isDraftComplete", () => {
  it("accepts a game with a title, category names and every question", () => {
    expect(isDraftComplete(buildFilledDraft(buildEmptyDraft()))).toBe(true)
  })

  it("needs the questions of a board that was just added", () => {
    const draft = buildFilledDraft(buildEmptyDraft())
    expect(
      isDraftComplete({
        ...draft,
        boards: [...draft.boards, buildEmptyBoard(1)],
      })
    ).toBe(false)
  })

  it("rejects a game that misses the title, a category or a question", () => {
    const draft = buildFilledDraft(buildEmptyDraft())
    const [board] = draft.boards
    expect(isDraftComplete({ ...draft, title: " " })).toBe(false)
    expect(
      isDraftComplete({
        ...draft,
        boards: [setCategoryName({ board, categoryIndex: 0, name: "" })],
      })
    ).toBe(false)
    expect(
      isDraftComplete({
        ...draft,
        boards: [
          setQuestion({
            board,
            categoryIndex: 0,
            question: { answer: "", question: "" },
            rowIndex: 0,
          }),
        ],
      })
    ).toBe(false)
  })
})

describe("hasCategoryContent", () => {
  it("is false for a category that holds nothing", () => {
    expect(hasCategoryContent(buildEmptyBoard(0).categories[0])).toBe(false)
  })

  it("is true for a name on its own", () => {
    const board = setCategoryName({
      board: buildEmptyBoard(0),
      categoryIndex: 1,
      name: "History",
    })
    expect(hasCategoryContent(board.categories[1])).toBe(true)
    expect(hasCategoryContent(board.categories[0])).toBe(false)
  })

  it("is true for a half-written question", () => {
    const board = setQuestion({
      board: buildEmptyBoard(0),
      categoryIndex: 2,
      question: { answer: "", question: "Magna Carta" },
      rowIndex: 3,
    })
    expect(hasCategoryContent(board.categories[2])).toBe(true)
    expect(hasCategoryContent(board.categories[3])).toBe(false)
  })
})

describe("hasRowContent", () => {
  it("is false for a row that holds nothing", () => {
    expect(hasRowContent({ board: buildEmptyBoard(0), rowIndex: 0 })).toBe(
      false
    )
  })

  it("is true when any category has content in that row", () => {
    const board = setQuestion({
      board: buildEmptyBoard(0),
      categoryIndex: 4,
      question: { answer: "Who is John?", question: "" },
      rowIndex: 2,
    })
    expect(hasRowContent({ board, rowIndex: 2 })).toBe(true)
    expect(hasRowContent({ board, rowIndex: 1 })).toBe(false)
  })

  it("ignores the name of a category", () => {
    const board = setCategoryName({
      board: buildEmptyBoard(0),
      categoryIndex: 0,
      name: "History",
    })
    expect(hasRowContent({ board, rowIndex: 0 })).toBe(false)
  })
})

describe("formatValue", () => {
  it("shows whole dollars, and a loss with a sign", () => {
    expect(formatValue(1200)).toBe("$1,200")
    expect(formatValue(-400)).toBe("-$400")
  })
})

describe("formatBoardCount", () => {
  it("names one board and more boards", () => {
    expect(formatBoardCount(1)).toBe("1 board")
    expect(formatBoardCount(2)).toBe("2 boards")
  })
})

describe("buildQuestionKey", () => {
  it("gives each position in the game its own key", () => {
    const keys = [
      buildQuestionKey({ boardIndex: 0, categoryIndex: 1, rowIndex: 2 }),
      buildQuestionKey({ boardIndex: 0, categoryIndex: 2, rowIndex: 1 }),
      buildQuestionKey({ boardIndex: 1, categoryIndex: 1, rowIndex: 2 }),
    ]
    expect(new Set(keys).size).toBe(keys.length)
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

describe("isBoardDone", () => {
  const board = buildEmptyBoard(0)

  it("is false while the board holds a question that the game did not show", () => {
    expect(isBoardDone({ board, boardIndex: 0, usedKeys: [] })).toBe(false)
    expect(
      isBoardDone({
        board,
        boardIndex: 0,
        usedKeys: buildAllKeys({ board, boardIndex: 0 }).slice(1),
      })
    ).toBe(false)
  })

  it("is true when every question has a key", () => {
    expect(
      isBoardDone({
        board,
        boardIndex: 0,
        usedKeys: buildAllKeys({ board, boardIndex: 0 }),
      })
    ).toBe(true)
  })

  it("ignores the keys of another board", () => {
    expect(
      isBoardDone({
        board,
        boardIndex: 1,
        usedKeys: buildAllKeys({ board, boardIndex: 0 }),
      })
    ).toBe(false)
  })

  it("counts only the positions that the board holds now", () => {
    const smaller = removeCategory({ board, categoryIndex: 0 })
    // The keys of the board before the removal cover the smaller board.
    expect(
      isBoardDone({
        board: smaller,
        boardIndex: 0,
        usedKeys: buildAllKeys({ board, boardIndex: 0 }),
      })
    ).toBe(true)
  })
})

describe("isGameDone", () => {
  const boards = [buildEmptyBoard(0), buildEmptyBoard(1)]

  it("needs every board", () => {
    const firstKeys = buildAllKeys({ board: boards[0], boardIndex: 0 })
    const secondKeys = buildAllKeys({ board: boards[1], boardIndex: 1 })
    expect(isGameDone({ boards, usedKeys: firstKeys })).toBe(false)
    expect(
      isGameDone({ boards, usedKeys: [...firstKeys, ...secondKeys] })
    ).toBe(true)
  })
})

describe("findQuestion", () => {
  const board = setQuestion({
    board: setCategoryName({
      board: buildEmptyBoard(1),
      categoryIndex: 2,
      name: "Science",
    }),
    categoryIndex: 2,
    question: { answer: "H2O", question: "Water" },
    rowIndex: 3,
  })
  const boards = [buildEmptyBoard(0), board]

  it("gives the category, the question and the value", () => {
    expect(
      findQuestion({
        boards,
        position: { boardIndex: 1, categoryIndex: 2, rowIndex: 3 },
      })
    ).toEqual({
      categoryName: "Science",
      question: { answer: "H2O", question: "Water" },
      value: 800,
    })
  })

  it("gives nothing for a position that the game does not hold", () => {
    expect(
      findQuestion({
        boards,
        position: { boardIndex: 2, categoryIndex: 0, rowIndex: 0 },
      })
    ).toBeUndefined()
    expect(
      findQuestion({
        boards,
        position: { boardIndex: 0, categoryIndex: 0, rowIndex: 9 },
      })
    ).toBeUndefined()
  })
})

describe("addBoard", () => {
  it("adds an empty board on the values of its place", () => {
    const draft = addBoard(buildEmptyDraft())
    expect(draft.boards).toHaveLength(2)
    expect(draft.boards[1]).toEqual(buildEmptyBoard(1))
  })
})

describe("removeBoard", () => {
  it("drops that board and keeps the others in order", () => {
    const draft = buildFilledDraft(addBoard(addBoard(buildEmptyDraft())))
    const next = removeBoard({ boardIndex: 1, draft })
    expect(next.boards).toEqual([draft.boards[0], draft.boards[2]])
  })
})

describe("hasBoardContent", () => {
  it("is false for an empty board and true for one category name", () => {
    const board = buildEmptyBoard(0)
    expect(hasBoardContent(board)).toBe(false)
    expect(
      hasBoardContent(setCategoryName({ board, categoryIndex: 3, name: "Art" }))
    ).toBe(true)
  })
})

describe("getNextBoardIndex", () => {
  const boards = [buildEmptyBoard(0), buildEmptyBoard(1), buildEmptyBoard(2)]
  const firstKeys = buildAllKeys({ board: boards[0], boardIndex: 0 })
  const secondKeys = buildAllKeys({ board: boards[1], boardIndex: 1 })

  it("stays on a board that still holds a question", () => {
    expect(
      getNextBoardIndex({ boardIndex: 0, boards, usedKeys: firstKeys.slice(1) })
    ).toBe(0)
  })

  it("moves on when the board is done", () => {
    expect(
      getNextBoardIndex({ boardIndex: 0, boards, usedKeys: firstKeys })
    ).toBe(1)
  })

  it("skips a later board that is done", () => {
    expect(
      getNextBoardIndex({
        boardIndex: 0,
        boards,
        usedKeys: [...firstKeys, ...secondKeys],
      })
    ).toBe(2)
  })

  it("does not go back to an earlier board", () => {
    expect(
      getNextBoardIndex({
        boardIndex: 1,
        boards: boards.slice(0, 2),
        usedKeys: secondKeys,
      })
    ).toBe(1)
  })
})
