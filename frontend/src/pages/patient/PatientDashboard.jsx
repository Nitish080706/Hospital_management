import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api';
import {
  Box, Typography, Card, CardContent, Grid, Chip, Divider,
  CircularProgress, Alert, Button, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper,
} from '@mui/material';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import ScienceIcon from '@mui/icons-material/Science';
import ShieldIcon from '@mui/icons-material/Shield';
import EventIcon from '@mui/icons-material/Event';
import ChatIcon from '@mui/icons-material/Chat';
import HistoryIcon from '@mui/icons-material/History';
import PeopleIcon from '@mui/icons-material/People';

const statusColors = {
  WAITING: 'warning',
  IN_CONSULTATION: 'info',
  COMPLETED: 'success',
  REQUESTED: 'warning',
  APPROVED: 'success',
  REJECTED: 'error',
  SCHEDULED: 'info',
};

export default function PatientDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/api/patient/dashboard')
      .then((res) => setData(res.data))
      .catch((err) => setError(err.response?.data?.detail || 'Failed to load dashboard'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}><CircularProgress /></Box>;
  if (error) return <Alert severity="error" sx={{ m: 3 }}>{error}</Alert>;

  const { patient, appointment, lab_orders, insurance, claims, followups, consultation_history, doctors } = data;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4">Welcome, {patient?.name || 'Patient'}</Typography>
          <Typography variant="body2" color="text.secondary">
            Patient ID: {patient?.patient_id} | Blood Group: {patient?.blood_group || 'N/A'}
          </Typography>
          <Typography variant="body1" fontWeight={600} sx={{ mt: 1, color: 'primary.main' }}>
            Assigned Primary Doctor: {patient?.doctor ? `Dr. ${patient.doctor}` : 'Not Assigned'}
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<ChatIcon />}
          onClick={() => navigate('/patient/chatbot')}
          size="large"
        >
          AI Assistant
        </Button>
      </Box>

      <Grid container spacing={3}>
        {/* Current Appointment */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <LocalHospitalIcon sx={{ color: 'primary.main', mr: 1 }} />
                <Typography variant="h6">Current Consultation</Typography>
              </Box>
              {appointment ? (
                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" color="text.secondary">Doctor</Typography>
                    <Typography variant="body1" fontWeight={600}>{appointment.doctor_name}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" color="text.secondary">Specialty</Typography>
                    <Typography variant="body1">{appointment.specialty}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" color="text.secondary">Slot</Typography>
                    <Typography variant="body1">{appointment.slot}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body2" color="text.secondary">Status</Typography>
                    <Chip label={appointment.status} color={statusColors[appointment.status] || 'default'} size="small" />
                  </Box>
                </Box>
              ) : (
                <Typography color="text.secondary">No active consultation</Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Insurance */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <ShieldIcon sx={{ color: 'secondary.main', mr: 1 }} />
                <Typography variant="h6">Insurance</Typography>
              </Box>
              {insurance ? (
                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" color="text.secondary">Provider</Typography>
                    <Typography variant="body1" fontWeight={600}>{insurance.provider}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" color="text.secondary">Policy</Typography>
                    <Typography variant="body1">{insurance.policy_number}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" color="text.secondary">Coverage</Typography>
                    <Typography variant="body1">
                      {insurance.coverage_amount - insurance.used_amount} / {insurance.coverage_amount} INR
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body2" color="text.secondary">Status</Typography>
                    <Chip
                      label={insurance.active ? 'Active' : 'Inactive'}
                      color={insurance.active ? 'success' : 'error'}
                      size="small"
                    />
                  </Box>
                </Box>
              ) : (
                <Typography color="text.secondary">No insurance on record</Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Follow-up */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <EventIcon sx={{ color: 'warning.main', mr: 1 }} />
                <Typography variant="h6">Follow-up Schedule</Typography>
              </Box>
              {followups && followups.length > 0 ? (
                followups.slice(0, 3).map((f, i) => (
                  <Box key={i} sx={{ mb: 1.5, p: 1.5, bgcolor: 'grey.50', borderRadius: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" fontWeight={600}>{f.next_appointment}</Typography>
                      <Chip label={f.status} color={statusColors[f.status] || 'default'} size="small" />
                    </Box>
                    <Typography variant="body2" color="text.secondary">{f.advice}</Typography>
                  </Box>
                ))
              ) : (
                <Typography color="text.secondary">No follow-ups scheduled</Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Lab Orders */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <ScienceIcon sx={{ color: 'info.main', mr: 1 }} />
                <Typography variant="h6">Lab Orders</Typography>
              </Box>
              {lab_orders && lab_orders.length > 0 ? (
                lab_orders.map((order, i) => (
                  <Box key={i} sx={{ mb: 1.5, p: 1.5, bgcolor: 'grey.50', borderRadius: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography variant="body2" fontWeight={600}>{order.tracking_id}</Typography>
                      <Chip label={order.status} color={statusColors[order.status] || 'default'} size="small" />
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      {(() => { try { return JSON.parse(order.tests).join(', '); } catch { return order.tests; } })()}
                    </Typography>
                  </Box>
                ))
              ) : (
                <Typography color="text.secondary">No lab orders</Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Available Doctors */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <PeopleIcon sx={{ color: 'success.main', mr: 1 }} />
                <Typography variant="h6">Available Doctors</Typography>
              </Box>
              {doctors && doctors.length > 0 ? (
                <Box sx={{ maxHeight: 220, overflowY: 'auto' }}>
                  {doctors.map((doc, i) => (
                    <Box key={i} sx={{ mb: 1.5, p: 1.5, bgcolor: 'grey.50', borderRadius: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" fontWeight={600}>Dr. {doc.name}</Typography>
                        <Chip label={doc.available_time} size="small" variant="outlined" color="primary" />
                      </Box>
                      <Typography variant="body2" color="text.secondary">{doc.specialty}</Typography>
                    </Box>
                  ))}
                </Box>
              ) : (
                <Typography color="text.secondary">No doctors available</Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Claims History */}
        {claims && claims.length > 0 && (
          <Grid size={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2 }}>Claims History</Typography>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Claim ID</TableCell>
                        <TableCell>Amount</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Reason</TableCell>
                        <TableCell>Date</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {claims.map((c) => (
                        <TableRow key={c.claim_id}>
                          <TableCell>#{c.claim_id}</TableCell>
                          <TableCell>{c.requested_amount} INR</TableCell>
                          <TableCell>
                            <Chip label={c.status} color={statusColors[c.status] || 'default'} size="small" />
                          </TableCell>
                          <TableCell>{c.reason}</TableCell>
                          <TableCell>{new Date(c.created_at).toLocaleDateString()}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Consultation History */}
        {consultation_history && consultation_history.length > 0 && (
          <Grid size={12}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <HistoryIcon sx={{ mr: 1, color: 'text.secondary' }} />
                  <Typography variant="h6">Consultation History</Typography>
                </Box>
                {consultation_history.map((h, i) => (
                  <Box key={i} sx={{ mb: 2, p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="subtitle2">{h.doctor_name}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {new Date(h.created_at).toLocaleDateString()}
                      </Typography>
                    </Box>
                    {h.processed_data && (
                      <>
                        <Typography variant="body2">
                          <strong>Diagnosis:</strong> {h.processed_data.consultation?.diagnosis?.join(', ') || 'N/A'}
                        </Typography>
                        <Typography variant="body2">
                          <strong>Summary:</strong> {h.processed_data.summary || 'N/A'}
                        </Typography>
                      </>
                    )}
                  </Box>
                ))}
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>
    </Box>
  );
}
