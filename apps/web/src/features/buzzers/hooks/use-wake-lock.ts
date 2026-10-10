import { useEffect } from "react"

/** Keeps the screen on while `isActive` is true, where the browser allows it. */
export const useWakeLock = (isActive: boolean) => {
  useEffect(() => {
    if (!isActive || !("wakeLock" in navigator)) return
    let sentinel: WakeLockSentinel | null = null
    let isStopped = false

    const request = async () => {
      try {
        const next = await navigator.wakeLock.request("screen")
        if (isStopped) await next.release()
        else sentinel = next
      } catch {
        return
      }
    }
    // The browser drops the lock when the page is hidden.
    const handleVisibility = () => {
      if (document.visibilityState === "visible") void request()
    }

    void request()
    document.addEventListener("visibilitychange", handleVisibility)
    return () => {
      isStopped = true
      document.removeEventListener("visibilitychange", handleVisibility)
      void sentinel?.release()
    }
  }, [isActive])
}
