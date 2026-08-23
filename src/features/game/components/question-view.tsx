import { ArrowLeftIcon } from "lucide-react"
import type { Question } from "@/lib/db"
import { Button } from "@/components/ui/button"
import { Kbd } from "@/components/ui/kbd"

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
          <p className="flex flex-wrap items-center justify-center gap-x-1.5 gap-y-1 text-sm text-muted-foreground">
            {!isAnswerShown && (
              <>
                <Kbd>Space</Kbd>
                <span>shows the answer.</span>
              </>
            )}
            <Kbd>Esc</Kbd>
            <span>goes back to the board.</span>
          </p>
          <span className="font-heading text-2xl font-medium tracking-wide uppercase">
            {categoryName} <span className="text-primary">{value}</span>
          </span>
        </div>
        <div />
      </div>
      <div className="flex flex-1 flex-col items-center justify-center gap-10 text-center">
        <p className="max-w-5xl font-heading text-6xl leading-tight font-medium text-balance uppercase">
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
