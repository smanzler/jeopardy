import { ArrowLeftIcon } from "lucide-react"
import { Button } from "@/components/ui/button"

type QuestionHeaderProps = {
  children: React.ReactNode
  onClose: () => void
}

/** Puts a Board button on the left and `children` in the centre. */
export function QuestionHeader({ children, onClose }: QuestionHeaderProps) {
  return (
    // The empty cell on the right holds the middle block in the centre.
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
        {children}
      </span>
      <div />
    </div>
  )
}
