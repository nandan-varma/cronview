import { useNavigate } from 'react-router-dom'
import { ImportModal } from '../components/import/ImportModal.js'

export function ImportPage() {
  const navigate = useNavigate()

  return (
    <ImportModal
      onClose={() => navigate('/jobs')}
      onImported={() => navigate('/jobs')}
    />
  )
}
