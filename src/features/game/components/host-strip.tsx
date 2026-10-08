import { Progress } from "@/components/ui/progress"
import { BoardTabs } from "@/components/board-tabs"
import { ButtonLink } from "@/components/button-link"

const LINK_CLASS =
  "h-9 px-2 font-heading text-xs tracking-widest text-muted-foreground uppercase"

type HostStripProps = {
  boardCount: number
  boardIndex: number
  gameId: string
  onSelectBoard: (boardIndex: number) => void
  /** The questions of the shown board that the game has not shown yet. */
  questionsLeft: number
  questionTotal: number
  title: string
}

/** The controls of the host, in a thin strip above the board. */
export function HostStrip({
  boardCount,
  boardIndex,
  gameId,
  onSelectBoard,
  questionsLeft,
  questionTotal,
  title,
}: HostStripProps) {
  return (
    <div className="grid h-11 shrink-0 grid-cols-[1fr_auto_1fr] items-center gap-4 border-b border-card bg-shade px-4">
      <h1 className="truncate font-heading text-lg font-semibold tracking-wider uppercase">
        {title}
      </h1>
      <div className="flex">
        {boardCount > 1 && (
          <BoardTabs
            activeVariant="ghost"
            boardCount={boardCount}
            boardIndex={boardIndex}
            className="h-11 rounded-none border-0 border-b-2 border-transparent px-3.5 font-heading text-sm tracking-widest text-muted-foreground uppercase aria-pressed:border-b-primary aria-pressed:text-foreground"
            inactiveVariant="ghost"
            onSelect={onSelectBoard}
          />
        )}
      </div>
      <div className="flex items-center justify-end gap-3.5">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="tabular-nums">{questionsLeft} left</span>
          <Progress
            aria-label={`${questionsLeft} of ${questionTotal} questions left`}
            value={
              questionTotal === 0
                ? 0
                : ((questionTotal - questionsLeft) / questionTotal) * 100
            }
            className="w-20 *:data-[slot=progress-track]:bg-card"
          />
        </div>
        <ButtonLink
          variant="ghost"
          className={LINK_CLASS}
          to="/play/$gameId/winner"
          params={{ gameId }}
        >
          End game
        </ButtonLink>
        <ButtonLink variant="ghost" className={LINK_CLASS} to="/">
          Home
        </ButtonLink>
      </div>
    </div>
  )
}
