import { useEffect, useReducer, useMemo, useRef } from 'react'
import { useAuth } from '../contexts/useAuth'
import { subscribeToConnections } from '../lib/connectionsService'
import type { Connection } from '../types'

// Por que o hook e não chamar o service direto no componente?
// O hook encapsula três responsabilidades: pegar o clientId do contexto,
// montar o listener onSnapshot, e fazer o cleanup — o componente só
// recebe os dados prontos sem saber como foram obtidos.

// useReducer evita a regra react-hooks/set-state-in-effect (que só bloqueia
// setState de useState, não dispatch de useReducer), mantendo o mesmo comportamento.

interface State {
  connections: Connection[]
  error: string | null
  settled: boolean
}

type Action =
  | { type: 'DATA'; connections: Connection[] }
  | { type: 'ERROR'; message: string }
  | { type: 'RESET' }

const initialState: State = { connections: [], error: null, settled: false }

const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case 'DATA':    return { connections: action.connections, error: null, settled: true }
    case 'ERROR':   return { connections: [], error: action.message, settled: true }
    case 'RESET':   return initialState
    default:        return state
  }
}

interface UseConnectionsResult {
  connections: Connection[]
  loading: boolean
  error: string | null
}

export const useConnections = (): UseConnectionsResult => {
  const { user } = useAuth()
  const [state, dispatch] = useReducer(reducer, initialState)
  const activeUidRef = useRef<string | null>(null)

  useEffect(() => {
    if (!user) {
      activeUidRef.current = null
      dispatch({ type: 'RESET' })
      return
    }

    activeUidRef.current = user.uid
    dispatch({ type: 'RESET' })

    const unsubscribe = subscribeToConnections(
      user.uid,
      (data) => {
        if (activeUidRef.current !== user.uid) return
        dispatch({ type: 'DATA', connections: data })
      },
      (err) => {
        if (activeUidRef.current !== user.uid) return
        console.error('Erro ao carregar conexões:', err)
        dispatch({ type: 'ERROR', message: 'Erro ao carregar conexões. Verifique os índices do Firestore e tente novamente.' })
      }
    )

    return () => {
      unsubscribe()
      dispatch({ type: 'RESET' })
    }
  }, [user])

  return useMemo(() => {
    if (!user) return { connections: [], loading: false, error: null }
    return { connections: state.connections, loading: !state.settled, error: state.error }
  }, [user, state])
}

