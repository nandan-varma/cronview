import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Shell } from './components/layout/Shell.js'
import { JobsPage } from './pages/JobsPage.js'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/jobs" replace />} />
        <Route
          path="/jobs"
          element={
            <Shell onImport={() => {}}>
              <JobsPage onImport={() => {}} />
            </Shell>
          }
        />
        <Route
          path="/jobs/:id"
          element={
            <Shell onImport={() => {}}>
              <JobsPage onImport={() => {}} />
            </Shell>
          }
        />
      </Routes>
    </BrowserRouter>
  )
}
