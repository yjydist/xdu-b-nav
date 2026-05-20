import { Box, Card, CardContent, CircularProgress, Typography } from '@mui/material';

function LoadingState({ title, subtitle }) {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        px: 3,
        bgcolor: '#FFFDF5',
      }}
    >
      <Card sx={{ width: 'min(420px, 100%)' }}>
        <CardContent sx={{ textAlign: 'center', py: 5 }}>
          <CircularProgress sx={{ mb: 2, color: '#6366F1' }} />
          <Typography variant="h3" sx={{ mb: 1, color: '#1F2937' }}>
            {title}
          </Typography>
          <Typography variant="body2" sx={{ color: '#6B7280' }}>
            {subtitle}
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
}

export default LoadingState;
