import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
} from 'firebase/firestore'
import { db } from './firebase'
import type { Connection } from '../types'

// Todas as funções recebem clientId explicitamente — nunca buscam o usuário
// por conta própria. Isso mantém as funções puras e testáveis.

// Converte um doc do Firestore no nosso tipo Connection
const toConnection = (id: string, data: Record<string, unknown>): Connection => ({
  id,
  clientId: data.clientId as string,
  name: data.name as string,
  createdAt: (data.createdAt as number) ?? Date.now(),
})

// Escuta mudanças em tempo real nas conexões do cliente.
// Retorna a função de unsubscribe — sempre usar no cleanup do useEffect.
export const subscribeToConnections = (
  clientId: string,
  onChange: (connections: Connection[]) => void,
  onError: (error: Error) => void
) => {
  const q = query(
    collection(db, 'connections'),
    where('clientId', '==', clientId),
    orderBy('createdAt', 'desc')
  )

  return onSnapshot(
    q,
    (snapshot) => {
      const connections = snapshot.docs.map((d) => toConnection(d.id, d.data()))
      onChange(connections)
    },
    onError
  )
}

// Cria uma nova conexão. clientId vem do caller — nunca hardcoded aqui.
export const addConnection = (clientId: string, name: string) =>
  addDoc(collection(db, 'connections'), {
    clientId,
    name: name.trim(),
    createdAt: Date.now(),
  })

// Atualiza apenas o nome — clientId não pode ser alterado pelo cliente
export const updateConnection = (id: string, name: string) =>
  updateDoc(doc(db, 'connections', id), { name: name.trim() })

// Remove a conexão. Atenção: não remove os contatos associados automaticamente.
// Isso deve ser tratado na UI (aviso) ou via Cloud Function futuramente.
export const deleteConnection = (id: string) =>
  deleteDoc(doc(db, 'connections', id))
