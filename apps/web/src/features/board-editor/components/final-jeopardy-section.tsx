import type { FinalJeopardy } from "@/lib/db"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"

type FinalJeopardySectionProps = {
  /** No Final Jeopardy turns the switch off and hides the fields. */
  finalJeopardy: FinalJeopardy | null
  onAdd: () => void
  onChange: (finalJeopardy: FinalJeopardy) => void
  onRemove: () => void
}

/** Turns the Final Jeopardy of the game on or off and edits it. */
export function FinalJeopardySection({
  finalJeopardy,
  onAdd,
  onChange,
  onRemove,
}: FinalJeopardySectionProps) {
  return (
    <section className="flex flex-col gap-4">
      <div className="flex min-h-9 items-center gap-3 text-sm">
        <Switch
          id="final-jeopardy"
          checked={finalJeopardy !== null}
          onCheckedChange={(isOn) => (isOn ? onAdd() : onRemove())}
        />
        <Label htmlFor="final-jeopardy">Final Jeopardy</Label>
        <span className="text-muted-foreground">
          Each team wagers on one last question after the boards.
        </span>
      </div>
      {finalJeopardy && (
        <FieldGroup className="max-w-2xl">
          <Field>
            <FieldLabel htmlFor="final-category">Category</FieldLabel>
            <Input
              id="final-category"
              value={finalJeopardy.category}
              onChange={(event) =>
                onChange({ ...finalJeopardy, category: event.target.value })
              }
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="final-question">Question</FieldLabel>
            <Textarea
              id="final-question"
              className="min-h-24"
              value={finalJeopardy.question}
              onChange={(event) =>
                onChange({ ...finalJeopardy, question: event.target.value })
              }
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="final-answer">Answer</FieldLabel>
            <Input
              id="final-answer"
              value={finalJeopardy.answer}
              onChange={(event) =>
                onChange({ ...finalJeopardy, answer: event.target.value })
              }
            />
          </Field>
        </FieldGroup>
      )}
    </section>
  )
}
