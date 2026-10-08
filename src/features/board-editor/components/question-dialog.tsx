import type { Question } from "@/lib/db"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"

type QuestionDialogProps = {
  categoryName: string
  isDailyDouble: boolean
  onChange: (question: Question) => void
  onClose: () => void
  /** No handler hides the daily double switch. */
  onToggleDailyDouble: (() => void) | undefined
  question: Question | undefined
  value: string
}

export function QuestionDialog({
  categoryName,
  isDailyDouble,
  onChange,
  onClose,
  onToggleDailyDouble,
  question,
  value,
}: QuestionDialogProps) {
  return (
    <Dialog
      open={question !== undefined}
      onOpenChange={(open) => open || onClose()}
    >
      <DialogContent>
        {question && (
          <>
            <DialogHeader>
              <DialogTitle>
                {categoryName || "Untitled category"} — {value}
              </DialogTitle>
            </DialogHeader>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="question-text">Question</FieldLabel>
                <Textarea
                  id="question-text"
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
            <DialogClose render={<Button>Done</Button>} />
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
