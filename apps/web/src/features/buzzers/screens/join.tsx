import { useState } from "react"
import type { FormEvent } from "react"
import { useNavigate } from "@tanstack/react-router"
import { roomCodeSchema } from "@jeopardy/shared/buzzers/messages"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

/** Takes the room code that the host shows. */
export default function Join() {
  const navigate = useNavigate()
  const [code, setCode] = useState("")
  const normalized = code.trim().toUpperCase()
  const isValid = roomCodeSchema.safeParse(normalized).success

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    if (!isValid) return
    void navigate({ params: { code: normalized }, to: "/buzz/$code" })
  }

  return (
    <form
      className="mx-auto flex h-svh max-w-xs flex-col justify-center gap-4 p-6"
      onSubmit={handleSubmit}
    >
      <h1 className="text-center font-heading text-2xl tracking-widest uppercase">
        Join a game
      </h1>
      <Input
        aria-label="Room code"
        autoCapitalize="characters"
        autoComplete="off"
        className="h-14 text-center font-heading text-3xl tracking-[0.3em] uppercase md:text-3xl"
        maxLength={4}
        placeholder="CODE"
        spellCheck={false}
        value={code}
        onChange={(event) => setCode(event.target.value)}
      />
      <Button className="h-12" disabled={!isValid} type="submit">
        Join
      </Button>
    </form>
  )
}
