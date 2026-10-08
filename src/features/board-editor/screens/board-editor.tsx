import { Fragment, useState } from "react"
import { PlusIcon, XIcon } from "lucide-react"
import type { Board, Game, GameDraft, Question } from "@/lib/db"
import {
  MAX_BOARD_COUNT,
  MAX_CATEGORY_COUNT,
  MAX_ROW_COUNT,
  addBoard,
  addCategory,
  addRow,
  buildEmptyDraft,
  formatValue,
  getRowCount,
  moveQuestion,
  setBoard,
  setCategoryName,
  setQuestion,
  setRowValue,
} from "@/lib/board"
import { saveGame } from "@/lib/games"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { parseGameFile } from "@/lib/game-file"
import { QuestionCell } from "@/features/board-editor/components/question-cell"
import { QuestionDialog } from "@/features/board-editor/components/question-dialog"
import { RowValueInput } from "@/features/board-editor/components/row-value-input"
import { EditorHeader } from "@/features/board-editor/components/editor-header"
import type { SaveState } from "@/features/board-editor/components/editor-header"
import { BoardStrip } from "@/features/board-editor/components/board-strip"
import { getDailyDoubleOps } from "@/lib/daily-doubles"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { removalDispatches } from "@/features/board-editor/lib/removals"
import type { Removal } from "@/features/board-editor/lib/removals"
import { useQuestionDrag } from "@/features/board-editor/hooks/use-question-drag"

type Selection = { categoryIndex: number; rowIndex: number }

type BoardEditorProps = {
  /** A board to edit. The editor reads it on the first render only. */
  game?: Game
}

export default function BoardEditor({ game }: BoardEditorProps) {
  const [draft, setDraft] = useState<GameDraft>(() =>
    game ? { boards: game.boards, title: game.title } : buildEmptyDraft()
  )
  // The board claims its key before the first write, so quick changes cannot
  // race each other into two rows. A new board reaches the database when the
  // host makes the first change to it.
  const [gameId] = useState(() => game?.id ?? crypto.randomUUID())
  const [boardIndex, setBoardIndex] = useState(0)
  const [selection, setSelection] = useState<Selection>()
  const [removal, setRemoval] = useState<Removal>()
  const [saveState, setSaveState] = useState<SaveState>(game ? "saved" : "new")
  const [isStored, setIsStored] = useState(Boolean(game))
  const [importError, setImportError] = useState<string>()

  const boardCount = draft.boards.length
  const board = draft.boards[boardIndex]
  const categoryCount = board.categories.length
  const rowCount = getRowCount(board)

  const dailyDoubleOps = getDailyDoubleOps(board.dailyDoubles)

  const selectedQuestion =
    selection &&
    board.categories[selection.categoryIndex].questions[selection.rowIndex]

  /**
   * Holds the change for the screen and writes it to the database. The screen
   * keeps its own copy, so the text of an input does not wait for the write.
   */
  const updateBoard = (next: GameDraft) => {
    setDraft(next)
    // A removed board can take the open tab with it.
    setBoardIndex((index) => Math.min(index, next.boards.length - 1))
    saveGame({ draft: next, id: gameId }).then(
      () => {
        setSaveState("saved")
        setIsStored(true)
      },
      () => setSaveState("failed")
    )
  }

  const updateCurrentBoard = (next: Board) =>
    updateBoard(setBoard({ board: next, boardIndex, draft }))

  const applyRemoval = ({ index, type }: Removal) =>
    updateBoard(removalDispatches[type].remove({ boardIndex, draft, index }))

  // A removal that throws no work away runs with no confirmation.
  const handleRemove = (next: Removal) => {
    const context = { boardIndex, draft, index: next.index }
    if (removalDispatches[next.type].hasContent(context)) {
      setRemoval(next)
      return
    }
    applyRemoval(next)
  }

  const handleConfirm = () => {
    if (!removal) return
    applyRemoval(removal)
    setRemoval(undefined)
  }

  const handleAddBoard = () => {
    updateBoard(addBoard(draft))
    setBoardIndex(boardCount)
  }

  // The boards of the file go after the boards that the game holds.
  const handleImportBoards = async (file: File) => {
    try {
      const { boards } = parseGameFile(await file.text())
      if (boardCount + boards.length > MAX_BOARD_COUNT) {
        setImportError(`A game holds ${MAX_BOARD_COUNT} boards at most.`)
        return
      }
      updateBoard({ ...draft, boards: [...draft.boards, ...boards] })
      setBoardIndex(boardCount)
      setImportError(undefined)
    } catch (error) {
      setImportError(
        error instanceof Error ? error.message : "The import did not work."
      )
    }
  }

  const questionDrag = useQuestionDrag((move) =>
    updateCurrentBoard(moveQuestion({ ...move, board }))
  )

  const handleToggleDailyDouble = () => {
    if (!selection) return
    updateCurrentBoard({
      ...board,
      dailyDoubles: dailyDoubleOps.togglePosition(selection),
    })
  }

  const handleQuestionChange = (question: Question) => {
    if (!selection) return
    updateCurrentBoard(setQuestion({ ...selection, board, question }))
  }

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-6">
      <EditorHeader
        draft={draft}
        gameId={gameId}
        isNew={!game}
        isStored={isStored}
        saveState={saveState}
        onTitleChange={(title) => updateBoard({ ...draft, title })}
      />

      {importError && <p className="text-sm text-destructive">{importError}</p>}

      <BoardStrip
        boardIndex={boardIndex}
        draft={draft}
        onAddBoard={handleAddBoard}
        onDailyDoublesChange={(dailyDoubles) =>
          updateCurrentBoard({ ...board, dailyDoubles })
        }
        onImportBoards={handleImportBoards}
        onRemoveBoard={() => handleRemove({ index: boardIndex, type: "board" })}
        onSelectBoard={setBoardIndex}
      />

      <div
        className="grid gap-2"
        // The column count changes at runtime, so Tailwind cannot name it.
        style={{
          gridTemplateColumns: `auto repeat(${categoryCount}, minmax(0, 1fr)) auto`,
        }}
      >
        <span className="self-center text-sm text-muted-foreground">
          Points
        </span>
        {board.categories.map((category, categoryIndex) => (
          <div key={categoryIndex} className="flex items-center gap-1">
            <Input
              aria-label={`Category ${categoryIndex + 1} name`}
              placeholder={`Category ${categoryIndex + 1}`}
              value={category.name}
              onChange={(event) =>
                updateCurrentBoard(
                  setCategoryName({
                    board,
                    categoryIndex,
                    name: event.target.value,
                  })
                )
              }
            />
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={`Remove category ${categoryIndex + 1}`}
              disabled={categoryCount <= 1}
              onClick={() =>
                handleRemove({ index: categoryIndex, type: "category" })
              }
            >
              <XIcon />
            </Button>
          </div>
        ))}
        <Button
          variant="outline"
          size="icon"
          aria-label="Add category"
          disabled={categoryCount >= MAX_CATEGORY_COUNT}
          onClick={() => updateCurrentBoard(addCategory(board))}
        >
          <PlusIcon />
        </Button>

        {/* Rows read across the categories, so the cells iterate by row. */}
        {Array.from({ length: rowCount }, (_, rowIndex) => (
          <Fragment key={rowIndex}>
            <RowValueInput
              label={`Points for row ${rowIndex + 1}`}
              value={board.values[rowIndex]}
              onChange={(value) =>
                updateCurrentBoard(setRowValue({ board, rowIndex, value }))
              }
            />
            {board.categories.map((category, categoryIndex) => (
              <QuestionCell
                key={categoryIndex}
                dragProps={questionDrag.getDragProps({
                  categoryIndex,
                  rowIndex,
                })}
                isDragged={questionDrag.isDragged({ categoryIndex, rowIndex })}
                isDropTarget={questionDrag.isDropTarget({
                  categoryIndex,
                  rowIndex,
                })}
                isDailyDouble={dailyDoubleOps.hasPosition({
                  categoryIndex,
                  rowIndex,
                })}
                question={category.questions[rowIndex]}
                value={formatValue(board.values[rowIndex])}
                onSelect={() => setSelection({ categoryIndex, rowIndex })}
              />
            ))}
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={`Remove the ${formatValue(board.values[rowIndex])} row`}
              disabled={rowCount <= 1}
              onClick={() => handleRemove({ index: rowIndex, type: "row" })}
            >
              <XIcon />
            </Button>
          </Fragment>
        ))}
      </div>

      <Button
        variant="outline"
        className="self-start"
        disabled={rowCount >= MAX_ROW_COUNT}
        onClick={() => updateCurrentBoard(addRow(board))}
      >
        <PlusIcon />
        Add row
      </Button>

      <QuestionDialog
        categoryName={
          selection ? board.categories[selection.categoryIndex].name : ""
        }
        question={selectedQuestion}
        value={selection ? formatValue(board.values[selection.rowIndex]) : ""}
        isDailyDouble={Boolean(
          selection && dailyDoubleOps.hasPosition(selection)
        )}
        onChange={handleQuestionChange}
        onClose={() => setSelection(undefined)}
        onToggleDailyDouble={
          dailyDoubleOps.isChoosable ? handleToggleDailyDouble : undefined
        }
      />

      <ConfirmDialog
        prompt={
          removal &&
          removalDispatches[removal.type].buildPrompt({
            boardIndex,
            draft,
            index: removal.index,
          })
        }
        onCancel={() => setRemoval(undefined)}
        onConfirm={handleConfirm}
      />
    </main>
  )
}
