import type { Question } from "@/lib/db"
import { Button } from "@/components/ui/button"
import { formatQuestionValue, isQuestionComplete } from "@/lib/board"

type QuestionCellProps = {
  onSelect: () => void
  question: Question
}

export function QuestionCell({ onSelect, question }: QuestionCellProps) {
  return (
    <Button
      variant="outline"
      className="flex h-20 w-full flex-col items-start gap-1 p-2 text-left"
      onClick={onSelect}
    >
      <span className="font-semibold">
        {formatQuestionValue(question.value)}
      </span>
      <span className="w-full truncate text-xs text-muted-foreground">
        {isQuestionComplete(question) ? question.question : "Empty"}
      </span>
    </Button>
  )
}
