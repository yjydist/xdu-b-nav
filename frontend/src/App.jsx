import { useState, useEffect, useCallback } from 'react';
import Header from './components/Header';
import RouteForm from './components/RouteForm';
import RouteResult from './components/RouteResult';
import LoadingState from './components/LoadingState';
import ErrorAlert from './components/ErrorAlert';
import { fetchStarts, fetchRooms, fetchRoute } from './api';
import styles from './App.module.css';

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
      <LoadingState
        title="正在准备导航数据"
        subtitle="正在读取宿舍起点、楼内节点与教室列表，请稍候片刻。"
      />
    );
  }

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <Header />

        <div className={styles.content}>
          {error && (
            <ErrorAlert
              message={error}
              onClose={() => setError(null)}
            />
          )}

          <div className={styles.card}>
            <div className={styles.cardBody}>
              <RouteForm
                starts={starts}
                rooms={rooms}
                roomCount={roomCount}
                onNavigate={handleNavigate}
                disabled={isNavigating}
              />
            </div>
          </div>

          {isNavigating && (
            <div className={styles.card}>
              <div className={`${styles.cardBody} ${styles.center}`}>
                <div className={styles.spinner} />
                <h4 className={styles.navTitle}>正在规划路径</h4>
                <p className={styles.navDesc}>
                  系统正在组合室外步行路线与楼内最短节点路径，请稍候。
                </p>
              </div>
            </div>
          )}

          {routeResult && <RouteResult result={routeResult} />}
        </div>
      </main>
    </div>
  );
}

export default App;
