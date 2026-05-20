import { Box, Stack, Typography } from '@mui/material';

function StatCard({ icon, label, value }) {
  return (
    <Box
      sx={{
        p: 2,
        borderRadius: '10px',
        bgcolor: '#F5F0E8',
        border: '2px solid #1F2937',
      }}
    >
      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
        <Box sx={{ color: '#6366F1', display: 'flex' }}>{icon}</Box>
        <Typography variant="body2" sx={{ color: '#6B7280' }}>
          {label}
        </Typography>
      </Stack>
      <Typography variant="h4" sx={{ color: '#1F2937' }}>
        {value}
      </Typography>
    </Box>
  );
}

export default StatCard;
