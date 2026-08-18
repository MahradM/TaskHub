import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'sonner'
import App from './App'
import { AuthProvider } from './contexts/AuthContext'
import { ThemeProvider } from './contexts/ThemeContext'
import './index.css'
const queryClient = new QueryClient({ defaultOptions: { queries: { staleTime: 30_000, retry: 1, refetchOnWindowFocus: false } } })
const basename = import.meta.env.BASE_URL === '/' ? '/' : import.meta.env.BASE_URL.replace(/\/$/, '')
createRoot(document.getElementById('root')!).render(<StrictMode><ThemeProvider><QueryClientProvider client={queryClient}><AuthProvider><BrowserRouter basename={basename}><App/></BrowserRouter><Toaster position="top-right" richColors closeButton/></AuthProvider></QueryClientProvider></ThemeProvider></StrictMode>)
