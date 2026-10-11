// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react"
import { SignInForm } from "@/features/auth/components/sign-in-form"
import { authClient } from "@/lib/auth-client"

vi.mock("@/lib/auth-client", () => ({
  authClient: {
    emailOtp: { sendVerificationOtp: vi.fn() },
    signIn: { emailOtp: vi.fn() },
  },
}))

const sendCode = vi.mocked(authClient.emailOtp.sendVerificationOtp)
const signIn = vi.mocked(authClient.signIn.emailOtp)

// Vitest runs with no globals, so Testing Library cannot clean up on its own.
afterEach(cleanup)

// jsdom has no layout, and input-otp asks for the element at a point.
document.elementFromPoint = () => null

beforeEach(() => {
  sendCode.mockReset().mockResolvedValue({ data: null, error: null })
  signIn.mockReset().mockResolvedValue({ data: null, error: null })
})

const renderForm = () => {
  const onSignedIn = vi.fn()
  render(<SignInForm onSignedIn={onSignedIn} />)
  return { onSignedIn }
}

const sendCodeTo = async (email: string) => {
  fireEvent.change(screen.getByLabelText("Email"), {
    target: { value: email },
  })
  fireEvent.click(screen.getByRole("button", { name: "Send code" }))
  await screen.findByLabelText("Code")
}

const typeCode = (code: string) =>
  fireEvent.change(screen.getByLabelText("Code"), { target: { value: code } })

describe("SignInForm", () => {
  it("sends a code, then signs in when the code is complete", async () => {
    const { onSignedIn } = renderForm()

    await sendCodeTo("host@example.com")
    expect(sendCode).toHaveBeenCalledWith({
      email: "host@example.com",
      type: "sign-in",
    })
    expect(screen.getByText(/host@example.com/)).toBeTruthy()

    typeCode("482913")

    await waitFor(() => expect(onSignedIn).toHaveBeenCalledOnce())
    expect(signIn).toHaveBeenCalledWith({
      email: "host@example.com",
      otp: "482913",
    })
  })

  it("takes digits only", async () => {
    renderForm()

    await sendCodeTo("host@example.com")
    typeCode("48a913")

    expect(screen.getByLabelText<HTMLInputElement>("Code").value).toBe("")
    expect(signIn).not.toHaveBeenCalled()
  })

  it("shows the error of a wrong code and stays on the code", async () => {
    signIn.mockResolvedValue({
      data: null,
      error: { message: "Invalid OTP" },
    })
    const { onSignedIn } = renderForm()

    await sendCodeTo("host@example.com")
    typeCode("000000")

    expect(await screen.findByText("Invalid OTP")).toBeTruthy()
    expect(onSignedIn).not.toHaveBeenCalled()
  })

  it("goes back to the email step", async () => {
    renderForm()

    await sendCodeTo("host@example.com")
    fireEvent.click(screen.getByRole("button", { name: "Use another email" }))

    expect(screen.getByLabelText("Email")).toBeTruthy()
  })
})
