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
    <div className="flex flex-1 flex-col bg-card px-6 py-5 text-card-foreground">
      {/* The empty cell on the right holds the middle block in the centre. */}
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4">
        <Button
          variant="outline"
          className="justify-self-start font-heading tracking-wider uppercase"
          onClick={onClose}
        >
          <ArrowLeftIcon />
          Board
        </Button>
        <span className="font-heading text-2xl font-semibold tracking-wider uppercase">
          {categoryName} <span className="text-primary">{value}</span>
        </span>
        <div />
      </div>
      <div className="flex flex-1 flex-col items-center justify-center gap-10 px-12 text-center">
        <p className="max-w-5xl font-clue text-5xl leading-snug font-bold text-balance uppercase text-shadow-[0_4px_0_var(--shade)]">
          {question.question}
        </p>
        {isAnswerShown && (
          <p className="max-w-4xl font-heading text-5xl font-semibold tracking-wide text-balance text-primary uppercase text-shadow-[0_3px_0_var(--shade)]">
            {question.answer}
          </p>
        )}
      </div>
      <p className="flex flex-wrap items-center justify-center gap-x-1.5 gap-y-1 font-heading text-sm tracking-wider text-muted-foreground uppercase">
        {!isAnswerShown && (
          <>
            <Kbd>Space</Kbd>
            <span>shows the answer.</span>
          </>
        )}
        <Kbd>Esc</Kbd>
        <span>goes back to the board.</span>
      </p>
    </div>
  )
}
