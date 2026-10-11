import { useEffect } from "react"
import { useNavigate } from "@tanstack/react-router"
import { authClient } from "@/lib/auth-client"
import { SignInForm } from "@/features/auth/components/sign-in-form"

/** @param redirect A path in this app. The page goes there once signed in. */
export default function SignIn({ redirect }: { redirect: string }) {
  const navigate = useNavigate()
  const { data: session } = authClient.useSession()

  useEffect(() => {
    // The replace keeps this page out of the history once its work is done.
    if (session) void navigate({ href: redirect, replace: true })
  }, [navigate, redirect, session])

  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-6 py-10">
      <SignInForm
        onSignedIn={() => void navigate({ href: redirect, replace: true })}
      />
    </main>
  )
}
