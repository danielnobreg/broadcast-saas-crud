import { createContext } from 'react'
import type { User } from 'firebase/auth'

// --- Tipos do contexto ---
export interface AuthContextValue {
  user: User | null
  loading: boolean
}

// --- Criação do contexto ---
// Arquivo sem componentes React — apenas criação do contexto.
// Separado de AuthContext.tsx (Provider) e useAuth.ts (hook) para satisfazer
// a regra react-refresh/only-export-components, que proíbe misturar
// exportações de componentes com não-componentes no mesmo arquivo.
export const AuthContext = createContext<AuthContextValue | undefined>(undefined)
