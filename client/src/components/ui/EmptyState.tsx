import type { ReactNode } from 'react'

interface EmptyStateProps {
  icon: ReactNode
  heading: string
  body: string
  action?: ReactNode
}

export function EmptyState({ icon, heading, body, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
      <div className="text-gray-300 mb-4">{icon}</div>
      <h3 className="text-base font-semibold text-gray-700 mb-1">{heading}</h3>
      <p className="text-sm text-gray-500 max-w-sm">{body}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
