import { ArrowLeftIcon } from "lucide-react"
import type { Question } from "@/lib/db"
import { Button } from "@/components/ui/button"

type QuestionViewProps = {
  categoryName: string
  isAnswerShown: boolean
  onClose: () => void
  question: Question
  value: string
}

export function QuestionView({
  categoryName,
  isAnswerShown,
  onClose,
  question,
  value,
}: QuestionViewProps) {
  return (
    <div className="flex flex-1 flex-col p-8">
      {/* The empty cell on the right holds the middle block in the centre. */}
      <div className="grid grid-cols-[1fr_auto_1fr] items-start gap-4">
        <Button
          variant="outline"
          className="justify-self-start"
          onClick={onClose}
        >
          <ArrowLeftIcon />
          Board
        </Button>
        <div className="flex flex-col items-center gap-2 text-center">
          <p className="text-sm text-muted-foreground">
            {isAnswerShown
              ? "Esc goes back to the board."
              : "Space shows the answer. Esc goes back to the board."}
          </p>
          <span className="text-2xl font-semibold tracking-wide uppercase">
            {categoryName} {value}
          </span>
        </div>
        <div />
      </div>
      <div className="flex flex-1 flex-col items-center justify-center gap-10 text-center">
        <p className="max-w-5xl text-6xl leading-tight font-semibold text-balance">
          {question.question}
        </p>
        {isAnswerShown && (
          <p className="max-w-4xl text-4xl text-balance text-primary">
            {question.answer}
          </p>
        )}
      </div>
    </div>
  )
}
