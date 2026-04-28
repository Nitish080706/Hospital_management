import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api';
import {
  Box, Typography, Card, CardContent, TextField, Button, Grid,
  FormControlLabel, Switch, Alert, CircularProgress, Paper,
  Dialog, DialogTitle, DialogContent, DialogActions, FormControl, InputLabel, Select, MenuItem
} from '@mui/material';

export default function RegisterPatient() {
  const [searchName, setSearchName] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [hasSearched, setHasSearched] = useState(false);
  
  const [formData, setFormData] = useState({
    patient_id: '', name: '', age: '', gender: '', issue: '',
    phone: '', blood_group: '', allergies: '',
    emergency: false, password: 'patient123'
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(null);
  

  const [editOpen, setEditOpen] = useState(false);
  const [editData, setEditData] = useState(null);
  

  const [assignOpen, setAssignOpen] = useState(false);
  const [assignPatient, setAssignPatient] = useState(null);
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState('');

  const navigate = useNavigate();

  const handleSearch = async () => {
    if (!searchName.trim()) return;
    setLoading(true);
    try {
      const res = await api.get(`/api/nurse/search-patient?name=${searchName}`);
      setSearchResults(res.data.patients || []);
      setHasSearched(true);
      if (res.data.patients.length === 0) {
        setFormData({ ...formData, name: searchName });
      }
    } catch (err) {
      setError('Search failed');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!formData.patient_id || !formData.name || !formData.age || !formData.gender || !formData.issue) {
      setError('Patient ID, Name, age, gender, and issue are required');
      return;
    }
    setLoading(true); setError(''); setSuccess(null);
    try {
      const payload = {
        ...formData,
        age: parseInt(formData.age)
      };
      const res = await api.post('/api/nurse/register-patient', payload);
      setSuccess(`Patient registered! ID: ${res.data.patient_id}. Assigned: ${res.data.allocation?.doctor || res.data.allocation?.doctor_possible}`);
      setFormData({
        patient_id: '', name: '', age: '', gender: '', issue: '',
        phone: '', blood_group: '', allergies: '',
        emergency: false, password: 'patient123'
      });
      setHasSearched(false);
    } catch (err) {
      setError(err.response?.data?.detail || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const openEditDialog = (patient) => {
    setEditData({ ...patient });
    setEditOpen(true);
  };

  const handleEditSubmit = async () => {
    try {
      await api.put(`/api/nurse/patient/${editData.patient_id}`, editData);
      setSuccess(`Patient ${editData.name} updated successfully.`);
      setEditOpen(false);
      handleSearch();
    } catch (err) {
      setError(err.response?.data?.detail || 'Edit failed');
    }
  };

  const openAssignDialog = async (patient) => {
    setAssignPatient(patient);
    setSelectedDoctor('');
    try {
      const res = await api.get('/api/nurse/doctor-availability');
      setDoctors(res.data.doctors || []);
      setAssignOpen(true);
    } catch (err) {
      setError('Failed to fetch doctors');
    }
  };

  const handleAssignSubmit = async () => {
    if (!selectedDoctor) return;
    try {
      const res = await api.post('/api/nurse/assign-doctor', {
        patient_id: assignPatient.patient_id,
        doctor_id: selectedDoctor
      });
      setSuccess(`Successfully assigned to ${res.data.doctor} at ${res.data.slot}.`);
      setAssignOpen(false);
    } catch (err) {
      setError(err.response?.data?.detail || 'Assignment failed');
    }
  };

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3 }}>Patient Management</Typography>
      
      {error && <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess(null)}>{success}</Alert>}

      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>Search & Manage Existing Patients</Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField 
              label="Search by Name or ID" 
              value={searchName} 
              onChange={(e) => setSearchName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              fullWidth
            />
            <Button variant="contained" onClick={handleSearch} disabled={loading}>
              Search
            </Button>
          </Box>
          
          {hasSearched && searchResults.length > 0 && (
            <Box sx={{ mt: 3 }}>
              {searchResults.map(p => (
                <Paper key={p.patient_id} sx={{ p: 2, mb: 1, bgcolor: 'grey.50' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                      <Typography variant="body1"><strong>{p.name}</strong> ({p.patient_id}) - {p.age}{p.gender?.[0]}</Typography>
                      <Typography variant="body2" color="text.secondary">Phone: {p.phone || 'N/A'} | Blood: {p.blood_group || 'N/A'}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button variant="outlined" size="small" onClick={() => openEditDialog(p)}>
                        Edit
                      </Button>
                      <Button variant="contained" size="small" onClick={() => openAssignDialog(p)}>
                        Assign Doctor
                      </Button>
                    </Box>
                  </Box>
                </Paper>
              ))}
            </Box>
          )}
          
          {hasSearched && searchResults.length === 0 && (
            <Typography color="success.main" sx={{ mt: 2 }}>No existing patient found. Proceed to register below.</Typography>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>New Patient Registration</Typography>
          <Box component="form" onSubmit={handleRegister}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <FormControlLabel
                  control={<Switch checked={formData.emergency} onChange={(e) => setFormData({...formData, emergency: e.target.checked})} color="error" />}
                  label={<Typography color="error.main" fontWeight={600}>Emergency Case</Typography>}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField fullWidth required label="Patient ID" placeholder="e.g. pat-nitish" value={formData.patient_id} onChange={e => setFormData({...formData, patient_id: e.target.value})} />
              </Grid>
              <Grid item xs={12} md={8}>
                <TextField fullWidth required label="Full Name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              </Grid>
              <Grid item xs={6} md={3}>
                <TextField fullWidth required type="number" label="Age" value={formData.age} onChange={e => setFormData({...formData, age: e.target.value})} />
              </Grid>
              <Grid item xs={6} md={3}>
                <TextField fullWidth required label="Gender" placeholder="Male/Female" value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value})} />
              </Grid>
              <Grid item xs={12}>
                <TextField fullWidth required multiline rows={2} label="Current Issue / Complaint" value={formData.issue} onChange={e => setFormData({...formData, issue: e.target.value})} />
              </Grid>
              
              {!formData.emergency && (
                <>
                  <Grid item xs={12} md={4}>
                    <TextField fullWidth label="Phone" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField fullWidth label="Blood Group" value={formData.blood_group} onChange={e => setFormData({...formData, blood_group: e.target.value})} />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField fullWidth label="Allergies" value={formData.allergies} onChange={e => setFormData({...formData, allergies: e.target.value})} />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField fullWidth label="Temporary Password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
                  </Grid>
                </>
              )}
              
              <Grid item xs={12}>
                <Button type="submit" variant="contained" size="large" disabled={loading}>
                  {loading ? <CircularProgress size={24} color="inherit" /> : 'Register & Auto-Allocate Doctor'}
                </Button>
              </Grid>
            </Grid>
          </Box>
        </CardContent>
      </Card>

      {}
      <Dialog open={editOpen} onClose={() => setEditOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Patient Details</DialogTitle>
        <DialogContent dividers>
          {editData && (
            <Grid container spacing={2}>
              <Grid item xs={12} md={8}>
                <TextField fullWidth label="Name" value={editData.name} onChange={e => setEditData({...editData, name: e.target.value})} />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField fullWidth label="Age" type="number" value={editData.age} onChange={e => setEditData({...editData, age: e.target.value})} />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField fullWidth label="Gender" value={editData.gender} onChange={e => setEditData({...editData, gender: e.target.value})} />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField fullWidth label="Phone" value={editData.phone || ''} onChange={e => setEditData({...editData, phone: e.target.value})} />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField fullWidth label="Blood Group" value={editData.blood_group || ''} onChange={e => setEditData({...editData, blood_group: e.target.value})} />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField fullWidth label="Allergies" value={editData.allergies || ''} onChange={e => setEditData({...editData, allergies: e.target.value})} />
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleEditSubmit}>Save Changes</Button>
        </DialogActions>
      </Dialog>

      {}
      <Dialog open={assignOpen} onClose={() => setAssignOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Manually Assign Doctor</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Assigning a doctor will cancel any existing waiting appointments and place this patient in the selected doctor's queue.
          </Typography>
          <FormControl fullWidth>
            <InputLabel>Select Doctor</InputLabel>
            <Select
              value={selectedDoctor}
              label="Select Doctor"
              onChange={(e) => setSelectedDoctor(e.target.value)}
            >
              {doctors.map(doc => (
                <MenuItem key={doc.id} value={doc.id}>
                  Dr. {doc.name} - {doc.specialty} ({doc.is_booked ? 'Busy' : 'Free'})
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAssignOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleAssignSubmit} disabled={!selectedDoctor}>Assign</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
