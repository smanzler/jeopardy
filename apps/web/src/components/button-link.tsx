import { createLink } from "@tanstack/react-router"
import type { VariantProps } from "class-variance-authority"
import type { ComponentProps } from "react"

import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type ButtonLinkProps = ComponentProps<"a"> & VariantProps<typeof buttonVariants>

// Base UI's `Button` expects to render a <button>. An anchor in its `render`
// prop gets `role="button"`, which hides the link semantics, so the button
// variants go on a plain <a> instead.
function ButtonLinkBase({
  className,
  size = "default",
  variant = "default",
  ...props
}: ButtonLinkProps) {
  return (
    <a
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

/** A router link with the styling of {@link buttonVariants}. */
const ButtonLink = createLink(ButtonLinkBase)

export { ButtonLink }
