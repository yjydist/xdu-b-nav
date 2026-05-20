import { Box, Stack, Typography } from '@mui/material';
import SchoolIcon from '@mui/icons-material/School';

function Header() {
  return (
    <Box
      sx={{
        mb: { xs: 3, md: 4 },
        px: { xs: 0.5, md: 1 },
      }}
    >
      <Stack
        direction="row"
        alignItems="center"
        spacing={1.5}
        sx={{ mb: 2 }}
      >
        <Box
          sx={{
            width: 52,
            height: 52,
            borderRadius: '10px',
            display: 'grid',
            placeItems: 'center',
            bgcolor: '#F5F0E8',
            border: '2px solid #1F2937',
          }}
        >
          <SchoolIcon sx={{ fontSize: 28, color: '#6366F1' }} />
        </Box>
      </Stack>

      <Typography
        variant="h1"
        component="h1"
        sx={{
          maxWidth: 780,
          color: '#1F2937',
          mb: 1.5,
        }}
      >
        B 楼导航系统
      </Typography>

      <Typography variant="subtitle1" sx={{ color: '#6B7280' }}>
        从宿舍到教室的路线规划
      </Typography>
    </Box>
  );
}

export default Header;
