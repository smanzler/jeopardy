import { useEffect } from "react"

/**
 * Binds the keys of the question view while a question is open.
 * Space shows the answer and Esc goes back to the board.
 */
export const useQuestionKeys = ({
  isOpen,
  onClose,
  onReveal,
}: {
  isOpen: boolean
  onClose: () => void
  onReveal: () => void
}) => {
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (event: KeyboardEvent) => {
      // The default action of Space presses the button that holds the focus.
      if (event.key === " ") {
        event.preventDefault()
        onReveal()
      }
      if (event.key === "Escape") onClose()
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isOpen, onClose, onReveal])
}
