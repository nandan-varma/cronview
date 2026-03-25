import type { ReactNode } from 'react'
import { Sidebar } from './Sidebar.js'

interface ShellProps {
  children: ReactNode
  onImport: () => void
}

export function Shell({ children, onImport }: ShellProps) {
  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar onImport={onImport} />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  )
}
