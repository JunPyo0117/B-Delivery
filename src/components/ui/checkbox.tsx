"use client"

import * as React from "react"
import { Check } from "lucide-react"

import { cn } from "@/lib/utils"

interface CheckboxProps extends Omit<React.ComponentProps<"button">, "onChange"> {
  checked?: boolean
  onCheckedChange?: (checked: boolean) => void
}

function Checkbox({
  className,
  checked = false,
  onCheckedChange,
  ...props
}: CheckboxProps) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      data-state={checked ? "checked" : "unchecked"}
      className={cn(
        "peer size-4 shrink-0 rounded border border-input shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50",
        checked && "border-primary bg-primary text-primary-foreground",
        className
      )}
      onClick={() => onCheckedChange?.(!checked)}
      {...props}
    >
      {checked && <Check className="size-3.5" />}
    </button>
  )
}

export { Checkbox }
