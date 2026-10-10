const API_URL: string = import.meta.env.VITE_API_URL ?? "http://localhost:4000"

/** Gives the WebSocket URL of an API path. */
export const buildRoomUrl = (
  path: string,
  query: Record<string, string> = {},
  apiUrl = API_URL
): string => {
  const url = new URL(path, apiUrl)
  url.protocol = url.protocol === "https:" ? "wss:" : "ws:"
  Object.entries(query).forEach(([key, value]) =>
    url.searchParams.set(key, value)
  )
  return url.toString()
}

export const buildJoinUrl = ({
  code,
  origin,
}: {
  code: string
  origin: string
}): string => `${origin}/buzz/${code}`
