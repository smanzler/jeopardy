import { createFileRoute, redirect } from "@tanstack/react-router"

// The boards moved to the home screen. Old links still work.
export const Route = createFileRoute("/play/")({
  beforeLoad: () => {
    throw redirect({ replace: true, to: "/" })
  },
})
