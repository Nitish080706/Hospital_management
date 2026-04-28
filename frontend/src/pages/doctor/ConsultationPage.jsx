import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api';
import {
  Box, Typography, Card, CardContent, Grid, TextField, Button,
  Stepper, Step, StepLabel, CircularProgress, Alert, Chip,
  Divider, Paper, List, ListItem, ListItemText, Switch, FormControlLabel,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

const steps = ['Write Notes', 'Process with AI', 'Order Tests', 'Check Insurance', 'Schedule Follow-up', 'Complete'];

export default function ConsultationPage() {
  const { patientId } = useParams();
  const navigate = useNavigate();

  const [activeStep, setActiveStep] = useState(0);
  const [history, setHistory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');


  const [rawNotes, setRawNotes] = useState('');
  const [processedResult, setProcessedResult] = useState(null);
  const [testResult, setTestResult] = useState(null);
  const [insuranceResult, setInsuranceResult] = useState(null);
  const [followupResult, setFollowupResult] = useState(null);


  const [skipTests, setSkipTests] = useState(false);
  const [skipInsurance, setSkipInsurance] = useState(true);
  const [insuranceAmount, setInsuranceAmount] = useState('');
  const [followupAdvice, setFollowupAdvice] = useState('');

  useEffect(() => {
    api.get(`/api/doctor/patient-history/${patientId}`)
      .then((res) => setHistory(res.data))
      .catch((err) => setError(err.response?.data?.detail || 'Failed to load'))
      .finally(() => setLoading(false));
  }, [patientId]);

  const handleProcessNotes = async () => {
    if (!rawNotes.trim()) { setError('Please enter consultation notes'); return; }
    setActionLoading(true); setError('');
    try {
      const res = await api.post('/api/doctor/process-consultation', {
        patient_id: patientId, raw_notes: rawNotes,
      });
      setProcessedResult(res.data.result);
      setActiveStep(2);

      if (res.data.result?.follow_up) setFollowupAdvice(res.data.result.follow_up);
    } catch (err) {
      setError(err.response?.data?.detail || 'Processing failed');
    } finally { setActionLoading(false); }
  };

  const handleOrderTests = async () => {
    const tests = processedResult?.tests_recommended || [];
    if (tests.length === 0 || skipTests) { setActiveStep(3); return; }
    setActionLoading(true); setError('');
    try {
      const res = await api.post('/api/doctor/order-test', {
        patient_id: patientId,
        patient_name: history?.patient?.name || patientId,
        tests,
      });
      setTestResult(res.data);
      setActiveStep(3);
    } catch (err) {
      setError(err.response?.data?.detail || 'Test order failed');
    } finally { setActionLoading(false); }
  };

  const handleCheckInsurance = async () => {
    if (skipInsurance) { setActiveStep(4); return; }
    if (!insuranceAmount) { setError('Enter the amount'); return; }
    setActionLoading(true); setError('');
    try {
      const res = await api.post('/api/doctor/check-insurance', {
        patient_id: patientId,
        requested_amount: parseInt(insuranceAmount),
      });
      setInsuranceResult(res.data);
      setActiveStep(4);
    } catch (err) {
      setError(err.response?.data?.detail || 'Insurance check failed');
    } finally { setActionLoading(false); }
  };

  const handleScheduleFollowup = async () => {
    if (!followupAdvice.trim()) { setError('Enter follow-up advice'); return; }
    setActionLoading(true); setError('');
    try {
      const res = await api.post('/api/doctor/schedule-followup', {
        patient_id: patientId, advice: followupAdvice,
      });
      setFollowupResult(res.data);
      setActiveStep(5);
    } catch (err) {
      setError(err.response?.data?.detail || 'Scheduling failed');
    } finally { setActionLoading(false); }
  };

  const handleComplete = async () => {
    setActionLoading(true);
    try {
      await api.post('/api/doctor/complete-consultation', { patient_id: patientId });
      navigate('/doctor');
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to complete');
    } finally { setActionLoading(false); }
  };

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}><CircularProgress /></Box>;

  return (
    <Box>
      <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/doctor')} sx={{ mb: 2 }}>
        Back to Patients
      </Button>

      <Typography variant="h4" sx={{ mb: 0.5 }}>
        Consultation: {history?.patient?.name || patientId}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        ID: {patientId} | Age: {history?.patient?.age} | Gender: {history?.patient?.gender}
        {history?.patient?.allergies ? ` | Allergies: ${history.patient.allergies}` : ''}
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

      {}
      <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 4 }}>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      <Grid container spacing={3}>
        {}
        <Grid size={{ xs: 12, md: 4 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>Patient History</Typography>
              {history?.consultation_history?.length > 0 ? (
                history.consultation_history.map((h, i) => (
                  <Box key={i} sx={{ mb: 2, p: 1.5, bgcolor: 'grey.50', borderRadius: 2 }}>
                    <Typography variant="caption" color="text.secondary">
                      {new Date(h.created_at).toLocaleDateString()} - {h.doctor_name}
                    </Typography>
                    {h.processed_data && (
                      <>
                        <Typography variant="body2">
                          <strong>Diagnosis:</strong> {h.processed_data.consultation?.diagnosis?.join(', ') || 'N/A'}
                        </Typography>
                        <Typography variant="body2">
                          <strong>Rx:</strong> {h.processed_data.prescription?.map(p => p.medicine_name).join(', ') || 'N/A'}
                        </Typography>
                      </>
                    )}
                  </Box>
                ))
              ) : (
                <Typography variant="body2" color="text.secondary">No prior history</Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {}
        <Grid size={{ xs: 12, md: 8 }}>
          {}
          {activeStep <= 1 && (
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2 }}>Consultation Notes</Typography>
                <TextField
                  fullWidth multiline rows={10}
                  placeholder={"Write your consultation notes here...\n\nExample:\nPatient Nitish, 20M, complaints of high fever for 3 days, headache, body pain.\nVitals: BP 120/80, Pulse 88, Temp 101F.\nDiagnosis: Viral Fever.\nRx: Paracetamol 500mg TDS x 5 days, Cetirizine 10mg OD x 3 days.\nAdvice: Rest, fluids. Follow up after 5 days.\nTests: CBC, Urine routine."}
                  value={rawNotes}
                  onChange={(e) => setRawNotes(e.target.value)}
                  sx={{ mb: 2 }}
                />
                <Button
                  variant="contained" size="large"
                  onClick={() => { setActiveStep(1); handleProcessNotes(); }}
                  disabled={actionLoading || !rawNotes.trim()}
                >
                  {actionLoading ? <CircularProgress size={24} color="inherit" /> : 'Process with AI'}
                </Button>
              </CardContent>
            </Card>
          )}

          {}
          {activeStep === 2 && (
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2 }}>AI Processed Result</Typography>
                {processedResult && (
                  <Box sx={{ mb: 3 }}>
                    <Paper sx={{ p: 2, mb: 2, bgcolor: 'grey.50' }}>
                      <Typography variant="subtitle2">Diagnosis</Typography>
                      <Typography variant="body2">
                        {processedResult.consultation?.diagnosis?.join(', ') || 'N/A'}
                      </Typography>
                    </Paper>
                    <Paper sx={{ p: 2, mb: 2, bgcolor: 'grey.50' }}>
                      <Typography variant="subtitle2">Prescription</Typography>
                      {processedResult.prescription?.map((p, i) => (
                        <Typography key={i} variant="body2">
                          {p.medicine_name} - {p.dosage} - {p.frequency} x {p.duration}
                        </Typography>
                      ))}
                    </Paper>
                    {processedResult.risk_flags?.length > 0 && (
                      <Alert severity="warning" sx={{ mb: 2 }}>
                        Risk Flags: {processedResult.risk_flags.join(', ')}
                      </Alert>
                    )}
                    <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                      <Typography variant="subtitle2">Summary</Typography>
                      <Typography variant="body2">{processedResult.summary}</Typography>
                    </Paper>
                  </Box>
                )}

                <Divider sx={{ my: 2 }} />
                <Typography variant="h6" sx={{ mb: 2 }}>Lab Tests</Typography>
                {processedResult?.tests_recommended?.length > 0 ? (
                  <Box>
                    <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                      {processedResult.tests_recommended.map((t, i) => (
                        <Chip key={i} label={t} color="info" />
                      ))}
                    </Box>
                    <FormControlLabel
                      control={<Switch checked={skipTests} onChange={(e) => setSkipTests(e.target.checked)} />}
                      label="Skip test ordering"
                    />
                  </Box>
                ) : (
                  <Typography variant="body2" color="text.secondary">No tests recommended</Typography>
                )}
                <Box sx={{ mt: 2 }}>
                  <Button variant="contained" onClick={handleOrderTests} disabled={actionLoading}>
                    {actionLoading ? <CircularProgress size={24} color="inherit" /> :
                      (processedResult?.tests_recommended?.length > 0 && !skipTests ? 'Order Tests' : 'Next')}
                  </Button>
                </Box>
              </CardContent>
            </Card>
          )}

          {}
          {activeStep === 3 && (
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2 }}>Insurance Check</Typography>
                {testResult && (
                  <Alert severity="success" sx={{ mb: 2 }}>
                    Tests ordered: {testResult.tracking_id}
                  </Alert>
                )}
                <FormControlLabel
                  control={<Switch checked={skipInsurance} onChange={(e) => setSkipInsurance(e.target.checked)} />}
                  label="Skip insurance check"
                />
                {!skipInsurance && (
                  <TextField
                    fullWidth type="number"
                    label="Requested Amount (INR)"
                    value={insuranceAmount}
                    onChange={(e) => setInsuranceAmount(e.target.value)}
                    sx={{ mt: 2, mb: 2 }}
                  />
                )}
                <Box sx={{ mt: 2 }}>
                  <Button variant="contained" onClick={handleCheckInsurance} disabled={actionLoading}>
                    {actionLoading ? <CircularProgress size={24} color="inherit" /> :
                      (!skipInsurance ? 'Check Insurance' : 'Next')}
                  </Button>
                </Box>
              </CardContent>
            </Card>
          )}

          {}
          {activeStep === 4 && (
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2 }}>Schedule Follow-up</Typography>
                {insuranceResult && (
                  <Alert
                    severity={insuranceResult.claim_status === 'APPROVED' ? 'success' : 'warning'}
                    sx={{ mb: 2 }}
                  >
                    Insurance: {insuranceResult.claim_status} - {insuranceResult.reason}
                  </Alert>
                )}
                <TextField
                  fullWidth
                  label="Follow-up Advice"
                  placeholder="e.g. Follow up after 5 days, Review in 1 week"
                  value={followupAdvice}
                  onChange={(e) => setFollowupAdvice(e.target.value)}
                  sx={{ mb: 2 }}
                />
                <Button variant="contained" onClick={handleScheduleFollowup} disabled={actionLoading}>
                  {actionLoading ? <CircularProgress size={24} color="inherit" /> : 'Schedule'}
                </Button>
              </CardContent>
            </Card>
          )}

          {}
          {activeStep === 5 && (
            <Card>
              <CardContent sx={{ textAlign: 'center', py: 4 }}>
                <CheckCircleIcon sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />
                <Typography variant="h5" sx={{ mb: 1 }}>Consultation Ready to Complete</Typography>
                {followupResult && (
                  <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                    Next appointment: {followupResult.next_appointment}
                  </Typography>
                )}
                <Button variant="contained" color="success" size="large" onClick={handleComplete} disabled={actionLoading}>
                  {actionLoading ? <CircularProgress size={24} color="inherit" /> : 'Mark as Completed'}
                </Button>
              </CardContent>
            </Card>
          )}
        </Grid>
      </Grid>
    </Box>
  );
}
