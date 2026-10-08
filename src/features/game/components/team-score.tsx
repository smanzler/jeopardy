import { useState } from "react"
import { formatValue } from "@/lib/board"
import { toScore } from "@/lib/score"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

type TeamScoreProps = {
  onChange: (score: number) => void
  score: number
  teamName: string
}

/** Shows the score of a team. A click opens a field to type a new score. */
export function TeamScore({ onChange, score, teamName }: TeamScoreProps) {
  // No text means that the field is closed.
  const [text, setText] = useState<string>()

  const handleSave = () => {
    const next = text === undefined ? undefined : toScore(text)
    if (next !== undefined && next !== score) onChange(next)
    setText(undefined)
  }

  if (text === undefined) {
    return (
      <Button
        variant="ghost"
        className="h-auto px-2 font-heading text-2xl font-medium text-primary tabular-nums"
        aria-label={`Change the score of ${teamName}`}
        onClick={() => setText(String(score))}
      >
        {formatValue(score)}
      </Button>
    )
  }

  return (
    <Input
      autoFocus
      aria-label={`Score of ${teamName}`}
      aria-invalid={toScore(text) === undefined}
      className="w-28 text-center tabular-nums"
      value={text}
      onBlur={handleSave}
      onChange={(event) => setText(event.target.value)}
      onFocus={(event) => event.target.select()}
      onKeyDown={(event) => {
        if (event.key === "Enter") handleSave()
        if (event.key === "Escape") setText(undefined)
      }}
    />
  )
}
