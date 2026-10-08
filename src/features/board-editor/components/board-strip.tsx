import { EllipsisIcon, PlusIcon, Trash2Icon, UploadIcon } from "lucide-react"
import type { GameDraft } from "@/lib/db"
import {
  MAX_BOARD_COUNT,
  countCompleteQuestions,
  countQuestions,
} from "@/lib/board"
import { GAME_FILE_ACCEPT } from "@/lib/game-file"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { BoardTabs } from "@/components/board-tabs"
import { useFilePicker } from "@/hooks/use-file-picker"

type BoardStripProps = {
  boardIndex: number
  draft: GameDraft
  onAddBoard: () => void
  onImportBoards: (file: File) => void
  onRemoveBoard: () => void
  onSelectBoard: (boardIndex: number) => void
}

/** The tabs of the boards, and the actions on the open board. */
export function BoardStrip({
  boardIndex,
  draft,
  onAddBoard,
  onImportBoards,
  onRemoveBoard,
  onSelectBoard,
}: BoardStripProps) {
  const boardCount = draft.boards.length
  const isFull = boardCount >= MAX_BOARD_COUNT
  const filePicker = useFilePicker({
    accept: GAME_FILE_ACCEPT,
    onFile: onImportBoards,
  })

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl bg-shade p-2">
      {filePicker.input}
      <div className="flex flex-wrap gap-1">
        <BoardTabs
          boardCount={boardCount}
          boardIndex={boardIndex}
          className="h-10 px-4 font-heading tracking-wider uppercase"
          inactiveVariant="ghost"
          getDetail={(index) => {
            const boards = [draft.boards[index]]
            return `${countCompleteQuestions({ boards })}/${countQuestions({ boards })}`
          }}
          onSelect={onSelectBoard}
        />
        <Button
          variant="outline"
          size="icon"
          className="size-10 border-dashed"
          aria-label="Add a board"
          disabled={isFull}
          onClick={onAddBoard}
        >
          <PlusIcon />
        </Button>
      </div>
      <div className="ml-auto">
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                variant="ghost"
                size="icon"
                className="size-10"
                aria-label={`Board ${boardIndex + 1} options`}
              />
            }
          >
            <EllipsisIcon />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem disabled={isFull} onClick={filePicker.open}>
              <UploadIcon />
              Import boards
            </DropdownMenuItem>
            <DropdownMenuItem
              variant="destructive"
              disabled={boardCount <= 1}
              onClick={onRemoveBoard}
            >
              <Trash2Icon />
              Remove board {boardIndex + 1}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}
