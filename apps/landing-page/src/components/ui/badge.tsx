import * as React from 'react'

export type BadgeProps = React.HTMLAttributes<HTMLSpanElement>

export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(({ className = '', ...props }, ref) => (
  <span
    ref={ref}
    className={`inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-600 ${className}`}
    {...props}
  />
))
Badge.displayName = 'Badge'

export const badgeVariants = {
  default: 'bg-slate-100 text-slate-600'
}
