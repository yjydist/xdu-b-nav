import { Loader2 } from 'lucide-react';
import styles from './LoadingState.module.css';

function LoadingState({ title, subtitle }) {
  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.spinnerBox}>
          <Loader2 size={28} className={styles.spinner} />
        </div>
        <span className={styles.eyebrow}>LOADING</span>
        <h3 className={styles.title}>{title}</h3>
        <p className={styles.subtitle}>{subtitle}</p>
        <div className={styles.dots} aria-hidden="true">
          <span className={styles.dot} />
          <span className={styles.dot} />
          <span className={styles.dot} />
        </div>
      </div>
    </div>
  );
}

export default LoadingState;
