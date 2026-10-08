import { formatValue } from "@/lib/board"
import { ButtonLink } from "@/components/button-link"

const SAMPLE_VALUES = [200, 400, 600, 800, 1000]

/** The welcome for a browser that holds no boards yet. */
export function TitleCard() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-10">
      <div className="flex flex-col gap-1.5">
        <div className="bg-card px-10 py-8 shadow-[inset_0_-8px_0_var(--shade)] sm:px-16 sm:py-10">
          <h1 className="font-heading text-6xl font-bold tracking-wide text-primary uppercase text-shadow-[0_5px_0_var(--shade)] sm:text-8xl">
            Jeopardy
          </h1>
        </div>
        {/* A row of board cells as decoration. */}
        <div aria-hidden className="grid grid-cols-5 gap-1.5">
          {SAMPLE_VALUES.map((value) => (
            <div
              key={value}
              className="bg-card py-2 text-center font-heading text-lg font-bold text-primary tabular-nums text-shadow-[0_2px_0_var(--shade)] sm:text-2xl"
            >
              {formatValue(value)}
            </div>
          ))}
        </div>
      </div>
      <ButtonLink
        size="xl"
        className="font-heading tracking-wider uppercase"
        to="/create"
      >
        Create your first board
      </ButtonLink>
    </div>
  )
}
