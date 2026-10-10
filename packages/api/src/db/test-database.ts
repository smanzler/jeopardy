import { vi } from "vitest"

// Each test file gets its own in-memory Postgres with the migrations applied,
// so the tests need no database server.
vi.mock("@/db/client", async () => {
  const { PGlite } = await import("@electric-sql/pglite")
  const { drizzle } = await import("drizzle-orm/pglite")
  const { migrate } = await import("drizzle-orm/pglite/migrator")
  const db = drizzle(new PGlite())
  await migrate(db, {
    migrationsFolder: new URL("../../drizzle", import.meta.url).pathname,
  })
  return { db }
})

vi.mock("@/auth/mailer", () => ({ mailer: { sendMail: vi.fn() } }))
