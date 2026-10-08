import { useRef } from "react"
import { ArrowLeftIcon, ArrowRightIcon, XIcon } from "lucide-react"
import type { Question } from "@/lib/db"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { POPUP_FIELD_CLASS } from "@/features/board-editor/lib/popup-field"

type QuestionDialogProps = {
  categoryName: string
  isDailyDouble: boolean
  onChange: (question: Question) => void
  onClose: () => void
  /** No handler disables the button, at that end of the board. */
  onNext: (() => void) | undefined
  onPrevious: (() => void) | undefined
  /** No handler hides the daily double switch. */
  onToggleDailyDouble: (() => void) | undefined
  /** No question closes the dialog. */
  question: Question | undefined
  /** Changes when the host steps to another question. */
  questionKey: string
  value: string
}

export function QuestionDialog({
  categoryName,
  isDailyDouble,
  onChange,
  onClose,
  onNext,
  onPrevious,
  onToggleDailyDouble,
  question,
  questionKey,
  value,
}: QuestionDialogProps) {
  const questionRef = useRef<HTMLTextAreaElement>(null)

  return (
    <Dialog
      open={question !== undefined}
      onOpenChange={(open) => open || onClose()}
    >
      <DialogContent
        showCloseButton={false}
        initialFocus={questionRef}
        className="gap-4 rounded-2xl border bg-secondary p-5 sm:max-w-md"
      >
        {question && (
          <>
            <div className="flex items-start justify-between gap-2">
              <DialogTitle className="flex min-w-0 flex-col">
                <span className="truncate font-heading text-sm tracking-widest text-muted-foreground uppercase">
                  {categoryName || "Untitled category"}
                </span>
                <span className="font-heading text-3xl font-bold text-primary tabular-nums">
                  {value}
                </span>
              </DialogTitle>
              <DialogClose
                render={
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Close the question"
                  />
                }
              >
                <XIcon />
              </DialogClose>
            </div>
            {/* A new key per question puts the focus back on its field. */}
            <FieldGroup key={questionKey}>
              <Field>
                <FieldLabel htmlFor="question-text">Question</FieldLabel>
                <Textarea
                  ref={questionRef}
                  autoFocus
                  id="question-text"
                  className={cn("min-h-24", POPUP_FIELD_CLASS)}
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
                  className={POPUP_FIELD_CLASS}
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
              Next goes down the category, then on to the next one. Changes save
              as you type.
            </p>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
