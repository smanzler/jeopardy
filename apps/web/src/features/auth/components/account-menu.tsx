import { useRouterState } from "@tanstack/react-router"
import { LogOutIcon, UserIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ButtonLink } from "@/components/button-link"
import { authClient } from "@/lib/auth-client"
import { useClearGames } from "@/hooks/use-games"

const BUTTON_CLASS = "font-heading tracking-wider uppercase"

/** Signs the host in or out. The app works the same without an account. */
export function AccountMenu() {
  const { data: session, isPending } = authClient.useSession()
  const location = useRouterState({ select: (state) => state.location })
  const clearGames = useClearGames()

  const handleSignOut = async () => {
    await authClient.signOut()
    clearGames("cloud")
  }

  if (isPending) return null

  if (!session) {
    if (location.pathname === "/sign-in") return null
    return (
      <ButtonLink
        className={BUTTON_CLASS}
        size="lg"
        variant="ghost"
        to="/sign-in"
        search={{ redirect: location.href }}
      >
        Sign in
      </ButtonLink>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            aria-label="Account"
            className={BUTTON_CLASS}
            size="icon-lg"
            variant="ghost"
          />
        }
      >
        <UserIcon />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="max-w-64 truncate">
            {session.user.email}
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => void handleSignOut()}>
          <LogOutIcon />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
