import type { ReactNode } from "react"
import { QRCodeSVG } from "qrcode.react"
import type { Room } from "@jeopardy/shared/buzzers/messages"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Spinner } from "@/components/ui/spinner"
import type { HostRoom } from "@/features/buzzers/hooks/use-host-room"
import { buildJoinUrl } from "@/features/buzzers/lib/room-url"

type BuzzersDialogProps = {
  hostRoom: HostRoom
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
  onStart: () => void
}

const countPlayers = (room: Room, teamIndex: number) =>
  room.players.filter((player) => player.teamIndex === teamIndex).length

function LiveRoom({ code, room }: { code: string; room: Room }) {
  const joinUrl = buildJoinUrl({ code, origin: window.location.origin })

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="rounded-lg bg-white p-3">
        <QRCodeSVG value={joinUrl} size={192} title={`Join at ${joinUrl}`} />
      </div>
      <div className="flex flex-col items-center gap-1">
        <span className="font-heading text-xs tracking-widest text-muted-foreground uppercase">
          Room code
        </span>
        <span className="font-heading text-5xl font-semibold tracking-[0.3em]">
          {code}
        </span>
        <span className="text-xs break-all text-muted-foreground">
          {joinUrl}
        </span>
      </div>
      <ul className="flex w-full flex-col gap-1">
        {room.teamNames.map((teamName, teamIndex) => {
          const count = countPlayers(room, teamIndex)
          return (
            <li
              key={teamIndex}
              className="flex justify-between gap-4 rounded-md bg-secondary px-3 py-1.5"
            >
              <span className="truncate font-heading tracking-wider uppercase">
                {teamName}
              </span>
              <span className="text-muted-foreground tabular-nums">
                {count} {count === 1 ? "phone" : "phones"}
              </span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

type BodyProps<TStatus extends HostRoom["status"]> = {
  hostRoom: Extract<HostRoom, { status: TStatus }>
  onStart: () => void
}

const bodies: {
  [TStatus in HostRoom["status"]]: (props: BodyProps<TStatus>) => ReactNode
} = {
  off: ({ onStart }) => <Button onClick={onStart}>Start buzzers</Button>,
  connecting: () => (
    <div className="flex items-center justify-center gap-2 py-6 text-muted-foreground">
      <Spinner />
      <span>Connecting…</span>
    </div>
  ),
  live: ({ hostRoom }) => (
    <LiveRoom code={hostRoom.code} room={hostRoom.room} />
  ),
}

const renderBody = <TStatus extends HostRoom["status"]>(
  props: BodyProps<TStatus> & { hostRoom: { status: TStatus } }
) => bodies[props.hostRoom.status](props)

/** Shows how players join the buzzer room of the game. */
export function BuzzersDialog({
  hostRoom,
  isOpen,
  onOpenChange,
  onStart,
}: BuzzersDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Buzzers</DialogTitle>
          <DialogDescription>
            Players buzz in from their phones. Each phone joins one team.
          </DialogDescription>
        </DialogHeader>
        {renderBody({ hostRoom, onStart })}
      </DialogContent>
    </Dialog>
  )
}
