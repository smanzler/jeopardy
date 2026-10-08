import { cn } from "@/lib/utils"

/** The classes of the name plate, for a field or for text. */
export const PLATE_CLASS =
  "mx-3 mb-3 h-10 min-w-0 bg-foreground text-center font-heading text-xl leading-10 font-semibold tracking-wider text-background uppercase"

type LecternProps = {
  className?: string
  /** The name plate under the score, such as a field or a `span`. */
  plate: React.ReactNode
  score: string
  scoreClassName?: string
}

/** A team desk like on the show: a score display above a name plate. */
export function Lectern({
  className,
  plate,
  score,
  scoreClassName,
}: LecternProps) {
  return (
    <div className="flex flex-col">
      <div
        className={cn(
          "flex flex-col gap-2.5 bg-card px-2.5 pt-2.5 shadow-[inset_0_-5px_0_var(--shade)]",
          className
        )}
      >
        <span
          className={cn(
            "bg-shade py-2 text-center font-heading text-4xl font-bold text-primary tabular-nums",
            scoreClassName
          )}
        >
          {score}
        </span>
        {plate}
      </div>
      {/* The stand under the desk. */}
      <span aria-hidden className="mx-5 h-8 bg-shade" />
    </div>
  )
}
