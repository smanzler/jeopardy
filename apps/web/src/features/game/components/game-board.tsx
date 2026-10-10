import type { Board, QuestionPosition } from "@/lib/db"
import { buildQuestionKey, formatValue } from "@/lib/board"
import { Button } from "@/components/ui/button"

type GameBoardProps = {
  board: Board
  boardIndex: number
  onSelect: (position: QuestionPosition) => void
  /** Keys of the questions that the game has already shown. */
  usedKeys: Array<string>
}

export function GameBoard({
  board,
  boardIndex,
  onSelect,
  usedKeys,
}: GameBoardProps) {
  const { categories, values } = board
  const categoryIndexes = [...categories.keys()]

  return (
    <div
      className="grid flex-1 gap-1.5"
      // The board size comes from the saved game, so Tailwind cannot name it.
      style={{
        gridTemplateColumns: `repeat(${categories.length}, minmax(0, 1fr))`,
        gridTemplateRows: `5rem repeat(${values.length}, minmax(0, 1fr))`,
      }}
    >
      {categories.map((category, categoryIndex) => (
        <div
          key={categoryIndex}
          className="flex items-center justify-center bg-card px-3 py-1.5 text-center font-heading text-xl leading-tight font-semibold tracking-wide text-card-foreground uppercase shadow-[inset_0_-4px_0_var(--shade)]"
        >
          {category.name}
        </div>
      ))}
      {values.map((value, rowIndex) =>
        categoryIndexes.map((categoryIndex) => {
          const position = { boardIndex, categoryIndex, rowIndex }
          const isUsed = usedKeys.includes(buildQuestionKey(position))
          const label = `${categories[categoryIndex].name || `Category ${categoryIndex + 1}`} ${formatValue(value)}`
          return (
            <Button
              key={`${categoryIndex}-${rowIndex}`}
              variant="outline"
              // A played cell stays on the board with no value, so the host
              // can open it again.
              aria-label={isUsed ? `${label}, played` : label}
              className="h-full w-full rounded-none border-0 bg-card font-heading text-5xl font-bold tracking-wide text-primary tabular-nums text-shadow-[0_3px_0_var(--shade)] hover:bg-card/85 hover:text-primary"
              onClick={() => onSelect(position)}
            >
              {isUsed ? "" : formatValue(value)}
            </Button>
          )
        })
      )}
    </div>
  )
}
