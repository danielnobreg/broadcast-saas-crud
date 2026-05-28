import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../contexts/useAuth'
import { CircularProgress, Box } from '@mui/material'

// PrivateRoute protege qualquer rota que exige autenticação.
// Uso no roteador: <Route element={<PrivateRoute />}>...rotas filhas...</Route>
//
// Três casos:
//   loading=true  → Firebase ainda verificando sessão → mostra spinner (evita flash)
//   user=null     → não autenticado → redireciona para /login
//   user≠null     → autenticado → renderiza a rota solicitada via <Outlet />

const PrivateRoute = () => {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
        }}
      >
        <CircularProgress />
      </Box>
    )
  }

  return user ? <Outlet /> : <Navigate to="/login" replace />
}

export default PrivateRoute
