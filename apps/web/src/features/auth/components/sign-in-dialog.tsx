import { useState } from "react"
import type { FormEvent, ReactNode } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { authClient } from "@/features/auth/lib/auth-client"

const CODE_LENGTH = 6

type Step = { kind: "email" } | { kind: "code"; email: string }

/** Runs `request` and gives its error message, if any. */
const useRequest = () => {
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState<string>()

  const run = async (
    request: () => Promise<{ error: { message?: string } | null }>
  ): Promise<boolean> => {
    setIsPending(true)
    setError(undefined)
    try {
      const result = await request()
      if (result.error) {
        setError(result.error.message ?? "That did not work. Try again.")
        return false
      }
      return true
    } catch {
      setError("Cannot reach the server. Try again.")
      return false
    } finally {
      setIsPending(false)
    }
  }

  return { error, isPending, run }
}

const sendCode = (email: string) =>
  authClient.emailOtp.sendVerificationOtp({ email, type: "sign-in" })

function EmailStep({ onSent }: { onSent: (email: string) => void }) {
  const [email, setEmail] = useState("")
  const { error, isPending, run } = useRequest()

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    const trimmed = email.trim()
    if (await run(() => sendCode(trimmed))) onSent(trimmed)
  }

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
      <Field data-invalid={error !== undefined || undefined}>
        <FieldLabel htmlFor="sign-in-email">Email</FieldLabel>
        <Input
          id="sign-in-email"
          autoComplete="email"
          autoFocus
          required
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
        {error && <FieldError>{error}</FieldError>}
      </Field>
      <Button disabled={isPending} type="submit">
        Send code
      </Button>
    </form>
  )
}

function CodeStep({
  email,
  onBack,
  onSignedIn,
}: {
  email: string
  onBack: () => void
  onSignedIn: () => void
}) {
  const [code, setCode] = useState("")
  const [isResent, setIsResent] = useState(false)
  const { error, isPending, run } = useRequest()

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (await run(() => authClient.signIn.emailOtp({ email, otp: code }))) {
      onSignedIn()
    }
  }

  const handleResend = async () => {
    setCode("")
    setIsResent(await run(() => sendCode(email)))
  }

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
      <Field data-invalid={error !== undefined || undefined}>
        <FieldLabel htmlFor="sign-in-code">Code</FieldLabel>
        <Input
          id="sign-in-code"
          autoComplete="one-time-code"
          autoFocus
          className="text-center font-heading text-2xl tracking-[0.4em] md:text-2xl"
          inputMode="numeric"
          maxLength={CODE_LENGTH}
          value={code}
          onChange={(event) => setCode(event.target.value.replace(/\D/g, ""))}
        />
        {error && <FieldError>{error}</FieldError>}
      </Field>
      <Button disabled={isPending || code.length !== CODE_LENGTH} type="submit">
        Sign in
      </Button>
      <div className="flex justify-between text-sm">
        <Button size="sm" type="button" variant="link" onClick={onBack}>
          Use another email
        </Button>
        <Button
          disabled={isPending}
          size="sm"
          type="button"
          variant="link"
          onClick={handleResend}
        >
          {isResent ? "Code sent again" : "Send a new code"}
        </Button>
      </div>
    </form>
  )
}

type StepActions = {
  onBack: () => void
  onSent: (email: string) => void
  onSignedIn: () => void
}

type StepView = { description: string; body: ReactNode }

const stepViews: {
  [TKind in Step["kind"]]: (
    step: Extract<Step, { kind: TKind }>,
    actions: StepActions
  ) => StepView
} = {
  email: (_step, { onSent }) => ({
    description: "We send a code to your email. No password needed.",
    body: <EmailStep onSent={onSent} />,
  }),
  code: ({ email }, { onBack, onSignedIn }) => ({
    description: `Enter the code that we sent to ${email}.`,
    body: <CodeStep email={email} onBack={onBack} onSignedIn={onSignedIn} />,
  }),
}

const buildStepView = <TKind extends Step["kind"]>(
  step: Extract<Step, { kind: TKind }> & { kind: TKind },
  actions: StepActions
): StepView => stepViews[step.kind](step, actions)

type SignInDialogProps = {
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
}

export function SignInDialog({ isOpen, onOpenChange }: SignInDialogProps) {
  const [step, setStep] = useState<Step>({ kind: "email" })

  const handleOpenChange = (next: boolean) => {
    if (!next) setStep({ kind: "email" })
    onOpenChange(next)
  }

  const { body, description } = buildStepView(step, {
    onBack: () => setStep({ kind: "email" }),
    onSent: (email) => setStep({ kind: "code", email }),
    onSignedIn: () => handleOpenChange(false),
  })

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Sign in</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        {body}
      </DialogContent>
    </Dialog>
  )
}
