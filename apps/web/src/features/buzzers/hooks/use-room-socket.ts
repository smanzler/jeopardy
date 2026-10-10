import { useCallback, useEffect, useRef, useState } from "react"
import {
  closeCodes,
  serverMessageSchema,
} from "@jeopardy/shared/buzzers/messages"
import type { ServerMessage } from "@jeopardy/shared/buzzers/messages"

const RETRY_DELAYS_MS = [500, 1000, 2000, 5000]
const ENDING_CODES: Array<number> = Object.values(closeCodes)

const parseMessage = (data: unknown): ServerMessage | undefined => {
  try {
    const result = serverMessageSchema.safeParse(JSON.parse(String(data)))
    return result.success ? result.data : undefined
  } catch {
    return undefined
  }
}

/**
 * Keeps a WebSocket to a buzzer room open while `isEnabled` is true, and
 * connects again after a drop. A close code from `closeCodes` stops the hook
 * and calls `onEnd`.
 * @param buildUrl Runs on each connect.
 */
export const useRoomSocket = <TOutgoing>({
  buildUrl,
  isEnabled,
  onEnd,
  onMessage,
}: {
  buildUrl: () => string
  isEnabled: boolean
  onEnd: (code: number) => void
  onMessage: (message: ServerMessage) => void
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const socketRef = useRef<WebSocket | null>(null)
  const handlersRef = useRef({ buildUrl, onEnd, onMessage })

  useEffect(() => {
    handlersRef.current = { buildUrl, onEnd, onMessage }
  })

  useEffect(() => {
    if (!isEnabled) return
    let attempt = 0
    let retryTimer: number | undefined
    let isStopped = false

    const connect = () => {
      const socket = new WebSocket(handlersRef.current.buildUrl())
      socketRef.current = socket
      socket.onopen = () => {
        attempt = 0
        setIsOpen(true)
      }
      socket.onmessage = (event) => {
        const message = parseMessage(event.data)
        if (message) handlersRef.current.onMessage(message)
      }
      socket.onclose = (event) => {
        socketRef.current = null
        setIsOpen(false)
        if (isStopped) return
        if (ENDING_CODES.includes(event.code)) {
          handlersRef.current.onEnd(event.code)
          return
        }
        const delay =
          RETRY_DELAYS_MS[Math.min(attempt, RETRY_DELAYS_MS.length - 1)]
        attempt += 1
        retryTimer = window.setTimeout(connect, delay)
      }
    }

    connect()
    return () => {
      isStopped = true
      window.clearTimeout(retryTimer)
      socketRef.current?.close()
      socketRef.current = null
      setIsOpen(false)
    }
  }, [isEnabled])

  const send = useCallback((message: TOutgoing) => {
    const socket = socketRef.current
    if (socket?.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(message))
    }
  }, [])

  return { isOpen, send }
}
