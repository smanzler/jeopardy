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
import { Textarea } from "@/components/ui/textarea"
import { formatQuestionValue } from "@/lib/board"

type QuestionDialogProps = {
  categoryName: string
  onChange: (question: Question) => void
  onClose: () => void
  question: Question | undefined
}

export function QuestionDialog({
  categoryName,
  onChange,
  onClose,
  question,
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
                {categoryName || "Untitled category"} —{" "}
                {formatQuestionValue(question.value)}
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
            </FieldGroup>
            <DialogClose render={<Button>Done</Button>} />
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
