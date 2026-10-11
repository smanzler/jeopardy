import { QRCodeSVG } from "qrcode.react"
import { buildJoinUrl } from "@/features/buzzers/lib/room-url"
import { cn } from "@/lib/utils"

type JoinCodeProps = {
  className?: string
  code: string
  /** Pixels. */
  qrSize: number
}

/** Shows the QR code, the room code and the URL that phones join at. */
export function JoinCode({ className, code, qrSize }: JoinCodeProps) {
  const joinUrl = buildJoinUrl({ code, origin: window.location.origin })

  return (
    <div className={cn("flex items-center gap-4", className)}>
      <div className="shrink-0 rounded-lg bg-white p-3">
        <QRCodeSVG value={joinUrl} size={qrSize} title={`Join at ${joinUrl}`} />
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
    </div>
  )
}
