import { forwardRef } from 'react';
import styles from './OutdoorMapCard.module.css';

const OutdoorMapCard = forwardRef(function OutdoorMapCard(
  { resultFrom, config },
  mapRef
) {
  return (
    <div>
      <h3 className={styles.title}>室外步行段</h3>

      <div ref={mapRef} className={styles.map}>
        {!config?.amap_js_api_key && (
          <p className={styles.mapPlaceholder}>
            未配置地图 API，仅显示文字路线
          </p>
        )}
      </div>

      <p className={styles.routeText}>
        {resultFrom} {'->'} B 楼南楼
      </p>
    </div>
  );
});

export default OutdoorMapCard;
