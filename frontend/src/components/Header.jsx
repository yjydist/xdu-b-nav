import { Box, Chip, Stack, Typography } from '@mui/material';
import AutoAwesomeRoundedIcon from '@mui/icons-material/AutoAwesomeRounded';
import ExploreRoundedIcon from '@mui/icons-material/ExploreRounded';
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
        <Typography variant="overline" sx={{ color: 'text.secondary' }}>
          XDU CAMPUS ROUTE ASSISTANT
        </Typography>
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

      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={1.25}
        useFlexGap
        flexWrap="wrap"
        sx={{ mt: 0.5 }}
      >
        <Chip
          icon={<ExploreRoundedIcon />}
          label="宿舍到教室路线规划"
          color="primary"
          variant="filled"
        />
        <Chip
          icon={<AutoAwesomeRoundedIcon />}
          label="室外步行 + 室内节点联动"
          variant="outlined"
          sx={{ bgcolor: 'rgba(255,255,255,0.75)' }}
        />
      </Stack>
    </Box>
  );
}

export default Header;
