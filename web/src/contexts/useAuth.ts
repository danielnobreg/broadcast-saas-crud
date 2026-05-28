import { useContext } from 'react'
import { AuthContext } from './authContextCore'
import type { AuthContextValue } from './authContextCore'

// Hook extraído em arquivo separado para satisfazer a regra
// react-refresh/only-export-components: AuthContext.tsx exporta apenas o
// Provider (componente React); authContext.ts exporta o contexto;
// este arquivo exporta apenas o hook.
export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de <AuthProvider>')
  }
  return context
}
