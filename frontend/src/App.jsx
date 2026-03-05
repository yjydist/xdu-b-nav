import { useState, useEffect } from 'react';
import {
  Container,
  Box,
  Typography,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Fade,
} from '@mui/material';
import Header from './components/Header';
import RouteForm from './components/RouteForm';
import RouteResult from './components/RouteResult';
import { fetchStarts, fetchRooms } from './api';

/**
 * 应用根组件
 * 负责整体布局和状态管理
 */
function App() {
  // 状态管理
  const [starts, setStarts] = useState([]); // 起点列表
  const [rooms, setRooms] = useState([]); // 教室列表
  const [loading, setLoading] = useState(true); // 初始加载状态
  const [routeResult, setRouteResult] = useState(null); // 导航结果
  const [isNavigating, setIsNavigating] = useState(false); // 导航中状态
  const [error, setError] = useState(null); // 错误信息

  // 组件挂载时加载起点和教室数据
  useEffect(() => {
    async function loadData() {
      try {
        // 并行加载起点和教室列表
        const [startsData, roomsData] = await Promise.all([
          fetchStarts(),
          fetchRooms(),
        ]);

        // 处理起点数据，按区域分组
        if (startsData.starts) {
          const groups = {
            '丁香公寓': [],
            '海棠公寓': [],
            '竹园公寓': [],
          };
          startsData.starts.forEach(loc => {
            for (const region in groups) {
              if (loc.name.includes(region)) {
                groups[region].push(loc);
                break;
              }
            }
          });
          // 过滤空组
          setStarts(Object.entries(groups)
            .filter(([_, items]) => items.length > 0)
            .map(([region, items]) => ({ region, items })));
        }

        // 处理教室数据，按楼层分组
        if (roomsData.rooms) {
          const floors = {};
          roomsData.rooms.forEach(room => {
            const floor = parseInt(room.substring(1, 2));
            if (!floors[floor]) {
              floors[floor] = [];
            }
            floors[floor].push(room);
          });
          // 转换为数组并排序
          setRooms(Object.entries(floors)
            .sort(([a], [b]) => a - b)
            .map(([floor, items]) => ({ floor: parseInt(floor), items: items.sort() })));
        }
      } catch (err) {
        console.error('加载数据失败:', err);
        setError('加载数据失败，请刷新页面重试');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  // 处理导航请求
  const handleNavigate = async (start, destination) => {
    setIsNavigating(true);
    setError(null);
    setRouteResult(null);

    try {
      // 动态导入路由函数，避免循环依赖
      const { fetchRoute } = await import('./api');
      const result = await fetchRoute(start, destination);
      setRouteResult(result);
    } catch (err) {
      console.error('导航请求失败:', err);
      setError(err.message || '导航请求失败');
    } finally {
      setIsNavigating(false);
    }
  };

  // 加载中显示
  if (loading) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #6750A4 0%, #7F67BE 100%)',
        }}
      >
        <CircularProgress sx={{ color: 'white' }} />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #6750A4 0%, #7F67BE 100%)',
        py: 4,
      }}
    >
      <Container maxWidth="md">
        {/* 顶部标题 */}
        <Header />

        {/* 主内容区 */}
        <Fade in timeout={500}>
          <Box>
            {/* 错误提示 */}
            {error && (
              <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
                {error}
              </Alert>
            )}

            {/* 导航表单 */}
            <Card sx={{ mb: 3 }}>
              <CardContent sx={{ p: 3 }}>
                <RouteForm
                  starts={starts}
                  rooms={rooms}
                  onNavigate={handleNavigate}
                  disabled={isNavigating}
                />
              </CardContent>
            </Card>

            {/* 导航结果 */}
            {isNavigating && (
              <Card sx={{ mb: 3 }}>
                <CardContent sx={{ p: 4, textAlign: 'center' }}>
                  <CircularProgress size={40} sx={{ mb: 2 }} />
                  <Typography color="text.secondary">
                    正在规划路径...
                  </Typography>
                </CardContent>
              </Card>
            )}

            {routeResult && (
              <RouteResult result={routeResult} />
            )}
          </Box>
        </Fade>
      </Container>
    </Box>
  );
}

export default App;
