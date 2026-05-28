import { useState, useMemo } from 'react'
import { useAuth } from '../contexts/useAuth'
import { useConnections } from '../hooks/useConnections'
import { useContacts } from '../hooks/useContacts'
import { useMessages } from '../hooks/useMessages'
import { addMessage, deleteMessage } from '../lib/messagesService'
import type { Message, MessageStatus, RecurrenceType } from '../types'
import {
  Box,
  Button,
  Typography,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Paper,
  CircularProgress,
  Tooltip,
  Snackbar,
  Alert,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Checkbox,
  Divider,
  FormControlLabel,
  Switch,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import DeleteIcon from '@mui/icons-material/Delete'
import MessageIcon from '@mui/icons-material/Message'
import ScheduleIcon from '@mui/icons-material/Schedule'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import PeopleIcon from '@mui/icons-material/People'
import InboxIcon from '@mui/icons-material/Inbox'
import SyncIcon from '@mui/icons-material/Sync'

// ── Tipos internos ──────────────────────────────────────────────────────────

type StatusFilter = 'all' | 'scheduled' | 'sent'

const EMPTY_FORM = {
  text: '',
  contactIds: [] as string[],
  scheduledAt: '',   // string no formato datetime-local: "YYYY-MM-DDTHH:mm"
  useSchedule: false,
  recurrence: 'none' as RecurrenceType,
}

// ── Helpers ─────────────────────────────────────────────────────────────────

const formatDate = (ts: number): string =>
  new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(ts))

// Converte string "YYYY-MM-DDTHH:mm" para timestamp ms.
// Retorna null se a string for vazia.
const parseScheduledAt = (value: string): number | null => {
  if (!value) return null
  return new Date(value).getTime()
}

// Valor mínimo para o input datetime-local: agora + 2 minutos (arredondado)
const minDateTimeLocal = (): string => {
  const d = new Date(Date.now() + 2 * 60 * 1000)
  d.setSeconds(0, 0)
  const tzOffset = d.getTimezoneOffset() * 60000
  return new Date(d.getTime() - tzOffset).toISOString().slice(0, 16)
}

// ── Estilos compartilhados ──────────────────────────────────────────────────

const inputSx = {
  '& .MuiOutlinedInput-root': {
    color: '#f8fafc',
    borderRadius: '12px',
    backgroundColor: 'rgba(30, 41, 59, 0.25)',
    transition: 'all 0.3s ease',
    '& fieldset': {
      borderColor: 'rgba(255, 255, 255, 0.08)',
      transition: 'all 0.3s ease',
    },
    '&:hover fieldset': {
      borderColor: 'rgba(99, 102, 241, 0.4)',
    },
    '&.Mui-focused fieldset': {
      borderColor: '#818cf8',
      borderWidth: '1.5px',
      boxShadow: '0 0 0 4px rgba(99, 102, 241, 0.15)',
    },
  },
  '& .MuiInputLabel-root': {
    color: '#64748b',
    fontWeight: 500,
  },
  '& .MuiInputLabel-root.Mui-focused': {
    color: '#818cf8',
  },
}

const selectSx = {
  color: '#f8fafc',
  borderRadius: '12px',
  backgroundColor: 'rgba(30, 41, 59, 0.25)',
  '& .MuiOutlinedInput-notchedOutline': {
    borderColor: 'rgba(255, 255, 255, 0.08)',
    transition: 'all 0.3s ease',
  },
  '&:hover .MuiOutlinedInput-notchedOutline': {
    borderColor: 'rgba(99, 102, 241, 0.4)',
  },
  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
    borderColor: '#818cf8',
    borderWidth: '1.5px',
    boxShadow: '0 0 0 4px rgba(99, 102, 241, 0.15)',
  },
  '& .MuiSelect-icon': { color: '#64748b' },
  '& .MuiSelect-select .MuiChip-root': { maxWidth: '140px' },
}

const labelSx = { color: '#64748b', fontWeight: 500, '&.Mui-focused': { color: '#818cf8' } }

const dialogPaperSx = {
  backgroundColor: 'rgba(15, 23, 42, 0.92)',
  border: '1px solid rgba(255, 255, 255, 0.08)',
  backdropFilter: 'blur(24px)',
  borderRadius: '20px',
  p: 1,
}

// ── Badges de status ─────────────────────────────────────────────────────────

const StatusBadge = ({ status }: { status: MessageStatus }) => {
  const isScheduled = status === 'scheduled'
  return (
    <Box
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 0.6,
        px: 1.2,
        py: 0.3,
        borderRadius: '999px',
        fontSize: '0.7rem',
        fontWeight: 700,
        letterSpacing: '0.06em',
        backgroundColor: isScheduled
          ? 'rgba(234, 179, 8, 0.1)'
          : 'rgba(16, 185, 129, 0.1)',
        color: isScheduled ? '#fbbf24' : '#34d399',
        border: `1px solid ${isScheduled ? 'rgba(234, 179, 8, 0.25)' : 'rgba(16, 185, 129, 0.25)'}`,
      }}
    >
      {isScheduled ? (
        <ScheduleIcon sx={{ fontSize: '0.75rem' }} />
      ) : (
        <CheckCircleIcon sx={{ fontSize: '0.75rem' }} />
      )}
      {isScheduled ? 'AGENDADO' : 'ENVIADO'}
    </Box>
  )
}

// ── Componente principal ─────────────────────────────────────────────────────

const MessagesPage = () => {
  const { user } = useAuth()
  const { connections } = useConnections()

  // Guarda o ID da conexão que o usuário escolheu no dropdown pra carregar os dados certos.
  const [selectedConnectionId, setSelectedConnectionId] = useState<string>('')

  // Esses dois hooks reagem sozinhos quando a conexão selecionada muda.
  const contacts = useContacts(selectedConnectionId)
  const { messages, loading } = useMessages(selectedConnectionId || null)

  // Controla tudo relacionado à janelinha (modal) de compor e criar novas mensagens.
  const [dialogOpen, setDialogOpen] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [dateInputFocused, setDateInputFocused] = useState(false)

  // Controla a janelinha de confirmação antes de excluir qualquer mensagem definitivamente.
  const [deleteTarget, setDeleteTarget] = useState<Message | null>(null)
  const [deleting, setDeleting] = useState(false)

  // Armazena o status e a data selecionados pra fazer a busca na tela.
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [dateFilter, setDateFilter] = useState<string>('')

  // Guarda alertas de erro temporários para mostrar na tela se algo der ruim.
  const [error, setError] = useState<string | null>(null)

  // Filtra as mensagens em memória! Isso é ótimo porque evita requisições extras e lentidão.
  const filteredMessages = useMemo(() => {
    let list = messages
    if (statusFilter !== 'all') {
      list = list.filter((m) => m.status === statusFilter)
    }
    if (dateFilter) {
      list = list.filter((m) => {
        const ts = m.scheduledAt || m.createdAt
        const d = new Date(ts)
        const year = d.getFullYear()
        const month = String(d.getMonth() + 1).padStart(2, '0')
        const day = String(d.getDate()).padStart(2, '0')
        const dateStr = `${year}-${month}-${day}`
        return dateStr === dateFilter
      })
    }
    return list
  }, [messages, statusFilter, dateFilter])

  // ── Ações e cliques da tela (Handlers) ───────────────────────────────────────

  const openCompose = () => {
    setForm({ ...EMPTY_FORM, contactIds: [] })
    setDialogOpen(true)
  }

  const closeDialog = () => {
    setDialogOpen(false)
    setForm(EMPTY_FORM)
    setDateInputFocused(false)
  }

  const handleSave = async () => {
    if (!form.text.trim() || !user || !selectedConnectionId) return
    if (form.contactIds.length === 0) return

    const scheduledAt = form.useSchedule ? parseScheduledAt(form.scheduledAt) : null

    if (form.useSchedule) {
      if (!scheduledAt || scheduledAt <= Date.now()) {
        setError('A data e hora do agendamento deve ser no futuro.')
        return
      }
    }

    setSaving(true)
    try {
      await addMessage(
        user.uid,
        selectedConnectionId,
        form.contactIds,
        form.text,
        scheduledAt,
        form.useSchedule ? form.recurrence : 'none'
      )
      closeDialog()
    } catch {
      setError('Erro ao criar mensagem. Tente novamente.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await deleteMessage(deleteTarget.id)
      setDeleteTarget(null)
    } catch {
      setError('Erro ao deletar mensagem. Tente novamente.')
    } finally {
      setDeleting(false)
    }
  }

  const toggleContact = (contactId: string) => {
    setForm((prev) => ({
      ...prev,
      contactIds: prev.contactIds.includes(contactId)
        ? prev.contactIds.filter((id) => id !== contactId)
        : [...prev.contactIds, contactId],
    }))
  }

  const toggleAllContacts = () => {
    const allIds = contacts.contacts.map((c) => c.id)
    const allSelected = allIds.every((id) => form.contactIds.includes(id))
    setForm((prev) => ({
      ...prev,
      contactIds: allSelected ? [] : allIds,
    }))
  }

  // Regrinha de segurança básica: só deixa salvar se tiver texto, contatos e, se for agendada, data válida.
  const canSave =
    form.text.trim().length > 0 &&
    form.contactIds.length > 0 &&
    (!form.useSchedule || (form.scheduledAt !== '' && parseScheduledAt(form.scheduledAt) !== null))

  // ── UI ───────────────────────────────────────────────────────────────────────

  return (
    <Box>
      {/* ── Header ── */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          mb: 4,
          flexWrap: 'wrap',
          gap: 2,
        }}
      >
        <Box>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 800,
              letterSpacing: '-0.03em',
              background: 'linear-gradient(135deg, #f8fafc 0%, #cbd5e1 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Mensagens
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748b', mt: 0.5, fontWeight: 500 }}>
            {selectedConnectionId
              ? `${filteredMessages.length} mensagem${filteredMessages.length !== 1 ? 's' : ''}`
              : 'Selecione uma conexão para começar'}
          </Typography>
        </Box>

        <Button
          id="btn-compose-message"
          variant="contained"
          startIcon={<AddIcon />}
          onClick={openCompose}
          disabled={!selectedConnectionId}
          sx={{
            py: 1.4,
            px: 2.5,
            background: selectedConnectionId
              ? 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)'
              : undefined,
            borderRadius: '12px',
            fontWeight: 600,
            textTransform: 'none',
            fontSize: '0.875rem',
            boxShadow: '0 4px 12px 0 rgba(99, 102, 241, 0.3)',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            '&:not(:disabled):hover': {
              background: 'linear-gradient(135deg, #4f46e5 0%, #4338ca 100%)',
              boxShadow: '0 6px 16px 0 rgba(99, 102, 241, 0.45)',
              transform: 'translateY(-1px)',
            },
            '&:active': { transform: 'translateY(0)' },
          }}
        >
          Nova mensagem
        </Button>
      </Box>

      {/* ── Seletor de conexão ── */}
      <Paper
        elevation={0}
        sx={{
          p: 3,
          mb: 3,
          backgroundColor: 'rgba(15, 23, 42, 0.35)',
          border: '1px solid rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(12px)',
          borderRadius: '16px',
        }}
      >
        <FormControl fullWidth size="small">
          <InputLabel id="connection-select-label" sx={labelSx}>
            Conexão
          </InputLabel>
          <Select
            labelId="connection-select-label"
            id="select-connection"
            value={selectedConnectionId}
            label="Conexão"
            onChange={(e) => {
              setSelectedConnectionId(e.target.value)
              setStatusFilter('all')
            }}
            sx={selectSx}
            MenuProps={{
              slotProps: {
                paper: {
                  sx: {
                    backgroundColor: 'rgba(15, 23, 42, 0.95)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '12px',
                    backdropFilter: 'blur(20px)',
                    mt: 0.5,
                  },
                },
              },
            }}
          >
            {connections.length === 0 && (
              <MenuItem disabled>
                <Typography sx={{ color: '#64748b', fontSize: '0.875rem' }}>
                  Nenhuma conexão cadastrada
                </Typography>
              </MenuItem>
            )}
            {connections.map((conn) => (
              <MenuItem
                key={conn.id}
                value={conn.id}
                sx={{
                  color: '#f8fafc',
                  borderRadius: '8px',
                  mx: 0.5,
                  '&:hover': { backgroundColor: 'rgba(99, 102, 241, 0.1)' },
                  '&.Mui-selected': {
                    backgroundColor: 'rgba(99, 102, 241, 0.15)',
                    '&:hover': { backgroundColor: 'rgba(99, 102, 241, 0.2)' },
                  },
                }}
              >
                {conn.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Paper>

      {/* ── Filtros de status e data ── */}
      {selectedConnectionId && (
        <Box sx={{ display: 'flex', gap: 1.5, mb: 3, flexWrap: 'wrap', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', gap: 1 }}>
            {(['all', 'scheduled', 'sent'] as StatusFilter[]).map((f) => {
              const labels: Record<StatusFilter, string> = {
                all: 'Todas',
                scheduled: 'Agendadas',
                sent: 'Enviadas',
              }
              const active = statusFilter === f
              return (
                <Chip
                  key={f}
                  id={`filter-${f}`}
                  label={labels[f]}
                  onClick={() => setStatusFilter(f)}
                  sx={{
                    fontWeight: 600,
                    fontSize: '0.8rem',
                    borderRadius: '999px',
                    transition: 'all 0.2s',
                    backgroundColor: active
                      ? 'rgba(99, 102, 241, 0.2)'
                      : 'rgba(30, 41, 59, 0.3)',
                    color: active ? '#818cf8' : '#64748b',
                    border: `1px solid ${active ? 'rgba(99, 102, 241, 0.4)' : 'rgba(255, 255, 255, 0.05)'}`,
                    '&:hover': {
                      backgroundColor: active
                        ? 'rgba(99, 102, 241, 0.28)'
                        : 'rgba(99, 102, 241, 0.08)',
                      color: '#818cf8',
                    },
                  }}
                />
              )
            })}
          </Box>

          {/* Filtro de Data */}
          <Box sx={{ ml: 'auto', display: 'flex', gap: 1, alignItems: 'center' }}>
            <Typography sx={{ color: '#64748b', fontSize: '0.75rem', fontWeight: 600 }}>
              Filtrar por dia:
            </Typography>
            <TextField
              type="date"
              size="small"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              slotProps={{
                htmlInput: {
                  style: {
                    color: '#f8fafc',
                    fontSize: '0.8rem',
                    padding: '5px 10px',
                  }
                }
              }}
              sx={{
                backgroundColor: 'rgba(30, 41, 59, 0.3)',
                borderRadius: '8px',
                border: '1px solid rgba(255, 255, 255, 0.05)',
                '& .MuiOutlinedInput-root': {
                  borderRadius: '8px',
                  '& fieldset': { border: 'none' },
                },
                '& input[type="date"]::-webkit-calendar-picker-indicator': {
                  filter: 'invert(0.6)',
                  cursor: 'pointer',
                },
              }}
            />
            {dateFilter && (
              <Button
                size="small"
                onClick={() => setDateFilter('')}
                sx={{
                  color: '#f87171',
                  fontSize: '0.75rem',
                  textTransform: 'none',
                  fontWeight: 600,
                  backgroundColor: 'rgba(248, 113, 113, 0.1)',
                  borderRadius: '8px',
                  px: 1.5,
                  minWidth: 0,
                  height: '32px',
                  '&:hover': {
                    backgroundColor: 'rgba(248, 113, 113, 0.2)',
                  }
                }}
              >
                Limpar
              </Button>
            )}
          </Box>
        </Box>
      )}

      {/* ── Loading ── */}
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 12 }}>
          <CircularProgress sx={{ color: '#818cf8' }} />
        </Box>
      )}

      {/* ── Prompt: sem conexão selecionada ── */}
      {!selectedConnectionId && !loading && (
        <Box
          sx={{
            textAlign: 'center',
            py: 12,
            px: 4,
            border: '1px dashed rgba(255, 255, 255, 0.06)',
            borderRadius: '20px',
            backgroundColor: 'rgba(15, 23, 42, 0.15)',
          }}
        >
          <MessageIcon
            sx={{
              fontSize: 60,
              color: 'rgba(99, 102, 241, 0.2)',
              filter: 'drop-shadow(0 0 10px rgba(99, 102, 241, 0.12))',
              mb: 2.5,
            }}
          />
          <Typography variant="h6" sx={{ color: '#e2e8f0', fontWeight: 600, mb: 1 }}>
            Selecione uma conexão
          </Typography>
          <Typography sx={{ color: '#64748b', fontSize: '0.875rem', maxWidth: '280px', mx: 'auto' }}>
            Escolha uma conexão acima para ver e criar mensagens.
          </Typography>
        </Box>
      )}

      {/* ── Empty state: conexão selecionada mas sem mensagens ── */}
      {selectedConnectionId && !loading && filteredMessages.length === 0 && (
        <Box
          sx={{
            textAlign: 'center',
            py: 12,
            px: 4,
            border: '1px dashed rgba(255, 255, 255, 0.06)',
            borderRadius: '20px',
            backgroundColor: 'rgba(15, 23, 42, 0.2)',
          }}
        >
          <InboxIcon
            sx={{
              fontSize: 60,
              color: 'rgba(99, 102, 241, 0.2)',
              filter: 'drop-shadow(0 0 10px rgba(99, 102, 241, 0.12))',
              mb: 2.5,
            }}
          />
          <Typography variant="h6" sx={{ color: '#e2e8f0', fontWeight: 600, mb: 1 }}>
            {statusFilter === 'all' ? 'Nenhuma mensagem ainda' : `Nenhuma mensagem ${statusFilter === 'scheduled' ? 'agendada' : 'enviada'}`}
          </Typography>
          <Typography sx={{ color: '#64748b', fontSize: '0.875rem', maxWidth: '280px', mx: 'auto', mb: 3 }}>
            {statusFilter === 'all'
              ? 'Crie sua primeira mensagem para esta conexão.'
              : 'Tente mudar o filtro de status.'}
          </Typography>
          {statusFilter === 'all' && (
            <Button
              onClick={openCompose}
              sx={{
                color: '#818cf8',
                fontWeight: 600,
                textTransform: 'none',
                borderRadius: '8px',
                padding: '6px 16px',
                backgroundColor: 'rgba(99, 102, 241, 0.06)',
                transition: 'all 0.2s',
                '&:hover': {
                  color: '#a78bfa',
                  backgroundColor: 'rgba(99, 102, 241, 0.12)',
                },
              }}
            >
              Criar a primeira
            </Button>
          )}
        </Box>
      )}

      {/* ── Lista de mensagens ── */}
      {!loading && filteredMessages.length > 0 && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {filteredMessages.map((msg) => (
            <MessageCard
              key={msg.id}
              message={msg}
              onDelete={() => setDeleteTarget(msg)}
            />
          ))}
        </Box>
      )}

      {/* ── Dialog compose ── */}
      <Dialog
        open={dialogOpen}
        onClose={closeDialog}
        fullWidth
        maxWidth="sm"
        slotProps={{ paper: { sx: dialogPaperSx } }}
      >
        <DialogTitle sx={{ color: '#f8fafc', fontWeight: 700, fontSize: '1.2rem', pb: 1 }}>
          Nova mensagem
        </DialogTitle>
        <DialogContent sx={{ pt: '10px !important', display: 'flex', flexDirection: 'column', gap: 2.5 }}>

          {/* Texto */}
          <TextField
            id="input-message-text"
            label="Mensagem"
            fullWidth
            multiline
            minRows={3}
            maxRows={6}
            value={form.text}
            onChange={(e) => setForm((prev) => ({ ...prev, text: e.target.value }))}
            placeholder="Digite o texto da mensagem..."
            sx={inputSx}
          />

          <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.05)' }} />

          {/* Multi-select de contatos */}
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
              <Typography sx={{ color: '#94a3b8', fontSize: '0.8rem', fontWeight: 600, letterSpacing: '0.06em' }}>
                DESTINATÁRIOS
              </Typography>
              {contacts.contacts.length > 0 && (
                <Button
                  size="small"
                  onClick={toggleAllContacts}
                  sx={{
                    color: '#818cf8',
                    fontWeight: 600,
                    textTransform: 'none',
                    fontSize: '0.75rem',
                    p: '2px 8px',
                    borderRadius: '6px',
                    '&:hover': { backgroundColor: 'rgba(99, 102, 241, 0.1)' },
                  }}
                >
                  {contacts.contacts.every((c) => form.contactIds.includes(c.id))
                    ? 'Desmarcar todos'
                    : 'Selecionar todos'}
                </Button>
              )}
            </Box>

            {contacts.loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
                <CircularProgress size={24} sx={{ color: '#818cf8' }} />
              </Box>
            ) : contacts.contacts.length === 0 ? (
              <Box
                sx={{
                  py: 3,
                  textAlign: 'center',
                  border: '1px dashed rgba(255,255,255,0.06)',
                  borderRadius: '12px',
                }}
              >
                <Typography sx={{ color: '#64748b', fontSize: '0.875rem' }}>
                  Nenhum contato nesta conexão. Cadastre contatos primeiro.
                </Typography>
              </Box>
            ) : (
              <Box
                sx={{
                  maxHeight: '200px',
                  overflowY: 'auto',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                  borderRadius: '12px',
                  backgroundColor: 'rgba(30, 41, 59, 0.15)',
                  '&::-webkit-scrollbar': { width: '4px' },
                  '&::-webkit-scrollbar-track': { background: 'transparent' },
                  '&::-webkit-scrollbar-thumb': {
                    background: 'rgba(99, 102, 241, 0.3)',
                    borderRadius: '4px',
                  },
                }}
              >
                {contacts.contacts.map((contact, idx) => {
                  const selected = form.contactIds.includes(contact.id)
                  return (
                    <Box key={contact.id}>
                      <Box
                        onClick={() => toggleContact(contact.id)}
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          px: 2,
                          py: 1.2,
                          cursor: 'pointer',
                          transition: 'all 0.15s',
                          backgroundColor: selected
                            ? 'rgba(99, 102, 241, 0.08)'
                            : 'transparent',
                          '&:hover': {
                            backgroundColor: selected
                              ? 'rgba(99, 102, 241, 0.12)'
                              : 'rgba(255, 255, 255, 0.03)',
                          },
                        }}
                      >
                        <Checkbox
                          checked={selected}
                          size="small"
                          sx={{
                            color: '#475569',
                            '&.Mui-checked': { color: '#818cf8' },
                            p: 0,
                            mr: 1.5,
                          }}
                        />
                        <Box>
                          <Typography sx={{ color: '#f8fafc', fontSize: '0.875rem', fontWeight: 500 }}>
                            {contact.name}
                          </Typography>
                          <Typography sx={{ color: '#64748b', fontSize: '0.75rem' }}>
                            {contact.phone}
                          </Typography>
                        </Box>
                      </Box>
                      {idx < contacts.contacts.length - 1 && (
                        <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.03)' }} />
                      )}
                    </Box>
                  )
                })}
              </Box>
            )}

            {form.contactIds.length > 0 && (
              <Typography sx={{ color: '#818cf8', fontSize: '0.75rem', fontWeight: 600, mt: 1 }}>
                {form.contactIds.length} contato{form.contactIds.length !== 1 ? 's' : ''} selecionado{form.contactIds.length !== 1 ? 's' : ''}
              </Typography>
            )}
          </Box>

          <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.05)' }} />

          {/* Agendamento */}
          <Box>
            <FormControlLabel
              control={
                <Switch
                  checked={form.useSchedule}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      useSchedule: e.target.checked,
                      scheduledAt: '',
                      recurrence: 'none',
                    }))
                  }
                  sx={{
                    '& .MuiSwitch-switchBase.Mui-checked': { color: '#818cf8' },
                    '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                      backgroundColor: '#6366f1',
                    },
                  }}
                />
              }
              label={
                <Typography sx={{ color: '#94a3b8', fontSize: '0.875rem', fontWeight: 500 }}>
                  Agendar envio
                </Typography>
              }
            />

            {form.useSchedule && (
              <Box sx={{ mt: 1.5, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                <TextField
                  id="input-scheduled-at"
                  label="Data e hora do envio"
                  type={dateInputFocused || form.scheduledAt ? 'datetime-local' : 'text'}
                  fullWidth
                  value={form.scheduledAt}
                  onChange={(e) => setForm((prev) => ({ ...prev, scheduledAt: e.target.value }))}
                  onFocus={() => setDateInputFocused(true)}
                  onBlur={() => setDateInputFocused(false)}
                  slotProps={{
                    inputLabel: { shrink: dateInputFocused || !!form.scheduledAt },
                    htmlInput: { min: minDateTimeLocal() },
                  }}
                  sx={{
                    ...inputSx,
                    '& input[type="datetime-local"]::-webkit-calendar-picker-indicator': {
                      filter: 'invert(0.6)',
                      cursor: 'pointer',
                    },
                  }}
                />

                <FormControl fullWidth>
                  <InputLabel id="recurrence-label" sx={labelSx}>Repetir envio</InputLabel>
                  <Select
                    labelId="recurrence-label"
                    id="select-recurrence"
                    value={form.recurrence}
                    label="Repetir envio"
                    onChange={(e) => setForm((prev) => ({ ...prev, recurrence: e.target.value as RecurrenceType }))}
                    sx={selectSx}
                    MenuProps={{
                      slotProps: {
                        paper: {
                          sx: {
                            backgroundColor: 'rgba(15, 23, 42, 0.95)',
                            border: '1px solid rgba(255, 255, 255, 0.08)',
                            borderRadius: '12px',
                            backdropFilter: 'blur(20px)',
                            mt: 0.5,
                          },
                        },
                      },
                    }}
                  >
                    <MenuItem value="none" sx={{ color: '#f8fafc', '&:hover': { backgroundColor: 'rgba(99, 102, 241, 0.1)' } }}>Não repetir</MenuItem>
                    <MenuItem value="daily" sx={{ color: '#f8fafc', '&:hover': { backgroundColor: 'rgba(99, 102, 241, 0.1)' } }}>Diário</MenuItem>
                    <MenuItem value="weekly" sx={{ color: '#f8fafc', '&:hover': { backgroundColor: 'rgba(99, 102, 241, 0.1)' } }}>Semanal</MenuItem>
                    <MenuItem value="monthly" sx={{ color: '#f8fafc', '&:hover': { backgroundColor: 'rgba(99, 102, 241, 0.1)' } }}>Mensal</MenuItem>
                    <MenuItem value="yearly" sx={{ color: '#f8fafc', '&:hover': { backgroundColor: 'rgba(99, 102, 241, 0.1)' } }}>Anual</MenuItem>
                  </Select>
                </FormControl>
              </Box>
            )}
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button
            onClick={closeDialog}
            sx={{
              color: '#64748b',
              fontWeight: 600,
              textTransform: 'none',
              borderRadius: '10px',
              '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.03)' },
            }}
          >
            Cancelar
          </Button>
          <Button
            id="btn-save-message"
            variant="contained"
            onClick={handleSave}
            disabled={!canSave || saving}
            sx={{
              background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
              borderRadius: '10px',
              fontWeight: 600,
              textTransform: 'none',
              px: 3,
              boxShadow: '0 4px 12px 0 rgba(99, 102, 241, 0.25)',
              '&:hover': {
                background: 'linear-gradient(135deg, #4f46e5 0%, #4338ca 100%)',
                boxShadow: '0 6px 16px 0 rgba(99, 102, 241, 0.4)',
              },
            }}
          >
            {saving ? <CircularProgress size={18} sx={{ color: '#fff' }} /> : 'Enviar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Dialog confirmar delete ── */}
      <Dialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        slotProps={{ paper: { sx: dialogPaperSx } }}
      >
        <DialogTitle sx={{ color: '#f8fafc', fontWeight: 700, fontSize: '1.2rem', pb: 1 }}>
          Deletar mensagem
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ color: '#94a3b8', fontSize: '0.925rem', lineHeight: 1.6 }}>
            Tem certeza que deseja deletar esta mensagem? Esta ação não pode ser desfeita.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button
            onClick={() => setDeleteTarget(null)}
            sx={{
              color: '#64748b',
              fontWeight: 600,
              textTransform: 'none',
              borderRadius: '10px',
              '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.03)' },
            }}
          >
            Cancelar
          </Button>
          <Button
            id="btn-confirm-delete-message"
            variant="contained"
            onClick={handleDelete}
            disabled={deleting}
            sx={{
              backgroundColor: '#ef4444',
              borderRadius: '10px',
              fontWeight: 600,
              textTransform: 'none',
              px: 3,
              boxShadow: '0 4px 12px 0 rgba(239, 68, 68, 0.25)',
              '&:hover': {
                backgroundColor: '#dc2626',
                boxShadow: '0 6px 16px 0 rgba(239, 68, 68, 0.4)',
              },
            }}
          >
            {deleting ? <CircularProgress size={18} sx={{ color: '#fff' }} /> : 'Deletar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Snackbar de erro ── */}
      <Snackbar
        open={!!error}
        autoHideDuration={4000}
        onClose={() => setError(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          severity="error"
          onClose={() => setError(null)}
          sx={{
            borderRadius: '12px',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            color: '#f87171',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            '& .MuiAlert-icon': { color: '#f87171' },
          }}
        >
          {error}
        </Alert>
      </Snackbar>
    </Box>
  )
}

// ── Card de mensagem ─────────────────────────────────────────────────────────

interface MessageCardProps {
  message: Message
  onDelete: () => void
}

const MessageCard = ({ message, onDelete }: MessageCardProps) => (
  <Paper
    elevation={0}
    sx={{
      p: 3,
      backgroundColor: 'rgba(15, 23, 42, 0.35)',
      border: '1px solid rgba(255, 255, 255, 0.05)',
      backdropFilter: 'blur(12px)',
      borderRadius: '16px',
      transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
      '&:hover': {
        backgroundColor: 'rgba(99, 102, 241, 0.04)',
        borderColor: 'rgba(99, 102, 241, 0.15)',
        transform: 'translateY(-2px)',
        boxShadow: '0 8px 20px -8px rgba(99, 102, 241, 0.2)',
      },
    }}
  >
    {/* Linha 1: status + delete */}
    <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 1.5 }}>
      <StatusBadge status={message.status} />
      <Tooltip title="Deletar mensagem">
        <IconButton
          size="small"
          onClick={onDelete}
          sx={{
            color: '#475569',
            borderRadius: '8px',
            transition: 'all 0.2s',
            '&:hover': {
              color: '#ef4444',
              backgroundColor: 'rgba(239, 68, 68, 0.08)',
            },
          }}
        >
          <DeleteIcon fontSize="small" />
        </IconButton>
      </Tooltip>
    </Box>

    {/* Texto da mensagem */}
    <Typography
      sx={{
        color: '#e2e8f0',
        fontSize: '0.925rem',
        lineHeight: 1.65,
        mb: 2,
        display: '-webkit-box',
        WebkitLineClamp: 3,
        WebkitBoxOrient: 'vertical',
        overflow: 'hidden',
      }}
    >
      {message.text}
    </Typography>

    {/* Linha de meta-dados */}
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
      {/* Contatos */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6 }}>
        <PeopleIcon sx={{ fontSize: '0.875rem', color: '#475569' }} />
        <Typography sx={{ color: '#64748b', fontSize: '0.75rem', fontWeight: 600 }}>
          {message.contactIds.length} contato{message.contactIds.length !== 1 ? 's' : ''}
        </Typography>
      </Box>

      {/* Data de agendamento */}
      {message.scheduledAt && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6 }}>
          <ScheduleIcon sx={{ fontSize: '0.875rem', color: '#475569' }} />
          <Typography sx={{ color: '#64748b', fontSize: '0.75rem', fontWeight: 600 }}>
            {formatDate(message.scheduledAt)}
          </Typography>
        </Box>
      )}

      {/* Recorrência */}
      {message.recurrence && message.recurrence !== 'none' && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6 }}>
          <SyncIcon sx={{ fontSize: '0.875rem', color: '#818cf8' }} />
          <Typography sx={{ color: '#818cf8', fontSize: '0.75rem', fontWeight: 600 }}>
            {message.recurrence === 'daily' && 'Diário'}
            {message.recurrence === 'weekly' && 'Semanal'}
            {message.recurrence === 'monthly' && 'Mensal'}
            {message.recurrence === 'yearly' && 'Anual'}
          </Typography>
        </Box>
      )}

      {/* Criado em */}
      <Typography sx={{ color: '#334155', fontSize: '0.7rem', ml: 'auto' }}>
        criado em {formatDate(message.createdAt)}
      </Typography>
    </Box>
  </Paper>
)


export default MessagesPage
