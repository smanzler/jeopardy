import { useState } from "react"
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
import { SignInDialog } from "@/features/auth/components/sign-in-dialog"
import { authClient } from "@/features/auth/lib/auth-client"

const BUTTON_CLASS = "font-heading tracking-wider uppercase"

/** Signs the host in or out. The app works the same without an account. */
export function AccountMenu() {
  const { data: session, isPending } = authClient.useSession()
  const [isSignInOpen, setIsSignInOpen] = useState(false)

  if (isPending) return null

  if (!session) {
    return (
      <>
        <Button
          className={BUTTON_CLASS}
          size="lg"
          variant="ghost"
          onClick={() => setIsSignInOpen(true)}
        >
          Sign in
        </Button>
        <SignInDialog isOpen={isSignInOpen} onOpenChange={setIsSignInOpen} />
      </>
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
        <DropdownMenuItem onClick={() => void authClient.signOut()}>
          <LogOutIcon />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
