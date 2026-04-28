import { useState, useEffect } from 'react';
import api from '../../api';
import {
  Box, Typography, Card, CardContent, TextField, Button, Grid,
  Alert, CircularProgress, Select, MenuItem, FormControl, InputLabel,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper
} from '@mui/material';

export default function ManageAccounts() {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    user_type: 'doctor',
    name: '',
    user_id: '',
    password: '',
    specialty: '',
    available_time: '09:00 AM'
  });

  const fetchAccounts = () => {
    setLoading(true);
    api.get('/api/admin/accounts')
      .then(res => setAccounts(res.data.accounts))
      .catch(err => setError(err.response?.data?.detail || 'Failed to load accounts'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.user_id || !formData.password) {
      setError('Name, ID, and Password are required');
      return;
    }
    setActionLoading(true); setError(''); setSuccess('');
    try {
      await api.post('/api/admin/create-account', formData);
      setSuccess(`Account ${formData.user_id} created successfully`);
      setFormData({
        user_type: 'doctor', name: '', user_id: '', password: '',
        specialty: '', available_time: '09:00 AM'
      });
      fetchAccounts();
    } catch (err) {
      setError(err.response?.data?.detail || 'Creation failed');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3 }}>Manage Accounts</Typography>
      
      {error && <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess('')}>{success}</Alert>}

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 5 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>Create Staff Account</Typography>
              <Box component="form" onSubmit={handleCreate}>
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel>Role</InputLabel>
                  <Select 
                    value={formData.user_type} 
                    label="Role"
                    onChange={e => setFormData({...formData, user_type: e.target.value})}
                  >
                    <MenuItem value="doctor">Doctor</MenuItem>
                    <MenuItem value="nurse">Nurse</MenuItem>
                    <MenuItem value="admin">Admin</MenuItem>
                  </Select>
                </FormControl>
                
                <TextField fullWidth required label="Full Name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} sx={{ mb: 2 }} />
                <TextField fullWidth required label="User ID (e.g. doc-name)" value={formData.user_id} onChange={e => setFormData({...formData, user_id: e.target.value})} sx={{ mb: 2 }} />
                <TextField fullWidth required label="Password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} sx={{ mb: 2 }} />
                
                {formData.user_type === 'doctor' && (
                  <>
                    <TextField fullWidth label="Specialty" value={formData.specialty} onChange={e => setFormData({...formData, specialty: e.target.value})} sx={{ mb: 2 }} />
                    <FormControl fullWidth sx={{ mb: 2 }}>
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
                  </>
                )}
                
                <Button type="submit" variant="contained" fullWidth disabled={actionLoading}>
                  {actionLoading ? <CircularProgress size={24} color="inherit" /> : 'Create Account'}
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid size={{ xs: 12, md: 7 }}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>Staff Accounts</Typography>
              {loading ? <CircularProgress /> : (
                <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>ID</TableCell>
                        <TableCell>Name</TableCell>
                        <TableCell>Role</TableCell>
                        <TableCell>Created</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {accounts.map(acc => (
                        <TableRow key={acc.user_id}>
                          <TableCell>{acc.user_id}</TableCell>
                          <TableCell>{acc.name}</TableCell>
                          <TableCell sx={{ textTransform: 'capitalize' }}>{acc.user_type}</TableCell>
                          <TableCell>{new Date(acc.created_at).toLocaleDateString()}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
