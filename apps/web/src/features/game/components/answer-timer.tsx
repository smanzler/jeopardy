import { useEffect, useState } from "react"

const ANSWER_MS = 5000

type AnswerTimerProps = {
  /** A new key starts the timer again. */
  turnKey: string
}

/** Empties a bar in 5 seconds, then says that the time is up. */
export function AnswerTimer({ turnKey }: AnswerTimerProps) {
  const [expiredKey, setExpiredKey] = useState<string>()
  const isExpired = expiredKey === turnKey

  useEffect(() => {
    const timeout = setTimeout(() => setExpiredKey(turnKey), ANSWER_MS)
    return () => clearTimeout(timeout)
  }, [turnKey])

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
          style={{ animationDuration: `${ANSWER_MS}ms` }}
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
