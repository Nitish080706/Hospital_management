import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api';
import {
  Box, Typography, Card, CardContent, TextField, Button, Grid,
  Alert, CircularProgress, Select, MenuItem, FormControl, InputLabel,
  Avatar, Divider
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';

export default function DoctorProfile() {
  const { user, login } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    specialty: '',
    available_time: '09:00 AM'
  });

  const fetchProfile = () => {
    setLoading(true);
    api.get('/api/doctor/profile')
      .then(res => {
        setProfile(res.data);
        setFormData({
          name: res.data.name || '',
          specialty: res.data.specialty || '',
          available_time: res.data.available_time || '09:00 AM'
        });
      })
      .catch(err => setError(err.response?.data?.detail || 'Failed to load profile'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleUpdate = async (e) => {
    e.preventDefault();
    setActionLoading(true); setError(''); setSuccess('');
    try {
      await api.put('/api/doctor/profile', formData);
      setSuccess('Profile updated successfully');
      

      if (formData.name !== user.name) {
        const updatedUser = { ...user, name: formData.name };
        login({
          token: localStorage.getItem('token'),
          user_id: user.user_id,
          user_type: user.user_type,
          name: formData.name
        });
      }
      
      fetchProfile();
    } catch (err) {
      setError(err.response?.data?.detail || 'Update failed');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}><CircularProgress /></Box>;

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto' }}>
      <Typography variant="h4" sx={{ mb: 3 }}>My Profile</Typography>
      
      {error && <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess('')}>{success}</Alert>}

      <Card>
        <CardContent sx={{ p: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
            <Avatar sx={{ width: 80, height: 80, bgcolor: 'primary.main', mr: 3 }}>
              <PersonIcon sx={{ fontSize: 40 }} />
            </Avatar>
            <Box>
              <Typography variant="h5" fontWeight={600}>{profile?.name}</Typography>
              <Typography variant="body1" color="text.secondary">{profile?.user_id}</Typography>
              <Typography variant="body2" sx={{ mt: 0.5, px: 1.5, py: 0.5, bgcolor: 'primary.light', color: 'primary.contrastText', borderRadius: 1, display: 'inline-block' }}>
                {profile?.specialty}
              </Typography>
            </Box>
          </Box>

          <Divider sx={{ mb: 4 }} />

          <Box component="form" onSubmit={handleUpdate}>
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField 
                  fullWidth 
                  required 
                  label="Full Name" 
                  value={formData.name} 
                  onChange={e => setFormData({...formData, name: e.target.value})} 
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField 
                  fullWidth 
                  required 
                  label="Specialty" 
                  value={formData.specialty} 
                  onChange={e => setFormData({...formData, specialty: e.target.value})} 
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <FormControl fullWidth required>
                  <InputLabel>Available Time</InputLabel>
                  <Select 
                    value={formData.available_time} 
                    label="Available Time"
                    onChange={e => setFormData({...formData, available_time: e.target.value})}
                  >
                    {['09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM'].map(t => (
                      <MenuItem key={t} value={t}>{t}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12 }}>
                <Button 
                  type="submit" 
                  variant="contained" 
                  size="large" 
                  disabled={actionLoading}
                  sx={{ mt: 2 }}
                >
                  {actionLoading ? <CircularProgress size={24} color="inherit" /> : 'Save Changes'}
                </Button>
              </Grid>
            </Grid>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
