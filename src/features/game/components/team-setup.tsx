import { Button } from "@/components/ui/button"

const TEAM_COUNT_OPTIONS = [2, 3, 4]

type TeamSetupProps = {
  onStart: (teamCount: number) => void
  title: string
}

export function TeamSetup({ onStart, title }: TeamSetupProps) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6">
      <h1 className="text-3xl font-semibold">{title}</h1>
      <p className="text-muted-foreground">How many teams play?</p>
      <div className="flex gap-2">
        {TEAM_COUNT_OPTIONS.map((teamCount) => (
          <Button key={teamCount} size="lg" onClick={() => onStart(teamCount)}>
            {teamCount} teams
          </Button>
        ))}
      </div>
    </div>
  )
}
