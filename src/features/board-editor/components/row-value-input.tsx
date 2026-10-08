import { useState } from "react"
import { Input } from "@/components/ui/input"
import { toRowValue } from "@/lib/board"

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
    const parsed = toRowValue(next)
    if (parsed !== undefined) onChange(parsed)
  }

  return (
    <Input
      aria-label={label}
      aria-invalid={text !== undefined && toRowValue(text) === undefined}
      className="w-24 tabular-nums"
      inputMode="numeric"
      value={text ?? String(value)}
      onBlur={() => setText(undefined)}
      onChange={(event) => handleChange(event.target.value)}
    />
  )
}
