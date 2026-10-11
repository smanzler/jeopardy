import { ArrowLeftIcon, PlusIcon, XIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ButtonLink } from "@/components/button-link"
import { formatValue } from "@/lib/board"
import { formatTeamName } from "@/lib/score"
import { cn } from "@/lib/utils"
import { Lectern, PLATE_CLASS } from "@/features/game/components/lectern"
import {
  MAX_TEAM_COUNT,
  MIN_TEAM_COUNT,
} from "@/features/game/hooks/use-team-drafts"
import type { TeamDrafts } from "@/features/game/hooks/use-team-drafts"
import type { HostRoom } from "@/features/buzzers/hooks/use-host-room"
import { HostRoomStatus } from "@/features/buzzers/components/host-room-status"
import { JoinCode } from "@/features/buzzers/components/join-code"
import {
  countPlayers,
  formatPhoneCount,
} from "@/features/buzzers/lib/count-players"

type TeamSetupProps = {
  hostRoom: HostRoom
  onRemoveTeam: (id: string) => void
  onStart: () => void
  onStartBuzzers: () => void
  /** A line about the game under its title, such as its size. */
  summary: string
  teamDrafts: TeamDrafts
  title: string
}

export function TeamSetup({
  hostRoom,
  onRemoveTeam,
  onStart,
  onStartBuzzers,
  summary,
  teamDrafts,
  title,
}: TeamSetupProps) {
  const { teams } = teamDrafts
  const room = hostRoom.status === "live" ? hostRoom.room : undefined

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
                onClick={() => onRemoveTeam(team.id)}
              >
                <XIcon />
              </Button>
            )}
            <Lectern
              score={formatValue(0)}
              plate={
                <input
                  aria-label={`Name of team ${teamIndex + 1}`}
                  placeholder={formatTeamName(teamIndex)}
                  value={team.name}
                  className={cn(
                    PLATE_CLASS,
                    "outline-none placeholder:text-background/50 focus-visible:ring-3 focus-visible:ring-ring"
                  )}
                  onChange={(event) =>
                    teamDrafts.rename({ id: team.id, name: event.target.value })
                  }
                />
              }
            />
            {room && (
              <span className="absolute inset-x-0 -bottom-6 text-center text-sm text-muted-foreground tabular-nums">
                {formatPhoneCount(countPlayers(room, teamIndex))}
              </span>
            )}
          </li>
        ))}
        {teams.length < MAX_TEAM_COUNT && (
          <li>
            <Button
              variant="ghost"
              className="flex h-[11.5rem] w-48 flex-col gap-1.5 rounded-none border-2 border-dashed border-card font-heading tracking-widest text-muted-foreground uppercase hover:border-primary hover:bg-card/20 hover:text-foreground"
              onClick={teamDrafts.add}
            >
              <PlusIcon className="size-8 text-primary" />
              Add team
            </Button>
          </li>
        )}
      </ul>
      <HostRoomStatus
        hostRoom={hostRoom}
        onStart={onStartBuzzers}
        renderLive={({ code }) => <JoinCode code={code} qrSize={128} />}
      />
      <div className="flex flex-col items-center gap-2">
        <Button
          size="xl"
          className="h-15 px-11 font-heading text-2xl font-bold tracking-widest uppercase"
          onClick={onStart}
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
