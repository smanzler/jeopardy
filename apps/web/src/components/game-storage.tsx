import { CloudIcon, LaptopIcon } from "lucide-react"
import type { LucideIcon } from "lucide-react"
import type { GameStorage } from "@/lib/game-store"
import { ButtonLink } from "@/components/button-link"
import { cn } from "@/lib/utils"

type StorageView = {
  icon: LucideIcon
  label: string
  /** Shows when the storage holds no such game. */
  missing: string
}

const storageViews: Record<GameStorage, StorageView> = {
  local: {
    icon: LaptopIcon,
    label: "On this device",
    missing: "That board is not in this browser.",
  },
  cloud: {
    icon: CloudIcon,
    label: "In your account",
    missing: "That board is not in your account.",
  },
}

export function StorageBadge({
  className,
  storage,
}: {
  className?: string
  storage: GameStorage
}) {
  const { icon: Icon, label } = storageViews[storage]
  return (
    <span title={label} className={cn("inline-flex", className)}>
      <Icon aria-hidden className="size-4" />
      <span className="sr-only">{label}</span>
    </span>
  )
}

/** Takes the place of a screen whose game is missing or failed to load. */
export function GameUnavailable({
  isError,
  storage,
}: {
  isError: boolean
  storage: GameStorage
}) {
  return (
    <div className="flex flex-col items-start gap-4 p-6">
      <p>
        {isError
          ? "The board did not load. Sign in, or try again."
          : storageViews[storage].missing}
      </p>
      <ButtonLink variant="outline" to="/">
        Home
      </ButtonLink>
    </div>
  )
}
