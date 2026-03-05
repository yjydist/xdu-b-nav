import { Box, Typography } from '@mui/material';
import SchoolIcon from '@mui/icons-material/School';

/**
 * 顶部标题组件
 * 显示系统名称和副标题
 */
function Header() {
  return (
    <Box sx={{ textAlign: 'center', mb: 4, color: 'white' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mb: 1 }}>
        <SchoolIcon sx={{ fontSize: 40 }} />
        <Typography variant="h1" component="h1" sx={{ color: 'white' }}>
          B 楼导航系统
        </Typography>
      </Box>
      <Typography variant="subtitle1" sx={{ opacity: 0.9 }}>
        从宿舍到教室的最短路径规划
      </Typography>
    </Box>
  );
}

export default Header;
