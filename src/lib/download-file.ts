import type { GameDraft } from "@/lib/db"
import { buildGameFileName, renderGameFile } from "@/lib/game-file"

export const downloadFile = ({
  name,
  text,
}: {
  name: string
  text: string
}): void => {
  const url = URL.createObjectURL(
    new Blob([text], { type: "application/json" })
  )
  const link = document.createElement("a")
  link.href = url
  link.download = name
  link.click()
  URL.revokeObjectURL(url)
}

export const downloadGameFile = (draft: GameDraft): void =>
  downloadFile({
    name: buildGameFileName(draft.title),
    text: renderGameFile(draft),
  })
