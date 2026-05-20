import { useState, useEffect, useRef } from 'react';
import {
  Card,
  CardContent,
  Stack,
  Typography,
  Box,
} from '@mui/material';
import PinDropRoundedIcon from '@mui/icons-material/PinDropRounded';
import RouteRoundedIcon from '@mui/icons-material/RouteRounded';
import ScheduleRoundedIcon from '@mui/icons-material/ScheduleRounded';
import StraightenRoundedIcon from '@mui/icons-material/StraightenRounded';
import { fetchConfig, fetchCoordinates } from '../api';
import StatCard from './StatCard';
import OutdoorMapCard from './OutdoorMapCard';
import IndoorStepper from './IndoorStepper';

function RouteResult({ result }) {
  const [config, setConfig] = useState(null);
  const [coordinates, setCoordinates] = useState({});
  const [isAMapReady, setIsAMapReady] = useState(false);
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);

  useEffect(() => {
    async function loadConfig() {
      try {
        const [configData, coordsData] = await Promise.all([
          fetchConfig(),
          fetchCoordinates(),
        ]);
        setConfig(configData);
        setCoordinates(coordsData.coordinates || {});

        if (configData.amap_js_api_key && configData.amap_js_api_key !== '你的 JS_API_Key_填在这里') {
          window._AMapSecurityConfig = {
            securityJsCode: configData.amap_security_code || '',
          };
          loadAMapScript(configData.amap_js_api_key);
        }
      } catch (err) {
        console.error('加载地图配置失败:', err);
      }
    }
    loadConfig();
  }, []);

  function loadAMapScript(key) {
    const script = document.getElementById('amap-script');
    if (!script) return;

    script.src = `https://webapi.amap.com/maps?v=2.0&key=${key}&plugin=AMap.Walking`;
    script.onload = () => {
      setIsAMapReady(true);
    };
  }

  useEffect(() => {
    if (!isAMapReady || !mapRef.current || !result.outdoor) return;

    const initMap = () => {
      const bBuildingCoords = Object.entries(coordinates).find(([name]) => name.includes('B 楼'));
      const center = bBuildingCoords ? bBuildingCoords[1] : [108.831946, 34.126019];

      mapInstanceRef.current = new window.AMap.Map(mapRef.current, {
        zoom: 16,
        center,
        viewMode: '2D',
      });

      const startCoord = coordinates[result.outdoor.from];
      if (startCoord) {
        new window.AMap.Marker({
          position: startCoord,
          title: result.outdoor.from,
          map: mapInstanceRef.current,
        });
      }

      if (bBuildingCoords) {
        new window.AMap.Marker({
          position: bBuildingCoords[1],
          title: 'B 楼南楼',
          label: {
            content: '🏫 B 楼',
            direction: 'top',
            offset: new window.AMap.Pixel(0, -10),
          },
          map: mapInstanceRef.current,
        });
      }

      if (startCoord && bBuildingCoords) {
        const walking = new window.AMap.Walking({
          map: mapInstanceRef.current,
          showTraffic: false,
        });

        walking.search(startCoord, bBuildingCoords[1], (status) => {
          if (status === 'complete') {
            mapInstanceRef.current.setFitView();
          }
        });
      }
    };

    if (window.AMap) {
      initMap();
    }
  }, [isAMapReady, result, coordinates]);

  const statItems = [
    {
      label: '室外距离',
      value: result.outdoor ? `${result.outdoor.distance} 米` : 'N/A',
      icon: <StraightenRoundedIcon fontSize="small" />,
    },
    {
      label: '预计时长',
      value: result.outdoor ? `${Math.ceil(result.outdoor.duration / 60)} 分钟` : 'N/A',
      icon: <ScheduleRoundedIcon fontSize="small" />,
    },
    {
      label: '推荐入口',
      value: result.outdoor?.nearest_exit || 'N/A',
      icon: <PinDropRoundedIcon fontSize="small" />,
    },
    {
      label: '经过节点',
      value: `${(result.path || []).length} 个`,
      icon: <RouteRoundedIcon fontSize="small" />,
    },
  ];

  return (
    <Stack spacing={3}>
      <Card>
        <CardContent>
          <Stack spacing={2.5}>
            <Stack
              direction={{ xs: 'column', md: 'row' }}
              justifyContent="space-between"
              spacing={2}
            >
              <Box>
                <Typography variant="h2" sx={{ color: '#1F2937' }}>
                  已生成推荐路径
                </Typography>
              </Box>
            </Stack>

            <Box
              sx={{
                display: 'grid',
                gap: 1.5,
                gridTemplateColumns: {
                  xs: '1fr 1fr',
                  md: 'repeat(4, minmax(0, 1fr))',
                },
              }}
            >
              {statItems.map((item) => (
                <StatCard
                  key={item.label}
                  icon={item.icon}
                  label={item.label}
                  value={item.value}
                />
              ))}
            </Box>
          </Stack>
        </CardContent>
      </Card>

      {result.outdoor && (
        <Card>
          <CardContent>
            <OutdoorMapCard
              ref={mapRef}
              resultFrom={result.outdoor.from}
              config={config}
            />
          </CardContent>
        </Card>
      )}

      {result.indoor && result.indoor.length > 0 && (
        <Card>
          <CardContent>
            <IndoorStepper indoor={result.indoor} path={result.path} />
          </CardContent>
        </Card>
      )}
    </Stack>
  );
}

export default RouteResult;
