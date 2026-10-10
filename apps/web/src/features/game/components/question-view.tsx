import type { Question } from "@/lib/db"
import { Kbd } from "@/components/ui/kbd"
import { QuestionHeader } from "@/features/game/components/question-header"

type QuestionViewProps = {
  /** Shows the B key hint. */
  canOpenBuzzers: boolean
  /** No status hides the buzzer line. */
  buzzerStatus: string | undefined
  categoryName: string
  isAnswerShown: boolean
  onClose: () => void
  question: Question
  value: string
}

export function QuestionView({
  buzzerStatus,
  canOpenBuzzers,
  categoryName,
  isAnswerShown,
  onClose,
  question,
  value,
}: QuestionViewProps) {
  return (
    <div className="flex flex-1 flex-col bg-card px-6 py-5 text-card-foreground">
      <QuestionHeader onClose={onClose}>
        {categoryName} <span className="text-primary">{value}</span>
      </QuestionHeader>
      <div className="flex flex-1 flex-col items-center justify-center gap-10 px-12 text-center">
        <p className="max-w-5xl font-clue text-5xl leading-snug font-bold text-balance uppercase text-shadow-[0_4px_0_var(--shade)]">
          {question.question}
        </p>
        {buzzerStatus && (
          <p className="font-heading text-2xl tracking-widest text-primary uppercase">
            {buzzerStatus}
          </p>
        )}
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
        {canOpenBuzzers && (
          <>
            <Kbd>B</Kbd>
            <span>opens buzzing.</span>
          </>
        )}
        <Kbd>Esc</Kbd>
        <span>goes back to the board.</span>
      </p>
    </div>
  )
}
