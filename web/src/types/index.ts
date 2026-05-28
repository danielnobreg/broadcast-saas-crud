import type { User } from 'firebase/auth'

// Representa o estado global de autenticação
export interface AuthState {
  user: User | null   // null = não autenticado, User = autenticado
  loading: boolean    // true enquanto o Firebase ainda está verificando a sessão
}

// Dados de uma conexão no Firestore
export interface Connection {
  id: string
  clientId: string
  name: string
  createdAt: number   // timestamp em ms (Date.now())
}

// Dados de um contato no Firestore
export interface Contact {
  id: string
  clientId: string
  connectionId: string
  name: string
  phone: string
  createdAt: number
}

// Status possíveis de uma mensagem
export type MessageStatus = 'scheduled' | 'sent'

// Tipos de recorrência de mensagens
export type RecurrenceType = 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly';

// Dados de uma mensagem no Firestore
export interface Message {
  id: string
  clientId: string
  connectionId: string
  contactIds: string[]
  text: string
  status: MessageStatus
  scheduledAt: number | null  // null = envio imediato
  recurrence?: RecurrenceType  // recorrência para mensagens agendadas
  createdAt: number
}
