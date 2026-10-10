import type { ReactNode } from "react"
import { roomCodeSchema } from "@jeopardy/shared/buzzers/messages"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { ButtonLink } from "@/components/button-link"
import { usePlayerRoom } from "@/features/buzzers/hooks/use-player-room"
import type { PlayerRoom } from "@/features/buzzers/hooks/use-player-room"
import { useWakeLock } from "@/features/buzzers/hooks/use-wake-lock"
import { buildPhoneView } from "@/features/buzzers/lib/phone-view"
import type { PhoneView } from "@/features/buzzers/lib/phone-view"
import { cn } from "@/lib/utils"

type Actions = {
  buzz: () => void
  join: (teamIndex: number) => void
}

const MESSAGE_CLASS =
  "flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center"
const BIG_TEXT_CLASS =
  "font-heading text-4xl font-semibold tracking-wider text-balance uppercase"

function Message({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return <div className={cn(MESSAGE_CLASS, className)}>{children}</div>
}

const phoneViews: {
  [TKind in PhoneView["kind"]]: (
    view: Extract<PhoneView, { kind: TKind }>,
    actions: Actions
  ) => ReactNode
} = {
  pickTeam: ({ teamNames }, { join }) =>
    teamNames.length === 0 ? (
      <Message>
        <p className="text-muted-foreground">
          Wait for the host to set up the teams.
        </p>
      </Message>
    ) : (
      <div className="flex flex-1 flex-col justify-center gap-3 p-6">
        <h1 className="text-center font-heading text-2xl tracking-widest uppercase">
          Pick your team
        </h1>
        {teamNames.map((teamName, teamIndex) => (
          <Button
            key={teamIndex}
            className="h-16 font-heading text-2xl tracking-widest uppercase"
            variant="secondary"
            onClick={() => join(teamIndex)}
          >
            {teamName}
          </Button>
        ))}
      </div>
    ),
  waiting: () => (
    <Message>
      <p className={cn(BIG_TEXT_CLASS, "text-muted-foreground")}>
        Wait for the clue
      </p>
    </Message>
  ),
  ready: (_view, { buzz }) => (
    <button
      type="button"
      className="m-4 flex flex-1 items-center justify-center rounded-3xl bg-primary font-heading text-7xl font-bold tracking-widest text-primary-foreground uppercase shadow-[0_8px_0_var(--shade)] active:translate-y-1 active:shadow-none"
      onPointerDown={buzz}
      onClick={buzz}
    >
      Buzz
    </button>
  ),
  buzzed: () => (
    <Message>
      <p className={BIG_TEXT_CLASS}>Buzzed!</p>
      <p className="text-muted-foreground">Wait to see who was first.</p>
    </Message>
  ),
  excluded: () => (
    <Message>
      <p className={cn(BIG_TEXT_CLASS, "text-muted-foreground")}>
        Your team answered
      </p>
    </Message>
  ),
  won: () => (
    <Message className="bg-primary text-primary-foreground">
      <p className={BIG_TEXT_CLASS}>You buzzed first!</p>
      <p>Give your answer.</p>
    </Message>
  ),
  lost: ({ winnerName }) => (
    <Message>
      <p className={BIG_TEXT_CLASS}>{winnerName} buzzed first</p>
    </Message>
  ),
}

const renderPhoneView = <TKind extends PhoneView["kind"]>(
  view: Extract<PhoneView, { kind: TKind }> & { kind: TKind },
  actions: Actions
) => phoneViews[view.kind](view, actions)

function Ended() {
  return (
    <Message>
      <p className={BIG_TEXT_CLASS}>This room has ended</p>
      <ButtonLink variant="outline" to="/buzz">
        Join another room
      </ButtonLink>
    </Message>
  )
}

function LiveRoom({ code }: { code: string }) {
  const { buzz, buzzedRoundId, changeTeam, join, playerRoom, teamIndex } =
    usePlayerRoom(code)
  useWakeLock(playerRoom.status === "live")

  const bodies: {
    [TStatus in PlayerRoom["status"]]: (
      playerRoom: Extract<PlayerRoom, { status: TStatus }>
    ) => ReactNode
  } = {
    connecting: () => (
      <Message>
        <Spinner className="size-8" />
      </Message>
    ),
    ended: () => <Ended />,
    live: ({ room }) =>
      renderPhoneView(buildPhoneView({ buzzedRoundId, room, teamIndex }), {
        buzz,
        join,
      }),
  }
  const renderBody = <TStatus extends PlayerRoom["status"]>(
    current: Extract<PlayerRoom, { status: TStatus }> & { status: TStatus }
  ) => bodies[current.status](current)

  const teamName =
    playerRoom.status === "live" && teamIndex !== undefined
      ? playerRoom.room.teamNames[teamIndex]
      : undefined

  return (
    <div className="flex h-svh flex-col">
      <header className="flex h-12 shrink-0 items-center justify-between gap-4 border-b border-card bg-shade px-4 font-heading tracking-widest uppercase">
        <span className="text-muted-foreground">Room {code}</span>
        {teamName && (
          <button
            type="button"
            className="truncate text-sm text-muted-foreground underline-offset-4 hover:underline"
            onClick={changeTeam}
          >
            {teamName} · Change
          </button>
        )}
      </header>
      {renderBody(playerRoom)}
    </div>
  )
}

/** The buzzer that a player uses on a phone. */
export default function Buzz({ code }: { code: string }) {
  const normalized = code.toUpperCase()
  if (!roomCodeSchema.safeParse(normalized).success) {
    return (
      <div className="flex h-svh flex-col">
        <Ended />
      </div>
    )
  }
  return <LiveRoom code={normalized} />
}
