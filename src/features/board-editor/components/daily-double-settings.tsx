import type { DailyDoubles } from "@/lib/db"
import type { DailyDoublesType } from "@/lib/daily-doubles"
import {
  MAX_RANDOM_DAILY_DOUBLES,
  buildDailyDoubles,
} from "@/lib/daily-doubles"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const TYPE_ITEMS: Array<{ label: string; value: DailyDoublesType }> = [
  { label: "Random", value: "random" },
  { label: "Chosen in the editor", value: "chosen" },
]

const COUNT_ITEMS = Array.from(
  { length: MAX_RANDOM_DAILY_DOUBLES + 1 },
  (_, count) => ({ label: String(count), value: count })
)

type DailyDoubleSettingsProps = {
  boardIndex: number
  dailyDoubles: DailyDoubles
  onChange: (dailyDoubles: DailyDoubles) => void
}

export function DailyDoubleSettings({
  boardIndex,
  dailyDoubles,
  onChange,
}: DailyDoubleSettingsProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Label
        htmlFor="daily-double-type"
        className="font-normal text-muted-foreground"
      >
        Daily doubles
      </Label>
      <Select
        items={TYPE_ITEMS}
        value={dailyDoubles.type}
        onValueChange={(type) =>
          type && onChange(buildDailyDoubles({ boardIndex, type }))
        }
      >
        <SelectTrigger id="daily-double-type" className="w-48">
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
      {dailyDoubles.type === "random" ? (
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
      ) : (
        <span className="text-sm text-muted-foreground">
          Set them in each question.
        </span>
      )}
    </div>
  )
}
