import { Spinner } from "@/components/ui/spinner"

export function LoadingScreen() {
  return (
    <div className="flex min-h-svh items-center justify-center">
      <Spinner className="size-8 text-muted-foreground" />
    </div>
  )
}
