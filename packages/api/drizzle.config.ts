import { defineConfig } from "drizzle-kit"

try {
  process.loadEnvFile()
} catch {
  // CI gives DATABASE_URL in the environment, with no .env file.
}

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/*/schema.ts",
  out: "./drizzle",
  dbCredentials: { url: process.env.DATABASE_URL ?? "" },
})
