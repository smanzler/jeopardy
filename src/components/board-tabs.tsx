import { Button } from "@/components/ui/button"

type BoardTabsProps = {
  boardCount: number
  boardIndex: number
  /** Classes for each tab. */
  className?: string
  /** Text after the name of each board. */
  getDetail?: (boardIndex: number) => string
  /** The look of the tabs that are not selected. */
  inactiveVariant?: "ghost" | "outline"
  onSelect: (boardIndex: number) => void
}

export function BoardTabs({
  boardCount,
  boardIndex,
  className,
  getDetail,
  inactiveVariant = "outline",
  onSelect,
}: BoardTabsProps) {
  return Array.from({ length: boardCount }, (_, index) => (
    <Button
      key={index}
      variant={index === boardIndex ? "default" : inactiveVariant}
      aria-pressed={index === boardIndex}
      className={className}
      onClick={() => onSelect(index)}
    >
      Board {index + 1}
      {getDetail && (
        <span className="font-normal opacity-80">· {getDetail(index)}</span>
      )}
    </Button>
  ))
}
