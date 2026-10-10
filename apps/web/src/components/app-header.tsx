import { useState } from "react"
import { Link, useNavigate } from "@tanstack/react-router"
import { PlusIcon, UploadIcon } from "lucide-react"
import { createGame } from "@/lib/games"
import { GAME_FILE_ACCEPT, parseGameFile } from "@/lib/game-file"
import { ButtonLink } from "@/components/button-link"
import { FileButton } from "@/components/file-button"
import { AccountMenu } from "@/features/auth/components/account-menu"

declare module "@tanstack/react-router" {
  interface HistoryState {
    /** Makes each link to a new board a new visit, also from a new board. */
    newBoardId?: string
  }
}

/** Give a link to `/create` this state, so it opens an empty board each time. */
export const buildNewBoardState = () => ({ newBoardId: crypto.randomUUID() })

/** The bar at the top of each screen outside a game. */
export function AppHeader() {
  const navigate = useNavigate()
  const [importError, setImportError] = useState<string>()

  const handleImport = async (file: File) => {
    try {
      await createGame(parseGameFile(await file.text()))
      setImportError(undefined)
      await navigate({ to: "/" })
    } catch (error) {
      setImportError(
        error instanceof Error ? error.message : "The import did not work."
      )
    }
  }

  return (
    <header className="border-b-2 border-card bg-shade">
      <div className="mx-auto flex min-h-16 max-w-6xl flex-wrap items-center justify-between gap-x-7 gap-y-3 px-6 py-2">
        <Link
          to="/"
          className="bg-card px-3 py-1 font-heading text-2xl font-bold tracking-wider text-primary uppercase shadow-[inset_0_-3px_0_var(--shade)]"
        >
          Jeopardy
        </Link>
        <div className="flex gap-2">
          <AccountMenu />
          <FileButton
            variant="outline"
            size="lg"
            className="font-heading tracking-wider uppercase"
            accept={GAME_FILE_ACCEPT}
            onFile={handleImport}
          >
            <UploadIcon />
            Import
          </FileButton>
          <ButtonLink
            size="lg"
            className="font-heading tracking-wider uppercase"
            to="/create"
            state={buildNewBoardState}
          >
            <PlusIcon />
            New board
          </ButtonLink>
        </div>
      </div>
      {importError && (
        <p className="mx-auto max-w-6xl px-6 pb-2 text-sm text-destructive">
          {importError}
        </p>
      )}
    </header>
  )
}
