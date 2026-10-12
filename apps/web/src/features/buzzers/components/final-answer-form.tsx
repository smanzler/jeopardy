import { useState } from "react"
import { MAX_FINAL_ANSWER_LENGTH } from "@jeopardy/shared/buzzers/messages"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"

type FinalAnswerFormProps = {
  /** True when a phone of the team sent an answer. */
  hasAnswered: boolean
  onAnswer: (answer: string) => void
}

/** Takes the answer of the team. A new answer replaces the one before it. */
export function FinalAnswerForm({
  hasAnswered,
  onAnswer,
}: FinalAnswerFormProps) {
  const [text, setText] = useState("")
  const [sent, setSent] = useState<string>()
  const answer = text.trim()

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    if (!answer) return
    onAnswer(answer)
    setSent(answer)
  }

  return (
    <form className="flex w-full flex-col gap-3" onSubmit={handleSubmit}>
      <Textarea
        aria-label="Your answer"
        className="min-h-24 text-lg md:text-lg"
        maxLength={MAX_FINAL_ANSWER_LENGTH}
        placeholder="What is…"
        value={text}
        onChange={(event) => setText(event.target.value)}
      />
      <Button
        type="submit"
        className="h-12 font-heading text-lg tracking-widest uppercase"
        disabled={!answer || answer === sent}
      >
        {sent ? "Change answer" : "Send answer"}
      </Button>
      {hasAnswered && (
        <p className="text-center text-sm text-muted-foreground">
          {sent
            ? `Sent: ${sent}. You can change it until the host reveals.`
            : "Your team sent an answer."}
        </p>
      )}
    </form>
  )
}
