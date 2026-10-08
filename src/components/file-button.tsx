import { useRef } from "react"
import type { VariantProps } from "class-variance-authority"
import { Button } from "@/components/ui/button"
import type { buttonVariants } from "@/components/ui/button"

type FileButtonProps = VariantProps<typeof buttonVariants> & {
  accept: string
  children: React.ReactNode
  disabled?: boolean
  onFile: (file: File) => void
}

/** A button that opens the file picker of the browser. */
export function FileButton({
  accept,
  children,
  onFile,
  ...props
}: FileButtonProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    // The reset lets the host pick the same file again.
    event.target.value = ""
    if (file) onFile(file)
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={handleChange}
      />
      <Button {...props} onClick={() => inputRef.current?.click()}>
        {children}
      </Button>
    </>
  )
}
