import { useState, useEffect, useCallback } from 'react';
import {
  Alert,
  Box,
  Card,
  CardContent,
  CircularProgress,
  Container,
  Fade,
  Stack,
  Typography,
} from '@mui/material';
import Header from './components/Header';
import RouteForm from './components/RouteForm';
import RouteResult from './components/RouteResult';
import { fetchStarts, fetchRooms, fetchRoute } from './api';

function extractFloorFromRoom(roomId) {
  const match = /^B(\d+)$/.exec(roomId);
  if (!match) {
    return null;
  }

  const digits = match[1];
  if (digits.length < 3) {
    return null;
  }

  const floorDigits = digits.slice(0, digits.length - 2);
  const floor = Number.parseInt(floorDigits, 10);
  return Number.isNaN(floor) ? null : floor;
}

function App() {
  const [starts, setStarts] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [routeResult, setRouteResult] = useState(null);
  const [isNavigating, setIsNavigating] = useState(false);
  const [error, setError] = useState(null);
  const [roomCount, setRoomCount] = useState(0);

  useEffect(() => {
    async function loadData() {
      try {
        const [startsData, roomsData] = await Promise.all([
          fetchStarts(),
          fetchRooms(),
        ]);

        if (startsData.starts) {
          const groups = {
            '丁香公寓': [],
            '海棠公寓': [],
            '竹园公寓': [],
          };
          startsData.starts.forEach((loc) => {
            for (const region in groups) {
              if (loc.name.includes(region)) {
                groups[region].push(loc);
                break;
              }
            }
          });
          setStarts(Object.entries(groups)
            .filter(([, items]) => items.length > 0)
            .map(([region, items]) => ({ region, items })));
        }

        if (roomsData.rooms) {
          setRoomCount(roomsData.rooms.length);
          const floors = {};
          roomsData.rooms.forEach((room) => {
            const floor = extractFloorFromRoom(room);
            if (floor === null) {
              return;
            }
            if (!floors[floor]) {
              floors[floor] = [];
            }
            floors[floor].push(room);
          });
          setRooms(Object.entries(floors)
            .sort(([a], [b]) => a - b)
            .map(([floor, items]) => ({ floor: parseInt(floor, 10), items: items.sort() })));
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

  const handleNavigate = useCallback(async (start, destination) => {
    setIsNavigating(true);
    setError(null);
    setRouteResult(null);

    try {
      const result = await fetchRoute(start, destination);
      setRouteResult(result);
    } catch (err) {
      console.error('导航请求失败:', err);
      setError(err.message || '导航请求失败');
    } finally {
      setIsNavigating(false);
    }
  }, []);

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'grid',
          placeItems: 'center',
          px: 3,
        }}
      >
        <Card sx={{ width: 'min(420px, 100%)' }}>
          <CardContent sx={{ textAlign: 'center', py: 5 }}>
            <CircularProgress sx={{ mb: 2 }} />
            <Typography variant="h3" sx={{ mb: 1 }}>
              正在准备导航数据
            </Typography>
            <Typography variant="body2" color="text.secondary">
              正在读取宿舍起点、楼内节点与教室列表，请稍候片刻。
            </Typography>
          </CardContent>
        </Card>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', py: { xs: 3, md: 5 } }}>
      <Container maxWidth="lg">
        <Header />

        <Fade in timeout={500}>
          <Stack spacing={3.5}>
            {error && (
              <Alert severity="error" sx={{ borderRadius: 6 }} onClose={() => setError(null)}>
                {error}
              </Alert>
            )}

            <Card>
              <CardContent sx={{ p: { xs: 2.5, md: 3.5 } }}>
                <RouteForm
                  starts={starts}
                  rooms={rooms}
                  roomCount={roomCount}
                  onNavigate={handleNavigate}
                  disabled={isNavigating}
                />
              </CardContent>
            </Card>

            {isNavigating && (
              <Card>
                <CardContent sx={{ p: 4, textAlign: 'center' }}>
                  <CircularProgress size={40} sx={{ mb: 2 }} />
                  <Typography variant="h4" sx={{ mb: 1 }}>
                    正在规划路径
                  </Typography>
                  <Typography color="text.secondary">
                    系统正在组合室外步行路线与楼内最短节点路径，请稍候。
                  </Typography>
                </CardContent>
              </Card>
            )}

            {routeResult && <RouteResult result={routeResult} />}
          </Stack>
        </Fade>
      </Container>
    </Box>
  );
}

export default App;
