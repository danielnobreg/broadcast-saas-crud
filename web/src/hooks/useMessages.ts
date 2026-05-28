import { useEffect, useReducer, useMemo, useRef } from 'react'
import { useAuth } from '../contexts/useAuth'
import { subscribeToMessages } from '../lib/messagesService'
import type { Message } from '../types'

interface State {
  messages: Message[]
  error: string | null
  settled: boolean
}

type Action =
  | { type: 'DATA'; messages: Message[] }
  | { type: 'ERROR'; message: string }
  | { type: 'RESET' }

const initialState: State = { messages: [], error: null, settled: false }

const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case 'DATA':  return { messages: action.messages, error: null, settled: true }
    case 'ERROR': return { messages: [], error: action.message, settled: true }
    case 'RESET': return initialState
    default:      return state
  }
}

interface UseMessagesResult {
  messages: Message[]
  loading: boolean
  error: string | null
}

// Esse hook customizado gerencia o estado e as mensagens em tempo real de uma conexão.
// O connectionId pode começar nulo (caso o usuário não tenha selecionado nada na tela ainda).
export const useMessages = (connectionId: string | null): UseMessagesResult => {
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

    // Cria a escuta ativa do Firestore.
    // Se o connectionId mudar, o próprio useEffect desliga o ouvinte anterior
    // (via cleanup) e liga um novo, evitando leituras duplicadas.
    const unsubscribe = subscribeToMessages(
      user.uid,
      connectionId,
      (data) => {
        if (activeKeyRef.current !== key) return
        dispatch({ type: 'DATA', messages: data })
      },
      (err) => {
        if (activeKeyRef.current !== key) return
        console.error('Erro ao carregar mensagens no hook:', err)
        dispatch({ type: 'ERROR', message: 'Não conseguimos carregar as mensagens. Dá uma olhadinha se os índices do Firestore já foram criados na sua conta!' })
      }
    )

    return () => {
      unsubscribe()
      dispatch({ type: 'RESET' })
    }
  }, [user, connectionId])

  return useMemo(() => {
    if (!user || !connectionId) return { messages: [], loading: false, error: null }
    return { messages: state.messages, loading: !state.settled, error: state.error }
  }, [user, connectionId, state])
}


