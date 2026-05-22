import { forwardRef } from 'react';
import { Map, ArrowRight } from 'lucide-react';
import styles from './OutdoorMapCard.module.css';

const OutdoorMapCard = forwardRef(function OutdoorMapCard(
  { resultFrom, config },
  mapRef
) {
  return (
    <div>
      <div className={styles.titleRow}>
        <span className={styles.titleIcon}>
          <Map size={14} />
        </span>
        <h3 className={styles.title}>室外步行段</h3>
      </div>

      <div ref={mapRef} className={styles.map}>
        {!config?.amap_js_api_key && (
          <p className={styles.mapPlaceholder}>
            未配置地图 API · 仅显示文字路线
          </p>
        )}
      </div>

      <div className={styles.routeText}>
        <span className={styles.routePoint}>{resultFrom}</span>
        <ArrowRight size={14} className={styles.routeArrow} />
        <span className={styles.routePoint}>B 楼南楼</span>
      </div>
    </div>
  );
});

export default OutdoorMapCard;
