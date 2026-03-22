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
        spacing={1.25}
        sx={{ mb: 2, color: 'primary.main' }}
      >
        <Box
          sx={{
            width: 52,
            height: 52,
            borderRadius: 3.5,
            display: 'grid',
            placeItems: 'center',
            bgcolor: 'rgba(233, 221, 255, 0.92)',
            boxShadow: '0 10px 20px rgba(101, 85, 143, 0.12)',
          }}
        >
          <SchoolIcon sx={{ fontSize: 28 }} />
        </Box>
      </Stack>

      <Typography
        variant="h1"
        component="h1"
        sx={{
          maxWidth: 780,
          color: 'text.primary',
          mb: 2,
        }}
      >
        B 楼导航系统
      </Typography>

      <Typography variant="subtitle1" color="text.secondary">
        从宿舍到教室的路线规划
      </Typography>
    </Box>
  );
}

export default Header;
