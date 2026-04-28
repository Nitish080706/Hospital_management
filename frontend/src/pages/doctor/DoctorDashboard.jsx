import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api';
import {
  Box, Typography, Card, CardContent, Grid, Chip, Button,
  CircularProgress, Alert, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper,
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';

const statusColors = {
  WAITING: 'warning',
  IN_CONSULTATION: 'info',
  COMPLETED: 'success',
};

export default function DoctorDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/api/doctor/assigned-patients')
      .then((res) => setData(res.data))
      .catch((err) => setError(err.response?.data?.detail || 'Failed to load'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}><CircularProgress /></Box>;
  if (error) return <Alert severity="error" sx={{ m: 3 }}>{error}</Alert>;

  const activePatients = data.patients.filter(p => p.status !== 'COMPLETED');
  const completedPatients = data.patients.filter(p => p.status === 'COMPLETED');

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 1 }}>My Patients</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        {data.doctor_name} | {activePatients.length} active, {completedPatients.length} completed
      </Typography>

      {activePatients.length === 0 && (
        <Card sx={{ p: 4, textAlign: 'center' }}>
          <Typography color="text.secondary">No patients currently assigned</Typography>
        </Card>
      )}

      {activePatients.length > 0 && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2 }}>Active Patients</Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Patient ID</TableCell>
                    <TableCell>Name</TableCell>
                    <TableCell>Age</TableCell>
                    <TableCell>Gender</TableCell>
                    <TableCell>Issue</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Slot</TableCell>
                    <TableCell align="center">Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {activePatients.map((p) => (
                    <TableRow key={p.id} hover>
                      <TableCell>{p.patient_id}</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>{p.patient_name || p.patient_id}</TableCell>
                      <TableCell>{p.age || '-'}</TableCell>
                      <TableCell>{p.gender || '-'}</TableCell>
                      <TableCell>{p.issue}</TableCell>
                      <TableCell>
                        <Chip label={p.status} color={statusColors[p.status] || 'default'} size="small" />
                      </TableCell>
                      <TableCell>{p.slot}</TableCell>
                      <TableCell align="center">
                        <Button
                          variant="contained"
                          size="small"
                          startIcon={<VisibilityIcon />}
                          onClick={() => navigate(`/doctor/consult/${p.patient_id}`)}
                        >
                          Consult
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      {completedPatients.length > 0 && (
        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2 }}>Completed Today</Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Patient ID</TableCell>
                    <TableCell>Name</TableCell>
                    <TableCell>Issue</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {completedPatients.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell>{p.patient_id}</TableCell>
                      <TableCell>{p.patient_name || p.patient_id}</TableCell>
                      <TableCell>{p.issue}</TableCell>
                      <TableCell>
                        <Chip label="Completed" color="success" size="small" />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}
    </Box>
  );
}
