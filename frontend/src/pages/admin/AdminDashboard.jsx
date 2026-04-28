import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, Card, Grid, CardActionArea, Button, Snackbar, Alert } from '@mui/material';
import api from '../../api';
import ShieldIcon from '@mui/icons-material/Shield';
import ManageAccountsIcon from '@mui/icons-material/ManageAccounts';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import GroupsIcon from '@mui/icons-material/Groups';
import FormatListNumberedIcon from '@mui/icons-material/FormatListNumbered';
import PolicyIcon from '@mui/icons-material/Policy';

const actions = [
  {
    label: 'Insurance Override',
    description: 'Manage and override patient insurance policies',
    icon: <ShieldIcon sx={{ fontSize: 48 }} />,
    path: '/admin/insurance',
    color: '#D32F2F', // Error/Red
  },
  {
    label: 'Manage Accounts',
    description: 'Create and view staff accounts',
    icon: <ManageAccountsIcon sx={{ fontSize: 48 }} />,
    path: '/admin/accounts',
    color: '#1565C0', // Primary Dark
  },
  {
    label: 'Register Patient',
    description: 'Register new patient or continue with existing',
    icon: <PersonAddIcon sx={{ fontSize: 48 }} />,
    path: '/admin/register',
    color: '#1976D2',
  },
  {
    label: 'Doctor Availability',
    description: 'View and update doctor schedules',
    icon: <EventAvailableIcon sx={{ fontSize: 48 }} />,
    path: '/admin/doctors',
    color: '#00897B',
  },
  {
    label: 'Active Consultations',
    description: 'See which doctor is consulting which patient',
    icon: <GroupsIcon sx={{ fontSize: 48 }} />,
    path: '/admin/map',
    color: '#ED6C02',
  },
  {
    label: 'Patient Waitlist',
    description: 'View patients waiting for a doctor',
    icon: <FormatListNumberedIcon sx={{ fontSize: 48 }} />,
    path: '/admin/waitlist',
    color: '#0288D1',
  },
  {
    label: 'AI Audit Logs',
    description: 'Monitor AI actions, flags, and system guardrails',
    icon: <PolicyIcon sx={{ fontSize: 48 }} />,
    path: '/admin/audit-logs',
    color: '#9C27B0',
  },
];

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [isSeeding, setIsSeeding] = useState(false);

  const handleSeedRAG = async () => {
    setIsSeeding(true);
    try {
      const res = await api.post('/api/admin/seed-rag');
      setSnackbar({ open: true, message: res.data.message || 'RAG Seeded Successfully', severity: 'success' });
    } catch (err) {
      setSnackbar({ open: true, message: err.response?.data?.detail || 'Failed to seed RAG', severity: 'error' });
    } finally {
      setIsSeeding(false);
    }
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const json = JSON.parse(e.target.result);
        if (!Array.isArray(json)) throw new Error("JSON must be an array of documents.");
        
        setIsSeeding(true);
        const res = await api.post('/api/admin/seed-rag-custom', json);
        setSnackbar({ open: true, message: res.data.message || 'Custom RAG Seeded Successfully', severity: 'success' });
      } catch (err) {
        setSnackbar({ open: true, message: err.response?.data?.detail || err.message || 'Invalid JSON file', severity: 'error' });
      } finally {
        setIsSeeding(false);
        event.target.value = ''; // Reset input
      }
    };
    reader.readAsText(file);
  };

  const handlePDFUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    setIsSeeding(true);
    try {
      const res = await api.post('/api/admin/seed-rag-pdf', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setSnackbar({ open: true, message: res.data.message || 'PDF Seeded Successfully', severity: 'success' });
    } catch (err) {
      setSnackbar({ open: true, message: err.response?.data?.detail || 'Failed to seed PDF', severity: 'error' });
    } finally {
      setIsSeeding(false);
      event.target.value = '';
    }
  };

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 1 }}>Admin Dashboard</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
        Full system access to manage insurance, accounts, and hospital operations
      </Typography>

      <Grid container spacing={3}>
        {actions.map((action) => (
          <Grid size={{ xs: 12, sm: 6, md: 4 }} key={action.label}>
            <Card sx={{
              height: '100%',
              '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 8px 30px rgba(0,0,0,0.15)' },
              transition: 'all 0.3s ease',
            }}>
              <CardActionArea onClick={() => navigate(action.path)} sx={{ p: 3, height: '100%' }}>
                <Box sx={{
                  width: 80, height: 80, borderRadius: 3,
                  bgcolor: `${action.color}15`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  mb: 2, color: action.color,
                }}>
                  {action.icon}
                </Box>
                <Typography variant="h6" sx={{ mb: 1 }}>{action.label}</Typography>
                <Typography variant="body2" color="text.secondary">{action.description}</Typography>
              </CardActionArea>
            </Card>
          </Grid>
        ))}
      </Grid>
      
      <Box sx={{ mt: 6, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
        <Button 
          variant="outlined" 
          color="warning" 
          onClick={handleSeedRAG}
          disabled={isSeeding}
        >
          {isSeeding ? 'Seeding Database...' : 'Default Seed'}
        </Button>
        <Button
          variant="contained"
          component="label"
          color="warning"
          disabled={isSeeding}
        >
          {isSeeding ? 'Uploading...' : 'Upload Custom RAG (.json)'}
          <input
            type="file"
            hidden
            accept=".json"
            onChange={handleFileUpload}
          />
        </Button>
        <Button
          variant="contained"
          component="label"
          color="info"
          disabled={isSeeding}
        >
          {isSeeding ? 'Processing...' : 'Upload Protocol PDF'}
          <input
            type="file"
            hidden
            accept=".pdf"
            onChange={handlePDFUpload}
          />
        </Button>
      </Box>

      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={6000} 
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
