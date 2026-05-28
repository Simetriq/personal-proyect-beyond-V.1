import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-gradient-to-b from-anima-goldglow to-anima-gold text-black shadow-glow-gold hover:opacity-90 transition-all border border-yellow-300/50",
        destructive:
          "bg-gradient-to-b from-red-600 to-anima-blood text-white shadow-glow-blood hover:opacity-90 transition-all border border-red-400/50",
        outline:
          "border border-anima-gold/50 bg-transparent text-anima-gold shadow-sm hover:bg-anima-gold/10 hover:shadow-glow-gold transition-all",
        secondary:
          "bg-gradient-to-b from-purple-600 to-anima-zeon text-white shadow-glow-zeon hover:opacity-90 transition-all border border-purple-400/50",
        ghost: "hover:bg-anima-gold/10 hover:text-anima-goldglow transition-colors",
        link: "text-anima-gold underline-offset-4 hover:underline hover:text-anima-goldglow",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-md px-8",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
