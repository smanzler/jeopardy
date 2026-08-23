import { Fragment, useState } from "react"
import { useLiveQuery } from "dexie-react-hooks"
import { PlusIcon, XIcon } from "lucide-react"
import type { Game, GameDraft, Question } from "@/lib/db"
import {
  MAX_CATEGORY_COUNT,
  MAX_ROW_COUNT,
  addCategory,
  addRow,
  buildEmptyDraft,
  countCompleteQuestions,
  countQuestions,
  formatRowValue,
  getRowCount,
  hasCategoryContent,
  hasDraftContent,
  hasRowContent,
  isDraftComplete,
  removeCategory,
  removeRow,
  setCategoryName,
  setQuestion,
} from "@/lib/board"
import { listGames, saveGame } from "@/lib/games"
import { Button } from "@/components/ui/button"
import { Field, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { QuestionCell } from "@/features/board-editor/components/question-cell"
import { QuestionDialog } from "@/features/board-editor/components/question-dialog"
import { ConfirmDialog } from "@/features/board-editor/components/confirm-dialog"
import type { ConfirmPrompt } from "@/features/board-editor/components/confirm-dialog"

type Selection = { categoryIndex: number; rowIndex: number }

/** An action that throws work away, and that waits for a confirmation. */
type PendingAction =
  | { categoryIndex: number; type: "remove-category" }
  | { game: Game; type: "open-board" }
  | { rowIndex: number; type: "remove-row" }
  | { type: "new-board" }

const REMOVAL_WARNING = "This deletes the questions and the answers in it."

const UNSAVED_WARNING =
  "The board that you have now has changes that you did not save. You lose those changes."

export default function BoardEditor() {
  const [draft, setDraft] = useState(buildEmptyDraft)
  const [gameId, setGameId] = useState<string>()
  const [selection, setSelection] = useState<Selection>()
  const [pending, setPending] = useState<PendingAction>()
  // Each edit builds a new draft, so the reference tells if a save is current.
  const [savedDraft, setSavedDraft] = useState<GameDraft>()
  const savedGames = useLiveQuery(listGames, [], [])

  const categoryCount = draft.categories.length
  const rowCount = getRowCount(draft)
  const hasUnsavedChanges = hasDraftContent(draft) && draft !== savedDraft

  const selectedQuestion =
    selection &&
    draft.categories[selection.categoryIndex].questions[selection.rowIndex]

  const handleSave = async () => {
    const game = await saveGame({ draft, id: gameId })
    setGameId(game.id)
    setSavedDraft(draft)
  }

  const buildConfirmPrompt = (action: PendingAction): ConfirmPrompt => {
    switch (action.type) {
      case "remove-category":
        return {
          confirmLabel: "Remove",
          description: REMOVAL_WARNING,
          title: `Remove ${draft.categories[action.categoryIndex].name || `category ${action.categoryIndex + 1}`}?`,
        }
      case "remove-row":
        return {
          confirmLabel: "Remove",
          description: REMOVAL_WARNING,
          title: `Remove the ${formatRowValue(action.rowIndex)} row?`,
        }
      case "new-board":
        return {
          confirmLabel: "Start a new board",
          description: UNSAVED_WARNING,
          title: "Start a new board?",
        }
      case "open-board":
        return {
          confirmLabel: "Open it",
          description: UNSAVED_WARNING,
          title: `Open ${action.game.title || "the untitled board"}?`,
        }
    }
  }

  const startNewBoard = () => {
    setDraft(buildEmptyDraft())
    setGameId(undefined)
    setSavedDraft(undefined)
  }

  const openBoard = (game: Game) => {
    const opened = { categories: game.categories, title: game.title }
    setDraft(opened)
    setGameId(game.id)
    setSavedDraft(opened)
  }

  // An action that throws no work away runs with no confirmation.
  const handleRemoveCategory = (categoryIndex: number) => {
    if (hasCategoryContent(draft.categories[categoryIndex])) {
      setPending({ categoryIndex, type: "remove-category" })
      return
    }
    setDraft(removeCategory({ categoryIndex, draft }))
  }

  const handleRemoveRow = (rowIndex: number) => {
    if (hasRowContent({ draft, rowIndex })) {
      setPending({ rowIndex, type: "remove-row" })
      return
    }
    setDraft(removeRow({ draft, rowIndex }))
  }

  const handleNew = () => {
    if (hasUnsavedChanges) {
      setPending({ type: "new-board" })
      return
    }
    startNewBoard()
  }

  const handleOpen = (game: Game) => {
    if (hasUnsavedChanges) {
      setPending({ game, type: "open-board" })
      return
    }
    openBoard(game)
  }

  const handleConfirm = () => {
    if (!pending) return
    switch (pending.type) {
      case "remove-category":
        setDraft(
          removeCategory({ categoryIndex: pending.categoryIndex, draft })
        )
        break
      case "remove-row":
        setDraft(removeRow({ draft, rowIndex: pending.rowIndex }))
        break
      case "new-board":
        startNewBoard()
        break
      case "open-board":
        openBoard(pending.game)
        break
    }
    setPending(undefined)
  }

  const handleQuestionChange = (question: Question) => {
    if (!selection) return
    setDraft(setQuestion({ ...selection, draft, question }))
  }

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-6 p-6">
      <div className="flex items-end justify-between gap-4">
        <Field className="max-w-sm">
          <FieldLabel htmlFor="board-title">Board title</FieldLabel>
          <Input
            id="board-title"
            value={draft.title}
            onChange={(event) =>
              setDraft({ ...draft, title: event.target.value })
            }
          />
        </Field>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            {countCompleteQuestions(draft)} of {countQuestions(draft)} questions
            {isDraftComplete(draft) ? " — ready" : ""}
          </span>
          <Button variant="outline" onClick={handleNew}>
            New board
          </Button>
          <Button onClick={handleSave}>
            {gameId ? "Save changes" : "Save board"}
          </Button>
        </div>
      </div>

      <div
        className="grid gap-2"
        // The column count changes at runtime, so Tailwind cannot name it.
        style={{
          gridTemplateColumns: `repeat(${categoryCount}, minmax(0, 1fr)) auto`,
        }}
      >
        {draft.categories.map((category, categoryIndex) => (
          <div key={categoryIndex} className="flex items-center gap-1">
            <Input
              aria-label={`Category ${categoryIndex + 1} name`}
              placeholder={`Category ${categoryIndex + 1}`}
              value={category.name}
              onChange={(event) =>
                setDraft(
                  setCategoryName({
                    categoryIndex,
                    draft,
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
              onClick={() => handleRemoveCategory(categoryIndex)}
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
          onClick={() => setDraft(addCategory(draft))}
        >
          <PlusIcon />
        </Button>

        {/* Rows read across the categories, so the cells iterate by row. */}
        {Array.from({ length: rowCount }, (_, rowIndex) => (
          <Fragment key={rowIndex}>
            {draft.categories.map((category, categoryIndex) => (
              <QuestionCell
                key={categoryIndex}
                question={category.questions[rowIndex]}
                value={formatRowValue(rowIndex)}
                onSelect={() => setSelection({ categoryIndex, rowIndex })}
              />
            ))}
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={`Remove the ${formatRowValue(rowIndex)} row`}
              disabled={rowCount <= 1}
              onClick={() => handleRemoveRow(rowIndex)}
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
        onClick={() => setDraft(addRow(draft))}
      >
        <PlusIcon />
        Add row
      </Button>

      <QuestionDialog
        categoryName={
          selection ? draft.categories[selection.categoryIndex].name : ""
        }
        question={selectedQuestion}
        value={selection ? formatRowValue(selection.rowIndex) : ""}
        onChange={handleQuestionChange}
        onClose={() => setSelection(undefined)}
      />

      <ConfirmDialog
        prompt={pending && buildConfirmPrompt(pending)}
        onCancel={() => setPending(undefined)}
        onConfirm={handleConfirm}
      />

      {savedGames.length > 0 && (
        <div className="flex flex-col gap-2">
          <h2 className="text-sm font-medium">Saved boards</h2>
          {savedGames.map((game) => (
            <div key={game.id} className="flex items-center gap-2 text-sm">
              <span>{game.title || "Untitled board"}</span>
              <span className="text-muted-foreground">
                {game.categories.length} categories, {getRowCount(game)} rows
              </span>
              <Button variant="ghost" onClick={() => handleOpen(game)}>
                Open
              </Button>
            </div>
          ))}
        </div>
      )}
    </main>
  )
}
