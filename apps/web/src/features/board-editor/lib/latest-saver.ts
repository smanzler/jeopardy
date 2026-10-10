/**
 * Saves with one write in flight at a time. A value that comes during a write
 * waits for it, and a newer value replaces the one that waits. Writes to the
 * API can then not land out of order.
 */
export const createLatestSaver = <TValue>({
  onFailed,
  onSaved,
  save,
}: {
  onFailed: () => void
  /** Runs when the last value is written. */
  onSaved: () => void
  save: (value: TValue) => Promise<unknown>
}) => {
  let isSaving = false
  let waiting: { value: TValue } | null = null

  const run = async (value: TValue): Promise<void> => {
    isSaving = true
    try {
      await save(value)
      if (!waiting) onSaved()
    } catch {
      onFailed()
    }
    const next = waiting
    waiting = null
    if (next) return run(next.value)
    isSaving = false
  }

  return (value: TValue) => {
    if (isSaving) {
      waiting = { value }
      return
    }
    void run(value)
  }
}
