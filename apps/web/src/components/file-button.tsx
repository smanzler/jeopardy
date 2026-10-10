import type { VariantProps } from "class-variance-authority"
import { Button } from "@/components/ui/button"
import type { buttonVariants } from "@/components/ui/button"
import { useFilePicker } from "@/hooks/use-file-picker"

type FileButtonProps = VariantProps<typeof buttonVariants> & {
  accept: string
  children: React.ReactNode
  className?: string
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
  const filePicker = useFilePicker({ accept, onFile })

  return (
    <>
      {filePicker.input}
      <Button {...props} onClick={filePicker.open}>
        {children}
      </Button>
    </>
  )
}
