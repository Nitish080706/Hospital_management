import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText,
  Toolbar, Typography, Divider, Box, Button,
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import ChatIcon from '@mui/icons-material/Chat';
import PeopleIcon from '@mui/icons-material/People';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import EventIcon from '@mui/icons-material/Event';
import AssignmentIcon from '@mui/icons-material/Assignment';
import ShieldIcon from '@mui/icons-material/Shield';
import ManageAccountsIcon from '@mui/icons-material/ManageAccounts';
import LogoutIcon from '@mui/icons-material/Logout';
import MedicalServicesIcon from '@mui/icons-material/MedicalServices';
import FormatListNumberedIcon from '@mui/icons-material/FormatListNumbered';
import PersonIcon from '@mui/icons-material/Person';

const DRAWER_WIDTH = 260;

const menuItems = {
  patient: [
    { label: 'Dashboard', path: '/patient', icon: <DashboardIcon /> },
    { label: 'AI Assistant', path: '/patient/chatbot', icon: <ChatIcon /> },
  ],
  doctor: [
    { label: 'My Patients', path: '/doctor', icon: <PeopleIcon /> },
    { label: 'My Profile', path: '/doctor/profile', icon: <PersonIcon /> },
  ],
  nurse: [
    { label: 'Dashboard', path: '/nurse', icon: <DashboardIcon /> },
    { label: 'Register Patient', path: '/nurse/register', icon: <LocalHospitalIcon /> },
    { label: 'Doctor Availability', path: '/nurse/doctors', icon: <EventIcon /> },
    { label: 'Active Consultations', path: '/nurse/map', icon: <AssignmentIcon /> },
    { label: 'Waitlist', path: '/nurse/waitlist', icon: <FormatListNumberedIcon /> },
  ],
  admin: [
    { label: 'Dashboard', path: '/admin', icon: <DashboardIcon /> },
    { label: 'Register Patient', path: '/admin/register', icon: <LocalHospitalIcon /> },
    { label: 'Doctor Availability', path: '/admin/doctors', icon: <EventIcon /> },
    { label: 'Active Consultations', path: '/admin/map', icon: <AssignmentIcon /> },
    { label: 'Waitlist', path: '/admin/waitlist', icon: <FormatListNumberedIcon /> },
    { label: 'Insurance Override', path: '/admin/insurance', icon: <ShieldIcon /> },
    { label: 'Manage Accounts', path: '/admin/accounts', icon: <ManageAccountsIcon /> },
  ],
};

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  if (!user) return null;

  const items = menuItems[user.user_type] || [];

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: DRAWER_WIDTH,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: DRAWER_WIDTH,
          boxSizing: 'border-box',
          background: 'linear-gradient(180deg, #1565C0 0%, #0D47A1 100%)',
          color: '#fff',
          borderRight: 'none',
        },
      }}
    >
      <Toolbar sx={{ py: 3, px: 2 }}>
        <MedicalServicesIcon sx={{ mr: 1.5, fontSize: 28 }} />
        <Typography variant="h6" noWrap sx={{ fontWeight: 700, letterSpacing: 0.5 }}>
          Hospital AI
        </Typography>
      </Toolbar>

      <Box sx={{ px: 2, pb: 2 }}>
        <Box sx={{
          bgcolor: 'rgba(255,255,255,0.12)',
          borderRadius: 2,
          p: 1.5,
        }}>
          <Typography variant="body2" sx={{ opacity: 0.7, fontSize: '0.75rem' }}>
            Logged in as
          </Typography>
          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
            {user.name}
          </Typography>
          <Typography variant="caption" sx={{
            opacity: 0.7,
            textTransform: 'capitalize',
          }}>
            {user.user_type} | {user.user_id}
          </Typography>
        </Box>
      </Box>

      <Divider sx={{ borderColor: 'rgba(255,255,255,0.15)' }} />

      <List sx={{ px: 1, py: 1.5, flex: 1 }}>
        {items.map((item) => (
          <ListItem key={item.path} disablePadding sx={{ mb: 0.5 }}>
            <ListItemButton
              onClick={() => navigate(item.path)}
              selected={location.pathname === item.path}
              sx={{
                borderRadius: 2,
                color: '#fff',
                '&.Mui-selected': {
                  bgcolor: 'rgba(255,255,255,0.18)',
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.22)' },
                },
                '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' },
              }}
            >
              <ListItemIcon sx={{ color: 'inherit', minWidth: 40 }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText
                primary={item.label}
                primaryTypographyProps={{ fontSize: '0.9rem', fontWeight: 500 }}
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>

      <Divider sx={{ borderColor: 'rgba(255,255,255,0.15)' }} />

      <Box sx={{ p: 2 }}>
        <Button
          fullWidth
          variant="outlined"
          startIcon={<LogoutIcon />}
          onClick={() => { logout(); navigate('/'); }}
          sx={{
            color: '#fff',
            borderColor: 'rgba(255,255,255,0.3)',
            '&:hover': {
              borderColor: '#fff',
              bgcolor: 'rgba(255,255,255,0.1)',
            },
          }}
        >
          Logout
        </Button>
      </Box>
    </Drawer>
  );
}

export { DRAWER_WIDTH };
