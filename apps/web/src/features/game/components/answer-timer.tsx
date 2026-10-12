import { useEffect, useState } from "react"

type AnswerTimerProps = {
  durationMs: number
  /** A new key starts the timer again. */
  turnKey: string
}

/** Empties a bar in `durationMs`, then says that the time is up. */
export function AnswerTimer({ durationMs, turnKey }: AnswerTimerProps) {
  const [expiredKey, setExpiredKey] = useState<string>()
  const isExpired = expiredKey === turnKey

  useEffect(() => {
    const timeout = setTimeout(() => setExpiredKey(turnKey), durationMs)
    return () => clearTimeout(timeout)
  }, [durationMs, turnKey])

  return (
    <div className="flex w-full max-w-md flex-col items-center gap-3">
      <div
        role="timer"
        aria-label="Time to answer"
        className="h-2 w-full overflow-hidden rounded-full bg-shade"
      >
        {/* The key starts the animation again on each turn. */}
        <div
          key={turnKey}
          className="h-full animate-answer-timer bg-primary"
          style={{ animationDuration: `${durationMs}ms` }}
        />
      </div>
      {isExpired && (
        <p className="font-heading text-2xl tracking-widest text-destructive uppercase">
          Time's up
        </p>
      )}
    </div>
  )
}
