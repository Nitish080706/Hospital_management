import { useState, useEffect } from 'react';
import api from '../../api';
import {
  Box, Typography, Card, CardContent, CircularProgress, Alert,
  Grid, Chip, Avatar
} from '@mui/material';
import PeopleIcon from '@mui/icons-material/People';

const statusColors = {
  WAITING: 'warning',
  IN_CONSULTATION: 'info',
};

export default function DoctorPatientMap() {
  const [mappings, setMappings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/api/nurse/doctor-patient-map')
      .then(res => setMappings(res.data.mappings))
      .catch(err => setError(err.response?.data?.detail || 'Failed to load'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}><CircularProgress /></Box>;

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 1 }}>Active Consultations</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
        Live view of doctors and their currently assigned patients
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      {mappings.length === 0 ? (
        <Card sx={{ p: 4, textAlign: 'center' }}>
          <PeopleIcon sx={{ fontSize: 64, color: 'text.secondary', opacity: 0.5, mb: 2 }} />
          <Typography color="text.secondary">No active consultations at the moment</Typography>
        </Card>
      ) : (
        <Grid container spacing={3}>
          {mappings.map((map) => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={map.id}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2, alignItems: 'flex-start' }}>
                    <Box>
                      <Typography variant="subtitle2" color="primary">{map.doctor_name}</Typography>
                      <Typography variant="caption" color="text.secondary">{map.specialty}</Typography>
                    </Box>
                    <Chip label={map.status} color={statusColors[map.status]} size="small" />
                  </Box>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', p: 1.5, bgcolor: 'grey.50', borderRadius: 2 }}>
                    <Avatar sx={{ width: 32, height: 32, mr: 1.5, bgcolor: 'secondary.main' }}>
                      {map.patient_name?.[0] || 'P'}
                    </Avatar>
                    <Box>
                      <Typography variant="body2" fontWeight={600}>{map.patient_name || map.patient_id}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {map.age ? `${map.age} yrs, ` : ''}{map.gender || 'Unknown'}
                      </Typography>
                    </Box>
                  </Box>
                  
                  <Typography variant="body2" sx={{ mt: 2, fontStyle: 'italic', color: 'text.secondary' }}>
                    Issue: {map.issue}
                  </Typography>
                  <Typography variant="caption" sx={{ display: 'block', mt: 1, color: 'text.secondary' }}>
                    Slot: {map.slot} | Wait Time: {Math.floor((new Date() - new Date(map.created_at)) / 60000)} mins
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
}
