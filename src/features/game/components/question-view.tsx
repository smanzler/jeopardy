import type { Question } from "@/lib/db"

type QuestionViewProps = {
  categoryName: string
  isAnswerShown: boolean
  question: Question
  value: string
}

export function QuestionView({
  categoryName,
  isAnswerShown,
  question,
  value,
}: QuestionViewProps) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-10 p-8 text-center">
      <span className="text-2xl font-semibold tracking-wide text-muted-foreground uppercase">
        {categoryName} {value}
      </span>
      <p className="max-w-5xl text-6xl leading-tight font-semibold text-balance">
        {question.question}
      </p>
      {isAnswerShown ? (
        <p className="max-w-4xl text-4xl text-balance text-primary">
          {question.answer}
        </p>
      ) : (
        <p className="text-sm text-muted-foreground">
          Space shows the answer. Esc goes back to the board.
        </p>
      )}
    </div>
  )
}
