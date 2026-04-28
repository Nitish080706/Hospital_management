import { useState } from 'react';
import api from '../../api';
import {
  Box, Typography, Card, CardContent, TextField, Button, Grid,
  Alert, CircularProgress, Paper, Switch, FormControlLabel,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';

const statusColors = {
  APPROVED: 'success',
  REJECTED: 'error',
};

export default function InsuranceOverride() {
  const [patientId, setPatientId] = useState('');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [overrideData, setOverrideData] = useState({
    active: true,
    coverage_amount: '',
    used_amount: '',
    expiry_date: '',
    override_reason: '',
    provider: '',
    policy_number: ''
  });
  const [actionLoading, setActionLoading] = useState(false);
  const [success, setSuccess] = useState('');

  const handleSearch = async () => {
    if (!patientId.trim()) return;
    setLoading(true); setError(''); setSuccess(''); setData(null);
    try {
      const res = await api.get(`/api/admin/insurance/${patientId}`);
      setData(res.data);
      if (res.data.insurance) {
        setOverrideData({
          active: res.data.insurance.active === 1,
          coverage_amount: res.data.insurance.coverage_amount,
          used_amount: res.data.insurance.used_amount,
          expiry_date: res.data.insurance.expiry_date,
          override_reason: '',
          provider: res.data.insurance.provider,
          policy_number: res.data.insurance.policy_number
        });
      } else {
        setOverrideData({
          active: true, coverage_amount: '50000', used_amount: '0',
          expiry_date: '2027-12-31', override_reason: '', provider: '', policy_number: ''
        });
      }
    } catch (err) {
      setError('Search failed. Ensure ID is correct.');
    } finally {
      setLoading(false);
    }
  };

  const handleOverride = async (e) => {
    e.preventDefault();
    if (!overrideData.override_reason) {
      setError('Override reason is required');
      return;
    }
    setActionLoading(true); setError(''); setSuccess('');
    try {
      const payload = {
        active: overrideData.active ? 1 : 0,
        coverage_amount: parseInt(overrideData.coverage_amount),
        used_amount: parseInt(overrideData.used_amount),
        expiry_date: overrideData.expiry_date,
        override_reason: overrideData.override_reason,
        provider: overrideData.provider,
        policy_number: overrideData.policy_number
      };
      await api.put(`/api/admin/override-insurance/${patientId}`, payload);
      setSuccess('Insurance overridden successfully');
      handleSearch(); // Refresh
    } catch (err) {
      setError(err.response?.data?.detail || 'Override failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleApproveClaim = async (claimId) => {
    setActionLoading(true); setError(''); setSuccess('');
    try {
      await api.put(`/api/admin/approve-claim/${claimId}`);
      setSuccess(`Claim #${claimId} approved`);
      handleSearch(); // Refresh
    } catch (err) {
      setError(err.response?.data?.detail || 'Approval failed');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3 }}>Insurance Override</Typography>
      
      {error && <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess('')}>{success}</Alert>}

      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField 
              label="Patient ID" 
              placeholder="e.g. pat-nitish"
              value={patientId} 
              onChange={(e) => setPatientId(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              fullWidth
            />
            <Button variant="contained" onClick={handleSearch} disabled={loading} startIcon={<SearchIcon />}>
              Search
            </Button>
          </Box>
        </CardContent>
      </Card>

      {loading && <Box sx={{ display: 'flex', justifyContent: 'center' }}><CircularProgress /></Box>}

      {data && (
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 5 }}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  {data.insurance ? 'Update Policy' : 'Create New Policy'}
                </Typography>
                <Box component="form" onSubmit={handleOverride}>
                  <FormControlLabel
                    control={<Switch checked={overrideData.active} onChange={(e) => setOverrideData({...overrideData, active: e.target.checked})} color="success" />}
                    label={overrideData.active ? "Active" : "Inactive"}
                    sx={{ mb: 2, display: 'block' }}
                  />
                  {!data.insurance && (
                    <>
                      <TextField fullWidth size="small" label="Provider" value={overrideData.provider} onChange={e => setOverrideData({...overrideData, provider: e.target.value})} sx={{ mb: 2 }} required />
                      <TextField fullWidth size="small" label="Policy Number" value={overrideData.policy_number} onChange={e => setOverrideData({...overrideData, policy_number: e.target.value})} sx={{ mb: 2 }} required />
                    </>
                  )}
                  <TextField fullWidth size="small" type="number" label="Coverage Amount" value={overrideData.coverage_amount} onChange={e => setOverrideData({...overrideData, coverage_amount: e.target.value})} sx={{ mb: 2 }} required />
                  <TextField fullWidth size="small" type="number" label="Used Amount" value={overrideData.used_amount} onChange={e => setOverrideData({...overrideData, used_amount: e.target.value})} sx={{ mb: 2 }} required />
                  <TextField fullWidth size="small" type="date" label="Expiry Date" InputLabelProps={{ shrink: true }} value={overrideData.expiry_date} onChange={e => setOverrideData({...overrideData, expiry_date: e.target.value})} sx={{ mb: 2 }} required />
                  <TextField fullWidth multiline rows={2} label="Override Reason" value={overrideData.override_reason} onChange={e => setOverrideData({...overrideData, override_reason: e.target.value})} sx={{ mb: 2 }} required />
                  <Button type="submit" variant="contained" color="error" fullWidth disabled={actionLoading}>
                    {actionLoading ? <CircularProgress size={24} color="inherit" /> : 'Force Override'}
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid size={{ xs: 12, md: 7 }}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2 }}>Claims History</Typography>
                {data.claims.length > 0 ? (
                  <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>ID</TableCell>
                          <TableCell>Amount</TableCell>
                          <TableCell>Status</TableCell>
                          <TableCell>Date</TableCell>
                          <TableCell align="center">Action</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {data.claims.map(c => (
                          <TableRow key={c.claim_id}>
                            <TableCell>#{c.claim_id}</TableCell>
                            <TableCell>{c.requested_amount}</TableCell>
                            <TableCell>
                              <Chip label={c.status} color={statusColors[c.status] || 'default'} size="small" />
                            </TableCell>
                            <TableCell>{new Date(c.created_at).toLocaleDateString()}</TableCell>
                            <TableCell align="center">
                              {c.status === 'REJECTED' && (
                                <Button 
                                  variant="outlined" color="success" size="small"
                                  onClick={() => handleApproveClaim(c.claim_id)}
                                  disabled={actionLoading}
                                >
                                  Approve
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                ) : (
                  <Typography color="text.secondary">No claims found</Typography>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}
    </Box>
  );
}
