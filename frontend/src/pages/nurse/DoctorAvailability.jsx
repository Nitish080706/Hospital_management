import { useState, useEffect } from 'react';
import api from '../../api';
import {
  Box, Typography, Card, CardContent, CircularProgress, Alert,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Select, MenuItem, FormControl, InputLabel, Button, Chip,
} from '@mui/material';

export default function DoctorAvailability() {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchDoctors = () => {
    setLoading(true);
    api.get('/api/nurse/doctor-availability')
      .then(res => setDoctors(res.data.doctors))
      .catch(err => setError(err.response?.data?.detail || 'Failed to load'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchDoctors();
  }, []);

  const handleUpdate = async (id, field, value) => {
    try {
      await api.put(`/api/nurse/update-doctor/${id}`, { [field]: value });
      fetchDoctors();
    } catch (err) {
      setError('Update failed');
    }
  };

  if (loading && doctors.length === 0) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}><CircularProgress /></Box>;

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3 }}>Doctor Availability</Typography>
      
      {error && <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>{error}</Alert>}

      <Card>
        <CardContent>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>ID</TableCell>
                  <TableCell>Doctor Name</TableCell>
                  <TableCell>Specialty</TableCell>
                  <TableCell>Available Time</TableCell>
                  <TableCell>Booking Status</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {doctors.map((doc) => (
                  <TableRow key={doc.id}>
                    <TableCell>{doc.user_id}</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>{doc.name}</TableCell>
                    <TableCell>{doc.specialty}</TableCell>
                    <TableCell>
                      <FormControl size="small" fullWidth>
                        <Select
                          value={doc.available_time}
                          onChange={(e) => handleUpdate(doc.id, 'available_time', e.target.value)}
                        >
                          {['09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM'].map(t => (
                            <MenuItem key={t} value={t}>{t}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={doc.is_booked ? 'Booked' : 'Available'} 
                        color={doc.is_booked ? 'warning' : 'success'} 
                        size="small" 
                      />
                    </TableCell>
                    <TableCell align="center">
                      {doc.is_booked === 1 && (
                        <Button 
                          variant="outlined" 
                          size="small" 
                          color="success"
                          onClick={() => handleUpdate(doc.id, 'is_booked', 0)}
                        >
                          Mark Free
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Box>
  );
}
