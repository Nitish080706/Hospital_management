import { useNavigate } from 'react-router-dom';
import { Box, Typography, Card, CardContent, Grid, CardActionArea } from '@mui/material';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import GroupsIcon from '@mui/icons-material/Groups';
import FormatListNumberedIcon from '@mui/icons-material/FormatListNumbered';

const actions = [
  {
    label: 'Register Patient',
    description: 'Register new patient or continue with existing',
    icon: <PersonAddIcon sx={{ fontSize: 48 }} />,
    path: '/nurse/register',
    color: '#1976D2',
  },
  {
    label: 'Doctor Availability',
    description: 'View and update doctor schedules',
    icon: <EventAvailableIcon sx={{ fontSize: 48 }} />,
    path: '/nurse/doctors',
    color: '#00897B',
  },
  {
    label: 'Active Consultations',
    description: 'See which doctor is consulting which patient',
    icon: <GroupsIcon sx={{ fontSize: 48 }} />,
    path: '/nurse/map',
    color: '#ED6C02',
  },
  {
    label: 'Patient Waitlist',
    description: 'View patients waiting for a doctor',
    icon: <FormatListNumberedIcon sx={{ fontSize: 48 }} />,
    path: '/nurse/waitlist',
    color: '#0288D1',
  },
];

export default function NurseDashboard() {
  const navigate = useNavigate();

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 1 }}>Nurse Station</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
        Manage patient registrations, doctor schedules, and consultations
      </Typography>

      <Grid container spacing={3}>
        {actions.map((action) => (
          <Grid size={{ xs: 12, sm: 6, md: 4 }} key={action.label}>
            <Card sx={{
              height: '100%',
              '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 8px 30px rgba(0,0,0,0.15)' },
              transition: 'all 0.3s ease',
            }}>
              <CardActionArea onClick={() => navigate(action.path)} sx={{ p: 3, height: '100%' }}>
                <Box sx={{
                  width: 80, height: 80, borderRadius: 3,
                  bgcolor: `${action.color}15`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  mb: 2, color: action.color,
                }}>
                  {action.icon}
                </Box>
                <Typography variant="h6" sx={{ mb: 1 }}>{action.label}</Typography>
                <Typography variant="body2" color="text.secondary">{action.description}</Typography>
              </CardActionArea>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
