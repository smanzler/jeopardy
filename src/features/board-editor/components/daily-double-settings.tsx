import type { DailyDoubles } from "@/lib/db"
import type { DailyDoublesType } from "@/lib/daily-doubles"
import {
  MAX_RANDOM_DAILY_DOUBLES,
  buildDailyDoubles,
} from "@/lib/daily-doubles"
import { Field, FieldLabel } from "@/components/ui/field"
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
    <div className="flex flex-wrap items-end gap-4">
      <Field className="w-56">
        <FieldLabel htmlFor="daily-double-type">Daily doubles</FieldLabel>
        <Select
          items={TYPE_ITEMS}
          value={dailyDoubles.type}
          onValueChange={(type) =>
            type && onChange(buildDailyDoubles({ boardIndex, type }))
          }
        >
          <SelectTrigger id="daily-double-type" className="w-full">
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
      </Field>
      {dailyDoubles.type === "random" ? (
        <Field className="w-32">
          <FieldLabel htmlFor="daily-double-count">How many</FieldLabel>
          <Select
            items={COUNT_ITEMS}
            value={dailyDoubles.count}
            onValueChange={(count) =>
              count !== null && onChange({ ...dailyDoubles, count })
            }
          >
            <SelectTrigger id="daily-double-count" className="w-full">
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
        </Field>
      ) : (
        <p className="pb-2 text-sm text-muted-foreground">
          Open a question to make it a daily double.
        </p>
      )}
    </div>
  )
}
