import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider, createRouter } from '@tanstack/react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ThemeProvider } from '@/app/providers/theme-provider'
import { AuthProvider } from '@/app/providers/auth-provider'
import { I18nProvider } from '@/app/providers/i18n-provider'
import '@/core/config/firebase'
import { routeTree } from './route-tree.gen'
import '../index.css'

const router = createRouter({ routeTree })
const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000, refetchOnWindowFocus: false } },
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <I18nProvider>
        <AuthProvider>
          <RouterProvider router={router} />
        </AuthProvider>
        </I18nProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </StrictMode>,
)
