import { useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Stack,
  Typography,
} from '@mui/material';
import NavigationIcon from '@mui/icons-material/Navigation';
import PlaceRoundedIcon from '@mui/icons-material/PlaceRounded';
import MeetingRoomRoundedIcon from '@mui/icons-material/MeetingRoomRounded';
import LocationSelect from './LocationSelect';

function RouteForm({ starts, rooms, roomCount, onNavigate, disabled }) {
  const [start, setStart] = useState('');
  const [destination, setDestination] = useState('');
  const [error, setError] = useState('');

  const startCount = starts.reduce((count, group) => count + group.items.length, 0);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!start) {
      setError('请选择起点');
      return;
    }
    if (!destination) {
      setError('请选择目的地教室');
      return;
    }

    onNavigate(start, destination);
  };

  return (
    <Box component="form" onSubmit={handleSubmit}>
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        justifyContent="space-between"
        alignItems={{ xs: 'flex-start', md: 'center' }}
        spacing={2}
        sx={{ mb: 3 }}
      >
        <Box>
          <Typography variant="h2" component="h2">
            规划路线
          </Typography>
        </Box>

        <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
          <Chip label={`${startCount} 个起点`} color="primary" />
          <Chip label={`${roomCount} 间教室`} variant="outlined" />
        </Stack>
      </Stack>

      {error && (
        <Alert severity="warning" sx={{ mb: 2.5 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <Stack spacing={2.25} sx={{ mb: 3 }}>
        <LocationSelect
          label="起点（宿舍楼号）"
          icon={<PlaceRoundedIcon fontSize="small" />}
          value={start}
          onChange={(e) => setStart(e.target.value)}
          options={starts}
          disabled={disabled}
          labelId="start-label"
          inputId="start"
          autoComplete="address-level1"
        />

        <LocationSelect
          label="目的地（B 楼教室号）"
          icon={<MeetingRoomRoundedIcon fontSize="small" />}
          value={destination}
          onChange={(e) => setDestination(e.target.value)}
          options={rooms}
          disabled={disabled}
          labelId="destination-label"
          inputId="destination"
          autoComplete="off"
        />
      </Stack>

      <Button
        type="submit"
        variant="contained"
        size="large"
        fullWidth
        disabled={disabled}
        startIcon={
          disabled ? <CircularProgress size={20} color="inherit" /> : <NavigationIcon />
        }
        sx={{
          py: 1.8,
          fontSize: '1rem',
          bgcolor: '#6366F1',
          '&:hover': {
            bgcolor: '#4F46E5',
          },
        }}
      >
        {disabled ? '正在生成推荐路线...' : '规划路径'}
      </Button>
    </Box>
  );
}

export default RouteForm;
