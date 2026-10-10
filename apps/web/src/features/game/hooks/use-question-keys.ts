import { useEffect } from "react"

/**
 * Binds the keys of the question view while a question is open.
 * Space shows the answer, B opens buzzing and Esc goes back to the board.
 */
export const useQuestionKeys = ({
  isOpen,
  onClose,
  onOpenBuzzers,
  onReveal,
}: {
  isOpen: boolean
  onClose: () => void
  onOpenBuzzers: () => void
  onReveal: () => void
}) => {
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (event: KeyboardEvent) => {
      // Keys that the host types in a field belong to that field.
      if (event.target instanceof HTMLInputElement) return
      // The default action of Space presses the button that holds the focus.
      if (event.key === " ") {
        event.preventDefault()
        onReveal()
      }
      if (event.key === "Escape") onClose()
      if (event.key === "b" || event.key === "B") onOpenBuzzers()
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isOpen, onClose, onOpenBuzzers, onReveal])
}
