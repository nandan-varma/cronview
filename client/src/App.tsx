import { useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Shell } from './components/layout/Shell.js'
import { JobsPage } from './pages/JobsPage.js'
import { ImportPage } from './pages/ImportPage.js'
import { ImportModal } from './components/import/ImportModal.js'

export default function App() {
  const [showImport, setShowImport] = useState(false)

  return (
    <BrowserRouter>
      {showImport && (
        <ImportModal
          onClose={() => setShowImport(false)}
          onImported={() => setShowImport(false)}
        />
      )}
      <Routes>
        <Route path="/" element={<Navigate to="/jobs" replace />} />
        <Route
          path="/jobs"
          element={
            <Shell onImport={() => setShowImport(true)}>
              <JobsPage onImport={() => setShowImport(true)} />
            </Shell>
          }
        />
        <Route
          path="/jobs/:id"
          element={
            <Shell onImport={() => setShowImport(true)}>
              <JobsPage onImport={() => setShowImport(true)} />
            </Shell>
          }
        />
        <Route
          path="/import"
          element={
            <Shell onImport={() => setShowImport(true)}>
              <ImportPage />
            </Shell>
          }
        />
      </Routes>
    </BrowserRouter>
  )
}
