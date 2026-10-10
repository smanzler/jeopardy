import { defineConfig } from "vite"
import { devtools } from "@tanstack/devtools-vite"
import { tanstackStart } from "@tanstack/react-start/plugin/vite"
import { nitro } from "nitro/vite"
import viteReact from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"

const apiUrl = process.env.VITE_API_URL ?? "http://localhost:4000"

const config = defineConfig({
  resolve: { tsconfigPaths: true },
  plugins: [
    devtools(),
    tailwindcss(),
    tanstackStart(),
    // Send /api/** to the API, so the browser gets the auth cookie from this
    // origin. WebSockets go to the API directly.
    nitro({ routeRules: { "/api/**": { proxy: `${apiUrl}/api/**` } } }),
    viteReact(),
  ],
})

export default config
