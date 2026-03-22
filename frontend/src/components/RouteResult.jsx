import { useState, useEffect, useRef } from 'react';
import {
  Box,
  Card,
  CardContent,
  Chip,
  Divider,
  Stack,
  Step,
  StepContent,
  StepLabel,
  Stepper,
  Typography,
} from '@mui/material';
import {
  ArrowForward,
  DirectionsWalk,
  DoorFront,
  Stairs,
} from '@mui/icons-material';
import PinDropRoundedIcon from '@mui/icons-material/PinDropRounded';
import RouteRoundedIcon from '@mui/icons-material/RouteRounded';
import ScheduleRoundedIcon from '@mui/icons-material/ScheduleRounded';
import StraightenRoundedIcon from '@mui/icons-material/StraightenRounded';
import { fetchConfig, fetchCoordinates } from '../api';

const getStepIcon = (action) => {
  if (action.includes('进入') || action.includes('出')) return DoorFront;
  if (action.includes('上楼')) return Stairs;
  if (action.includes('下楼')) return Stairs;
  if (action.includes('直行') || action.includes('移动')) return ArrowForward;
  return DirectionsWalk;
};

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
                <Typography variant="h2">
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
                <Box
                  key={item.label}
                  sx={{
                    p: 2,
                    borderRadius: 2.5,
                    bgcolor: 'rgba(247, 242, 250, 0.92)',
                    border: '1px solid rgba(122, 117, 127, 0.12)',
                  }}
                >
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                    <Box sx={{ color: 'primary.main', display: 'flex' }}>{item.icon}</Box>
                    <Typography variant="body2" color="text.secondary">
                      {item.label}
                    </Typography>
                  </Stack>
                  <Typography variant="h4">{item.value}</Typography>
                </Box>
              ))}
            </Box>
          </Stack>
        </CardContent>
      </Card>

      {result.outdoor && (
        <Card>
          <CardContent>
            <Stack spacing={2.5}>
              <Box>
                <Typography variant="h3">
                  室外步行段
                </Typography>
              </Box>

              <Box
                ref={mapRef}
                sx={{
                  width: '100%',
                  height: { xs: 260, md: 320 },
                  borderRadius: 2.5,
                  overflow: 'hidden',
                  bgcolor: 'rgba(231, 224, 235, 0.92)',
                  border: '1px solid rgba(122, 117, 127, 0.14)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {!config?.amap_js_api_key && (
                  <Typography color="text.secondary">
                    未配置地图 API，仅显示文字路线
                  </Typography>
                )}
              </Box>

              <Typography variant="body2" color="text.secondary">
                {result.outdoor.from} {'->'} B 楼南楼
              </Typography>
            </Stack>
          </CardContent>
        </Card>
      )}

      {result.indoor && result.indoor.length > 0 && (
        <Card>
          <CardContent>
            <Stack spacing={2.5}>
              <Box>
                <Typography variant="h3">
                  室内导航
                </Typography>
              </Box>

              <Stepper orientation="vertical">
                {result.indoor.map((step, index) => {
                  const StepIcon = getStepIcon(step.action);
                  return (
                    <Step key={index} active>
                      <StepLabel
                        StepIconComponent={() => (
                          <Box
                            sx={{
                              width: 36,
                              height: 36,
                              borderRadius: '50%',
                              bgcolor: 'primary.main',
                              color: 'white',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              boxShadow: '0 8px 18px rgba(101, 85, 143, 0.2)',
                            }}
                          >
                            <StepIcon fontSize="small" />
                          </Box>
                        )}
                      >
                        <Typography variant="body1" fontWeight={700}>
                          {step.action}
                        </Typography>
                      </StepLabel>
                      <StepContent>
                        <Typography variant="body2" color="text.secondary">
                          {step.description}
                        </Typography>
                      </StepContent>
                    </Step>
                  );
                })}
              </Stepper>

              {result.path && result.path.length > 0 && (
                <>
                  <Divider />
                  <Box>
                    <Typography variant="h5" sx={{ mb: 1.25 }}>
                      完整经过节点
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {result.path.map((node, index) => (
                        <Chip
                          key={index}
                          label={`${index + 1}. ${node}`}
                          size="small"
                          variant="outlined"
                        />
                      ))}
                    </Box>
                  </Box>
                </>
              )}
            </Stack>
          </CardContent>
        </Card>
      )}
    </Stack>
  );
}

export default RouteResult;
