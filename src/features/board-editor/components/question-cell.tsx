import type { Question } from "@/lib/db"
import type { QuestionStatus } from "@/lib/board"
import { Button } from "@/components/ui/button"
import { getQuestionStatus } from "@/lib/board"
import { cn } from "@/lib/utils"

const STATUS_LABEL: Record<QuestionStatus, string> = {
  complete: "",
  empty: "Empty",
  "no-answer": "No answer yet",
  "no-question": "No question yet",
}

type QuestionCellProps = {
  onSelect: () => void
  question: Question
  value: string
}

export function QuestionCell({ onSelect, question, value }: QuestionCellProps) {
  const status = getQuestionStatus(question)

  return (
    <Button
      variant="outline"
      className={cn(
        "flex h-20 w-full flex-col items-start gap-1 p-2 text-left",
        // A full question gets a firm edge and a question that the board still
        // needs gets a dashed, faint one. The dark rule holds the firm edge
        // against `dark:border-input` in the variant of the button.
        status === "complete"
          ? "border-foreground/30 dark:border-foreground/30"
          : "border-dashed opacity-60"
      )}
      onClick={onSelect}
    >
      <span className="font-semibold">{value}</span>
      {status === "complete" ? (
        <span className="w-full truncate text-xs text-muted-foreground">
          {question.question}
        </span>
      ) : (
        <span
          className={cn(
            "w-full truncate text-xs",
            // A half-written question is a mistake, an empty one is only work
            // that is not done yet.
            status === "empty" ? "text-muted-foreground" : "text-destructive"
          )}
        >
          {STATUS_LABEL[status]}
        </span>
      )}
    </Button>
  )
}
