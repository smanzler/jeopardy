import type { ReactNode } from "react"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import type { HostRoom } from "@/features/buzzers/hooks/use-host-room"

type LiveHostRoom = Extract<HostRoom, { status: "live" }>

type HostRoomStatusProps = {
  hostRoom: HostRoom
  onStart: () => void
  renderLive: (hostRoom: LiveHostRoom) => ReactNode
}

type BodyProps<TStatus extends HostRoom["status"]> = Omit<
  HostRoomStatusProps,
  "hostRoom"
> & { hostRoom: Extract<HostRoom, { status: TStatus }> }

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
  live: ({ hostRoom, renderLive }) => renderLive(hostRoom),
}

const renderBody = <TStatus extends HostRoom["status"]>(
  props: BodyProps<TStatus> & { hostRoom: { status: TStatus } }
) => bodies[props.hostRoom.status](props)

/** Shows a start button, then a spinner, then the live room. */
export function HostRoomStatus(props: HostRoomStatusProps) {
  return renderBody(props)
}
