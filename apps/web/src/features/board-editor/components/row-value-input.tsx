import { useState } from "react"
import { Input } from "@/components/ui/input"
import { toPoints } from "@/lib/board"

type RowValueInputProps = {
  label: string
  onChange: (value: number) => void
  value: number
}

export function RowValueInput({ label, onChange, value }: RowValueInputProps) {
  // While the host types, the text can be invalid, such as an empty field. The
  // board keeps the last valid value, and the text goes back to it on blur.
  const [text, setText] = useState<string>()

  const handleChange = (next: string) => {
    setText(next)
    const parsed = toPoints(next)
    if (parsed !== undefined) onChange(parsed)
  }

  return (
    <Input
      aria-label={label}
      aria-invalid={text !== undefined && toPoints(text) === undefined}
      className="h-full w-20 rounded-md bg-shade text-center font-heading text-xl font-bold text-primary tabular-nums md:text-xl dark:bg-shade"
      inputMode="numeric"
      value={text ?? String(value)}
      onBlur={() => setText(undefined)}
      onChange={(event) => handleChange(event.target.value)}
    />
  )
}
