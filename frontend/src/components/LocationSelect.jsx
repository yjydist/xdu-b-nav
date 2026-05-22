import { MapPin } from 'lucide-react';
import styles from './LocationSelect.module.css';

function LocationSelect({
  label,
  icon,
  value,
  onChange,
  options,
  disabled,
  labelId,
  inputId,
  autoComplete,
}) {
  return (
    <div className={styles.box}>
      <div className={styles.header}>
        <div className={styles.iconBox}>
          {icon || <MapPin size={18} />}
        </div>
        <span className={styles.label}>{label}</span>
      </div>

      <select
        id={inputId}
        name={inputId}
        value={value}
        onChange={onChange}
        disabled={disabled}
        autoComplete={autoComplete}
        className={styles.select}
        aria-labelledby={labelId}
      >
        <option value="" disabled>
          -- 请选择 --
        </option>
        {options.map((group) => (
          <optgroup key={group.region || group.floor} label={group.region ? `${group.region}` : `${group.floor} 层`}>
            {group.items.map((item) => (
              <option key={item.name || item} value={item.name || item}>
                {item.name || item}
              </option>
            ))}
          </optgroup>
        ))}
      </select>
    </div>
  );
}

export default LocationSelect;
