import { createFileRoute } from "@tanstack/react-router"
import BoardPicker from "@/features/game/screens/board-picker"

export const Route = createFileRoute("/play/")({ component: BoardPicker })
