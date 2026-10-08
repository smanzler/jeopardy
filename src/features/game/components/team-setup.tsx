import { useState } from "react"
import { ArrowLeftIcon, PlusIcon, XIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ButtonLink } from "@/components/button-link"
import { formatValue } from "@/lib/board"
import { buildTeamNames, formatTeamName } from "@/lib/score"

const MIN_TEAM_COUNT = 2

const MAX_TEAM_COUNT = 8

/** The id keeps the field of a team when a team before it goes away. */
type TeamDraft = { id: string; name: string }

const buildTeamDraft = (): TeamDraft => ({ id: crypto.randomUUID(), name: "" })

type TeamSetupProps = {
  /** Gets one name for each team. A blank name becomes the team number. */
  onStart: (teamNames: Array<string>) => void
  /** A line about the game under its title, such as its size. */
  summary: string
  title: string
}

export function TeamSetup({ onStart, summary, title }: TeamSetupProps) {
  const [teams, setTeams] = useState(() =>
    Array.from({ length: MIN_TEAM_COUNT }, buildTeamDraft)
  )

  const handleNameChange = ({ id, name }: TeamDraft) =>
    setTeams((current) =>
      current.map((team) => (team.id === id ? { id, name } : team))
    )

  return (
    <div className="relative flex flex-1 flex-col items-center justify-center gap-9 p-8">
      <ButtonLink
        variant="ghost"
        className="absolute top-5 left-6 font-heading tracking-widest text-muted-foreground uppercase"
        to="/"
      >
        <ArrowLeftIcon />
        Home
      </ButtonLink>
      <div className="flex flex-col items-center gap-2 text-center">
        <div className="bg-card px-11 py-3.5 shadow-[inset_0_-6px_0_var(--shade)]">
          <h1 className="font-heading text-6xl leading-none font-bold tracking-wider text-primary uppercase text-shadow-[0_4px_0_var(--shade)]">
            {title}
          </h1>
        </div>
        <p className="text-muted-foreground">{summary} · Name your teams</p>
      </div>
      <ul className="flex max-w-6xl flex-wrap items-end justify-center gap-x-6 gap-y-8">
        {teams.map((team, teamIndex) => (
          <li key={team.id} className="relative flex w-48 flex-col">
            {teams.length > MIN_TEAM_COUNT && (
              <Button
                variant="ghost"
                size="icon-sm"
                className="absolute -top-3 -right-3 z-10 rounded-full bg-secondary text-muted-foreground hover:bg-destructive hover:text-foreground"
                aria-label={`Remove ${formatTeamName(teamIndex)}`}
                onClick={() =>
                  setTeams((current) =>
                    current.filter((other) => other.id !== team.id)
                  )
                }
              >
                <XIcon />
              </Button>
            )}
            <div className="flex flex-col gap-2.5 bg-card px-2.5 pt-2.5 shadow-[inset_0_-5px_0_var(--shade)]">
              <span className="bg-shade py-2 text-center font-heading text-4xl font-bold text-primary tabular-nums">
                {formatValue(0)}
              </span>
              <input
                aria-label={`Name of team ${teamIndex + 1}`}
                placeholder={formatTeamName(teamIndex)}
                value={team.name}
                className="mx-3 mb-3 h-10 min-w-0 bg-foreground text-center font-heading text-xl font-semibold tracking-wider text-background uppercase outline-none placeholder:text-background/50 focus-visible:ring-3 focus-visible:ring-ring"
                onChange={(event) =>
                  handleNameChange({ id: team.id, name: event.target.value })
                }
              />
            </div>
            {/* The stand under the desk. */}
            <span aria-hidden className="mx-5 h-8 bg-shade" />
          </li>
        ))}
        {teams.length < MAX_TEAM_COUNT && (
          <li>
            <Button
              variant="ghost"
              className="flex h-[11.5rem] w-48 flex-col gap-1.5 rounded-none border-2 border-dashed border-card font-heading tracking-widest text-muted-foreground uppercase hover:border-primary hover:bg-card/20 hover:text-foreground"
              onClick={() =>
                setTeams((current) => [...current, buildTeamDraft()])
              }
            >
              <PlusIcon className="size-8 text-primary" />
              Add team
            </Button>
          </li>
        )}
      </ul>
      <div className="flex flex-col items-center gap-2">
        <Button
          size="xl"
          className="h-15 px-11 font-heading text-2xl font-bold tracking-widest uppercase"
          onClick={() =>
            onStart(buildTeamNames(teams.map((team) => team.name)))
          }
        >
          Start the game
        </Button>
        <p className="text-sm text-muted-foreground">
          {MIN_TEAM_COUNT} to {MAX_TEAM_COUNT} teams. A blank name stays{" "}
          {formatTeamName(0)}, {formatTeamName(1)}…
        </p>
      </div>
    </div>
  )
}
