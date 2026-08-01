import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva } from "class-variance-authority";

import { cn } from "@/lib/utils"

/*
  hustart V2 — Premium button
  Default: orange #E8521A · soft shadow · md radius
  Subtle lift on hover, fine ring on focus, neutral disabled.
*/
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium tracking-tight transition-[transform,box-shadow,background-color,color,border-color] duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-sm hover:bg-primary-dark hover:shadow-md hover:-translate-y-px active:translate-y-0 active:shadow-sm",
        destructive:
          "bg-destructive text-destructive-foreground shadow-sm hover:opacity-95 hover:shadow-md hover:-translate-y-px",
        outline:
          "border border-border bg-surface text-ink-1 shadow-sm hover:border-ink-1/40 hover:bg-surface-2",
        secondary:
          "bg-surface-2 text-ink-1 border border-border hover:bg-surface-2/70 hover:border-ink-1/30",
        ghost:
          "text-ink-1 hover:bg-surface-2",
        link:
          "text-primary underline-offset-4 hover:underline px-0",
        accent:
          "bg-ink-1 text-surface shadow-sm hover:bg-ink-2 hover:shadow-md hover:-translate-y-px",
      },
      size: {
        default: "h-10 px-5 py-2",
        sm: "h-8 px-3 text-xs",
        lg: "h-12 px-7 text-base",
        xl: "h-14 px-9 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

const Button = React.forwardRef(({ className, variant, size, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : "button"
  return (
    <Comp
      className={cn(buttonVariants({ variant, size, className }))}
      ref={ref}
      {...props} />
  );
})
Button.displayName = "Button"

export { Button, buttonVariants }
