import { useState } from "react"
import { useLiveQuery } from "dexie-react-hooks"
import type { Game, Question } from "@/lib/db"
import {
  QUESTION_COUNT,
  buildEmptyDraft,
  countCompleteQuestions,
  isDraftComplete,
  setCategoryName,
  setQuestion,
} from "@/lib/board"
import { listGames, saveGame } from "@/lib/games"
import { Button } from "@/components/ui/button"
import { Field, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { QuestionCell } from "@/features/board-editor/components/question-cell"
import { QuestionDialog } from "@/features/board-editor/components/question-dialog"

type Selection = { categoryIndex: number; questionIndex: number }

export default function BoardEditor() {
  const [draft, setDraft] = useState(buildEmptyDraft)
  const [gameId, setGameId] = useState<string>()
  const [selection, setSelection] = useState<Selection>()
  const savedGames = useLiveQuery(listGames, [], [])

  const selectedQuestion =
    selection &&
    draft.categories[selection.categoryIndex].questions[selection.questionIndex]

  const handleSave = async () => {
    const game = await saveGame({ draft, id: gameId })
    setGameId(game.id)
  }

  const handleQuestionChange = (question: Question) => {
    if (!selection) return
    setDraft(setQuestion({ ...selection, draft, question }))
  }

  const handleOpen = (game: Game) => {
    setDraft({ categories: game.categories, title: game.title })
    setGameId(game.id)
  }

  const handleNew = () => {
    setDraft(buildEmptyDraft())
    setGameId(undefined)
  }

  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-6 p-6">
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
            {countCompleteQuestions(draft)} of {QUESTION_COUNT} questions
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

      <div className="grid grid-cols-5 gap-2">
        {draft.categories.map((category, categoryIndex) => (
          <Input
            key={categoryIndex}
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
        ))}
        {/* Rows read across the categories, so the cells iterate by value. */}
        {draft.categories[0].questions.map((_, questionIndex) =>
          draft.categories.map((category, categoryIndex) => (
            <QuestionCell
              key={`${categoryIndex}-${questionIndex}`}
              question={category.questions[questionIndex]}
              onSelect={() => setSelection({ categoryIndex, questionIndex })}
            />
          ))
        )}
      </div>

      <QuestionDialog
        categoryName={
          selection ? draft.categories[selection.categoryIndex].name : ""
        }
        question={selectedQuestion}
        onChange={handleQuestionChange}
        onClose={() => setSelection(undefined)}
      />

      {savedGames.length > 0 && (
        <div className="flex flex-col gap-2">
          <h2 className="text-sm font-medium">Saved boards</h2>
          {savedGames.map((game) => (
            <div key={game.id} className="flex items-center gap-2 text-sm">
              <span>{game.title || "Untitled board"}</span>
              <span className="text-muted-foreground">
                {countCompleteQuestions(game)} of {QUESTION_COUNT} questions
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
