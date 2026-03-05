import { useState, memo } from 'react';
import {
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Typography,
  CircularProgress,
  Alert,
} from '@mui/material';
import NavigationIcon from '@mui/icons-material/Navigation';

/**
 * 导航表单组件
 * 使用 memo 包装避免不必要的重渲染
 * @param {Array} starts - 起点列表（已按区域分组）
 * @param {Array} rooms - 教室列表（已按楼层分组）
 * @param {Function} onNavigate - 导航回调函数
 * @param {boolean} disabled - 是否禁用表单
 */
const RouteForm = memo(function RouteForm({ starts, rooms, onNavigate, disabled }) {
  const [start, setStart] = useState('');
  const [destination, setDestination] = useState('');
  const [error, setError] = useState('');

  // 表单提交处理
  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    // 验证输入
    if (!start) {
      setError('请选择起点');
      return;
    }
    if (!destination) {
      setError('请选择目的地教室');
      return;
    }

    // 调用导航回调
    onNavigate(start, destination);
  };

  return (
    <Box component="form" onSubmit={handleSubmit}>
      <Typography variant="h2" component="h2" sx={{ mb: 3 }}>
        规划路线
      </Typography>

      {/* 错误提示 */}
      {error && (
        <Alert severity="warning" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* 起点选择 */}
      <FormControl fullWidth sx={{ mb: 3 }}>
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
          {starts.map((group) => (
            <MenuItem key={group.region} value="" disabled sx={{ fontWeight: 600 }}>
              {group.region}
            </MenuItem>
          ))}
          {starts.flatMap((group) =>
            group.items.map((loc) => (
              <MenuItem key={loc.name} value={loc.name} sx={{ pl: 4 }}>
                {loc.name}
              </MenuItem>
            ))
          )}
        </Select>
        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, ml: 1.5 }}>
          请选择您的出发地点
        </Typography>
      </FormControl>

      {/* 目的地选择 */}
      <FormControl fullWidth sx={{ mb: 3 }}>
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
          {rooms.map((group) => (
            <MenuItem key={group.floor} value="" disabled sx={{ fontWeight: 600 }}>
              {group.floor}楼
            </MenuItem>
          ))}
          {rooms.flatMap((group) =>
            group.items.map((room) => (
              <MenuItem key={room} value={room} sx={{ pl: 4 }}>
                {room}
              </MenuItem>
            ))
          )}
        </Select>
        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, ml: 1.5 }}>
          请选择您要去的教室
        </Typography>
      </FormControl>

      {/* 提交按钮 */}
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
          py: 1.5,
          fontSize: '1.1rem',
        }}
      >
        {disabled ? '规划中...' : '规划路径'}
      </Button>
    </Box>
  );
}

export default RouteForm;
