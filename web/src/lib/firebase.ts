import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

// Todas as variáveis vêm do .env.local — nunca hardcode aqui
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

// initializeApp deve ser chamado UMA vez — aqui, no módulo raiz
const app = initializeApp(firebaseConfig)

// Exportamos as instâncias prontas para uso em qualquer módulo
export const auth = getAuth(app)
export const db = getFirestore(app)
