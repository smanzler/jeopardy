import { useState } from "react"
import { ArrowLeftIcon } from "lucide-react"
import type { Wager } from "@/lib/db"
import { toPoints } from "@/lib/board"
import { Button } from "@/components/ui/button"
import { Field, FieldLabel, FieldLegend, FieldSet } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"

type DailyDoubleWagerProps = {
  categoryName: string
  onClose: () => void
  onWager: (wager: Wager) => void
  teamNames: Array<string>
}

export function DailyDoubleWager({
  categoryName,
  onClose,
  onWager,
  teamNames,
}: DailyDoubleWagerProps) {
  const [teamIndex, setTeamIndex] = useState<number>()
  const [text, setText] = useState("")
  const points = toPoints(text)

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    if (points !== undefined && teamIndex !== undefined) {
      onWager({ points, teamIndex })
    }
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
        <FieldSet className="items-center">
          <FieldLegend>Which team chose it?</FieldLegend>
          {/* Base UI takes only string values. */}
          <ToggleGroup
            variant="choice"
            size="lg"
            className="flex-wrap justify-center"
            value={teamIndex === undefined ? [] : [String(teamIndex)]}
            onValueChange={(pressed) => setTeamIndex(pressed.map(Number).at(0))}
          >
            {teamNames.map((teamName, index) => (
              <ToggleGroupItem
                key={index}
                value={String(index)}
                className="font-heading tracking-wider uppercase"
              >
                {teamName}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </FieldSet>
        <Field className="w-48">
          <FieldLabel htmlFor="daily-double-wager">Wager</FieldLabel>
          <Input
            id="daily-double-wager"
            autoFocus
            autoComplete="off"
            inputMode="numeric"
            className="h-12 text-center font-heading text-2xl tabular-nums md:text-2xl"
            value={text}
            // The field keeps only the digits that the host types.
            onChange={(event) => setText(event.target.value.replace(/\D/g, ""))}
          />
        </Field>
        <Button
          size="lg"
          type="submit"
          disabled={points === undefined || teamIndex === undefined}
        >
          Show the question
        </Button>
      </form>
    </div>
  )
}
