import { useState } from 'react';
import { Navigation, MapPin, DoorOpen, Loader2, X, Route, Building2 } from 'lucide-react';
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
        <div className={styles.headingGroup}>
          <span className={styles.eyebrow}>STEP 01</span>
          <h2 className={styles.heading}>规划路线</h2>
        </div>
        <div className={styles.badges}>
          <span className={styles.badge}>
            <Route size={12} />
            <span>{startCount} 个起点</span>
          </span>
          <span className={styles.badge}>
            <Building2 size={12} />
            <span>{roomCount} 间教室</span>
          </span>
        </div>
      </div>

      {error && (
        <div className={styles.error} role="alert">
          <span className={styles.errorText}>{error}</span>
          <button
            type="button"
            className={styles.errorClose}
            onClick={() => setError('')}
            aria-label="关闭"
          >
            <X size={14} />
          </button>
        </div>
      )}

      <div className={styles.selects}>
        <LocationSelect
          label="起点（宿舍楼号）"
          icon={<MapPin size={16} />}
          value={start}
          onChange={(e) => setStart(e.target.value)}
          options={starts}
          disabled={disabled}
          inputId="start"
          autoComplete="address-level1"
        />

        <LocationSelect
          label="目的地（B 楼教室号）"
          icon={<DoorOpen size={16} />}
          value={destination}
          onChange={(e) => setDestination(e.target.value)}
          options={rooms}
          disabled={disabled}
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
            <span>正在生成推荐路线</span>
          </>
        ) : (
          <>
            <Navigation size={16} />
            <span>规划路径</span>
          </>
        )}
      </button>
    </form>
  );
}

export default RouteForm;
