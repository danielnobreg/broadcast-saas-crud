import { setGlobalOptions } from 'firebase-functions'
import { onSchedule } from 'firebase-functions/v2/scheduler'
import { initializeApp } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import * as logger from 'firebase-functions/logger'

// Aqui a gente inicializa o Firebase Admin pra conseguir mexer no Firestore direto do servidor.
// Como roda no backend interno do Google, ele pula as regras de segurança normais e tem passe livre
// pra ler e atualizar qualquer coleção sem problemas de permissão.
initializeApp()

// Coloquei no máximo 10 instâncias ligadas ao mesmo tempo pra sua carteira não chorar 
// com cobranças inesperadas do Google se o volume de requisições explodir do nada!
setGlobalOptions({ maxInstances: 10 })

// Essa funçãozinha calcula quando deve ser o próximo envio caso a mensagem seja do tipo recorrente.
// Ela adiciona dias, semanas ou meses na data de hoje e devolve o novo horário em milissegundos.
const calculateNextOccurrence = (currentScheduledAt: number, recurrence: string): number => {
  const date = new Date(currentScheduledAt)
  switch (recurrence) {
    case 'daily':
      date.setDate(date.getDate() + 1)
      break
    case 'weekly':
      date.setDate(date.getDate() + 7)
      break
    case 'monthly':
      date.setMonth(date.getMonth() + 1)
      break
    case 'yearly':
      date.setFullYear(date.getFullYear() + 1)
      break
  }
  return date.getTime()
}

// Esse é o agendador principal. Ele vai rodar de 1 em 1 minuto na região de São Paulo (southamerica-east1)
// pra ficar bem pertinho dos seus usuários e responder com latência super baixa.
export const processScheduledMessages = onSchedule(
  {
    schedule: 'every 1 minutes',
    region: 'southamerica-east1',
  },
  async () => {
    const db = getFirestore()
    const now = Date.now()

    // 1. Busca todas as mensagens que estão como "agendadas" e que o horário de envio já passou.
    const snapshot = await db
      .collection('messages')
      .where('status', '==', 'scheduled')
      .where('scheduledAt', '<=', now)
      .get()

    // Se a busca voltou vazia, a gente só deixa um log avisando e sai de fininho pra economizar recursos.
    if (snapshot.empty) {
      logger.info('processScheduledMessages: nenhuma mensagem precisando ser enviada agora.', { now })
      return
    }

    logger.info(`processScheduledMessages: encontramos ${snapshot.size} mensagem(ns) pra enviar!`, { now })

    // Usamos o recurso de Batch do Firestore pra atualizar todas as mensagens juntas.
    // Isso garante atomicidade: ou todas atualizam com sucesso total ou nenhuma muda (evita bagunça no banco).
    const batch = db.batch()
    
    snapshot.docs.forEach((docSnap) => {
      const data = docSnap.data()
      
      // A mensagem que estava na fila agora é marcada como "sent" (enviada).
      batch.update(docSnap.ref, { status: 'sent' })

      // E se a mensagem tiver recorrência ativa? (tipo todo dia ou toda semana)
      // A gente calcula a data do próximo disparo e já cria um novo agendamento na fila pro futuro.
      const recurrence = data.recurrence
      const scheduledAt = data.scheduledAt
      
      if (recurrence && recurrence !== 'none' && typeof scheduledAt === 'number') {
        const nextScheduledAt = calculateNextOccurrence(scheduledAt, recurrence)
        const nextDocRef = db.collection('messages').doc()
        
        batch.set(nextDocRef, {
          clientId: data.clientId,
          connectionId: data.connectionId,
          contactIds: data.contactIds,
          text: data.text,
          status: 'scheduled',
          scheduledAt: nextScheduledAt,
          recurrence: recurrence,
          createdAt: now,
        })
      }
    })

    // Commitando o lote de atualizações no banco de dados.
    await batch.commit()

    logger.info(`processScheduledMessages: as ${snapshot.size} mensagens foram disparadas e salvas com sucesso total!`)
  }
)
