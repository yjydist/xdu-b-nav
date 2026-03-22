import { useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Typography,
} from '@mui/material';
import NavigationIcon from '@mui/icons-material/Navigation';
import PlaceRoundedIcon from '@mui/icons-material/PlaceRounded';
import MeetingRoomRoundedIcon from '@mui/icons-material/MeetingRoomRounded';

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
          <Typography variant="overline" color="text.secondary">
            Route setup
          </Typography>
          <Typography variant="h2" component="h2" sx={{ mt: 0.5 }}>
            规划路线
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1, maxWidth: 520 }}>
            选择宿舍起点与教室编号，系统会自动组合室外步行路线和楼内最短路径。
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
        <Box
          sx={{
            p: { xs: 2, md: 2.5 },
            borderRadius: 2.5,
            bgcolor: 'rgba(247, 242, 250, 0.9)',
            border: '1px solid rgba(122, 117, 127, 0.12)',
          }}
        >
          <Stack direction="row" spacing={1.25} alignItems="flex-start" sx={{ mb: 2 }}>
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: 2,
                bgcolor: 'primary.light',
                color: 'primary.main',
                display: 'grid',
                placeItems: 'center',
              }}
            >
              <PlaceRoundedIcon fontSize="small" />
            </Box>
            <Box>
              <Typography variant="h4">起点（宿舍楼号）</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                按宿舍区组织列表，优先选择你当前所在的宿舍楼。
              </Typography>
            </Box>
          </Stack>

          <FormControl fullWidth>
            <InputLabel id="start-label">起点（宿舍楼号）</InputLabel>
            <Select
              labelId="start-label"
              id="start"
              name="start"
              value={start}
              label="起点（宿舍楼号）"
              onChange={(e) => setStart(e.target.value)}
              disabled={disabled}
              autoComplete="address-level1"
            >
              {starts.flatMap((group) =>
                group.items.map((loc) => (
                  <MenuItem key={loc.name} value={loc.name}>
                    {loc.name}
                  </MenuItem>
                ))
              )}
            </Select>
          </FormControl>
        </Box>

        <Box
          sx={{
            p: { xs: 2, md: 2.5 },
            borderRadius: 2.5,
            bgcolor: 'rgba(247, 242, 250, 0.9)',
            border: '1px solid rgba(122, 117, 127, 0.12)',
          }}
        >
          <Stack direction="row" spacing={1.25} alignItems="flex-start" sx={{ mb: 2 }}>
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: 2,
                bgcolor: 'secondary.light',
                color: 'secondary.dark',
                display: 'grid',
                placeItems: 'center',
              }}
            >
              <MeetingRoomRoundedIcon fontSize="small" />
            </Box>
            <Box>
              <Typography variant="h4">目的地（B 楼教室号）</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                教室按楼层整理，你可以直接滚动到目标楼层选择对应房间。
              </Typography>
            </Box>
          </Stack>

          <FormControl fullWidth>
            <InputLabel id="destination-label">目的地（B 楼教室号）</InputLabel>
            <Select
              labelId="destination-label"
              id="destination"
              name="destination"
              value={destination}
              label="目的地（B 楼教室号）"
              onChange={(e) => setDestination(e.target.value)}
              disabled={disabled}
              autoComplete="off"
            >
              {rooms.flatMap((group) =>
                group.items.map((room) => (
                  <MenuItem key={room} value={room}>
                    {room}
                  </MenuItem>
                ))
              )}
            </Select>
          </FormControl>
        </Box>
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
        }}
      >
        {disabled ? '正在生成推荐路线...' : '规划路径'}
      </Button>

      <Typography
        variant="body2"
        color="text.secondary"
        sx={{ mt: 1.5, textAlign: 'center' }}
      >
        提交后会显示室外步行、楼内节点路径和完整步骤说明。
      </Typography>
    </Box>
  );
}

export default RouteForm;
