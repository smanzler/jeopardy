import { useState } from "react"
import { ArrowLeftIcon } from "lucide-react"
import { toPoints } from "@/lib/board"
import { Button } from "@/components/ui/button"
import { Field, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"

type DailyDoubleWagerProps = {
  categoryName: string
  onClose: () => void
  onWager: (wager: number) => void
}

export function DailyDoubleWager({
  categoryName,
  onClose,
  onWager,
}: DailyDoubleWagerProps) {
  const [text, setText] = useState("")
  const wager = toPoints(text)

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    if (wager !== undefined) onWager(wager)
  }

  return (
    <div className="flex flex-1 flex-col bg-card px-6 py-5 text-card-foreground">
      <Button
        variant="outline"
        className="self-start font-heading tracking-wider uppercase"
        onClick={onClose}
      >
        <ArrowLeftIcon />
        Board
      </Button>
      <form
        className="flex flex-1 flex-col items-center justify-center gap-8 text-center"
        onSubmit={handleSubmit}
      >
        <p className="font-heading text-2xl font-semibold tracking-wider uppercase">
          {categoryName}
        </p>
        <h2 className="font-heading text-9xl font-bold tracking-wide text-primary uppercase text-shadow-[0_6px_0_var(--shade)]">
          Daily double
        </h2>
        <Field className="w-48">
          <FieldLabel htmlFor="daily-double-wager">Wager</FieldLabel>
          <Input
            id="daily-double-wager"
            autoFocus
            inputMode="numeric"
            className="h-12 text-center font-heading text-2xl tabular-nums md:text-2xl"
            value={text}
            onChange={(event) => setText(event.target.value)}
          />
        </Field>
        <Button size="lg" type="submit" disabled={wager === undefined}>
          Show the question
        </Button>
      </form>
    </div>
  )
}
