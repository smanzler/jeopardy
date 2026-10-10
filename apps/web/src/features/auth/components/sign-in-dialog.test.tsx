// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react"
import { SignInDialog } from "@/features/auth/components/sign-in-dialog"
import { authClient } from "@/features/auth/lib/auth-client"

vi.mock("@/features/auth/lib/auth-client", () => ({
  authClient: {
    emailOtp: { sendVerificationOtp: vi.fn() },
    signIn: { emailOtp: vi.fn() },
  },
}))

const sendCode = vi.mocked(authClient.emailOtp.sendVerificationOtp)
const signIn = vi.mocked(authClient.signIn.emailOtp)

// Vitest runs with no globals, so Testing Library cannot clean up on its own.
afterEach(cleanup)

beforeEach(() => {
  sendCode.mockReset().mockResolvedValue({ data: null, error: null })
  signIn.mockReset().mockResolvedValue({ data: null, error: null })
})

const renderDialog = () => {
  const onOpenChange = vi.fn()
  render(<SignInDialog isOpen onOpenChange={onOpenChange} />)
  return { onOpenChange }
}

const sendCodeTo = async (email: string) => {
  fireEvent.change(screen.getByLabelText("Email"), {
    target: { value: email },
  })
  fireEvent.click(screen.getByRole("button", { name: "Send code" }))
  await screen.findByLabelText("Code")
}

describe("SignInDialog", () => {
  it("sends a code, then signs in with it", async () => {
    const { onOpenChange } = renderDialog()

    await sendCodeTo("host@example.com")
    expect(sendCode).toHaveBeenCalledWith({
      email: "host@example.com",
      type: "sign-in",
    })
    expect(screen.getByText(/host@example.com/)).toBeTruthy()

    fireEvent.change(screen.getByLabelText("Code"), {
      target: { value: "48 29 13" },
    })
    fireEvent.click(screen.getByRole("button", { name: "Sign in" }))

    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false))
    expect(signIn).toHaveBeenCalledWith({
      email: "host@example.com",
      otp: "482913",
    })
  })

  it("shows the error of a wrong code and stays open", async () => {
    signIn.mockResolvedValue({
      data: null,
      error: { message: "Invalid OTP" },
    })
    const { onOpenChange } = renderDialog()

    await sendCodeTo("host@example.com")
    fireEvent.change(screen.getByLabelText("Code"), {
      target: { value: "000000" },
    })
    fireEvent.click(screen.getByRole("button", { name: "Sign in" }))

    expect(await screen.findByText("Invalid OTP")).toBeTruthy()
    expect(onOpenChange).not.toHaveBeenCalled()
  })

  it("goes back to the email step", async () => {
    renderDialog()

    await sendCodeTo("host@example.com")
    fireEvent.click(screen.getByRole("button", { name: "Use another email" }))

    expect(screen.getByLabelText("Email")).toBeTruthy()
  })
})
