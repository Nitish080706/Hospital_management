import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import {
  Box, Card, CardContent, Typography, TextField, Button,
  ToggleButton, ToggleButtonGroup, Alert, CircularProgress,
  Fade, Container,
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import MedicalServicesIcon from '@mui/icons-material/MedicalServices';

const roleLabels = {
  doctor: 'Doctor',
  nurse: 'Nurse',
  admin: 'Admin',
};

export default function LoginPage() {
  const [mode, setMode] = useState(null);
  const [hospitalRole, setHospitalRole] = useState(null);
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async () => {
    if (!userId || !password) {
      setError('Please enter both ID and password');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/api/login', { user_id: userId, password });
      login(res.data);
      const type = res.data.user_type;
      const routes = { patient: '/patient', doctor: '/doctor', nurse: '/nurse', admin: '/admin' };
      navigate(routes[type] || '/');
    } catch (err) {
      setError(err.response?.data?.detail || 'Login failed. Check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') handleLogin();
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #1565C0 0%, #0D47A1 50%, #004D40 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 2,
      }}
    >
      <Container maxWidth="sm">
        {}
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <MedicalServicesIcon sx={{ fontSize: 56, color: '#fff', mb: 1 }} />
          <Typography variant="h4" sx={{ color: '#fff', fontWeight: 700, mb: 0.5 }}>
            Hospital AI
          </Typography>
          <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.75)' }}>
            Intelligent Healthcare Management System
          </Typography>
        </Box>

        {}
        {!mode && (
          <Fade in>
            <Box sx={{ display: 'flex', gap: 3, justifyContent: 'center' }}>
              <Card
                onClick={() => setMode('user')}
                sx={{
                  flex: 1, maxWidth: 220, cursor: 'pointer',
                  textAlign: 'center', py: 4,
                  '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 8px 30px rgba(0,0,0,0.2)' },
                  transition: 'all 0.3s ease',
                }}
              >
                <PersonIcon sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
                <Typography variant="h6">User</Typography>
                <Typography variant="body2" color="text.secondary">
                  Patient Login
                </Typography>
              </Card>
              <Card
                onClick={() => setMode('hospital')}
                sx={{
                  flex: 1, maxWidth: 220, cursor: 'pointer',
                  textAlign: 'center', py: 4,
                  '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 8px 30px rgba(0,0,0,0.2)' },
                  transition: 'all 0.3s ease',
                }}
              >
                <LocalHospitalIcon sx={{ fontSize: 48, color: 'secondary.main', mb: 1 }} />
                <Typography variant="h6">Hospital</Typography>
                <Typography variant="body2" color="text.secondary">
                  Staff Login
                </Typography>
              </Card>
            </Box>
          </Fade>
        )}

        {}
        {mode === 'hospital' && !hospitalRole && (
          <Fade in>
            <Card sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="h5" sx={{ mb: 3 }}>
                Select Your Role
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
                {['doctor', 'nurse', 'admin'].map((role) => (
                  <Button
                    key={role}
                    variant="outlined"
                    onClick={() => setHospitalRole(role)}
                    sx={{
                      px: 4, py: 2, minWidth: 120,
                      textTransform: 'capitalize', fontSize: '1rem',
                    }}
                  >
                    {roleLabels[role]}
                  </Button>
                ))}
              </Box>
              <Button
                variant="text"
                onClick={() => setMode(null)}
                sx={{ mt: 3, color: 'text.secondary' }}
              >
                Back
              </Button>
            </Card>
          </Fade>
        )}

        {}
        {(mode === 'user' || (mode === 'hospital' && hospitalRole)) && (
          <Fade in>
            <Card sx={{ p: 4 }}>
              <Typography variant="h5" sx={{ mb: 1, textAlign: 'center' }}>
                {mode === 'user' ? 'Patient Login' : `${roleLabels[hospitalRole]} Login`}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3, textAlign: 'center' }}>
                Enter your credentials to continue
              </Typography>

              {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

              <TextField
                fullWidth
                label={mode === 'user' ? 'Patient ID' : `${roleLabels[hospitalRole]} ID`}
                placeholder={mode === 'user' ? 'e.g. pat-nitish' : `e.g. ${hospitalRole === 'admin' ? 'admin-000' : hospitalRole + '-001'}`}
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                onKeyPress={handleKeyPress}
                sx={{ mb: 2 }}
                autoFocus
              />
              <TextField
                fullWidth
                type="password"
                label="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyPress={handleKeyPress}
                sx={{ mb: 3 }}
              />
              <Button
                fullWidth
                variant="contained"
                size="large"
                onClick={handleLogin}
                disabled={loading}
              >
                {loading ? <CircularProgress size={24} color="inherit" /> : 'Login'}
              </Button>
              <Button
                fullWidth
                variant="text"
                onClick={() => {
                  setMode(mode === 'user' ? null : 'hospital');
                  setHospitalRole(null);
                  setUserId('');
                  setPassword('');
                  setError('');
                }}
                sx={{ mt: 1.5, color: 'text.secondary' }}
              >
                Back
              </Button>
            </Card>
          </Fade>
        )}
      </Container>
    </Box>
  );
}
