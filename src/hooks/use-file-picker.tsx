import { useRef } from "react"

/**
 * Opens the file picker of the browser from any control. Put `input` in the
 * tree, and call `open` from the control.
 */
export const useFilePicker = ({
  accept,
  onFile,
}: {
  accept: string
  onFile: (file: File) => void
}) => {
  const inputRef = useRef<HTMLInputElement>(null)

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    // The reset lets the host pick the same file again.
    event.target.value = ""
    if (file) onFile(file)
  }

  return {
    input: (
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={handleChange}
      />
    ),
    open: () => inputRef.current?.click(),
  }
}
