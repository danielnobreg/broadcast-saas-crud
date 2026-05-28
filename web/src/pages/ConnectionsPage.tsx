import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/useAuth'
import { useConnections } from '../hooks/useConnections'
import {
  addConnection,
  updateConnection,
  deleteConnection,
} from '../lib/connectionsService'
import type { Connection } from '../types'
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
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import PeopleAltIcon from '@mui/icons-material/PeopleAlt'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'

// Estado inicial do formulário — extraído como constante para reusar no reset
const EMPTY_FORM = { name: '' }

const ConnectionsPage = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { connections, loading, error: connectionsError } = useConnections()

  // Estado do dialog de criar/editar
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Connection | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)

  // Estado do dialog de confirmação de delete
  const [deleteTarget, setDeleteTarget] = useState<Connection | null>(null)
  const [deleting, setDeleting] = useState(false)

  // Feedback de erro
  const [error, setError] = useState<string | null>(null)

  // --- Handlers ---

  const openCreate = () => {
    setEditing(null)
    setForm(EMPTY_FORM)
    setDialogOpen(true)
  }

  const openEdit = (connection: Connection) => {
    setEditing(connection)
    setForm({ name: connection.name })
    setDialogOpen(true)
  }

  const closeDialog = () => {
    setDialogOpen(false)
    setEditing(null)
    setForm(EMPTY_FORM)
  }

  const handleSave = async () => {
    if (!form.name.trim() || !user) return

    const normalizedNewName = form.name.trim().toLowerCase()
    const isDuplicate = connections.some(
      (c) => c.name.trim().toLowerCase() === normalizedNewName && c.id !== editing?.id
    )
    if (isDuplicate) {
      setError('Já existe uma conexão cadastrada com este nome.')
      return
    }

    setSaving(true)
    try {
      if (editing) {
        await updateConnection(editing.id, form.name)
      } else {
        await addConnection(user.uid, form.name)
      }
      closeDialog()
    } catch {
      setError('Erro ao salvar conexão. Tente novamente.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await deleteConnection(deleteTarget.id)
      setDeleteTarget(null)
    } catch {
      setError('Erro ao deletar conexão. Tente novamente.')
    } finally {
      setDeleting(false)
    }
  }

  // --- UI ---

  return (
    <Box>
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          mb: 5,
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
            Conexões
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748b', mt: 0.5, fontWeight: 500 }}>
            {connections.length} conexão{connections.length !== 1 ? 'ões' : ''} configurada{connections.length !== 1 ? 's' : ''}
          </Typography>
        </Box>
        <Button
          id="btn-add-connection"
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
          Nova conexão
        </Button>
      </Box>

      {/* Loading */}
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 12 }}>
          <CircularProgress sx={{ color: '#818cf8' }} />
        </Box>
      )}

      {!loading && connectionsError && (
        <Alert
          severity="error"
          sx={{
            borderRadius: '12px',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            color: '#f87171',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            '& .MuiAlert-icon': { color: '#f87171' },
          }}
        >
          {connectionsError}
        </Alert>
      )}

      {/* Empty state */}
      {!loading && !connectionsError && connections.length === 0 && (
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
          <PeopleAltIcon
            sx={{
              fontSize: 60,
              color: 'rgba(99, 102, 241, 0.25)',
              filter: 'drop-shadow(0 0 10px rgba(99, 102, 241, 0.15))',
              mb: 2.5,
            }}
          />
          <Typography variant="h6" sx={{ color: '#e2e8f0', fontWeight: 600, mb: 1 }}>
            Nenhuma conexão ainda
          </Typography>
          <Typography sx={{ color: '#64748b', fontSize: '0.875rem', maxW: '280px', mx: 'auto', mb: 3 }}>
            Crie sua primeira conexão para gerenciar seus contatos e disparar mensagens.
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
            Criar a primeira
          </Button>
        </Box>
      )}

      {/* Lista de conexões em Grid de Cards */}
      {!loading && connections.length > 0 && (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr' },
            gap: 3,
          }}
        >
          {connections.map((conn) => (
            <Paper
              key={conn.id}
              elevation={0}
              onClick={() => navigate(`/connections/${conn.id}/contacts`)}
              sx={{
                p: 3,
                backgroundColor: 'rgba(15, 23, 42, 0.35)',
                border: '1px solid rgba(255, 255, 255, 0.05)',
                backdropFilter: 'blur(12px)',
                borderRadius: '16px',
                cursor: 'pointer',
                position: 'relative',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                minHeight: '145px',
                '&:hover': {
                  backgroundColor: 'rgba(99, 102, 241, 0.05)',
                  borderColor: 'rgba(99, 102, 241, 0.3)',
                  transform: 'translateY(-4px)',
                  boxShadow: '0 12px 24px -10px rgba(99, 102, 241, 0.25)',
                  '& .conn-chevron': {
                    color: '#818cf8',
                    transform: 'translateX(3px)',
                  },
                },
              }}
            >
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: 700,
                      color: '#f8fafc',
                      letterSpacing: '-0.02em',
                      fontSize: '1.05rem',
                    }}
                  >
                    {conn.name}
                  </Typography>
                  <ChevronRightIcon
                    className="conn-chevron"
                    sx={{
                      color: '#475569',
                      transition: 'all 0.25s ease',
                      fontSize: '1.25rem',
                    }}
                  />
                </Box>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 'auto' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#10b981', boxShadow: '0 0 8px #10b981' }} />
                  <Typography variant="caption" sx={{ color: '#475569', fontWeight: 700, letterSpacing: '0.05em' }}>
                    ATIVO
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Tooltip title="Editar">
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation()
                        openEdit(conn)
                      }}
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
                      onClick={(e) => {
                        e.stopPropagation()
                        setDeleteTarget(conn)
                      }}
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
          {editing ? 'Editar conexão' : 'Nova conexão'}
        </DialogTitle>
        <DialogContent sx={{ pt: '10px !important' }}>
          <TextField
            id="input-connection-name"
            autoFocus
            label="Nome da conexão"
            fullWidth
            value={form.name}
            onChange={(e) => setForm({ name: e.target.value })}
            onKeyDown={(e) => e.key === 'Enter' && handleSave()}
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
            id="btn-save-connection"
            variant="contained"
            onClick={handleSave}
            disabled={!form.name.trim() || saving}
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
          Deletar conexão
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ color: '#94a3b8', fontSize: '0.925rem', lineHeight: 1.6 }}>
            Tem certeza que deseja deletar{' '}
            <strong style={{ color: '#f8fafc', fontWeight: 600 }}>{deleteTarget?.name}</strong>?
            Os contatos associados não serão removidos automaticamente.
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
            id="btn-confirm-delete-connection"
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

      {/* Snackbar de erro */}
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

// Estilos de input premium compartilhados
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

export default ConnectionsPage
