import { useState } from "react"
import { Link } from "@tanstack/react-router"
import { Button } from "@/components/ui/button"
import { Field, FieldLabel } from "@/components/ui/field"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const DEFAULT_TEAM_COUNT = 2

const TEAM_COUNT_ITEMS = [2, 3, 4, 5, 6, 7, 8].map((count) => ({
  label: `${count} teams`,
  value: count,
}))

type TeamSetupProps = {
  onStart: (teamCount: number) => void
  title: string
}

export function TeamSetup({ onStart, title }: TeamSetupProps) {
  const [teamCount, setTeamCount] = useState(DEFAULT_TEAM_COUNT)

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6">
      <h1 className="text-3xl font-semibold">{title}</h1>
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
      <Button size="lg" onClick={() => onStart(teamCount)}>
        Play
      </Button>
      <div className="flex gap-2">
        <Button variant="ghost" render={<Link to="/play" />}>
          Boards
        </Button>
        <Button variant="ghost" render={<Link to="/" />}>
          Home
        </Button>
      </div>
    </div>
  )
}
