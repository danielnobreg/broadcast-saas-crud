import { useState } from 'react'
import { useNavigate, useLocation, Outlet } from 'react-router-dom'
import { signOut } from 'firebase/auth'
import { auth } from '../lib/firebase'
import { useAuth } from '../contexts/useAuth'
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  IconButton,
  Avatar,
  Divider,
  Tooltip,
} from '@mui/material'
import PeopleAltIcon from '@mui/icons-material/PeopleAlt'
import MessageIcon from '@mui/icons-material/Message'
import LogoutIcon from '@mui/icons-material/Logout'
import MenuIcon from '@mui/icons-material/Menu'
import CloseIcon from '@mui/icons-material/Close'
import SensorsIcon from '@mui/icons-material/Sensors'

const DRAWER_WIDTH = 260

const navItems = [
  { label: 'Conexões', path: '/', icon: <PeopleAltIcon fontSize="small" /> },
  { label: 'Mensagens', path: '/messages', icon: <MessageIcon fontSize="small" /> },
]

const Layout = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleLogout = async () => {
    await signOut(auth)
    navigate('/login', { replace: true })
  }

  const drawerContent = (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#030712',
        borderRight: '1px solid rgba(255, 255, 255, 0.05)',
      }}
    >
      {/* Logo */}
      <Box sx={{ px: 3.5, py: 4, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <SensorsIcon sx={{ color: '#818cf8', fontSize: 28, filter: 'drop-shadow(0 0 8px rgba(129, 140, 248, 0.5))' }} />
        <Typography
          variant="h6"
          sx={{
            fontWeight: 800,
            color: '#f8fafc',
            letterSpacing: '-0.03em',
            background: 'linear-gradient(135deg, #f8fafc 0%, #94a3b8 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          Broadcast
        </Typography>
      </Box>

      <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.05)', mx: 2 }} />

      {/* Nav links */}
      <List sx={{ flex: 1, px: 2, py: 3 }}>
        {navItems.map((item) => {
          const isActive =
            item.path === '/'
              ? location.pathname === '/' || location.pathname.startsWith('/connections')
              : location.pathname.startsWith(item.path)

          return (
            <ListItem key={item.path} disablePadding sx={{ mb: 1 }}>
              <ListItemButton
                onClick={() => {
                  navigate(item.path)
                  setMobileOpen(false)
                }}
                sx={{
                  borderRadius: '12px',
                  backgroundColor: isActive ? 'rgba(99, 102, 241, 0.08)' : 'transparent',
                  borderLeft: isActive ? '4px solid #818cf8' : '4px solid transparent',
                  paddingLeft: isActive ? '12px' : '16px',
                  transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                  '&:hover': {
                    backgroundColor: isActive ? 'rgba(99, 102, 241, 0.12)' : 'rgba(255, 255, 255, 0.03)',
                    transform: 'translateX(2px)',
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 32,
                    color: isActive ? '#818cf8' : '#475569',
                    transition: 'color 0.25s',
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.label}
                  slotProps={{
                    primary: {
                      style: {
                        fontSize: '0.875rem',
                        fontWeight: isActive ? 600 : 500,
                        color: isActive ? '#f8fafc' : '#64748b',
                        transition: 'color 0.25s',
                      },
                    },
                  }}
                />
              </ListItemButton>
            </ListItem>
          )
        })}
      </List>

      <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.05)', mx: 2 }} />

      {/* User + logout */}
      <Box sx={{ p: 2.5, display: 'flex', alignItems: 'center', gap: 1.5, mt: 'auto', borderTop: '1px solid rgba(255, 255, 255, 0.03)' }}>
        <Avatar
          sx={{
            width: 36,
            height: 36,
            background: 'linear-gradient(135deg, #6366f1 0%, #a78bfa 100%)',
            fontSize: '0.85rem',
            fontWeight: 700,
            boxShadow: '0 0 12px 0 rgba(99, 102, 241, 0.2)',
          }}
        >
          {user?.email?.[0]?.toUpperCase() || ''}
        </Avatar>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography
            variant="body2"
            noWrap
            sx={{ color: '#e2e8f0', fontSize: '0.825rem', fontWeight: 600 }}
          >
            {user?.email?.split('@')[0]}
          </Typography>
          <Typography
            variant="caption"
            noWrap
            sx={{ color: '#475569', display: 'block', fontSize: '0.725rem' }}
          >
            {user?.email}
          </Typography>
        </Box>
        <Tooltip title="Sair">
          <IconButton
            onClick={handleLogout}
            size="small"
            sx={{
              color: '#475569',
              borderRadius: '10px',
              transition: 'all 0.2s',
              '&:hover': {
                color: '#f87171',
                backgroundColor: 'rgba(239, 68, 68, 0.08)',
              },
            }}
          >
            <LogoutIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>
    </Box>
  )

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', backgroundColor: '#030712' }}>
      {/* Sidebar desktop */}
      <Drawer
        variant="permanent"
        sx={{
          width: DRAWER_WIDTH,
          flexShrink: 0,
          display: { xs: 'none', md: 'block' },
          '& .MuiDrawer-paper': {
            width: DRAWER_WIDTH,
            boxSizing: 'border-box',
            border: 'none',
          },
        }}
      >
        {drawerContent}
      </Drawer>

      {/* Sidebar mobile (drawer temporário) */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': {
            width: DRAWER_WIDTH,
            backgroundColor: '#030712',
            border: 'none',
          },
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', p: 1.5, backgroundColor: '#030712' }}>
          <IconButton onClick={() => setMobileOpen(false)} sx={{ color: '#64748b' }}>
            <CloseIcon />
          </IconButton>
        </Box>
        {drawerContent}
      </Drawer>

      {/* Conteúdo principal */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Topbar mobile */}
        <Box
          sx={{
            display: { xs: 'flex', md: 'none' },
            alignItems: 'center',
            px: 2.5,
            py: 2,
            borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
            backgroundColor: '#030712',
          }}
        >
          <IconButton onClick={() => setMobileOpen(true)} sx={{ color: '#64748b', mr: 1 }}>
            <MenuIcon />
          </IconButton>
          <SensorsIcon sx={{ color: '#818cf8', fontSize: 24, mr: 1, filter: 'drop-shadow(0 0 8px rgba(129, 140, 248, 0.5))' }} />
          <Typography
            variant="h6"
            sx={{
              color: '#f8fafc',
              fontWeight: 800,
              letterSpacing: '-0.03em',
            }}
          >
            Broadcast
          </Typography>
        </Box>

        {/* Rota filha renderizada aqui */}
        <Box
          sx={{
            flex: 1,
            p: { xs: 3, md: 6 },
            overflowY: 'auto',
            background: 'radial-gradient(circle at 80% 20%, #080d1a 0%, #030712 100%)',
          }}
        >
          <Outlet />
        </Box>
      </Box>
    </Box>
  )
}

export default Layout
