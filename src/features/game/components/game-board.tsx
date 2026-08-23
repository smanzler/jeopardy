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
          className="flex items-center justify-center rounded-sm bg-card p-2 text-center font-heading text-xl font-medium tracking-wide text-card-foreground uppercase"
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
                "h-full w-full rounded-sm border-0 bg-card font-heading text-4xl font-medium text-primary tabular-nums hover:bg-card/80 hover:text-primary",
                // The hover of the button lifts the text back to full colour,
                // which hides which questions the game showed already.
                isUsed && "text-primary/20 hover:text-primary/20"
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
