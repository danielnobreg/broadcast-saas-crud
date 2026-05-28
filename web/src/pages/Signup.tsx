import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { createUserWithEmailAndPassword } from 'firebase/auth'
import { auth } from '../lib/firebase'
import {
  Box,
  Button,
  TextField,
  Typography,
  Alert,
  Paper,
  CircularProgress,
  IconButton,
  InputAdornment,
} from '@mui/material'
import Visibility from '@mui/icons-material/Visibility'
import VisibilityOff from '@mui/icons-material/VisibilityOff'

const Signup = () => {
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (password !== confirm) {
      setError('As senhas não coincidem.')
      return
    }

    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.')
      return
    }

    setLoading(true)

    try {
      await createUserWithEmailAndPassword(auth, email, password)
      navigate('/', { replace: true })
    } catch {
      setError('Não foi possível criar a conta. Verifique se o e-mail já está em uso.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box
      className="min-h-screen flex items-center justify-center overflow-hidden relative"
      sx={{
        background: '#040711',
        fontFamily: '"Outfit", "Inter", sans-serif',
      }}
    >
      {/* Estilos CSS injetados dinamicamente para o visual clean premium e override de autofill */}
      <style>{`
        input:-webkit-autofill,
        input:-webkit-autofill:hover, 
        input:-webkit-autofill:focus, 
        input:-webkit-autofill:active {
          -webkit-text-fill-color: #f8fafc !important;
          -webkit-box-shadow: 0 0 0px 1000px #0c111d inset !important;
          transition: background-color 5000s ease-in-out 0s;
        }
      `}</style>

      {/* Brilhos de Fundo Estáticos e Sutis */}
      <Box
        sx={{
          position: 'absolute',
          top: '-10%',
          left: '-10%',
          width: '50%',
          height: '50%',
          background: 'radial-gradient(circle, rgba(99, 102, 241, 0.04) 0%, rgba(99, 102, 241, 0) 70%)',
          filter: 'blur(80px)',
          pointerEvents: 'none',
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          bottom: '-10%',
          right: '-10%',
          width: '50%',
          height: '50%',
          background: 'radial-gradient(circle, rgba(167, 139, 250, 0.03) 0%, rgba(167, 139, 250, 0) 70%)',
          filter: 'blur(90px)',
          pointerEvents: 'none',
        }}
      />

      {/* Card Principal - Glassmorphism de Luxo Minimalista */}
      <Paper
        elevation={0}
        className="w-full max-w-sm p-10 rounded-[20px]"
        sx={{
          backgroundColor: 'rgba(10, 15, 30, 0.65)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          backdropFilter: 'blur(30px)',
          boxShadow: '0 20px 40px -15px rgba(0, 0, 0, 0.7)',
          zIndex: 2,
          position: 'relative',
          transition: 'all 0.3s ease-in-out',
          '&:hover': {
            borderColor: 'rgba(255, 255, 255, 0.12)',
            boxShadow: '0 25px 45px -12px rgba(0, 0, 0, 0.8)',
          },
        }}
      >
        {/* Cabeçalho */}
        <Box className="mb-8 text-center">
          <Typography
            variant="h4"
            className="font-bold tracking-tight mb-2"
            sx={{
              fontWeight: 850,
              fontSize: '2.1rem',
              letterSpacing: '-0.05em',
              background: 'linear-gradient(135deg, #f8fafc 0%, #cbd5e1 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              fontFamily: '"Outfit", "Inter", sans-serif',
            }}
          >
            Broadcast
          </Typography>
          <Typography
            variant="body2"
            sx={{ color: '#64748b', fontWeight: 550, letterSpacing: '0.01em' }}
          >
            Crie sua conta gratuita
          </Typography>
        </Box>

        {/* Formulário */}
        <Box
          component="form"
          onSubmit={handleSubmit}
          className="flex flex-col gap-6"
        >
          {error && (
            <Alert
              severity="error"
              sx={{
                borderRadius: '12px',
                backgroundColor: 'rgba(239, 68, 68, 0.08)',
                color: '#f87171',
                border: '1px solid rgba(239, 68, 68, 0.15)',
                fontSize: '0.825rem',
                fontWeight: 500,
                '& .MuiAlert-icon': { color: '#f87171' },
              }}
            >
              {error}
            </Alert>
          )}

          <TextField
            id="signup-email"
            label="E-mail"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            fullWidth
            autoComplete="email"
            sx={inputSx}
          />

          <TextField
            id="signup-password"
            label="Senha"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            fullWidth
            autoComplete="new-password"
            sx={inputSx}
            slotProps={{
              input: {
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle password visibility"
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                      sx={{ color: '#64748b', p: 0.5 }}
                    >
                      {showPassword ? <VisibilityOff sx={{ fontSize: '1.25rem' }} /> : <Visibility sx={{ fontSize: '1.25rem' }} />}
                    </IconButton>
                  </InputAdornment>
                ),
              },
            }}
          />

          <TextField
            id="signup-confirm"
            label="Confirmar senha"
            type={showConfirm ? 'text' : 'password'}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
            fullWidth
            autoComplete="new-password"
            sx={inputSx}
            slotProps={{
              input: {
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle password visibility"
                      onClick={() => setShowConfirm(!showConfirm)}
                      edge="end"
                      sx={{ color: '#64748b', p: 0.5 }}
                    >
                      {showConfirm ? <VisibilityOff sx={{ fontSize: '1.25rem' }} /> : <Visibility sx={{ fontSize: '1.25rem' }} />}
                    </IconButton>
                  </InputAdornment>
                ),
              },
            }}
          />

          {/* Botão de Enviar Premium e Clean */}
          <Button
            id="signup-submit"
            type="submit"
            variant="contained"
            fullWidth
            disabled={loading}
            sx={{
              mt: 1,
              py: 1.6,
              borderRadius: '12px',
              fontWeight: 700,
              fontSize: '0.95rem',
              textTransform: 'none',
              letterSpacing: '0.01em',
              background: '#4f46e5',
              color: '#ffffff',
              boxShadow: 'none',
              transition: 'all 0.2s ease-in-out',
              '&:hover': {
                background: '#4338ca',
                boxShadow: 'none',
                transform: 'translateY(-1px)',
              },
              '&:active': {
                transform: 'translateY(0)',
              },
              '&:disabled': {
                background: 'rgba(255, 255, 255, 0.04)',
                color: 'rgba(255, 255, 255, 0.25)',
              },
            }}
          >
            {loading ? <CircularProgress size={22} sx={{ color: '#fff' }} /> : 'Criar conta'}
          </Button>
        </Box>

        {/* Rodapé */}
        <Typography
          variant="body2"
          className="text-center mt-8"
          sx={{ color: '#475569', fontWeight: 600 }}
        >
          Já tem conta?{' '}
          <Link
            to="/login"
            style={{
              color: '#818cf8',
              textDecoration: 'none',
              fontWeight: 700,
              transition: 'color 0.2s ease',
              borderBottom: '1px solid rgba(129, 140, 248, 0.2)',
              paddingBottom: '2px',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.color = '#a78bfa'
              e.currentTarget.style.borderBottomColor = 'rgba(167, 139, 250, 0.4)'
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.color = '#818cf8'
              e.currentTarget.style.borderBottomColor = 'rgba(129, 140, 248, 0.2)'
            }}
          >
            Entrar
          </Link>
        </Typography>
      </Paper>
    </Box>
  )
}

// Estilos customizados HSL premium para inputs - foco ultra reativo limpo e sem glows chamativos
const inputSx = {
  '& .MuiOutlinedInput-root': {
    color: '#f8fafc !important',
    borderRadius: '12px',
    backgroundColor: '#0c111d !important',
    transition: 'all 0.2s ease-in-out',
    '& fieldset': {
      borderColor: 'rgba(255, 255, 255, 0.08) !important',
      transition: 'all 0.2s ease-in-out',
    },
    '&:hover fieldset': {
      borderColor: 'rgba(99, 102, 241, 0.45) !important',
    },
    '&.Mui-focused fieldset': {
      borderColor: '#818cf8 !important',
      borderWidth: '1px !important',
    },
  },
  '& .MuiInputLabel-root': {
    color: '#94a3b8 !important',
    fontWeight: 500,
  },
  '& .MuiInputLabel-root.Mui-focused': {
    color: '#818cf8 !important',
  },
  '& .MuiInputLabel-root.Mui-error': {
    color: '#f87171 !important',
  },
  '& .MuiOutlinedInput-input': {
    color: '#f8fafc !important',
  },
}

export default Signup
