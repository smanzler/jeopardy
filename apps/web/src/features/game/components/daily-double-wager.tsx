import { useState } from "react"
import type { Wager } from "@/lib/db"
import { formatValue, toPoints } from "@/lib/board"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Field, FieldLabel, FieldLegend, FieldSet } from "@/components/ui/field"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from "@/components/ui/input-group"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { QuestionHeader } from "@/features/game/components/question-header"

type DailyDoubleWagerProps = {
  categoryName: string
  onClose: () => void
  onWager: (wager: Wager) => void
  scores: Array<number>
  /** One name for each entry of `scores`. */
  teamNames: Array<string>
}

export function DailyDoubleWager({
  categoryName,
  onClose,
  onWager,
  scores,
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
      <QuestionHeader onClose={onClose}>{categoryName}</QuestionHeader>
      <form
        className="flex flex-1 flex-col items-center justify-center gap-9 text-center"
        onSubmit={handleSubmit}
      >
        <h2 className="font-heading text-8xl font-bold tracking-wide text-primary uppercase text-shadow-[0_6px_0_var(--shade)]">
          Daily double
        </h2>
        <FieldSet className="items-center">
          <FieldLegend className="font-heading text-lg tracking-widest text-card-foreground/85 uppercase">
            Which team chose it?
          </FieldLegend>
          {/* Base UI takes only string values. */}
          <ToggleGroup
            variant="tile"
            size="tile"
            spacing={5}
            className="flex-wrap justify-center"
            value={teamIndex === undefined ? [] : [String(teamIndex)]}
            onValueChange={(pressed) => setTeamIndex(pressed.map(Number).at(0))}
          >
            {teamNames.map((teamName, index) => (
              <ToggleGroupItem
                key={index}
                value={String(index)}
                className="font-heading"
              >
                <span className="truncate bg-secondary px-3 py-2.5 text-xl tracking-widest uppercase group-aria-pressed/toggle:bg-foreground/25">
                  {teamName}
                </span>
                <span
                  className={cn(
                    "py-5 text-4xl font-semibold tabular-nums",
                    scores[index] < 0 &&
                      "text-destructive group-aria-pressed/toggle:text-primary-foreground"
                  )}
                >
                  {formatValue(scores[index])}
                </span>
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </FieldSet>
        <div className="flex items-end gap-3">
          <Field className="w-52">
            <FieldLabel
              htmlFor="daily-double-wager"
              className="font-heading tracking-wider uppercase"
            >
              {teamIndex === undefined ? "" : `${teamNames[teamIndex]} `}
              Wager
            </FieldLabel>
            <InputGroup className="h-13 border-2 border-border bg-background">
              <InputGroupAddon>
                <InputGroupText className="font-heading text-2xl text-primary">
                  $
                </InputGroupText>
              </InputGroupAddon>
              <InputGroupInput
                id="daily-double-wager"
                autoFocus
                autoComplete="off"
                inputMode="numeric"
                className="font-heading text-2xl tabular-nums md:text-2xl"
                value={text}
                // The field keeps only the digits that the host types.
                onChange={(event) =>
                  setText(event.target.value.replace(/\D/g, ""))
                }
              />
            </InputGroup>
          </Field>
          <Button
            size="lg"
            type="submit"
            className="h-13 px-6 font-heading tracking-wider uppercase"
            disabled={points === undefined || teamIndex === undefined}
          >
            Show the question
          </Button>
        </div>
      </form>
    </div>
  )
}
