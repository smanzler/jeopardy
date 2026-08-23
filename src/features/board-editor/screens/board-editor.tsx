import { Fragment, useState } from "react"
import { Link, useBlocker } from "@tanstack/react-router"
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
import { ConfirmDialog } from "@/components/confirm-dialog"
import type { ConfirmPrompt } from "@/components/confirm-dialog"

type Selection = { categoryIndex: number; rowIndex: number }

/** An action that throws work away, and that waits for a confirmation. */
type PendingAction =
  | { categoryIndex: number; type: "remove-category" }
  | { rowIndex: number; type: "remove-row" }
  | { type: "new-board" }

const REMOVAL_WARNING = "This deletes the questions and the answers in it."

const UNSAVED_WARNING =
  "The board that you have now has changes that you did not save. You lose those changes."

const LEAVE_PROMPT = {
  cancelLabel: "Stay here",
  confirmLabel: "Leave the board",
  description: UNSAVED_WARNING,
  title: "Leave the board?",
}

type BoardEditorProps = {
  /** A board to edit. The editor reads it on the first render only. */
  game?: Game
}

export default function BoardEditor({ game }: BoardEditorProps) {
  const [draft, setDraft] = useState<GameDraft>(() =>
    game
      ? { categories: game.categories, title: game.title }
      : buildEmptyDraft()
  )
  // Each edit builds a new draft, so the reference tells if a save is current.
  // A board that comes from the database starts as the draft that it holds.
  const [savedDraft, setSavedDraft] = useState(() => (game ? draft : undefined))
  const [gameId, setGameId] = useState(game?.id)
  const [selection, setSelection] = useState<Selection>()
  const [pending, setPending] = useState<PendingAction>()
  const savedGames = useLiveQuery(listGames, [], [])

  const categoryCount = draft.categories.length
  const rowCount = getRowCount(draft.categories)
  const hasUnsavedChanges = hasDraftContent(draft) && draft !== savedDraft

  // A link out of the editor throws the work away, the same as a new board.
  const blocker = useBlocker({
    enableBeforeUnload: () => hasUnsavedChanges,
    shouldBlockFn: () => hasUnsavedChanges,
    withResolver: true,
  })

  const selectedQuestion =
    selection &&
    draft.categories[selection.categoryIndex].questions[selection.rowIndex]

  const handleSave = async () => {
    const saved = await saveGame({ draft, id: gameId })
    setGameId(saved.id)
    setSavedDraft(draft)
  }

  const buildConfirmPrompt = (action: PendingAction): ConfirmPrompt => {
    switch (action.type) {
      case "remove-category":
        return {
          cancelLabel: "Keep it",
          confirmLabel: "Remove",
          description: REMOVAL_WARNING,
          title: `Remove ${draft.categories[action.categoryIndex].name || `category ${action.categoryIndex + 1}`}?`,
        }
      case "remove-row":
        return {
          cancelLabel: "Keep it",
          confirmLabel: "Remove",
          description: REMOVAL_WARNING,
          title: `Remove the ${formatRowValue(action.rowIndex)} row?`,
        }
      case "new-board":
        return {
          cancelLabel: "Keep it",
          confirmLabel: "Start a new board",
          description: UNSAVED_WARNING,
          title: "Start a new board?",
        }
    }
  }

  const startNewBoard = () => {
    setDraft(buildEmptyDraft())
    setGameId(undefined)
    setSavedDraft(undefined)
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
    }
    setPending(undefined)
  }

  const handleQuestionChange = (question: Question) => {
    if (!selection) return
    setDraft(setQuestion({ ...selection, draft, question }))
  }

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-6 p-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" render={<Link to="/" />}>
          Home
        </Button>
        <Button variant="ghost" render={<Link to="/play" />}>
          Boards
        </Button>
      </div>
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
          {game ? (
            <Button variant="outline" render={<Link to="/create" />}>
              New board
            </Button>
          ) : (
            <Button variant="outline" onClick={handleNew}>
              New board
            </Button>
          )}
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

      <ConfirmDialog
        prompt={blocker.status === "blocked" ? LEAVE_PROMPT : undefined}
        onCancel={() => blocker.reset?.()}
        onConfirm={() => blocker.proceed?.()}
      />

      {savedGames.length > 0 && (
        <div className="flex flex-col gap-2">
          <h2 className="text-sm font-medium">Saved boards</h2>
          {savedGames.map((savedGame) => (
            <div key={savedGame.id} className="flex items-center gap-2 text-sm">
              <span>{savedGame.title || "Untitled board"}</span>
              <span className="text-muted-foreground">
                {savedGame.categories.length} categories,{" "}
                {getRowCount(savedGame.categories)} rows
              </span>
              <Button
                variant="ghost"
                render={
                  <Link to="/edit/$gameId" params={{ gameId: savedGame.id }} />
                }
              >
                Edit
              </Button>
            </div>
          ))}
        </div>
      )}
    </main>
  )
}
