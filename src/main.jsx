import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import './tokens.css'
import './index.css'
import App from './App.jsx'

// Production defaults: 60s staleTime = instant cache on tab switch with quiet background revalidation.
// Individual queries can override (e.g. quizNext uses staleTime:0 for always-fresh random question).
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      gcTime: 5 * 60_000,
      refetchOnWindowFocus: false, // typical for content apps — avoids surprise reloads when switching windows
      retry: 1,
    },
  },
})

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>,
)
