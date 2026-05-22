import { X, XCircle } from 'lucide-react';
import styles from './ErrorAlert.module.css';

function ErrorAlert({ message, onClose }) {
  return (
    <div className={styles.alert} role="alert">
      <XCircle size={16} className={styles.icon} />
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
