import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import type { User } from 'firebase/auth'
import { auth } from '../lib/firebase'
import { AuthContext } from './authContextCore'

// --- Provider ---

// Este arquivo exporta APENAS o AuthProvider (componente React).
// O contexto (AuthContext, AuthContextValue) fica em authContext.ts
// O hook useAuth fica em useAuth.ts
// Essa separação é necessária para a regra react-refresh/only-export-components.
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true) // começa true: Firebase ainda não respondeu

  useEffect(() => {
    // onAuthStateChanged retorna uma função de unsubscribe — sempre limpar no cleanup
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser)
      setLoading(false) // Firebase respondeu — pode renderizar
    })

    return unsubscribe // cleanup: para de ouvir quando o componente desmonta
  }, []) // array vazio: só registra o listener uma vez

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

