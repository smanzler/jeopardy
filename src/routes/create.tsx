import { createFileRoute } from "@tanstack/react-router"
import BoardEditor from "@/features/board-editor/screens/board-editor"

export const Route = createFileRoute("/create")({ component: BoardEditor })
