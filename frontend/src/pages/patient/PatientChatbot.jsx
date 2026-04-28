import { useState, useRef, useEffect } from 'react';
import api from '../../api';
import {
  Box, Typography, TextField, IconButton, Paper, CircularProgress, Card, CardContent,
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import PersonIcon from '@mui/icons-material/Person';

export default function PatientChatbot() {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'Hello! I am your hospital AI assistant. Ask me anything about your medical records, appointments, prescriptions, or test results.',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const question = input.trim();
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: question }]);
    setLoading(true);

    try {
      const res = await api.post('/api/patient/chatbot', { question });
      setMessages((prev) => [...prev, { role: 'assistant', content: res.data.answer }]);
    } catch (err) {
      setMessages((prev) => [...prev, {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ height: 'calc(100vh - 48px)', display: 'flex', flexDirection: 'column' }}>
      <Typography variant="h5" sx={{ mb: 2 }}>AI Assistant</Typography>

      {}
      <Card sx={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <CardContent sx={{ flex: 1, overflow: 'auto', p: 3 }}>
          {messages.map((msg, i) => (
            <Box
              key={i}
              sx={{
                display: 'flex',
                justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                mb: 2,
              }}
            >
              {msg.role === 'assistant' && (
                <Box sx={{
                  width: 36, height: 36, borderRadius: '50%',
                  bgcolor: 'primary.main', display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                  mr: 1.5, flexShrink: 0, mt: 0.5,
                }}>
                  <SmartToyIcon sx={{ fontSize: 20, color: '#fff' }} />
                </Box>
              )}
              <Paper
                elevation={0}
                sx={{
                  p: 2, maxWidth: '70%', borderRadius: 3,
                  bgcolor: msg.role === 'user' ? 'primary.main' : 'grey.100',
                  color: msg.role === 'user' ? '#fff' : 'text.primary',
                }}
              >
                <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                  {msg.content}
                </Typography>
              </Paper>
              {msg.role === 'user' && (
                <Box sx={{
                  width: 36, height: 36, borderRadius: '50%',
                  bgcolor: 'secondary.main', display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                  ml: 1.5, flexShrink: 0, mt: 0.5,
                }}>
                  <PersonIcon sx={{ fontSize: 20, color: '#fff' }} />
                </Box>
              )}
            </Box>
          ))}
          {loading && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box sx={{
                width: 36, height: 36, borderRadius: '50%',
                bgcolor: 'primary.main', display: 'flex',
                alignItems: 'center', justifyContent: 'center',
              }}>
                <SmartToyIcon sx={{ fontSize: 20, color: '#fff' }} />
              </Box>
              <CircularProgress size={20} />
              <Typography variant="body2" color="text.secondary">Thinking...</Typography>
            </Box>
          )}
          <div ref={messagesEndRef} />
        </CardContent>

        {}
        <Box sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider' }}>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <TextField
              fullWidth
              placeholder="Ask about your appointments, prescriptions, test results..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              size="small"
              disabled={loading}
            />
            <IconButton
              color="primary"
              onClick={sendMessage}
              disabled={loading || !input.trim()}
              sx={{
                bgcolor: 'primary.main', color: '#fff',
                '&:hover': { bgcolor: 'primary.dark' },
                '&.Mui-disabled': { bgcolor: 'grey.300' },
              }}
            >
              <SendIcon />
            </IconButton>
          </Box>
        </Box>
      </Card>
    </Box>
  );
}
