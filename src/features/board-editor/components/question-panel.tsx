import { ArrowLeftIcon, ArrowRightIcon, XIcon } from "lucide-react"
import type { Question } from "@/lib/db"
import { Button } from "@/components/ui/button"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"

type QuestionPanelProps = {
  categoryName: string
  isDailyDouble: boolean
  onChange: (question: Question) => void
  onClose: () => void
  /** No handler disables the button, at that end of the board. */
  onNext: (() => void) | undefined
  onPrevious: (() => void) | undefined
  /** No handler hides the daily double switch. */
  onToggleDailyDouble: (() => void) | undefined
  question: Question
  value: string
}

/** Edits the open question beside the board. */
export function QuestionPanel({
  categoryName,
  isDailyDouble,
  onChange,
  onClose,
  onNext,
  onPrevious,
  onToggleDailyDouble,
  question,
  value,
}: QuestionPanelProps) {
  return (
    <aside
      aria-label="Question"
      className="flex flex-col gap-4 self-start rounded-2xl border bg-secondary p-5"
      onKeyDown={(event) => {
        if (event.key === "Escape") onClose()
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 flex-col">
          <span className="truncate font-heading text-sm tracking-widest text-muted-foreground uppercase">
            {categoryName || "Untitled category"}
          </span>
          <span className="font-heading text-3xl font-bold text-primary tabular-nums">
            {value}
          </span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Close the question"
          onClick={onClose}
        >
          <XIcon />
        </Button>
      </div>
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="question-text">Question</FieldLabel>
          <Textarea
            // The field takes the focus each time the host opens a question.
            autoFocus
            id="question-text"
            className="min-h-24"
            value={question.question}
            onChange={(event) =>
              onChange({ ...question, question: event.target.value })
            }
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="question-answer">Answer</FieldLabel>
          <Input
            id="question-answer"
            value={question.answer}
            onChange={(event) =>
              onChange({ ...question, answer: event.target.value })
            }
          />
        </Field>
        {onToggleDailyDouble && (
          <Field orientation="horizontal">
            <Switch
              id="question-daily-double"
              checked={isDailyDouble}
              onCheckedChange={onToggleDailyDouble}
            />
            <FieldLabel htmlFor="question-daily-double">
              Daily double
            </FieldLabel>
          </Field>
        )}
      </FieldGroup>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="lg"
          className="flex-1 font-heading tracking-wider uppercase"
          disabled={!onPrevious}
          onClick={onPrevious}
        >
          <ArrowLeftIcon />
          Previous
        </Button>
        <Button
          size="lg"
          className="flex-1 font-heading tracking-wider uppercase"
          disabled={!onNext}
          onClick={onNext}
        >
          Next
          <ArrowRightIcon />
        </Button>
      </div>
      <p className="text-sm text-muted-foreground">
        Next goes down the category, then on to the next one. Changes save as
        you type.
      </p>
    </aside>
  )
}
