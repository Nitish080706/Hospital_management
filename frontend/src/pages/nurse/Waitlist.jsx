import { useState, useEffect } from 'react';
import api from '../../api';
import {
  Box, Typography, Card, CardContent, CircularProgress, Alert,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper
} from '@mui/material';

export default function Waitlist() {
  const [waitlist, setWaitlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/api/nurse/waitlist')
      .then(res => setWaitlist(res.data.waitlist))
      .catch(err => setError(err.response?.data?.detail || 'Failed to load waitlist'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}><CircularProgress /></Box>;

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 1 }}>Patient Waitlist</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
        Patients waiting for doctor availability
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      <Card>
        <CardContent>
          {waitlist.length === 0 ? (
            <Typography color="text.secondary" align="center" sx={{ py: 4 }}>
              The waitlist is currently empty.
            </Typography>
          ) : (
            <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>ID</TableCell>
                    <TableCell>Patient Name</TableCell>
                    <TableCell>Issue</TableCell>
                    <TableCell>Requested Specialty</TableCell>
                    <TableCell>Added At</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {waitlist.map((item) => (
                    <TableRow key={item.id} hover>
                      <TableCell>{item.id}</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>{item.patient_name}</TableCell>
                      <TableCell>{item.issue}</TableCell>
                      <TableCell>{item.requested_specialty}</TableCell>
                      <TableCell>{new Date(item.created_at).toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
