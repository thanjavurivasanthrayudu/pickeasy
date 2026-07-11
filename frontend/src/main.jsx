import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ErrorBoundary } from 'react-error-boundary'
import './index.css'
import App from './App.jsx'

function ErrorFallback({ error }) {
  return (
    <div style={{ padding: '20px', color: 'red' }}>
      <h2>Something went wrong:</h2>
      <pre>{error.message}</pre>
      <pre>{error.stack}</pre>
    </div>
  )
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
