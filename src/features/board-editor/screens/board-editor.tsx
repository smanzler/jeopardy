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
import { ButtonLink } from "@/components/button-link"
import { QuestionCell } from "@/features/board-editor/components/question-cell"
import { QuestionDialog } from "@/features/board-editor/components/question-dialog"
import { ConfirmDialog } from "@/components/confirm-dialog"
import type { ConfirmPrompt } from "@/components/confirm-dialog"

type Selection = { categoryIndex: number; rowIndex: number }

/** A removal that deletes work, and that waits for a confirmation. */
type PendingRemoval =
  | { categoryIndex: number; type: "category" }
  | { rowIndex: number; type: "row" }

const REMOVAL_WARNING = "This deletes the questions and the answers in it."

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
  // The board claims its key before the first write, so quick changes cannot
  // race each other into two rows. A new board reaches the database when the
  // host makes the first change to it.
  const [gameId, setGameId] = useState(() => game?.id ?? crypto.randomUUID())
  const [selection, setSelection] = useState<Selection>()
  const [removal, setRemoval] = useState<PendingRemoval>()
  const [hasSaveFailed, setHasSaveFailed] = useState(false)
  const savedGames = useLiveQuery(listGames, [], [])

  const categoryCount = draft.categories.length
  const rowCount = getRowCount(draft.categories)
  const otherGames = savedGames.filter((savedGame) => savedGame.id !== gameId)

  const selectedQuestion =
    selection &&
    draft.categories[selection.categoryIndex].questions[selection.rowIndex]

  /**
   * Holds the change for the screen and writes it to the database. The screen
   * keeps its own copy, so the text of an input does not wait for the write.
   */
  const updateBoard = (next: GameDraft) => {
    setDraft(next)
    saveGame({ draft: next, id: gameId }).then(
      () => setHasSaveFailed(false),
      () => setHasSaveFailed(true)
    )
  }

  const buildConfirmPrompt = (action: PendingRemoval): ConfirmPrompt => {
    switch (action.type) {
      case "category":
        return {
          cancelLabel: "Keep it",
          confirmLabel: "Remove",
          description: REMOVAL_WARNING,
          title: `Remove ${draft.categories[action.categoryIndex].name || `category ${action.categoryIndex + 1}`}?`,
        }
      case "row":
        return {
          cancelLabel: "Keep it",
          confirmLabel: "Remove",
          description: REMOVAL_WARNING,
          title: `Remove the ${formatRowValue(action.rowIndex)} row?`,
        }
    }
  }

  // A removal that throws no work away runs with no confirmation.
  const handleRemoveCategory = (categoryIndex: number) => {
    if (hasCategoryContent(draft.categories[categoryIndex])) {
      setRemoval({ categoryIndex, type: "category" })
      return
    }
    updateBoard(removeCategory({ categoryIndex, draft }))
  }

  const handleRemoveRow = (rowIndex: number) => {
    if (hasRowContent({ draft, rowIndex })) {
      setRemoval({ rowIndex, type: "row" })
      return
    }
    updateBoard(removeRow({ draft, rowIndex }))
  }

  const handleConfirm = () => {
    if (!removal) return
    switch (removal.type) {
      case "category":
        updateBoard(
          removeCategory({ categoryIndex: removal.categoryIndex, draft })
        )
        break
      case "row":
        updateBoard(removeRow({ draft, rowIndex: removal.rowIndex }))
        break
    }
    setRemoval(undefined)
  }

  const handleQuestionChange = (question: Question) => {
    if (!selection) return
    updateBoard(setQuestion({ ...selection, draft, question }))
  }

  // The board that the editor holds stays in the database, so a new board only
  // needs an empty draft under a new key.
  const handleNew = () => {
    setDraft(buildEmptyDraft())
    setGameId(crypto.randomUUID())
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
                updateBoard(
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
          onClick={() => updateBoard(addCategory(draft))}
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
        onClick={() => updateBoard(addRow(draft))}
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
        prompt={removal && buildConfirmPrompt(removal)}
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
                {savedGame.categories.length} categories,{" "}
                {getRowCount(savedGame.categories)} rows
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
