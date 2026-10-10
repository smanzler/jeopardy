import { authClient } from "@/lib/auth-client"
import type { GameStorage } from "@/lib/game-store"

/**
 * Where a new game goes: the account when the host is signed in, otherwise
 * this browser. `undefined` while the session loads.
 */
export const useDefaultStorage = (): GameStorage | undefined => {
  const { data: session, isPending } = authClient.useSession()
  if (isPending) return undefined
  return session ? "cloud" : "local"
}
