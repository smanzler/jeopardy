import type { Question } from "@/lib/db"
import type { QuestionStatus } from "@/lib/board"
import { Button } from "@/components/ui/button"
import { getQuestionStatus } from "@/lib/board"
import { cn } from "@/lib/utils"
import type { QuestionDragProps } from "@/features/board-editor/hooks/use-question-drag"

type StatusView = {
  className: string
  /** A warning under the text. A half-written question is a mistake. */
  note?: string
  /** The text that the cell shows for the question. */
  toText: (question: Question) => string
}

const STATUS_VIEWS: Record<QuestionStatus, StatusView> = {
  complete: {
    className: "bg-card",
    toText: (question) => question.question,
  },
  empty: {
    className:
      "items-center justify-center border border-dashed bg-transparent text-muted-foreground",
    toText: () => "+ Add question",
  },
  "no-answer": {
    className: "bg-card",
    note: "No answer yet",
    toText: (question) => question.question,
  },
  "no-question": {
    className: "bg-card",
    note: "No question yet",
    toText: (question) => question.answer,
  },
}

type QuestionCellProps = {
  dragProps: QuestionDragProps
  isDailyDouble: boolean
  isDragged: boolean
  isDropTarget: boolean
  onSelect: () => void
  question: Question
  value: string
}

export function QuestionCell({
  dragProps,
  isDailyDouble,
  isDragged,
  isDropTarget,
  onSelect,
  question,
  value,
}: QuestionCellProps) {
  const view = STATUS_VIEWS[getQuestionStatus(question)]

  return (
    <Button
      variant="outline"
      className={cn(
        "flex h-24 w-full flex-col items-start justify-start gap-1 overflow-hidden rounded-none border-0 p-2.5 text-left whitespace-normal text-card-foreground hover:bg-card/85 hover:text-card-foreground dark:bg-transparent",
        view.className,
        isDragged && "opacity-30",
        isDropTarget && "ring-2 ring-primary"
      )}
      {...dragProps}
      onClick={onSelect}
    >
      <span className="flex w-full items-center justify-between gap-1">
        <span className="font-heading text-base font-bold text-primary tabular-nums">
          {value}
        </span>
        {isDailyDouble && (
          <span className="rounded-sm bg-primary px-1.5 font-heading text-xs tracking-wider text-primary-foreground uppercase">
            Daily double
          </span>
        )}
      </span>
      <span className="line-clamp-2 w-full text-xs leading-snug">
        {view.toText(question)}
      </span>
      {view.note && (
        <span className="text-xs text-destructive">{view.note}</span>
      )}
    </Button>
  )
}
