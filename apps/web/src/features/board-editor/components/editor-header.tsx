import { Link } from "@tanstack/react-router"
import type { GameStorage } from "@/lib/game-store"
import {
  CheckIcon,
  DownloadIcon,
  PlayIcon,
  TriangleAlertIcon,
} from "lucide-react"
import type { GameDraft } from "@/lib/db"
import { countCompleteQuestions, countQuestions } from "@/lib/board"
import { downloadGameFile } from "@/lib/download-file"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { ButtonLink } from "@/components/button-link"

/** `new` is a board that the host has not changed, so the browser holds none. */
export type SaveState = "failed" | "new" | "saved"

const SAVE_STATE_VIEWS: Record<SaveState, React.ReactNode> = {
  failed: (
    <span className="inline-flex items-center gap-1.5 text-sm text-destructive">
      <TriangleAlertIcon className="size-4" />
      Not saved
    </span>
  ),
  new: null,
  saved: (
    <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
      <CheckIcon className="size-4" />
      Saved
    </span>
  ),
}

type EditorHeaderProps = {
  draft: GameDraft
  gameId: string
  /** True when the browser holds the game, so it can start. */
  isStored: boolean
  isNew: boolean
  onTitleChange: (title: string) => void
  saveState: SaveState
  storage: GameStorage
}

export function EditorHeader({
  draft,
  gameId,
  isNew,
  isStored,
  onTitleChange,
  saveState,
  storage,
}: EditorHeaderProps) {
  const complete = countCompleteQuestions(draft)
  const total = countQuestions(draft)

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex min-w-0 flex-[1_1_22rem] flex-col gap-1">
          <nav
            aria-label="Breadcrumb"
            className="text-sm text-muted-foreground"
          >
            <Link to="/" className="hover:text-foreground">
              Home
            </Link>{" "}
            <span aria-hidden>/</span> {isNew ? "New board" : "Edit"}
          </nav>
          <Input
            aria-label="Game title"
            placeholder="Untitled board"
            value={draft.title}
            className="-ml-2.5 h-14 max-w-xl border-transparent bg-transparent font-heading text-4xl font-semibold tracking-wide uppercase hover:border-border md:text-4xl dark:bg-transparent"
            onChange={(event) => onTitleChange(event.target.value)}
          />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex w-44 flex-col items-end gap-1.5">
            <span className="text-sm tabular-nums">
              {complete} of {total} questions
            </span>
            <Progress
              aria-label="Questions written"
              value={total === 0 ? 0 : (complete / total) * 100}
              className="w-full"
            />
          </div>
          {SAVE_STATE_VIEWS[saveState]}
          <Button
            variant="outline"
            size="lg"
            className="font-heading tracking-wider uppercase"
            onClick={() => downloadGameFile(draft)}
          >
            <DownloadIcon />
            Export
          </Button>
          {isStored && (
            <ButtonLink
              size="lg"
              className="font-heading tracking-wider uppercase"
              to="/play/$gameId"
              params={{ gameId }}
              search={{ storage }}
            >
              <PlayIcon />
              Play
            </ButtonLink>
          )}
        </div>
      </div>
      {saveState === "failed" && (
        <p className="text-sm text-destructive">
          The browser did not keep the last change. Look at the space that the
          browser gives to this site.
        </p>
      )}
    </div>
  )
}
