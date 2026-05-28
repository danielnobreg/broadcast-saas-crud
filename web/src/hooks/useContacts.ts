import { useEffect, useReducer, useMemo, useRef } from 'react'
import { useAuth } from '../contexts/useAuth'
import { subscribeToContacts } from '../lib/contactsService'
import type { Contact } from '../types'

interface State {
  contacts: Contact[]
  error: string | null
  settled: boolean
}

type Action =
  | { type: 'DATA'; contacts: Contact[] }
  | { type: 'ERROR'; message: string }
  | { type: 'RESET' }

const initialState: State = { contacts: [], error: null, settled: false }

const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case 'DATA':  return { contacts: action.contacts, error: null, settled: true }
    case 'ERROR': return { contacts: [], error: action.message, settled: true }
    case 'RESET': return initialState
    default:      return state
  }
}

interface UseContactsResult {
  contacts: Contact[]
  loading: boolean
  error: string | null
}

// connectionId vem do parâmetro de URL — o hook recebe como argumento
// e reexecuta o useEffect sempre que ele mudar (ex: navegação entre conexões)
export const useContacts = (connectionId: string): UseContactsResult => {
  const { user } = useAuth()
  const [state, dispatch] = useReducer(reducer, initialState)
  const activeKeyRef = useRef<string | null>(null)

  useEffect(() => {
    if (!user || !connectionId) {
      activeKeyRef.current = null
      dispatch({ type: 'RESET' })
      return
    }

    const key = `${user.uid}:${connectionId}`
    activeKeyRef.current = key
    dispatch({ type: 'RESET' })

    const unsubscribe = subscribeToContacts(
      user.uid,
      connectionId,
      (data) => {
        if (activeKeyRef.current !== key) return
        dispatch({ type: 'DATA', contacts: data })
      },
      (err) => {
        if (activeKeyRef.current !== key) return
        console.error('Erro ao carregar contatos:', err)
        dispatch({ type: 'ERROR', message: 'Erro ao carregar contatos. Verifique os índices do Firestore e tente novamente.' })
      }
    )

    return () => {
      unsubscribe()
      dispatch({ type: 'RESET' })
    }
  }, [user, connectionId])

  return useMemo(() => {
    if (!user || !connectionId) return { contacts: [], loading: false, error: null }
    return { contacts: state.contacts, loading: !state.settled, error: state.error }
  }, [user, connectionId, state])
}


