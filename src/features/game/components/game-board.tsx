import type { Category, QuestionPosition } from "@/lib/db"
import { buildQuestionKey, formatRowValue, getRowCount } from "@/lib/board"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type GameBoardProps = {
  categories: Array<Category>
  onSelect: (position: QuestionPosition) => void
  /** Keys of the questions that the game has already shown. */
  usedKeys: Array<string>
}

export function GameBoard({ categories, onSelect, usedKeys }: GameBoardProps) {
  const rowIndexes = [...Array(getRowCount(categories)).keys()]
  const categoryIndexes = [...categories.keys()]

  return (
    <div
      className="grid flex-1 gap-2"
      // The board size comes from the saved game, so Tailwind cannot name it.
      style={{
        gridTemplateColumns: `repeat(${categories.length}, minmax(0, 1fr))`,
        gridTemplateRows: `auto repeat(${rowIndexes.length}, minmax(0, 1fr))`,
      }}
    >
      {categories.map((category, categoryIndex) => (
        <div
          key={categoryIndex}
          className="flex items-center justify-center rounded-lg bg-primary p-2 text-center text-lg font-semibold text-primary-foreground uppercase"
        >
          {category.name}
        </div>
      ))}
      {rowIndexes.map((rowIndex) =>
        categoryIndexes.map((categoryIndex) => {
          const isUsed = usedKeys.includes(
            buildQuestionKey({ categoryIndex, rowIndex })
          )
          return (
            <Button
              key={`${categoryIndex}-${rowIndex}`}
              variant="outline"
              className={cn(
                "h-full w-full text-3xl font-bold tabular-nums",
                isUsed && "text-muted-foreground/40"
              )}
              onClick={() => onSelect({ categoryIndex, rowIndex })}
            >
              {formatRowValue(rowIndex)}
            </Button>
          )
        })
      )}
    </div>
  )
}
