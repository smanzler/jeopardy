import { describe, expect, it } from "vitest"
import { renderSignInEmail } from "@/auth/sign-in-email"

describe("renderSignInEmail", () => {
  it("puts the code in the subject and in both bodies", () => {
    const email = renderSignInEmail({ code: "482913", expiresInMinutes: 5 })

    expect(email.subject).toContain("482913")
    expect(email.text).toContain("482913")
    expect(email.html).toContain("482913")
    expect(email.text).toContain("5 minutes")
  })
})
