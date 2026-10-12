type FinalScreenProps = {
  /** The controls of the host, under the content. */
  actions: React.ReactNode
  category: string
  children: React.ReactNode
}

/** The frame of each step of Final Jeopardy. */
export function FinalScreen({ actions, category, children }: FinalScreenProps) {
  return (
    <div className="flex flex-1 flex-col items-center gap-8 bg-card px-6 py-5 text-center text-card-foreground">
      <div className="flex flex-col items-center gap-1">
        <p className="font-heading text-sm tracking-[0.16em] text-card-foreground/85 uppercase">
          Final Jeopardy
        </p>
        <h2 className="font-heading text-4xl font-semibold tracking-wider text-balance text-primary uppercase">
          {category}
        </h2>
      </div>
      <div className="flex w-full flex-1 flex-col items-center justify-center gap-10">
        {children}
      </div>
      <div className="flex gap-3">{actions}</div>
    </div>
  )
}
