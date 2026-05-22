import { useState } from 'react';
import { Navigation, MapPin, DoorOpen, Loader2 } from 'lucide-react';
import LocationSelect from './LocationSelect';
import styles from './RouteForm.module.css';

function RouteForm({ starts, rooms, roomCount, onNavigate, disabled }) {
  const [start, setStart] = useState('');
  const [destination, setDestination] = useState('');
  const [error, setError] = useState('');

  const startCount = starts.reduce((count, group) => count + group.items.length, 0);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!start) {
      setError('请选择起点');
      return;
    }
    if (!destination) {
      setError('请选择目的地教室');
      return;
    }

    onNavigate(start, destination);
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className={styles.formHeader}>
        <h2 className={styles.heading}>规划路线</h2>
        <div className={styles.badges}>
          <span className={`${styles.badge} ${styles.badgePrimary}`}>
            {startCount} 个起点
          </span>
          <span className={`${styles.badge} ${styles.badgeOutlined}`}>
            {roomCount} 间教室
          </span>
        </div>
      </div>

      {error && (
        <div className={styles.error} role="alert">
          {error}
        </div>
      )}

      <div className={styles.selects}>
        <LocationSelect
          label="起点（宿舍楼号）"
          icon={<MapPin size={18} />}
          value={start}
          onChange={(e) => setStart(e.target.value)}
          options={starts}
          disabled={disabled}
          labelId="start-label"
          inputId="start"
          autoComplete="address-level1"
        />

        <LocationSelect
          label="目的地（B 楼教室号）"
          icon={<DoorOpen size={18} />}
          value={destination}
          onChange={(e) => setDestination(e.target.value)}
          options={rooms}
          disabled={disabled}
          labelId="destination-label"
          inputId="destination"
          autoComplete="off"
        />
      </div>

      <button
        type="submit"
        className={styles.submitBtn}
        disabled={disabled}
      >
        {disabled ? (
          <>
            <Loader2 size={16} className={styles.spinIcon} />
            正在生成推荐路线...
          </>
        ) : (
          <>
            <Navigation size={16} />
            规划路径
          </>
        )}
      </button>
    </form>
  );
}

export default RouteForm;
