import { Fragment, useState } from "react"
import { useLiveQuery } from "dexie-react-hooks"
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
  countCompleteQuestions,
  countQuestions,
  formatBoardCount,
  formatValue,
  getRowCount,
  isDraftComplete,
  setBoard,
  setCategoryName,
  setQuestion,
  setRowValue,
} from "@/lib/board"
import { listGames, saveGame } from "@/lib/games"
import { Button } from "@/components/ui/button"
import { Field, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { BoardTabs } from "@/components/board-tabs"
import { ButtonLink } from "@/components/button-link"
import { QuestionCell } from "@/features/board-editor/components/question-cell"
import { QuestionDialog } from "@/features/board-editor/components/question-dialog"
import { RowValueInput } from "@/features/board-editor/components/row-value-input"
import { DailyDoubleSettings } from "@/features/board-editor/components/daily-double-settings"
import { getDailyDoubleOps } from "@/lib/daily-doubles"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { removalDispatches } from "@/features/board-editor/lib/removals"
import type { Removal } from "@/features/board-editor/lib/removals"

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
  const [gameId, setGameId] = useState(() => game?.id ?? crypto.randomUUID())
  const [boardIndex, setBoardIndex] = useState(0)
  const [selection, setSelection] = useState<Selection>()
  const [removal, setRemoval] = useState<Removal>()
  const [hasSaveFailed, setHasSaveFailed] = useState(false)
  const savedGames = useLiveQuery(listGames, [], [])

  const boardCount = draft.boards.length
  const board = draft.boards[boardIndex]
  const categoryCount = board.categories.length
  const rowCount = getRowCount(board)
  const otherGames = savedGames.filter((savedGame) => savedGame.id !== gameId)

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
      () => setHasSaveFailed(false),
      () => setHasSaveFailed(true)
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

  // The board that the editor holds stays in the database, so a new board only
  // needs an empty draft under a new key.
  const handleNew = () => {
    setDraft(buildEmptyDraft())
    setGameId(crypto.randomUUID())
    setBoardIndex(0)
  }

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-6 p-6">
      <div className="flex items-center gap-2">
        <ButtonLink variant="ghost" to="/">
          Home
        </ButtonLink>
        <ButtonLink variant="ghost" to="/play">
          Boards
        </ButtonLink>
      </div>
      <div className="flex items-end justify-between gap-4">
        <Field className="max-w-sm">
          <FieldLabel htmlFor="board-title">Board title</FieldLabel>
          <Input
            id="board-title"
            value={draft.title}
            onChange={(event) =>
              updateBoard({ ...draft, title: event.target.value })
            }
          />
        </Field>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            {countCompleteQuestions(draft)} of {countQuestions(draft)} questions
            {isDraftComplete(draft) ? " — ready" : ""}
          </span>
          {game ? (
            <ButtonLink variant="outline" to="/create">
              New board
            </ButtonLink>
          ) : (
            <Button variant="outline" onClick={handleNew}>
              New board
            </Button>
          )}
        </div>
      </div>

      {hasSaveFailed && (
        <p className="text-sm text-destructive">
          The browser did not keep the last change. Look at the space that the
          browser gives to this site.
        </p>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <BoardTabs
          boardCount={boardCount}
          boardIndex={boardIndex}
          onSelect={setBoardIndex}
        />
        <Button
          variant="outline"
          disabled={boardCount >= MAX_BOARD_COUNT}
          onClick={handleAddBoard}
        >
          <PlusIcon />
          Add board
        </Button>
        <Button
          variant="ghost"
          className="ml-auto"
          disabled={boardCount <= 1}
          onClick={() => handleRemove({ index: boardIndex, type: "board" })}
        >
          <XIcon />
          Remove board {boardIndex + 1}
        </Button>
      </div>

      <DailyDoubleSettings
        boardIndex={boardIndex}
        dailyDoubles={board.dailyDoubles}
        onChange={(dailyDoubles) =>
          updateCurrentBoard({ ...board, dailyDoubles })
        }
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

      {otherGames.length > 0 && (
        <div className="flex flex-col gap-2">
          <h2 className="text-sm font-medium">Other boards</h2>
          {otherGames.map((savedGame) => (
            <div key={savedGame.id} className="flex items-center gap-2 text-sm">
              <span>{savedGame.title || "Untitled board"}</span>
              <span className="text-muted-foreground">
                {formatBoardCount(savedGame.boards.length)}
              </span>
              <ButtonLink
                variant="ghost"
                to="/edit/$gameId"
                params={{ gameId: savedGame.id }}
              >
                Edit
              </ButtonLink>
            </div>
          ))}
        </div>
      )}
    </main>
  )
}
