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
import type { Contact } from '../types'

const toContact = (id: string, data: Record<string, unknown>): Contact => ({
  id,
  clientId: data.clientId as string,
  connectionId: data.connectionId as string,
  name: data.name as string,
  phone: data.phone as string,
  createdAt: (data.createdAt as number) ?? Date.now(),
})

// Duplo filtro: clientId garante isolamento SaaS, connectionId filtra a conexão certa.
// Ambos são necessários — um sem o outro quebraria o isolamento ou retornaria dados errados.
export const subscribeToContacts = (
  clientId: string,
  connectionId: string,
  onChange: (contacts: Contact[]) => void,
  onError: (error: Error) => void
) => {
  const q = query(
    collection(db, 'contacts'),
    where('clientId', '==', clientId),
    where('connectionId', '==', connectionId),
    orderBy('createdAt', 'desc')
  )

  return onSnapshot(
    q,
    (snapshot) => {
      const contacts = snapshot.docs.map((d) => toContact(d.id, d.data()))
      onChange(contacts)
    },
    onError
  )
}

export const addContact = (
  clientId: string,
  connectionId: string,
  name: string,
  phone: string
) =>
  addDoc(collection(db, 'contacts'), {
    clientId,
    connectionId,
    name: name.trim(),
    phone: phone.trim(),
    createdAt: Date.now(),
  })

export const updateContact = (id: string, name: string, phone: string) =>
  updateDoc(doc(db, 'contacts', id), {
    name: name.trim(),
    phone: phone.trim(),
  })

export const deleteContact = (id: string) =>
  deleteDoc(doc(db, 'contacts', id))
