import { X } from 'lucide-react';
import styles from './ErrorAlert.module.css';

function ErrorAlert({ message, onClose }) {
  return (
    <div className={styles.alert} role="alert">
      <span className={styles.text}>{message}</span>
      {onClose && (
        <button
          type="button"
          className={styles.close}
          onClick={onClose}
          aria-label="关闭"
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
}

export default ErrorAlert;
