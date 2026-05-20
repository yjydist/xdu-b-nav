import { forwardRef } from 'react';
import { Box, Stack, Typography } from '@mui/material';

const OutdoorMapCard = forwardRef(function OutdoorMapCard(
  { resultFrom, config },
  mapRef
) {
  return (
    <Box>
      <Stack spacing={2.5}>
        <Box>
          <Typography variant="h3" sx={{ color: '#1F2937' }}>
            室外步行段
          </Typography>
        </Box>

        <Box
          ref={mapRef}
          sx={{
            width: '100%',
            height: { xs: 260, md: 320 },
            borderRadius: '10px',
            overflow: 'hidden',
            bgcolor: '#F5F0E8',
            border: '2px solid #1F2937',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {!config?.amap_js_api_key && (
            <Typography sx={{ color: '#6B7280' }}>
              未配置地图 API，仅显示文字路线
            </Typography>
          )}
        </Box>

        <Typography variant="body2" sx={{ color: '#6B7280' }}>
          {resultFrom} {'->'} B 楼南楼
        </Typography>
      </Stack>
    </Box>
  );
});

export default OutdoorMapCard;
