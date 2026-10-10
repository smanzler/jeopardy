import type { DailyDoubles } from "@/lib/db"
import type { DailyDoublesType } from "@/lib/daily-doubles"
import { MAX_RANDOM_DAILY_DOUBLES } from "@jeopardy/shared/games/schemas"
import { buildDailyDoubles, getDailyDoubleOps } from "@/lib/daily-doubles"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"

/** The switch turns daily doubles off, so the picker offers only these. */
const TYPE_ITEMS: Array<{ label: string; value: DailyDoublesType }> = [
  { label: "Random", value: "random" },
  { label: "Chosen in each question", value: "chosen" },
]

const COUNT_ITEMS = Array.from(
  { length: MAX_RANDOM_DAILY_DOUBLES },
  (_, index) => ({ label: String(index + 1), value: index + 1 })
)

type DailyDoublesLineProps = {
  boardIndex: number
  dailyDoubles: DailyDoubles
  onChange: (dailyDoubles: DailyDoubles) => void
}

/** Turns the daily doubles of the open board on or off and sets them, in one line. */
export function DailyDoublesLine({
  boardIndex,
  dailyDoubles,
  onChange,
}: DailyDoublesLineProps) {
  const ops = getDailyDoubleOps(dailyDoubles)

  const setType = (type: DailyDoublesType) =>
    onChange(buildDailyDoubles({ boardIndex, type }))

  return (
    <div className="flex min-h-9 flex-wrap items-center gap-x-3 gap-y-2 text-sm">
      <Switch
        id="daily-doubles"
        checked={ops.isOn}
        onCheckedChange={(isOn) => setType(isOn ? "random" : "none")}
      />
      <Label htmlFor="daily-doubles">Daily doubles</Label>
      {ops.isOn && (
        <Select
          items={TYPE_ITEMS}
          value={dailyDoubles.type}
          onValueChange={(type) => type && setType(type)}
        >
          <SelectTrigger
            aria-label="How the board gets its daily doubles"
            className="w-52"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TYPE_ITEMS.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
      {ops.isOn && dailyDoubles.type === "random" && (
        <Select
          items={COUNT_ITEMS}
          value={dailyDoubles.count}
          onValueChange={(count) =>
            count !== null && onChange({ ...dailyDoubles, count })
          }
        >
          <SelectTrigger aria-label="How many daily doubles" className="w-16">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {COUNT_ITEMS.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
      {ops.isChoosable && (
        <span className="text-muted-foreground">{ops.summary}</span>
      )}
    </div>
  )
}
