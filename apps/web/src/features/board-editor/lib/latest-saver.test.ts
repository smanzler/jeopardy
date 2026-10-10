import { describe, expect, it, vi } from "vitest"
import { createLatestSaver } from "@/features/board-editor/lib/latest-saver"

const flush = () => new Promise((resolve) => setTimeout(resolve, 0))

describe("createLatestSaver", () => {
  it("writes the first value, then only the newest that waited", async () => {
    const writes: Array<() => void> = []
    const save = vi.fn(
      () => new Promise<void>((resolve) => writes.push(resolve))
    )
    const onSaved = vi.fn()
    const saveLatest = createLatestSaver({ onFailed: vi.fn(), onSaved, save })

    saveLatest("a")
    saveLatest("b")
    saveLatest("c")
    expect(save.mock.calls).toEqual([["a"]])

    writes[0]()
    await flush()
    expect(save.mock.calls).toEqual([["a"], ["c"]])
    expect(onSaved).not.toHaveBeenCalled()

    writes[1]()
    await flush()
    expect(onSaved).toHaveBeenCalledOnce()
  })

  it("reports a failed write and still writes the next value", async () => {
    const onFailed = vi.fn()
    const save = vi
      .fn<(value: string) => Promise<void>>()
      .mockRejectedValueOnce(new Error("offline"))
      .mockResolvedValue(undefined)
    const onSaved = vi.fn()
    const saveLatest = createLatestSaver({ onFailed, onSaved, save })

    saveLatest("a")
    saveLatest("b")
    await flush()

    expect(onFailed).toHaveBeenCalledOnce()
    expect(save.mock.calls).toEqual([["a"], ["b"]])
    expect(onSaved).toHaveBeenCalledOnce()
  })
})
