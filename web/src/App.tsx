import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import PrivateRoute from './components/PrivateRoute'
import Layout from './components/Layout'
import { CircularProgress, Box } from '@mui/material'

// Lazy loading das páginas — cada uma vira um chunk separado no build.
// O bundle principal cai de ~883 kB para apenas auth + layout + router.
// Cada página é baixada apenas quando o usuário navega até ela.
const Login = lazy(() => import('./pages/Login'))
const Signup = lazy(() => import('./pages/Signup'))
const ConnectionsPage = lazy(() => import('./pages/ConnectionsPage'))
const ContactsPage = lazy(() => import('./pages/ContactsPage'))
const MessagesPage = lazy(() => import('./pages/MessagesPage'))

// Fallback mínimo exibido enquanto o chunk da página é baixado
const PageLoader = () => (
  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
    <CircularProgress sx={{ color: '#818cf8' }} />
  </Box>
)

const App = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* Rotas públicas */}
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />

            {/* Rotas protegidas — PrivateRoute verifica auth, Layout renderiza a sidebar */}
            <Route element={<PrivateRoute />}>
              <Route element={<Layout />}>
                <Route path="/" element={<ConnectionsPage />} />
                <Route
                  path="/connections/:connectionId/contacts"
                  element={<ContactsPage />}
                />
                <Route path="/messages" element={<MessagesPage />} />
              </Route>
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App

