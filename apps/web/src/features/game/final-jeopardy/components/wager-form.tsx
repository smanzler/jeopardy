import { useState } from "react"
import { toPoints } from "@/lib/board"
import { Button } from "@/components/ui/button"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from "@/components/ui/input-group"

type WagerFormProps = {
  maxWager: number
  onWager: (points: number) => void
  teamName: string
}

/** Takes the wager of one team in a field that hides the digits. */
export function WagerForm({ maxWager, onWager, teamName }: WagerFormProps) {
  const [text, setText] = useState("")
  const points = toPoints(text)
  const isValid = points !== undefined && points <= maxWager

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    if (isValid) onWager(points)
  }

  return (
    <form className="flex gap-2" onSubmit={handleSubmit}>
      <InputGroup className="h-10 w-36 border-2 border-border bg-background">
        <InputGroupAddon>
          <InputGroupText className="font-heading text-lg text-primary">
            $
          </InputGroupText>
        </InputGroupAddon>
        {/* The room sees the screen, so the field hides the wager. */}
        <InputGroupInput
          aria-label={`Wager of ${teamName}`}
          autoComplete="off"
          inputMode="numeric"
          type="password"
          className="font-heading text-lg tabular-nums md:text-lg"
          value={text}
          onChange={(event) => setText(event.target.value.replace(/\D/g, ""))}
        />
      </InputGroup>
      <Button
        type="submit"
        className="h-10 font-heading tracking-wider uppercase"
        disabled={!isValid}
      >
        Lock
      </Button>
    </form>
  )
}
