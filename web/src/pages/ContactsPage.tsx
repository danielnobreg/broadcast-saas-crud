import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/useAuth'
import { useContacts } from '../hooks/useContacts'
import { useConnections } from '../hooks/useConnections'
import {
  addContact,
  updateContact,
  deleteContact,
} from '../lib/contactsService'
import type { Contact } from '../types'
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
  Avatar,
  CircularProgress,
  Tooltip,
  Snackbar,
  Alert,
  Breadcrumbs,
  Link,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import PersonIcon from '@mui/icons-material/Person'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'

const EMPTY_FORM = { name: '', phone: '' }

const formatBrazilianPhone = (value: string) => {
  const hasPlus = value.startsWith('+');
  const clean = value.replace(/\D/g, '');
  
  if (hasPlus && clean.length <= 2) {
    if (clean.length === 0) return '+';
    if (clean.length === 1) return `+${clean}`;
    return `+55`;
  }

  if (clean.startsWith('55') && clean.length > 2) {
    const rest = clean.substring(2);
    if (rest.length <= 2) return `+55 (${rest}`;
    if (rest.length <= 6) return `+55 (${rest.substring(0, 2)}) ${rest.substring(2)}`;
    if (rest.length <= 10) return `+55 (${rest.substring(0, 2)}) ${rest.substring(2, 6)}-${rest.substring(6)}`;
    return `+55 (${rest.substring(0, 2)}) ${rest.substring(2, 7)}-${rest.substring(7, 11)}`;
  }

  if (clean.length === 0) return hasPlus ? '+' : '';
  if (clean.length <= 2) return `(${clean}`;
  if (clean.length <= 6) return `(${clean.substring(0, 2)}) ${clean.substring(2)}`;
  if (clean.length <= 10) return `(${clean.substring(0, 2)}) ${clean.substring(2, 6)}-${clean.substring(6)}`;
  return `(${clean.substring(0, 2)}) ${clean.substring(2, 7)}-${clean.substring(7, 11)}`;
}

const ContactsPage = () => {
  // connectionId vem da URL: /connections/:connectionId/contacts
  const { connectionId = '' } = useParams<{ connectionId: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { contacts, loading } = useContacts(connectionId)
  const { connections } = useConnections()

  // Nome da conexão atual para o breadcrumb
  const currentConnection = connections.find((c) => c.id === connectionId)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Contact | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Contact | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const openCreate = () => {
    setEditing(null)
    setForm(EMPTY_FORM)
    setDialogOpen(true)
  }

  const openEdit = (contact: Contact) => {
    setEditing(contact)
    setForm({ name: contact.name, phone: contact.phone })
    setDialogOpen(true)
  }

  const closeDialog = () => {
    setDialogOpen(false)
    setEditing(null)
    setForm(EMPTY_FORM)
  }

  const handleSave = async () => {
    if (!form.name.trim() || !form.phone.trim() || !user) return
    setSaving(true)
    try {
      if (editing) {
        await updateContact(editing.id, form.name, form.phone)
      } else {
        await addContact(user.uid, connectionId, form.name, form.phone)
      }
      closeDialog()
    } catch {
      setError('Erro ao salvar contato. Tente novamente.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await deleteContact(deleteTarget.id)
      setDeleteTarget(null)
    } catch {
      setError('Erro ao deletar contato. Tente novamente.')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <Box>
      {/* Breadcrumb + voltar */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <IconButton
          size="small"
          onClick={() => navigate('/')}
          sx={{
            color: '#64748b',
            borderRadius: '10px',
            transition: 'all 0.2s',
            '&:hover': {
              color: '#818cf8',
              backgroundColor: 'rgba(129, 140, 248, 0.08)',
            },
          }}
        >
          <ArrowBackIcon fontSize="small" />
        </IconButton>
        <Breadcrumbs sx={{ '& .MuiBreadcrumbs-separator': { color: '#334155' } }}>
          <Link
            component="button"
            onClick={() => navigate('/')}
            sx={{
              color: '#64748b',
              fontSize: '0.85rem',
              textDecoration: 'none',
              fontWeight: 500,
              transition: 'color 0.2s',
              cursor: 'pointer',
              '&:hover': { color: '#818cf8' },
            }}
          >
            Conexões
          </Link>
          <Typography sx={{ color: '#f8fafc', fontSize: '0.85rem', fontWeight: 600 }}>
            {currentConnection?.name ?? '...'}
          </Typography>
        </Breadcrumbs>
      </Box>

      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          mb: 5,
          mt: 1,
        }}
      >
        <Box>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 800,
              color: '#f8fafc',
              letterSpacing: '-0.03em',
              background: 'linear-gradient(135deg, #f8fafc 0%, #cbd5e1 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Contatos
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748b', mt: 0.5, fontWeight: 500 }}>
            {contacts.length} contato{contacts.length !== 1 ? 's' : ''} em{' '}
            <span style={{ color: '#818cf8', fontWeight: 600 }}>{currentConnection?.name}</span>
          </Typography>
        </Box>
        <Button
          id="btn-add-contact"
          variant="contained"
          startIcon={<AddIcon />}
          onClick={openCreate}
          sx={{
            py: 1.4,
            px: 2.5,
            background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
            borderRadius: '12px',
            fontWeight: 600,
            textTransform: 'none',
            fontSize: '0.875rem',
            boxShadow: '0 4px 12px 0 rgba(99, 102, 241, 0.3)',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            '&:hover': {
              background: 'linear-gradient(135deg, #4f46e5 0%, #4338ca 100%)',
              boxShadow: '0 6px 16px 0 rgba(99, 102, 241, 0.45)',
              transform: 'translateY(-1px)',
            },
            '&:active': {
              transform: 'translateY(0)',
            },
          }}
        >
          Novo contato
        </Button>
      </Box>

      {/* Loading */}
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 12 }}>
          <CircularProgress sx={{ color: '#818cf8' }} />
        </Box>
      )}

      {/* Empty state */}
      {!loading && contacts.length === 0 && (
        <Box
          sx={{
            textAlign: 'center',
            py: 12,
            px: 4,
            border: '1px dashed rgba(255, 255, 255, 0.08)',
            borderRadius: '20px',
            backgroundColor: 'rgba(15, 23, 42, 0.2)',
            backdropFilter: 'blur(10px)',
          }}
        >
          <PersonIcon
            sx={{
              fontSize: 60,
              color: 'rgba(99, 102, 241, 0.25)',
              filter: 'drop-shadow(0 0 10px rgba(99, 102, 241, 0.15))',
              mb: 2.5,
            }}
          />
          <Typography variant="h6" sx={{ color: '#e2e8f0', fontWeight: 600, mb: 1 }}>
            Nenhum contato ainda
          </Typography>
          <Typography sx={{ color: '#64748b', fontSize: '0.875rem', maxW: '280px', mx: 'auto', mb: 3 }}>
            Adicione contatos a esta conexão para que você possa disparar mensagens para eles de forma automatizada.
          </Typography>
          <Button
            onClick={openCreate}
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
            Adicionar o primeiro
          </Button>
        </Box>
      )}

      {/* Lista de contatos */}
      {!loading && contacts.length > 0 && (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
          }}
        >
          {contacts.map((contact) => (
            <Paper
              key={contact.id}
              elevation={0}
              sx={{
                p: 2.5,
                backgroundColor: 'rgba(15, 23, 42, 0.35)',
                border: '1px solid rgba(255, 255, 255, 0.05)',
                backdropFilter: 'blur(12px)',
                borderRadius: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                '&:hover': {
                  backgroundColor: 'rgba(99, 102, 241, 0.04)',
                  borderColor: 'rgba(99, 102, 241, 0.25)',
                  transform: 'translateX(2px)',
                },
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5 }}>
                <Avatar
                  sx={{
                    width: 42,
                    height: 42,
                    bgcolor: 'rgba(99, 102, 241, 0.08)',
                    color: '#818cf8',
                    border: '1px solid rgba(99, 102, 241, 0.15)',
                  }}
                >
                  <PersonIcon fontSize="medium" />
                </Avatar>
                <Box>
                  <Typography sx={{ fontWeight: 700, color: '#f8fafc', fontSize: '0.975rem', letterSpacing: '-0.01em' }}>
                    {contact.name}
                  </Typography>
                  <Typography sx={{ color: '#64748b', fontSize: '0.825rem', mt: 0.25, fontWeight: 500 }}>
                    {contact.phone}
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Tooltip title="Editar">
                  <IconButton
                    size="small"
                    onClick={() => openEdit(contact)}
                    sx={{
                      color: '#475569',
                      borderRadius: '8px',
                      transition: 'all 0.2s',
                      '&:hover': {
                        color: '#818cf8',
                        backgroundColor: 'rgba(129, 140, 248, 0.08)',
                      },
                    }}
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Deletar">
                  <IconButton
                    size="small"
                    onClick={() => setDeleteTarget(contact)}
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
            </Paper>
          ))}
        </Box>
      )}

      {/* Dialog criar/editar */}
      <Dialog
        open={dialogOpen}
        onClose={closeDialog}
        fullWidth
        maxWidth="xs"
        slotProps={{
          paper: {
            sx: {
              backgroundColor: 'rgba(15, 23, 42, 0.85)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              backdropFilter: 'blur(24px)',
              borderRadius: '20px',
              p: 1,
            },
          },
        }}
      >
        <DialogTitle sx={{ color: '#f8fafc', fontWeight: 700, fontSize: '1.2rem', pb: 1 }}>
          {editing ? 'Editar contato' : 'Novo contato'}
        </DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '10px !important' }}>
          <TextField
            id="input-contact-name"
            autoFocus
            label="Nome"
            fullWidth
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            sx={inputSx}
          />
          <TextField
            id="input-contact-phone"
            label="Telefone"
            fullWidth
            value={form.phone}
            onChange={(e) => setForm((f) => ({ ...f, phone: formatBrazilianPhone(e.target.value) }))}
            onKeyDown={(e) => e.key === 'Enter' && handleSave()}
            placeholder="(12) 34567-8999"
            sx={inputSx}
          />
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
            id="btn-save-contact"
            variant="contained"
            onClick={handleSave}
            disabled={!form.name.trim() || !form.phone.trim() || saving}
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
            {saving ? <CircularProgress size={18} sx={{ color: '#fff' }} /> : 'Salvar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog confirmar delete */}
      <Dialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        slotProps={{
          paper: {
            sx: {
              backgroundColor: 'rgba(15, 23, 42, 0.85)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              backdropFilter: 'blur(24px)',
              borderRadius: '20px',
              p: 1,
            },
          },
        }}
      >
        <DialogTitle sx={{ color: '#f8fafc', fontWeight: 700, fontSize: '1.2rem', pb: 1 }}>
          Deletar contato
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ color: '#94a3b8', fontSize: '0.925rem', lineHeight: 1.6 }}>
            Tem certeza que deseja deletar{' '}
            <strong style={{ color: '#f8fafc', fontWeight: 600 }}>{deleteTarget?.name}</strong>?
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
            id="btn-confirm-delete-contact"
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

export default ContactsPage
