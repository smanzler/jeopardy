import { describe, expect, it } from "vitest"
import { getStepPosition } from "@/features/board-editor/lib/question-order"

const size = { categoryCount: 3, rowCount: 4 }

describe("getStepPosition", () => {
  it("goes down the category", () => {
    expect(
      getStepPosition({
        ...size,
        position: { categoryIndex: 1, rowIndex: 1 },
        step: 1,
      })
    ).toEqual({ categoryIndex: 1, rowIndex: 2 })
  })

  it("goes from the end of a category to the top of the next", () => {
    expect(
      getStepPosition({
        ...size,
        position: { categoryIndex: 0, rowIndex: 3 },
        step: 1,
      })
    ).toEqual({ categoryIndex: 1, rowIndex: 0 })
  })

  it("goes back from the top of a category to the end of the one before", () => {
    expect(
      getStepPosition({
        ...size,
        position: { categoryIndex: 2, rowIndex: 0 },
        step: -1,
      })
    ).toEqual({ categoryIndex: 1, rowIndex: 3 })
  })

  it("stops at both ends of the board", () => {
    expect(
      getStepPosition({
        ...size,
        position: { categoryIndex: 0, rowIndex: 0 },
        step: -1,
      })
    ).toBeUndefined()
    expect(
      getStepPosition({
        ...size,
        position: { categoryIndex: 2, rowIndex: 3 },
        step: 1,
      })
    ).toBeUndefined()
  })
})
