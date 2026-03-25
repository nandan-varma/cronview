import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Shell } from './components/layout/Shell.js'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/jobs" replace />} />
        <Route
          path="/jobs"
          element={
            <Shell onImport={() => {}}>
              <div className="p-8 text-gray-400">Jobs coming soon…</div>
            </Shell>
          }
        />
      </Routes>
    </BrowserRouter>
  )
}
