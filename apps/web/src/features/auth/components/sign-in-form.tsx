import { useState } from "react"
import { REGEXP_ONLY_DIGITS } from "input-otp"
import type { FormEvent, ReactNode } from "react"
import { Button } from "@/components/ui/button"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp"
import { authClient } from "@/lib/auth-client"

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

  const signIn = async (otp: string) => {
    if (await run(() => authClient.signIn.emailOtp({ email, otp }))) {
      onSignedIn()
    }
  }

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    void signIn(code)
  }

  const handleResend = async () => {
    setCode("")
    setIsResent(await run(() => sendCode(email)))
  }

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
      <Field data-invalid={error !== undefined || undefined}>
        <FieldLabel htmlFor="sign-in-code">Code</FieldLabel>
        <InputOTP
          id="sign-in-code"
          autoComplete="one-time-code"
          autoFocus
          containerClassName="justify-center"
          disabled={isPending}
          maxLength={CODE_LENGTH}
          pattern={REGEXP_ONLY_DIGITS}
          value={code}
          onChange={setCode}
          onComplete={(otp: string) => void signIn(otp)}
        >
          <InputOTPGroup>
            {Array.from({ length: CODE_LENGTH }, (_, index) => (
              <InputOTPSlot
                key={index}
                aria-invalid={error !== undefined || undefined}
                className="size-12 font-heading text-2xl"
                index={index}
              />
            ))}
          </InputOTPGroup>
        </InputOTP>
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

type SignInFormProps = {
  onSignedIn: () => void
}

/** Asks for an email, sends a code to it, and signs in with the code. */
export function SignInForm({ onSignedIn }: SignInFormProps) {
  const [step, setStep] = useState<Step>({ kind: "email" })

  const { body, description } = buildStepView(step, {
    onBack: () => setStep({ kind: "email" }),
    onSent: (email) => setStep({ kind: "code", email }),
    onSignedIn,
  })

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-1.5">
        <h1 className="font-heading text-3xl font-semibold tracking-wider uppercase">
          Sign in
        </h1>
        <p className="text-muted-foreground">{description}</p>
      </div>
      {body}
    </div>
  )
}
