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
      <label className={styles.label} htmlFor={inputId} id={labelId}>
        <span className={styles.labelIcon}>{icon || <MapPin size={16} />}</span>
        <span className={styles.labelText}>{label}</span>
      </label>

      <div className={styles.selectWrap}>
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
    </div>
  );
}

export default LocationSelect;
