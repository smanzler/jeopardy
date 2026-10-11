import type { Room } from "@jeopardy/shared/buzzers/messages"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import type { HostRoom } from "@/features/buzzers/hooks/use-host-room"
import { HostRoomStatus } from "@/features/buzzers/components/host-room-status"
import { JoinCode } from "@/features/buzzers/components/join-code"
import {
  countPlayers,
  formatPhoneCount,
} from "@/features/buzzers/lib/count-players"

type BuzzersDialogProps = {
  hostRoom: HostRoom
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
  onStart: () => void
}

function LiveRoom({ code, room }: { code: string; room: Room }) {
  return (
    <div className="flex flex-col items-center gap-4">
      <JoinCode className="flex-col" code={code} qrSize={192} />
      <ul className="flex w-full flex-col gap-1">
        {room.teamNames.map((teamName, teamIndex) => (
          <li
            key={teamIndex}
            className="flex justify-between gap-4 rounded-md bg-secondary px-3 py-1.5"
          >
            <span className="truncate font-heading tracking-wider uppercase">
              {teamName}
            </span>
            <span className="text-muted-foreground tabular-nums">
              {formatPhoneCount(countPlayers(room, teamIndex))}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

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
        <HostRoomStatus
          hostRoom={hostRoom}
          onStart={onStart}
          renderLive={(live) => <LiveRoom code={live.code} room={live.room} />}
        />
      </DialogContent>
    </Dialog>
  )
}
