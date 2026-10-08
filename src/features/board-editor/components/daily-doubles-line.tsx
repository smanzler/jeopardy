import { StarIcon } from "lucide-react"
import type { DailyDoubles } from "@/lib/db"
import { getDailyDoubleOps } from "@/lib/daily-doubles"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { DailyDoubleSettings } from "@/features/board-editor/components/daily-double-settings"

type DailyDoublesLineProps = {
  boardIndex: number
  dailyDoubles: DailyDoubles
  onChange: (dailyDoubles: DailyDoubles) => void
}

/** Says how the open board gets its daily doubles, and opens the settings. */
export function DailyDoublesLine({
  boardIndex,
  dailyDoubles,
  onChange,
}: DailyDoublesLineProps) {
  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
      <StarIcon className="size-4 text-primary" />
      <span className="text-muted-foreground">Daily doubles:</span>
      <span>{getDailyDoubleOps(dailyDoubles).summary}</span>
      <Dialog>
        <DialogTrigger render={<Button variant="link" className="px-1" />}>
          Change
        </DialogTrigger>
        <DialogContent className="gap-4 rounded-2xl border bg-secondary p-5">
          <DialogHeader>
            <DialogTitle className="font-heading text-xl tracking-wide uppercase">
              Board {boardIndex + 1} daily doubles
            </DialogTitle>
          </DialogHeader>
          <DailyDoubleSettings
            boardIndex={boardIndex}
            dailyDoubles={dailyDoubles}
            onChange={onChange}
          />
          <DialogClose render={<Button className="justify-self-end" />}>
            Done
          </DialogClose>
        </DialogContent>
      </Dialog>
    </div>
  )
}
