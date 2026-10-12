import { Button } from "@/components/ui/button"

type FinalIntroProps = {
  onStart: () => void
}

/** Holds the category back until the host starts Final Jeopardy. */
export function FinalIntro({ onStart }: FinalIntroProps) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-9 bg-card px-6 py-5 text-center text-card-foreground">
      <h2 className="font-heading text-8xl font-bold tracking-wide text-primary uppercase text-shadow-[0_6px_0_var(--shade)]">
        Final Jeopardy
      </h2>
      <Button
        size="lg"
        className="h-13 px-6 font-heading tracking-wider uppercase"
        onClick={onStart}
      >
        Show the category
      </Button>
    </div>
  )
}
