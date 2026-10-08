import { Button } from "@/components/ui/button"

type BoardTabsProps = {
  boardCount: number
  boardIndex: number
  onSelect: (boardIndex: number) => void
}

export function BoardTabs({
  boardCount,
  boardIndex,
  onSelect,
}: BoardTabsProps) {
  return Array.from({ length: boardCount }, (_, index) => (
    <Button
      key={index}
      variant={index === boardIndex ? "default" : "outline"}
      aria-pressed={index === boardIndex}
      onClick={() => onSelect(index)}
    >
      Board {index + 1}
    </Button>
  ))
}
