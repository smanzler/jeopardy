import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Field, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ButtonLink } from "@/components/button-link"
import { buildTeamNames, formatTeamName } from "@/lib/score"

const DEFAULT_TEAM_COUNT = 2

const MAX_TEAM_COUNT = 8

const TEAM_COUNT_ITEMS = Array.from(
  { length: MAX_TEAM_COUNT - 1 },
  (_, index) => index + 2
).map((count) => ({ label: `${count} teams`, value: count }))

type TeamSetupProps = {
  /** Gets one name for each team. A blank name becomes the team number. */
  onStart: (teamNames: Array<string>) => void
  title: string
}

export function TeamSetup({ onStart, title }: TeamSetupProps) {
  const [teamCount, setTeamCount] = useState(DEFAULT_TEAM_COUNT)
  // A smaller count keeps the names after it, so a larger count gets them back.
  const [names, setNames] = useState(() =>
    Array.from({ length: MAX_TEAM_COUNT }, () => "")
  )
  const shownNames = names.slice(0, teamCount)

  const handleNameChange = ({
    name,
    teamIndex,
  }: {
    name: string
    teamIndex: number
  }) =>
    setNames((current) =>
      current.map((existing, index) => (index === teamIndex ? name : existing))
    )

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6">
      <h1 className="font-heading text-4xl font-medium tracking-wide uppercase">
        {title}
      </h1>
      <Field className="w-48">
        <FieldLabel htmlFor="team-count">Teams</FieldLabel>
        <Select
          items={TEAM_COUNT_ITEMS}
          value={teamCount}
          onValueChange={(value) => setTeamCount(value ?? DEFAULT_TEAM_COUNT)}
        >
          <SelectTrigger id="team-count" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TEAM_COUNT_ITEMS.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
      <div className="grid w-full max-w-md grid-cols-2 gap-2">
        {shownNames.map((name, teamIndex) => (
          <Input
            key={teamIndex}
            aria-label={`Name of team ${teamIndex + 1}`}
            placeholder={formatTeamName(teamIndex)}
            value={name}
            onChange={(event) =>
              handleNameChange({ name: event.target.value, teamIndex })
            }
          />
        ))}
      </div>
      <Button size="lg" onClick={() => onStart(buildTeamNames(shownNames))}>
        Play
      </Button>
      <div className="flex gap-2">
        <ButtonLink variant="ghost" to="/">
          Home
        </ButtonLink>
      </div>
    </div>
  )
}
