import { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Chip,
  Divider,
} from '@mui/material';
import {
  DirectionsWalk,
  Stairs,
  DoorFront,
  ArrowForward,
} from '@mui/icons-material';
import { fetchConfig, fetchCoordinates } from '../api';

/**
 * 获取步骤图标组件（模块级别定义）
 * @param {string} action - 动作描述
 * @returns {Component} 图标组件
 */
const getStepIcon = (action) => {
  if (action.includes('进入') || action.includes('出')) return DoorFront;
  if (action.includes('上楼')) return Stairs;
  if (action.includes('下楼')) return Stairs;
  if (action.includes('直行') || action.includes('移动')) return ArrowForward;
  return DirectionsWalk;
};

/**
 * 路线结果组件
 * 显示室外路线（地图）和室内导航步骤
 * @param {Object} result - 导航结果数据
 */
function RouteResult({ result }) {
  const [config, setConfig] = useState(null);
  const [coordinates, setCoordinates] = useState({});
  const [isAMapReady, setIsAMapReady] = useState(false);
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);

  // 加载地图配置和坐标映射
  useEffect(() => {
    async function loadConfig() {
      try {
        // 并行加载配置和坐标
        const [configData, coordsData] = await Promise.all([
          fetchConfig(),
          fetchCoordinates(),
        ]);
        setConfig(configData);
        setCoordinates(coordsData.coordinates || {});
        
        // 配置安全密钥
        if (configData.amap_js_api_key && configData.amap_js_api_key !== '你的 JS_API_Key_填在这里') {
          window._AMapSecurityConfig = {
            securityJsCode: configData.amap_security_code || '',
          };
          // 动态加载高德地图脚本
          loadAMapScript(configData.amap_js_api_key);
        }
      } catch (err) {
        console.error('加载地图配置失败:', err);
      }
    }
    loadConfig();
  }, []);

  // 加载高德地图脚本
  function loadAMapScript(key) {
    const script = document.getElementById('amap-script');
    if (!script) return;

    script.src = `https://webapi.amap.com/maps?v=2.0&key=${key}&plugin=AMap.Walking`;
    script.onload = () => {
      setIsAMapReady(true);
    };
  }

  // 初始化地图
  useEffect(() => {
    if (!isAMapReady || !mapRef.current || !result.outdoor) return;

    const initMap = () => {
      // 从 API 获取的坐标中查找 B 楼中心坐标
      const bBuildingCoords = Object.entries(coordinates).find(([name]) => name.includes('B 楼'));
      const center = bBuildingCoords ? bBuildingCoords[1] : [108.831946, 34.126019];
      
      // 创建地图实例
      mapInstanceRef.current = new window.AMap.Map(mapRef.current, {
        zoom: 16,
        center,
        viewMode: '2D',
      });

      // 添加起点和终点标记
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

      // 规划步行路线
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

    // 等待 AMap 加载完成
    if (window.AMap) {
      initMap();
    }
  }, [isAMapReady, result, coordinates]);

  return (
    <Box>
      {/* 室外路线 - 地图 */}
      {result.outdoor && (
        <Card sx={{ mb: 3 }}>
          <CardContent sx={{ p: 0 }}>
            <Box sx={{ p: 2, pb: 0 }}>
              <Typography variant="h3" component="h3" sx={{ mb: 1 }}>
                🚶 室外路线
              </Typography>
            </Box>
            
            {/* 地图容器 */}
            <Box
              ref={mapRef}
              sx={{
                width: '100%',
                height: 300,
                backgroundColor: '#f5f5f5',
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

            {/* 室外路线摘要 */}
            <Box sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <Chip label={`距离: ${result.outdoor.distance}米`} color="primary" variant="outlined" />
                <Chip label={`预计: ${Math.ceil(result.outdoor.duration / 60)}分钟`} color="primary" variant="outlined" />
              </Box>
              <Typography variant="body2" color="text.secondary">
                从 {result.outdoor.from} 步行前往 B 楼南楼
              </Typography>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* 室内路线 */}
      {result.indoor && result.indoor.length > 0 && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h3" component="h3" sx={{ mb: 2 }}>
              🏢 室内导航
            </Typography>

            {/* 导航步骤 */}
            <Stepper orientation="vertical">
              {result.indoor.map((step, index) => {
                const StepIcon = getStepIcon(step.action);
                return (
                  <Step key={index} active>
                    <StepLabel
                      StepIconComponent={() => (
                        <Box
                          sx={{
                            width: 32,
                            height: 32,
                            borderRadius: '50%',
                            bgcolor: 'primary.main',
                            color: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <StepIcon fontSize="small" />
                        </Box>
                      )}
                    >
                      <Typography variant="body1" fontWeight={600}>
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

            {/* 完整节点序列 */}
            {result.path && result.path.length > 0 && (
              <>
                <Divider sx={{ my: 2 }} />
                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
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
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* 路径摘要 */}
      <Card sx={{ bgcolor: 'primary.main', color: 'primary.contrastText' }}>
        <CardContent sx={{ textAlign: 'center', py: 3 }}>
          <Typography variant="h4" sx={{ mb: 1 }}>
            总权重
          </Typography>
          <Typography variant="h2" sx={{ fontWeight: 'bold', mb: 1 }}>
            {result.total_weight}
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.9 }}>
            入口：{result.outdoor?.nearest_exit || 'N/A'} | 节点数：{(result.path || []).length}
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
}

export default RouteResult;
