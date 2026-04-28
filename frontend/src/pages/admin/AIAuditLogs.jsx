import { useState, useEffect } from 'react';
import { Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip, Alert, IconButton, Collapse } from '@mui/material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import api from '../../api';

function LogRow({ log }) {
  const [open, setOpen] = useState(false);

  const getOutcomeColor = (outcome) => {
    if (outcome === 'SUCCESS') return 'success';
    if (outcome === 'REJECTED_INPUT') return 'error';
    if (outcome === 'HUMAN_REVIEW_REQUIRED') return 'warning';
    return 'default';
  };

  const hasFlags = log.guardrail_flags && log.guardrail_flags.length > 0;

  return (
    <>
      <TableRow sx={{ '& > *': { borderBottom: 'unset' } }}>
        <TableCell>
          <IconButton size="small" onClick={() => setOpen(!open)}>
            {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
          </IconButton>
        </TableCell>
        <TableCell>{new Date(log.timestamp).toLocaleString()}</TableCell>
        <TableCell>{log.tool_name}</TableCell>
        <TableCell>{log.triggered_by}</TableCell>
        <TableCell>
          <Chip label={log.outcome} color={getOutcomeColor(log.outcome)} size="small" />
        </TableCell>
        <TableCell>
          {hasFlags ? (
            <Chip label={`${log.guardrail_flags.length} Flags`} color="error" size="small" />
          ) : (
            <Chip label="Clear" color="success" size="small" variant="outlined" />
          )}
        </TableCell>
      </TableRow>
      <TableRow>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={6}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box sx={{ margin: 2 }}>
              <Typography variant="h6" gutterBottom component="div">
                Log Details
              </Typography>
              
              {hasFlags && (
                <Alert severity="warning" sx={{ mb: 2 }}>
                  <strong>Guardrail Flags:</strong>
                  <ul>
                    {log.guardrail_flags.map((flag, i) => <li key={i}>{flag}</li>)}
                  </ul>
                </Alert>
              )}

              <Typography variant="subtitle2" sx={{ mt: 2 }}>Input Payload:</Typography>
              <Paper sx={{ p: 2, bgcolor: '#f5f5f5', overflowX: 'auto', mb: 2 }}>
                <pre style={{ margin: 0 }}>{JSON.stringify(log.input_payload, null, 2)}</pre>
              </Paper>

              <Typography variant="subtitle2" sx={{ mt: 2 }}>Parsed Output:</Typography>
              <Paper sx={{ p: 2, bgcolor: '#f5f5f5', overflowX: 'auto', mb: 2 }}>
                <pre style={{ margin: 0 }}>{JSON.stringify(log.parsed_output, null, 2)}</pre>
              </Paper>

              <Typography variant="subtitle2" sx={{ mt: 2 }}>Raw LLM Response:</Typography>
              <Paper sx={{ p: 2, bgcolor: '#f5f5f5', overflowX: 'auto', maxHeight: 200 }}>
                <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{log.llm_response_raw}</pre>
              </Paper>
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  );
}

export default function AIAuditLogs() {
  const [logs, setLogs] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const res = await api.get('/admin/audit-logs');
      setLogs(res.data.logs);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to fetch audit logs');
    }
  };

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 2 }}>AI Audit Logs</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
        Immutable record of all AI actions, tool calls, and guardrail validations.
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      <TableContainer component={Paper}>
        <Table aria-label="audit logs table">
          <TableHead>
            <TableRow>
              <TableCell />
              <TableCell>Timestamp</TableCell>
              <TableCell>Tool / Action</TableCell>
              <TableCell>Triggered By</TableCell>
              <TableCell>Outcome</TableCell>
              <TableCell>Guardrails</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {logs.map((log) => (
              <LogRow key={log.log_id} log={log} />
            ))}
            {logs.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} align="center">No audit logs found.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
