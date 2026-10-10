import { describe, expect, it } from "vitest"
import { moveItem, toMovedIndex } from "@/lib/move"

const items = ["a", "b", "c", "d", "e"]

describe("moveItem", () => {
  it("moves an item down and shifts the items between up", () => {
    expect(moveItem({ from: 1, items, to: 3 })).toEqual([
      "a",
      "c",
      "d",
      "b",
      "e",
    ])
  })

  it("moves an item up and shifts the items between down", () => {
    expect(moveItem({ from: 3, items, to: 0 })).toEqual([
      "d",
      "a",
      "b",
      "c",
      "e",
    ])
  })

  it("keeps the order when the item stays", () => {
    expect(moveItem({ from: 2, items, to: 2 })).toEqual(items)
  })
})

describe("toMovedIndex", () => {
  it.each([
    { from: 1, to: 3 },
    { from: 3, to: 0 },
    { from: 4, to: 0 },
    { from: 0, to: 4 },
    { from: 2, to: 2 },
  ])("agrees with moveItem from $from to $to", ({ from, to }) => {
    const moved = moveItem({ from, items, to })
    items.forEach((item, index) => {
      expect(moved[toMovedIndex({ from, index, to })]).toBe(item)
    })
  })
})
