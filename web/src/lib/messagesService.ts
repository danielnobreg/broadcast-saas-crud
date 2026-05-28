import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  addDoc,
  deleteDoc,
  doc,
} from 'firebase/firestore'
import { db } from './firebase'
import type { Message, MessageStatus, RecurrenceType } from '../types'

// Funçãozinha rápida pra converter os dados crus que voltam do Firestore 
// no formato tipado de Message que o nosso React entende perfeitamente.
const toMessage = (id: string, data: Record<string, unknown>): Message => ({
  id,
  clientId: data.clientId as string,
  connectionId: data.connectionId as string,
  contactIds: (data.contactIds as string[]) ?? [],
  text: data.text as string,
  status: data.status as MessageStatus,
  scheduledAt: (data.scheduledAt as number | null) ?? null,
  recurrence: (data.recurrence as RecurrenceType | undefined) ?? 'none',
  createdAt: (data.createdAt as number) ?? Date.now(),
})

// Esse é o cara reativo do nosso feed! Ele conecta um "ouvinte" em tempo real na coleção de mensagens.
// A gente usa um filtro duplo obrigatório: pelo clientId (pra garantir que ninguém veja dados de outros clientes)
// e pelo connectionId (pra mostrar só as mensagens desta tela em específico).
// Ele devolve uma função de "unsubscribe" pra gente desligar esse ouvinte quando o usuário sair da página.
export const subscribeToMessages = (
  clientId: string,
  connectionId: string,
  onChange: (messages: Message[]) => void,
  onError: (error: Error) => void
) => {
  const q = query(
    collection(db, 'messages'),
    where('clientId', '==', clientId),
    where('connectionId', '==', connectionId),
    orderBy('createdAt', 'desc')
  )

  return onSnapshot(
    q,
    (snapshot) => {
      const messages = snapshot.docs.map((d) => toMessage(d.id, d.data()))
      onChange(messages)
    },
    onError
  )
}

// Pra criar uma nova mensagem, a lógica é decidida na hora:
// Se o usuário não definiu horário agendado (scheduledAt é null), ela vira "sent" (enviada imediatamente).
// Se tem um horário no futuro, o status vira "scheduled" (agendada) e fica na fila esperando a Cloud Function do servidor.
export const addMessage = (
  clientId: string,
  connectionId: string,
  contactIds: string[],
  text: string,
  scheduledAt: number | null,
  recurrence: RecurrenceType = 'none'
) => {
  const status: MessageStatus = scheduledAt === null ? 'sent' : 'scheduled'

  return addDoc(collection(db, 'messages'), {
    clientId,
    connectionId,
    contactIds,
    text: text.trim(),
    status,
    scheduledAt,
    recurrence,
    createdAt: Date.now(),
  })
}

// Deleta a mensagem do Firestore usando o ID do documento. Sem mistério!
export const deleteMessage = (id: string) =>
  deleteDoc(doc(db, 'messages', id))
