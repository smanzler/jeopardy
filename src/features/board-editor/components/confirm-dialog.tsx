import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

export type ConfirmPrompt = {
  confirmLabel: string
  description: string
  title: string
}

type ConfirmDialogProps = {
  onCancel: () => void
  onConfirm: () => void
  /** No prompt keeps the dialog shut. */
  prompt: ConfirmPrompt | undefined
}

export function ConfirmDialog({
  onCancel,
  onConfirm,
  prompt,
}: ConfirmDialogProps) {
  return (
    <AlertDialog
      open={prompt !== undefined}
      onOpenChange={(open) => open || onCancel()}
    >
      <AlertDialogContent>
        {prompt && (
          <>
            <AlertDialogHeader>
              <AlertDialogTitle>{prompt.title}</AlertDialogTitle>
              <AlertDialogDescription>
                {prompt.description}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Keep it</AlertDialogCancel>
              <AlertDialogAction variant="destructive" onClick={onConfirm}>
                {prompt.confirmLabel}
              </AlertDialogAction>
            </AlertDialogFooter>
          </>
        )}
      </AlertDialogContent>
    </AlertDialog>
  )
}
