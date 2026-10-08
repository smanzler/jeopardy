import { useState } from "react"
import { Link, useLocation, useNavigate } from "@tanstack/react-router"
import { PlusIcon, UploadIcon } from "lucide-react"
import { createGame } from "@/lib/games"
import { GAME_FILE_ACCEPT, parseGameFile } from "@/lib/game-file"
import { ButtonLink } from "@/components/button-link"
import { FileButton } from "@/components/file-button"
import { cn } from "@/lib/utils"

declare module "@tanstack/react-router" {
  interface HistoryState {
    /** Makes each link to a new board a new visit, also from a new board. */
    newBoardId?: string
  }
}

const buildNewBoardState = () => ({ newBoardId: crypto.randomUUID() })

type NavItem = {
  isActive: (pathname: string) => boolean
  label: string
  to: "/create" | "/play"
}

const NAV_ITEMS: Array<NavItem> = [
  {
    // The editor of a saved board sits under the boards.
    isActive: (pathname) =>
      pathname === "/play" || pathname.startsWith("/edit/"),
    label: "Boards",
    to: "/play",
  },
  {
    isActive: (pathname) => pathname === "/create",
    label: "Create",
    to: "/create",
  },
]

/** The bar at the top of each screen outside a game. */
export function AppHeader() {
  const navigate = useNavigate()
  const pathname = useLocation({ select: (location) => location.pathname })
  const [importError, setImportError] = useState<string>()

  const handleImport = async (file: File) => {
    try {
      await createGame(parseGameFile(await file.text()))
      setImportError(undefined)
      await navigate({ to: "/play" })
    } catch (error) {
      setImportError(
        error instanceof Error ? error.message : "The import did not work."
      )
    }
  }

  return (
    <header className="border-b-2 border-card bg-shade">
      <div className="mx-auto flex min-h-16 max-w-6xl flex-wrap items-center gap-x-7 gap-y-3 px-6 py-2">
        <Link
          to="/"
          className="bg-card px-3 py-1 font-heading text-2xl font-bold tracking-wider text-primary uppercase shadow-[inset_0_-3px_0_var(--shade)]"
        >
          Jeopardy
        </Link>
        <nav aria-label="Main" className="flex flex-1 gap-1">
          {NAV_ITEMS.map((item) => {
            const isActive = item.isActive(pathname)
            return (
              <Link
                key={item.to}
                to={item.to}
                state={item.to === "/create" ? buildNewBoardState : undefined}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "border-b-3 border-transparent px-3 pt-4 pb-3 font-heading tracking-widest text-muted-foreground uppercase transition-colors hover:text-foreground",
                  isActive && "border-primary text-foreground"
                )}
              >
                {item.label}
              </Link>
            )
          })}
        </nav>
        <div className="flex gap-2">
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
