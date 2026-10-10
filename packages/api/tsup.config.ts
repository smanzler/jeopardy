import { defineConfig } from "tsup"

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  target: "node22",
  clean: true,
  sourcemap: true,
  // The shared package is TypeScript source with no build step.
  noExternal: [/^@jeopardy\/shared/],
})
